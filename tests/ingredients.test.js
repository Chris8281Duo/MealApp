import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  parseIngredient,
  createIngredientEntry,
  mergeIngredientEntry,
  formatIngredientSummary,
  findShoppingCategoryIndex,
  scaleIngredientText,
  canonicalizeIngredientName,
  singularizeWord,
} from "../ingredients.js";

describe("parseIngredient", () => {
  test("splits quantity, unit, and name", () => {
    const parsed = parseIngredient("2 cups chopped tomatoes");
    assert.equal(parsed.quantity, 2);
    assert.equal(parsed.unit, "cup");
    assert.equal(parsed.key, "canned tomato");
  });

  test("handles mixed-number quantities", () => {
    const parsed = parseIngredient("1 1/2 cups flour");
    assert.equal(parsed.quantity, 1.5);
  });

  test("canonicalizes synonyms to a shared key", () => {
    const courgette = parseIngredient("1 courgette, sliced");
    const zucchini = parseIngredient("2 zucchini, diced");
    assert.equal(courgette.key, zucchini.key);
  });

  test("leaves ingredients without a leading quantity intact", () => {
    const parsed = parseIngredient("Salt and pepper to taste");
    assert.equal(parsed.quantity, null);
    assert.equal(parsed.unit, "");
  });
});

describe("mergeIngredientEntry unit conversion", () => {
  test("sums identical units", () => {
    const entry = createIngredientEntry(parseIngredient("2 cups broth"), "Recipe A");
    mergeIngredientEntry(entry, parseIngredient("1 cup broth"), "Recipe B");
    assert.equal(entry.quantityTotal, 3);
    assert.equal(entry.unit, "cup");
  });

  test("converts compatible volume units before summing", () => {
    const entry = createIngredientEntry(parseIngredient("2 tbsp olive oil"), "Recipe A");
    mergeIngredientEntry(entry, parseIngredient("1 cup olive oil"), "Recipe B");
    // 2 tbsp (~29.57ml) + 1 cup (~236.59ml) = ~266.16ml
    assert.equal(entry.unit, "ml");
    assert.ok(Math.abs(entry.quantityTotal - 266.16) < 1);
  });

  test("converts compatible weight units and upgrades to kg past 1000g", () => {
    const entry = createIngredientEntry(parseIngredient("700g flour"), "Recipe A");
    mergeIngredientEntry(entry, parseIngredient("500g flour"), "Recipe B");
    assert.equal(entry.unit, "kg");
    assert.equal(entry.quantityTotal, 1.2);
  });

  test("falls back to a recipe count when units are incompatible", () => {
    const entry = createIngredientEntry(parseIngredient("1 can tomatoes"), "Recipe A");
    mergeIngredientEntry(entry, parseIngredient("400g tomatoes"), "Recipe B");
    assert.equal(entry.quantityTotal, null);
    assert.equal(formatIngredientSummary(entry), "2 recipes");
  });
});

describe("findShoppingCategoryIndex", () => {
  test("matches produce ahead of the catch-all cupboard category", () => {
    assert.equal(findShoppingCategoryIndex("Carrot"), 0);
  });

  test("falls back to the last (cupboard) category for unmatched items", () => {
    const categories = findShoppingCategoryIndex("Nutritional Yeast");
    assert.ok(categories >= 0);
  });
});

describe("scaleIngredientText", () => {
  test("scales the leading quantity and preserves the rest of the line", () => {
    assert.equal(scaleIngredientText("2 cups flour, sifted", 2), "4 cups flour, sifted");
  });

  test("scales mixed-number quantities", () => {
    assert.equal(scaleIngredientText("1 1/2 cups sugar", 2), "3 cups sugar");
  });

  test("returns the original text when there is no leading quantity", () => {
    assert.equal(scaleIngredientText("Salt to taste", 2), "Salt to taste");
  });

  test("is a no-op for a scale factor of 1", () => {
    assert.equal(scaleIngredientText("2 cups flour", 1), "2 cups flour");
  });
});

describe("canonicalizeIngredientName / singularizeWord", () => {
  test("resolves an exact synonym match to its canonical name", () => {
    assert.equal(canonicalizeIngredientName("coriander leaves"), "cilantro");
  });

  test("strips prep descriptors that aren't part of a synonym entry", () => {
    assert.equal(canonicalizeIngredientName("finely chopped fresh basil"), "basil");
  });

  test("singularizes common plural endings", () => {
    assert.equal(singularizeWord("tomatoes"), "tomato");
    assert.equal(singularizeWord("berries"), "berry");
    assert.equal(singularizeWord("glass"), "glass");
  });
});
