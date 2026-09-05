from __future__ import annotations

import json
import os
import secrets
import sys
import uuid
from datetime import datetime, timezone
from functools import wraps

from flask import Flask, jsonify, request, send_from_directory, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Text
from werkzeug.security import check_password_hash, generate_password_hash

from recipe_importer import import_recipe_from_url, parse_recipe_html


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEEK_DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]


def build_database_url() -> str:
    database_url = os.environ.get("DATABASE_URL", "").strip()
    if not database_url:
        return f"sqlite:///{os.path.join(BASE_DIR, 'tableset.db')}"
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql://", 1)
    return database_url


app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")
app.config["SQLALCHEMY_DATABASE_URI"] = build_database_url()
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

secret_key = os.environ.get("SECRET_KEY", "").strip()
if not secret_key:
    secret_key = secrets.token_hex(32)
    print(
        "WARNING: SECRET_KEY is not set. Using a random key for this process, so "
        "sessions will not survive a restart. Set SECRET_KEY in production.",
        file=sys.stderr,
    )
app.secret_key = secret_key
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("SESSION_COOKIE_SECURE", "1").strip().lower() not in {
    "0",
    "false",
    "no",
}

db = SQLAlchemy(app)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(String(36), primary_key=True)
    email = db.Column(String(255), nullable=False, unique=True)
    password_hash = db.Column(String(255), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False)


class Recipe(db.Model):
    __tablename__ = "recipes"

    id = db.Column(String(36), primary_key=True)
    owner_id = db.Column(String(36), db.ForeignKey("users.id"), nullable=False)
    title = db.Column(String(255), nullable=False)
    source_url = db.Column(String(2048), nullable=False, default="")
    description = db.Column(Text, nullable=False, default="")
    ingredients_json = db.Column(Text, nullable=False, default="[]")
    instructions_json = db.Column(Text, nullable=False, default="[]")
    method = db.Column(Text, nullable=False, default="")
    image = db.Column(String(2048), nullable=False, default="")
    servings = db.Column(db.Integer, nullable=True)
    imported_at = db.Column(db.DateTime(timezone=True), nullable=False)


class PlannerEntry(db.Model):
    __tablename__ = "planner_entries"

    owner_id = db.Column(String(36), db.ForeignKey("users.id"), primary_key=True)
    day = db.Column(String(20), primary_key=True)
    recipe_id = db.Column(String(36), nullable=True)


with app.app_context():
    db.create_all()


def current_user_id() -> str | None:
    return session.get("user_id")


def login_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        if not current_user_id():
            return jsonify({"error": "Sign in required."}), 401
        return view(*args, **kwargs)

    return wrapped


@app.get("/api/health")
def healthcheck():
    return jsonify({"ok": True})


@app.post("/api/auth/register")
def api_register():
    body = request.get_json(silent=True) or {}
    email = str(body.get("email") or "").strip().lower()
    password = str(body.get("password") or "")

    if "@" not in email or len(email) > 255:
        return jsonify({"error": "A valid email is required."}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with that email already exists."}), 409

    user = User(
        id=str(uuid.uuid4()),
        email=email,
        password_hash=generate_password_hash(password),
        created_at=datetime.now(timezone.utc),
    )
    db.session.add(user)
    db.session.commit()

    session.clear()
    session["user_id"] = user.id
    return jsonify({"user": serialize_user(user)})


@app.post("/api/auth/login")
def api_login():
    body = request.get_json(silent=True) or {}
    email = str(body.get("email") or "").strip().lower()
    password = str(body.get("password") or "")

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Incorrect email or password."}), 401

    session.clear()
    session["user_id"] = user.id
    return jsonify({"user": serialize_user(user)})


@app.post("/api/auth/logout")
def api_logout():
    session.clear()
    return jsonify({"ok": True})


@app.get("/api/auth/me")
def api_me():
    user_id = current_user_id()
    if not user_id:
        return jsonify({"user": None})

    user = User.query.get(user_id)
    if not user:
        session.clear()
        return jsonify({"user": None})

    return jsonify({"user": serialize_user(user)})


@app.get("/api/state")
@login_required
def get_state():
    owner_id = current_user_id()
    return jsonify({"recipes": serialize_recipes(owner_id), "planner": load_planner(owner_id)})


@app.post("/api/import-recipe")
@login_required
def api_import_recipe():
    owner_id = current_user_id()
    body = request.get_json(silent=True) or {}
    recipe_data = import_recipe_from_url(body.get("url", ""))
    recipe = save_recipe(recipe_data, owner_id)
    return jsonify({"recipe": serialize_recipe(recipe), "recipes": serialize_recipes(owner_id)})


@app.post("/api/recipes")
@login_required
def api_save_recipe():
    owner_id = current_user_id()
    body = request.get_json(silent=True) or {}
    html = body.get("html", "")
    if html:
        recipe_data = parse_recipe_html(html, body.get("sourceUrl", ""))
    else:
        recipe_data = sanitize_recipe_payload(body)

    recipe = save_recipe(recipe_data, owner_id)
    return jsonify({"recipe": serialize_recipe(recipe), "recipes": serialize_recipes(owner_id)})


@app.post("/api/recipes/bulk")
@login_required
def api_bulk_save_recipes():
    owner_id = current_user_id()
    body = request.get_json(silent=True) or {}
    recipes = body.get("recipes") if isinstance(body.get("recipes"), list) else []
    saved = [
        serialize_recipe(save_recipe(sanitize_recipe_payload(recipe), owner_id)) for recipe in recipes
    ]
    return jsonify({"recipes": serialize_recipes(owner_id), "saved": saved})


@app.put("/api/recipes/<recipe_id>")
@login_required
def api_update_recipe(recipe_id: str):
    owner_id = current_user_id()
    recipe = Recipe.query.get(recipe_id)
    if not recipe or recipe.owner_id != owner_id:
        return jsonify({"error": "Recipe not found."}), 404

    recipe_data = sanitize_recipe_payload(request.get_json(silent=True) or {})
    recipe_data["id"] = recipe_id
    recipe_data["sourceUrl"] = recipe.source_url
    updated = save_recipe(recipe_data, owner_id)
    return jsonify({"recipe": serialize_recipe(updated), "recipes": serialize_recipes(owner_id)})


@app.delete("/api/recipes/<recipe_id>")
@login_required
def api_delete_recipe(recipe_id: str):
    owner_id = current_user_id()
    recipe = Recipe.query.get(recipe_id)
    if not recipe or recipe.owner_id != owner_id:
        return jsonify({"error": "Recipe not found."}), 404

    db.session.delete(recipe)
    for entry in PlannerEntry.query.filter_by(owner_id=owner_id, recipe_id=recipe_id).all():
        entry.recipe_id = ""
    db.session.commit()

    return jsonify({"recipes": serialize_recipes(owner_id), "planner": load_planner(owner_id)})


@app.put("/api/planner")
@login_required
def api_save_planner():
    owner_id = current_user_id()
    body = request.get_json(silent=True) or {}
    planner = body.get("planner") if isinstance(body.get("planner"), dict) else {}

    for day in WEEK_DAYS:
        entry = PlannerEntry.query.get((owner_id, day))
        if entry is None:
            entry = PlannerEntry(owner_id=owner_id, day=day)
            db.session.add(entry)
        entry.recipe_id = planner.get(day, "") or ""

    db.session.commit()
    return jsonify({"planner": load_planner(owner_id)})


@app.get("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/<path:path>")
def static_files(path: str):
    if path.startswith("api/"):
        return jsonify({"error": "Not found"}), 404
    return send_from_directory(BASE_DIR, path)


def save_recipe(recipe_data: dict, owner_id: str) -> Recipe:
    source_url = str(recipe_data.get("sourceUrl") or "").strip()
    recipe = None

    if source_url:
        recipe = Recipe.query.filter_by(source_url=source_url, owner_id=owner_id).first()

    if recipe is None and recipe_data.get("id"):
        candidate = Recipe.query.get(recipe_data["id"])
        if candidate is not None and candidate.owner_id == owner_id:
            recipe = candidate

    if recipe is None:
        recipe = Recipe(
            id=str(uuid.uuid4()),
            owner_id=owner_id,
            imported_at=datetime.now(timezone.utc),
        )
        db.session.add(recipe)

    recipe.title = str(recipe_data.get("title") or "Imported Recipe").strip()
    recipe.source_url = source_url
    recipe.description = str(recipe_data.get("description") or "")
    recipe.ingredients_json = json.dumps(recipe_data.get("ingredients") or [])
    recipe.instructions_json = json.dumps(recipe_data.get("instructions") or [])
    recipe.method = str(recipe_data.get("method") or "")
    recipe.image = str(recipe_data.get("image") or "")
    recipe.servings = normalize_servings(recipe_data.get("servings"))
    if not recipe.imported_at:
        recipe.imported_at = datetime.now(timezone.utc)

    db.session.commit()
    return recipe


def serialize_user(user: User) -> dict:
    return {"id": user.id, "email": user.email}


def serialize_recipes(owner_id: str) -> list[dict]:
    recipes = Recipe.query.filter_by(owner_id=owner_id).order_by(Recipe.imported_at.desc()).all()
    return [serialize_recipe(recipe) for recipe in recipes]


def serialize_recipe(recipe: Recipe) -> dict:
    return {
        "id": recipe.id,
        "title": recipe.title,
        "sourceUrl": recipe.source_url,
        "description": recipe.description,
        "ingredients": json.loads(recipe.ingredients_json or "[]"),
        "instructions": json.loads(recipe.instructions_json or "[]"),
        "method": recipe.method,
        "image": recipe.image,
        "servings": recipe.servings,
        "importedAt": recipe.imported_at.isoformat() if recipe.imported_at else "",
    }


def load_planner(owner_id: str) -> dict[str, str]:
    planner = {day: "" for day in WEEK_DAYS}
    for entry in PlannerEntry.query.filter_by(owner_id=owner_id).all():
        planner[entry.day] = entry.recipe_id or ""
    return planner


def normalize_servings(value: object) -> int | None:
    try:
        servings = int(value)
    except (TypeError, ValueError):
        return None
    return servings if servings > 0 else None


def sanitize_recipe_payload(payload: dict) -> dict:
    return {
        "id": str(payload.get("id") or ""),
        "title": str(payload.get("title") or ""),
        "sourceUrl": str(payload.get("sourceUrl") or ""),
        "description": str(payload.get("description") or ""),
        "ingredients": payload.get("ingredients") if isinstance(payload.get("ingredients"), list) else [],
        "instructions": payload.get("instructions") if isinstance(payload.get("instructions"), list) else [],
        "method": str(payload.get("method") or ""),
        "image": str(payload.get("image") or ""),
        "servings": normalize_servings(payload.get("servings")),
    }


if __name__ == "__main__":
    debug_enabled = os.environ.get("FLASK_DEBUG", "").strip().lower() in {"1", "true", "yes"}
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=debug_enabled)
