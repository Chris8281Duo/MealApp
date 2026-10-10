# Deploying TableSet on Render

This version of TableSet uses a real backend and a real database.

- The frontend, backend, and recipe importer are served by one Python web service.
- Recipes and the weekly menu are stored in Postgres instead of browser storage.
- Each signed-in user has their own recipe library and weekly planner.

## What is included

- `backend.py` runs the Flask app, API, and account/session handling.
- `recipe_importer.py` fetches and parses recipe URLs on the server.
- `render.yaml` defines a Render web service plus a Render Postgres database.
- `requirements.txt` lists the Python dependencies.

## Deploy path

1. Put this project in a GitHub repo.
2. In Render, click `New` -> `Blueprint`.
3. Connect the GitHub repo.
4. Render will detect `render.yaml`.
5. Confirm the blueprint to create:
   - a web service named `tableset`
   - a Postgres database named `tableset-db`
6. Wait for the first deploy to finish.
7. Open the Render `onrender.com` URL for the web service and register an account.

## Local behavior

- If you open `index.html` with `file://`, the app still works in local-only mode (no accounts, data lives in browser storage).
- If you open the app through the Flask server or on Render, it uses the shared backend and requires signing in.

## Environment variables

- `DATABASE_URL` — set automatically by the Render blueprint from the Postgres connection string. Falls back to a local `tableset.db` SQLite file when unset.
- `SECRET_KEY` — set automatically by the Render blueprint (`generateValue: true`) and used to sign session cookies. If you deploy outside of the blueprint, set this yourself to a long random value; without it, a random key is generated per process and everyone gets signed out on every restart.
- `FLASK_DEBUG` — leave unset (or `0`) in production. Only set to `1` for local debugging; it enables the Werkzeug interactive debugger, which is a remote-code-execution risk if ever exposed.
- `SESSION_COOKIE_SECURE` — defaults to on (cookies only sent over HTTPS). Set to `0` only for local HTTP development.

## Notes

- **Breaking schema change:** recipes and the weekly planner are now scoped per user (`owner_id`). If you're upgrading an existing deployment, the database needs to be recreated — the old shared board's data does not migrate automatically to a specific account.
