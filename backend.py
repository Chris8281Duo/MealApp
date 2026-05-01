from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone

from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Text

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
db = SQLAlchemy(app)


class Recipe(db.Model):
    __tablename__ = "recipes"

    id = db.Column(String(36), primary_key=True)
    title = db.Column(String(255), nullable=False)
    source_url = db.Column(String(2048), nullable=False, default="")
    description = db.Column(Text, nullable=False, default="")
    ingredients_json = db.Column(Text, nullable=False, default="[]")
    instructions_json = db.Column(Text, nullable=False, default="[]")
    method = db.Column(Text, nullable=False, default="")
    image = db.Column(String(2048), nullable=False, default="")
    imported_at = db.Column(db.DateTime(timezone=True), nullable=False)


class PlannerEntry(db.Model):
    __tablename__ = "planner_entries"

    day = db.Column(String(20), primary_key=True)
    recipe_id = db.Column(String(36), nullable=True)


with app.app_context():
    db.create_all()
    for day in WEEK_DAYS:
        if not PlannerEntry.query.get(day):
            db.session.add(PlannerEntry(day=day, recipe_id=""))
    db.session.commit()


@app.get("/api/health")
def healthcheck():
    return jsonify({"ok": True})


@app.get("/api/state")
def get_state():
    return jsonify({"recipes": serialize_recipes(), "planner": load_planner()})


@app.post("/api/import-recipe")
def api_import_recipe():
    body = request.get_json(silent=True) or {}
    recipe_data = import_recipe_from_url(body.get("url", ""))
    recipe = save_recipe(recipe_data)
    return jsonify({"recipe": serialize_recipe(recipe), "recipes": serialize_recipes()})


@app.post("/api/recipes")
def api_save_recipe():
    body = request.get_json(silent=True) or {}
    html = body.get("html", "")
    if html:
        recipe_data = parse_recipe_html(html, body.get("sourceUrl", ""))
    else:
        recipe_data = sanitize_recipe_payload(body)

    recipe = save_recipe(recipe_data)
    return jsonify({"recipe": serialize_recipe(recipe), "recipes": serialize_recipes()})


@app.post("/api/recipes/bulk")
def api_bulk_save_recipes():
    body = request.get_json(silent=True) or {}
    recipes = body.get("recipes") if isinstance(body.get("recipes"), list) else []
    saved = [serialize_recipe(save_recipe(sanitize_recipe_payload(recipe))) for recipe in recipes]
    return jsonify({"recipes": serialize_recipes(), "saved": saved})


@app.put("/api/planner")
def api_save_planner():
    body = request.get_json(silent=True) or {}
    planner = body.get("planner") if isinstance(body.get("planner"), dict) else {}
    for day in WEEK_DAYS:
        entry = PlannerEntry.query.get(day)
        entry.recipe_id = planner.get(day, "") or ""
    db.session.commit()
    return jsonify({"planner": load_planner()})


@app.get("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/<path:path>")
def static_files(path: str):
    if path.startswith("api/"):
        return jsonify({"error": "Not found"}), 404
    return send_from_directory(BASE_DIR, path)


def save_recipe(recipe_data: dict) -> Recipe:
    source_url = str(recipe_data.get("sourceUrl") or "").strip()
    recipe = None

    if source_url:
        recipe = Recipe.query.filter_by(source_url=source_url).first()

    if recipe is None and recipe_data.get("id"):
        recipe = Recipe.query.get(recipe_data["id"])

    if recipe is None:
        recipe = Recipe(
            id=str(uuid.uuid4()),
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
    if not recipe.imported_at:
        recipe.imported_at = datetime.now(timezone.utc)

    db.session.commit()
    return recipe


def serialize_recipes() -> list[dict]:
    recipes = Recipe.query.order_by(Recipe.imported_at.desc()).all()
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
        "importedAt": recipe.imported_at.isoformat() if recipe.imported_at else "",
    }


def load_planner() -> dict[str, str]:
    planner = {day: "" for day in WEEK_DAYS}
    for entry in PlannerEntry.query.all():
        planner[entry.day] = entry.recipe_id or ""
    return planner


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
    }


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=True)
