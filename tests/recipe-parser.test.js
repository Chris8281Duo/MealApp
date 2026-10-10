import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { JSDOM } from "jsdom";

import {
  extractRecipeFromHtml,
  extractServings,
  normalizeText,
  inferTitleFromUrl,
  isRecipeNode,
  parseJsonLd,
} from "../recipe-parser.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, "fixtures");

function loadDoc(fixtureName) {
  const html = readFileSync(path.join(FIXTURES, fixtureName), "utf-8");
  return new JSDOM(html).window.document;
}

let uuidCounter = 0;
const stubUuid = () => `stub-uuid-${++uuidCounter}`;

describe("extractRecipeFromHtml (JSON-LD path)", () => {
  test("parses the same fixture the Python parser is tested against", () => {
    const doc = loadDoc("json_ld_recipe.html");
    const recipe = extractRecipeFromHtml(doc, "https://example.com/recipes/lemon-chicken", stubUuid);

    assert.equal(recipe.title, "Weeknight Lemon Chicken");
    assert.equal(recipe.description, "Bright, fast, and forgiving for a weeknight.");
    assert.equal(recipe.servings, 4);
    assert.equal(recipe.image, "https://example.com/images/lemon-chicken.jpg");
    assert.deepEqual(recipe.ingredients, [
      "2 tbsp olive oil",
      "4 chicken breasts",
      "1 lemon, juiced",
      "2 garlic cloves, minced",
      "Salt and pepper to taste",
    ]);
    assert.deepEqual(recipe.instructions, [
      "Season the chicken with salt and pepper.",
      "Sear in olive oil until golden, about 5 minutes per side.",
      "Add garlic and lemon juice, simmer until cooked through.",
    ]);
  });
});

describe("extractRecipeFromHtml (visible HTML fallback)", () => {
  test("parses the same fixture the Python parser is tested against", () => {
    const doc = loadDoc("visible_html_recipe.html");
    const recipe = extractRecipeFromHtml(doc, "https://example.com/recipes/veg-stew", stubUuid);

    assert.equal(recipe.title, "Rustic Vegetable Stew");
    assert.equal(recipe.servings, null);
    assert.deepEqual(recipe.ingredients, [
      "2 carrots, sliced",
      "1 onion, diced",
      "400g canned tomatoes",
      "500ml vegetable stock",
    ]);
    assert.deepEqual(recipe.instructions, [
      "Saute the onion and carrots until soft.",
      "Add the tomatoes and stock, then simmer for 25 minutes.",
    ]);
  });
});

describe("extractServings", () => {
  test("pulls the first number out of a yield string or list", () => {
    assert.equal(extractServings("4"), 4);
    assert.equal(extractServings("4 servings"), 4);
    assert.equal(extractServings(["4 to 6 servings"]), 4);
    assert.equal(extractServings(null), null);
    assert.equal(extractServings("serves many"), null);
  });
});

describe("normalizeText", () => {
  test("collapses whitespace runs and non-breaking spaces", () => {
    const messy = `A${String.fromCharCode(160)}B\t\tC\n\nD`;
    assert.equal(normalizeText(messy), "A B C D");
  });
});

describe("inferTitleFromUrl", () => {
  test("falls back when the URL cannot be parsed", () => {
    assert.equal(inferTitleFromUrl("not a url"), "Imported Recipe");
  });

  test("title-cases the last path segment", () => {
    assert.equal(inferTitleFromUrl("https://example.com/roast-veg-pasta"), "Roast Veg Pasta");
  });
});

describe("isRecipeNode / parseJsonLd", () => {
  test("accepts both a bare @type and an array of types", () => {
    assert.equal(isRecipeNode({ "@type": "Recipe" }), true);
    assert.equal(isRecipeNode({ "@type": ["Article", "Recipe"] }), true);
    assert.equal(isRecipeNode({ "@type": "Article" }), false);
  });

  test("parseJsonLd tolerates malformed JSON without throwing", () => {
    assert.deepEqual(parseJsonLd("{not valid json"), []);
    assert.deepEqual(parseJsonLd(""), []);
  });
});
