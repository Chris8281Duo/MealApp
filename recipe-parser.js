// Client-side mirror of recipe_importer.py, used only when the app runs
// without a backend (file:// mode). Keep the two in sync: both read the
// same JSON-LD Recipe shape and fall back to the same heading keywords.

export function extractRecipeFromHtml(doc, sourceUrl, uuid = () => cryptoRandomUUID()) {
  const jsonLdScripts = Array.from(
    doc.querySelectorAll('script[type="application/ld+json"]')
  );

  const candidateRecipes = jsonLdScripts
    .flatMap((script) => parseJsonLd(script.textContent))
    .flatMap(flattenJsonLdNodes)
    .filter((entry) => isRecipeNode(entry));

  const recipeNode = candidateRecipes[0];

  if (!recipeNode) {
    return extractRecipeFromVisibleHtml(doc, sourceUrl, uuid);
  }

  const instructions = normalizeInstructions(recipeNode.recipeInstructions);
  const ingredients = normalizeStringList(recipeNode.recipeIngredient);
  const description = normalizeText(recipeNode.description);
  const title = normalizeText(recipeNode.name) || inferTitleFromUrl(sourceUrl);
  const image = normalizeImage(recipeNode.image);
  const servings = extractServings(recipeNode.recipeYield);

  return {
    id: uuid(),
    title,
    sourceUrl,
    description,
    ingredients,
    instructions,
    method: instructions.join(" "),
    image,
    servings,
    importedAt: new Date().toISOString(),
  };
}

export function extractRecipeFromVisibleHtml(doc, sourceUrl, uuid = () => cryptoRandomUUID()) {
  const title =
    normalizeText(doc.querySelector("h1")?.textContent) || inferTitleFromUrl(sourceUrl);
  const ingredients = gatherListAfterHeading(doc, ["ingredients"]);
  const instructions = gatherListAfterHeading(doc, [
    "instructions",
    "method",
    "directions",
    "preparation",
  ]);
  const description = normalizeText(
    doc.querySelector('meta[name="description"]')?.getAttribute("content")
  );

  return {
    id: uuid(),
    title,
    sourceUrl,
    description,
    ingredients,
    instructions,
    method: instructions.join(" "),
    image: "",
    servings: null,
    importedAt: new Date().toISOString(),
  };
}

export function gatherListAfterHeading(doc, keywords) {
  const headings = Array.from(doc.querySelectorAll("h1, h2, h3, h4, strong, b"));
  const match = headings.find((heading) => {
    const text = normalizeText(heading.textContent).toLowerCase();
    return keywords.some((keyword) => text === keyword || text.includes(keyword));
  });

  if (!match) {
    return [];
  }

  let sibling = match.nextElementSibling;
  while (sibling) {
    if (["UL", "OL"].includes(sibling.tagName)) {
      return Array.from(sibling.querySelectorAll("li"))
        .map((item) => normalizeText(item.textContent))
        .filter(Boolean);
    }

    if (sibling.tagName === "P") {
      const lines = sibling.textContent
        .split(/\n|\. /)
        .map((line) => normalizeText(line))
        .filter(Boolean);
      if (lines.length) {
        return lines;
      }
    }

    sibling = sibling.nextElementSibling;
  }

  return [];
}

export function parseJsonLd(text) {
  if (!text) {
    return [];
  }

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    return [];
  }
}

export function flattenJsonLdNodes(node) {
  if (!node) {
    return [];
  }

  const graph = Array.isArray(node["@graph"]) ? node["@graph"] : [];
  return [node, ...graph];
}

export function isRecipeNode(node) {
  const type = node["@type"];
  if (Array.isArray(type)) {
    return type.includes("Recipe");
  }
  return type === "Recipe";
}

export function normalizeInstructions(input) {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input
      .flatMap((entry) => {
        if (typeof entry === "string") {
          return [entry];
        }

        if (entry?.text) {
          return [entry.text];
        }

        if (Array.isArray(entry?.itemListElement)) {
          return entry.itemListElement.map((item) => item.text || "");
        }

        return [];
      })
      .map((entry) => normalizeText(entry))
      .filter(Boolean);
  }

  if (typeof input === "string") {
    return input
      .split(/\n+/)
      .map((entry) => normalizeText(entry))
      .filter(Boolean);
  }

  return [];
}

export function normalizeStringList(input) {
  if (!input) {
    return [];
  }

  return (Array.isArray(input) ? input : [input])
    .map((entry) => normalizeText(String(entry)))
    .filter(Boolean);
}

export function normalizeImage(image) {
  if (!image) {
    return "";
  }

  if (typeof image === "string") {
    return image;
  }

  if (Array.isArray(image)) {
    return typeof image[0] === "string" ? image[0] : image[0]?.url || "";
  }

  return image.url || "";
}

// recipeYield can be "4", "4 servings", or a list of those; pull the first number out.
export function extractServings(raw) {
  if (raw === null || raw === undefined) {
    return null;
  }

  const values = Array.isArray(raw) ? raw : [raw];
  for (const value of values) {
    const match = String(value).match(/\d+/);
    if (match) {
      return Number(match[0]);
    }
  }

  return null;
}

export function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

export function inferTitleFromUrl(url) {
  try {
    const path = new URL(url).pathname
      .split("/")
      .filter(Boolean)
      .pop();
    return path
      ? path
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (letter) => letter.toUpperCase())
      : "Imported Recipe";
  } catch (error) {
    return "Imported Recipe";
  }
}

function cryptoRandomUUID() {
  return crypto.randomUUID();
}
