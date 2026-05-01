# Deploying TableSet on Render

This version of TableSet uses a real backend and a real database.

- The frontend, backend, and recipe importer are served by one Python web service.
- Recipes and the weekly menu are stored in Postgres instead of browser storage.
- When the app is live, everyone opening the site sees the same shared recipe board.

## What is included

- `backend.py` runs the Flask app and API.
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
7. Open the Render `onrender.com` URL for the web service.

## Local behavior

- If you open `index.html` with `file://`, the app still works in local-only mode.
- If you open the app through the Flask server or on Render, it uses the shared backend.

## Notes

- The Render blueprint sets `DATABASE_URL` from the Postgres database connection string.
- The default local database is `tableset.db` in the project folder.
- If you want private multi-user accounts later, that can be added on top of this backend.
