# TableSet

A recipe importer and weekly meal planner. Paste in a recipe URL, TableSet
pulls out the title, ingredients, instructions, and servings; drop recipes
into a weekly menu; get a shopping list that merges duplicate ingredients
across the week automatically.

It runs two ways:

- **Hosted** (Flask + Postgres/SQLite): sign in, and your recipes and weekly
  planner are saved server-side under your account.
- **Local-only** (open `index.html` directly, no server): no accounts, data
  lives in the browser's `localStorage`, and recipe URLs are fetched
  client-side (or pasted in as HTML when a site blocks direct fetching).

See [DEPLOY.md](DEPLOY.md) for deploying the hosted version to Render.

## Architecture

- `backend.py` — Flask app: authentication (session cookies, hashed
  passwords), the recipe/planner API, and static file serving.
- `recipe_importer.py` — server-side recipe parsing (JSON-LD `Recipe` schema
  first, falls back to heading-based HTML scraping), with SSRF protections
  on the URLs it's allowed to fetch.
- `index.html` / `styles.css` — the page shell and styling.
- `app.js` — client-side state, rendering, and event handling. Imports the
  modules below.
- `ingredients.js` — pure ingredient-parsing and shopping-list logic
  (quantity/unit parsing, synonym canonicalization, unit conversion for
  merging, category grouping, serving-size scaling).
- `recipe-parser.js` — client-side mirror of `recipe_importer.py`'s JSON-LD
  parsing, used only in local-only (`file://`) mode where there's no backend
  to do it server-side. Keep the two in sync when changing either.
- `share.js` — gzip + base64url encoding for local-only mode's share links.

## Local development

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt

SECRET_KEY=dev-secret SESSION_COOKIE_SECURE=0 FLASK_DEBUG=1 python3 backend.py
```

Then open `http://localhost:5000` and register an account. This uses a
local `tableset.db` SQLite file by default; delete it to start fresh.

### Frontend only (no backend)

Just open `index.html` directly in a browser (`file://`) — no accounts,
everything is stored in `localStorage`.

## Tests

Two independent suites, since the recipe parser and ingredient logic each
exist in both Python (server-side import) and JavaScript (client-side
fallback for local-only mode):

```bash
# Python: recipe_importer.py parsing, SSRF validation, servings extraction
pip install -r requirements-dev.txt
pytest

# JavaScript: ingredients.js and recipe-parser.js
npm install
npm test
```

Both suites parse the same HTML fixtures in `tests/fixtures/` and assert
the same output, to catch the two parsers drifting apart.

## Known limitations

- The synonym/canonicalization table in `ingredients.js` strips descriptor
  words (fresh, ground, chopped, ...) before matching synonyms, which means
  a few common phrasings (e.g. "ground beef", "minced beef") don't resolve
  to their intended canonical name today. Fixing this generally is riskier
  than it looks — descriptor words like "ground" and "fresh" can be the
  difference between two different ingredients (ground coriander the spice
  vs. fresh coriander the herb), so a proper fix needs its own pass rather
  than a quick patch.
- Ingredient shopping categories (`SHOPPING_CATEGORIES` in `ingredients.js`)
  are a hardcoded keyword list; anything not recognized falls into a
  catch-all "Cupboard" category.
