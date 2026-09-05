export const SHOPPING_CATEGORIES = [
  {
    label: "Fresh Fruit & Veg",
    matches: [
      "apple",
      "apricot",
      "arugula",
      "asparagus",
      "avocado",
      "basil",
      "bell pepper",
      "berry",
      "broccoli",
      "cabbage",
      "capsicum",
      "carrot",
      "cauliflower",
      "celery",
      "chili",
      "cilantro",
      "coriander",
      "courgette",
      "cucumber",
      "eggplant",
      "garlic",
      "ginger",
      "grape",
      "herb",
      "kale",
      "leek",
      "lemon",
      "lettuce",
      "lime",
      "mango",
      "mushroom",
      "onion",
      "orange",
      "parsley",
      "pear",
      "pepper",
      "pineapple",
      "potato",
      "rocket",
      "salad",
      "scallion",
      "spinach",
      "spring onion",
      "tomato",
      "zucchini",
    ],
  },
  {
    label: "Fridge & Dairy",
    matches: [
      "butter",
      "cheese",
      "cream",
      "creme fraiche",
      "egg",
      "feta",
      "halloumi",
      "milk",
      "mozzarella",
      "parmesan",
      "yogurt",
      "yoghurt",
    ],
  },
  {
    label: "Meat & Fish",
    matches: [
      "beef",
      "bacon",
      "chicken",
      "ham",
      "lamb",
      "pork",
      "prawn",
      "salmon",
      "sausage",
      "shrimp",
      "steak",
      "turkey",
      "tuna",
    ],
  },
  {
    label: "Frozen",
    matches: ["frozen", "ice cream", "peas", "sweetcorn", "hash brown"],
  },
  {
    label: "Bakery",
    matches: ["bread", "bun", "roll", "pitta", "tortilla", "wrap", "bagel"],
  },
  {
    label: "Cupboard",
    matches: [],
  },
];

export const INGREDIENT_SYNONYMS = [
  {
    canonical: "cajun seasoning",
    matches: ["cajun seasoning", "cajun spice mix", "cajun spice blend"],
  },
  {
    canonical: "paprika",
    matches: [
      "paprika",
      "ground paprika",
      "sweet paprika",
      "smoked paprika",
      "sweet smoked paprika",
    ],
  },
  {
    canonical: "chili powder",
    matches: ["chili powder", "chilli powder", "ground chili", "ground chilli"],
  },
  {
    canonical: "red pepper flakes",
    matches: ["red pepper flakes", "chilli flakes", "chili flakes", "crushed red pepper"],
  },
  {
    canonical: "cilantro",
    matches: ["cilantro", "coriander leaves", "fresh coriander", "coriander leaf"],
  },
  {
    canonical: "scallions",
    matches: ["scallions", "spring onions", "green onions"],
  },
  {
    canonical: "bell pepper",
    matches: ["bell pepper", "capsicum"],
  },
  {
    canonical: "zucchini",
    matches: ["zucchini", "courgette"],
  },
  {
    canonical: "eggplant",
    matches: ["eggplant", "aubergine"],
  },
  {
    canonical: "arugula",
    matches: ["arugula", "rocket"],
  },
  {
    canonical: "garbanzo beans",
    matches: ["garbanzo beans", "chickpeas"],
  },
  {
    canonical: "confectioners sugar",
    matches: ["confectioners sugar", "powdered sugar", "icing sugar"],
  },
  {
    canonical: "cornstarch",
    matches: ["cornstarch", "cornflour"],
  },
  {
    canonical: "plain flour",
    matches: ["plain flour", "all purpose flour", "all-purpose flour"],
  },
  {
    canonical: "baking soda",
    matches: ["baking soda", "bicarbonate of soda", "bicarb"],
  },
  {
    canonical: "baking powder",
    matches: ["baking powder", "raising powder"],
  },
  {
    canonical: "heavy cream",
    matches: ["heavy cream", "double cream"],
  },
  {
    canonical: "whipping cream",
    matches: ["whipping cream", "single cream"],
  },
  {
    canonical: "yogurt",
    matches: ["yogurt", "yoghurt", "greek yogurt", "greek yoghurt"],
  },
  {
    canonical: "mozzarella",
    matches: ["mozzarella", "fresh mozzarella"],
  },
  {
    canonical: "parmesan",
    matches: ["parmesan", "parmigiano reggiano"],
  },
  {
    canonical: "canned tomatoes",
    matches: [
      "canned tomatoes",
      "can tomatoes",
      "tinned tomatoes",
      "tin tomatoes",
      "chopped tomatoes",
      "whole tomatoes",
      "peeled tomatoes",
      "plum tomatoes",
      "diced tomatoes",
      "tomatoes",
    ],
  },
  {
    canonical: "passata",
    matches: ["passata", "tomato puree", "tomato purée"],
  },
  {
    canonical: "broth",
    matches: ["broth", "stock"],
  },
  {
    canonical: "shrimp",
    matches: ["shrimp", "prawns"],
  },
  {
    canonical: "ground beef",
    matches: ["ground beef", "minced beef", "beef mince"],
  },
  {
    canonical: "ground pork",
    matches: ["ground pork", "pork mince", "minced pork"],
  },
  {
    canonical: "ground turkey",
    matches: ["ground turkey", "turkey mince", "minced turkey"],
  },
  {
    canonical: "chicken breast",
    matches: [
      "chicken breast",
      "chicken breasts",
      "skinless chicken breast",
      "skinless chicken breasts",
      "boneless chicken breast",
      "boneless chicken breasts",
      "skinless boneless chicken breast",
      "skinless boneless chicken breasts",
    ],
  },
  {
    canonical: "soda water",
    matches: ["soda water", "sparkling water"],
  },
  {
    canonical: "caster sugar",
    matches: ["caster sugar", "superfine sugar"],
  },
  {
    canonical: "brown sugar",
    matches: ["brown sugar", "light brown sugar", "soft brown sugar"],
  },
];

// Units that can be summed across recipes once converted to a shared base
// unit for their dimension (volume in ml, weight in g).
export const UNIT_CONVERSIONS = {
  ml: { group: "volume", toBase: 1 },
  l: { group: "volume", toBase: 1000 },
  tsp: { group: "volume", toBase: 4.92892 },
  tbsp: { group: "volume", toBase: 14.7868 },
  cup: { group: "volume", toBase: 236.588 },
  g: { group: "weight", toBase: 1 },
  kg: { group: "weight", toBase: 1000 },
};

const INGREDIENT_UNITS = [
  "g",
  "kg",
  "ml",
  "l",
  "tbsp",
  "tsp",
  "cup",
  "cups",
  "clove",
  "cloves",
  "can",
  "cans",
  "tin",
  "tins",
  "handful",
  "handfuls",
  "slice",
  "slices",
  "bunch",
  "bunches",
  "packet",
  "packets",
];

const LEADING_QUANTITY_PATTERN = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)(?:\s+|-)?(.*)$/;

export function parseIngredient(ingredient) {
  const cleaned = normalizeIngredientLabel(ingredient);
  const quantityMatch = cleaned.match(LEADING_QUANTITY_PATTERN);
  const quantity = quantityMatch ? parseIngredientQuantity(quantityMatch[1]) : null;
  const remainder = quantityMatch ? quantityMatch[2].trim() : cleaned;
  const tokens = remainder.split(/\s+/).filter(Boolean);
  const firstToken = tokens[0] || "";
  const unit = isIngredientUnit(firstToken) ? singularizeWord(firstToken) : "";
  const nameTokens = unit ? tokens.slice(1) : tokens;
  const ingredientName = canonicalizeIngredientName(
    nameTokens.join(" ") || remainder || cleaned
  );
  const label = titleCaseIngredient(ingredientName);
  const key = normalizeIngredientKey(ingredientName);

  return {
    original: ingredient,
    label,
    key,
    quantity,
    unit,
  };
}

export function createIngredientEntry(parsed, recipeTitle) {
  return {
    key: parsed.key,
    label: parsed.label,
    recipes: [recipeTitle],
    quantityTotal: parsed.quantity,
    unit: parsed.unit,
    rawCount: 1,
    sourceLabels: [parsed.original],
  };
}

export function mergeIngredientEntry(entry, parsed, recipeTitle) {
  if (!entry.recipes.includes(recipeTitle)) {
    entry.recipes.push(recipeTitle);
  }

  entry.rawCount += 1;
  entry.sourceLabels.push(parsed.original);

  if (entry.quantityTotal === null || parsed.quantity === null) {
    entry.quantityTotal = null;
    return;
  }

  if (entry.unit === parsed.unit) {
    entry.quantityTotal += parsed.quantity;
    upgradeDisplayUnit(entry);
    return;
  }

  const entryConversion = UNIT_CONVERSIONS[entry.unit || ""];
  const parsedConversion = UNIT_CONVERSIONS[parsed.unit || ""];

  if (entryConversion && parsedConversion && entryConversion.group === parsedConversion.group) {
    const baseTotal = entry.quantityTotal * entryConversion.toBase + parsed.quantity * parsedConversion.toBase;
    const displayUnit = pickDisplayUnit(entryConversion.group, baseTotal);
    entry.quantityTotal = baseTotal / UNIT_CONVERSIONS[displayUnit].toBase;
    entry.unit = displayUnit;
    return;
  }

  entry.quantityTotal = null;
}

function pickDisplayUnit(group, baseTotal) {
  if (group === "weight") {
    return baseTotal >= 1000 ? "kg" : "g";
  }
  return baseTotal >= 1000 ? "l" : "ml";
}

// Same-unit sums skip the cross-unit conversion path above, but a base metric
// unit (g/ml) should still roll over to kg/l once the total gets unwieldy.
function upgradeDisplayUnit(entry) {
  if (entry.unit === "g" && entry.quantityTotal >= 1000) {
    entry.quantityTotal /= 1000;
    entry.unit = "kg";
  } else if (entry.unit === "ml" && entry.quantityTotal >= 1000) {
    entry.quantityTotal /= 1000;
    entry.unit = "l";
  }
}

export function formatIngredientSummary(item) {
  if (item.quantityTotal !== null) {
    const quantity = formatQuantity(item.quantityTotal);
    return item.unit ? `${quantity} ${item.unit}` : quantity;
  }

  return item.recipes.length > 1 ? `${item.recipes.length} recipes` : item.recipes[0];
}

export function groupShoppingItems(items) {
  const groups = SHOPPING_CATEGORIES.map((category) => ({
    label: category.label,
    items: [],
  }));

  items.forEach((item) => {
    const categoryIndex = findShoppingCategoryIndex(item.label);
    groups[categoryIndex].items.push(item);
  });

  return groups.filter((group) => group.items.length);
}

export function findShoppingCategoryIndex(label) {
  const normalized = normalizeIngredientLabel(label);
  const matchedIndex = SHOPPING_CATEGORIES.findIndex(
    (category) =>
      category.matches.length &&
      category.matches.some(
        (match) =>
          normalized.includes(match) ||
          normalizeIngredientKey(label).includes(normalizeIngredientKey(match))
      )
  );

  return matchedIndex >= 0 ? matchedIndex : SHOPPING_CATEGORIES.length - 1;
}

export function normalizeIngredientLabel(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^[\-•*]+\s*/, "")
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeIngredientKey(value) {
  return stripIngredientDescriptors(canonicalizeIngredientName(value))
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => singularizeWord(word))
    .join(" ");
}

export function canonicalizeIngredientName(value) {
  const normalized = stripIngredientDescriptors(normalizeIngredientLabel(value))
    .replace(/\s+/g, " ")
    .trim();

  const synonymMatch = INGREDIENT_SYNONYMS.find((entry) =>
    entry.matches.some((match) => normalizeIngredientLabel(match) === normalized)
  );

  return synonymMatch ? synonymMatch.canonical : normalized;
}

export function stripIngredientDescriptors(value) {
  return String(value || "")
    // "x 400g" (a leading count already stripped by the caller) needs to go
    // before the plain digit+unit pattern below, or the bare "x" pattern
    // eats the digits and strands the unit letter (e.g. "g canned beans").
    .replace(/\bx\s*\d+(?:\.\d+)?\s*(g|kg|ml|l)?\b/g, " ")
    .replace(/\b\d+\s*x\s*/g, " ")
    .replace(/\bx\s+\d+/g, " ")
    .replace(/\b\d+(?:\.\d+)?\s*(g|kg|ml|l)\b/g, " ")
    .replace(/\b(heaped|level|pinch)\b/g, " ")
    .replace(/\b(powdered|ground)\b/g, " ")
    .replace(/\b(cut|sliced) into (strips|pieces|chunks|cubes)\b/g, " ")
    .replace(/\bplus extra( for \w+)?\b/g, " ")
    .replace(/\bfor (frying|dusting|serving|drizzling|topping)\b/g, " ")
    .replace(/\b(kept warm|to serve|to taste)\b/g, " ")
    .replace(
      /\b(of|and|or|very|fresh|large|small|medium|extra|optional|sweet|smoked|crushed|chopped|finely|roughly|thinly|minced|diced|sliced|grated|deseeded|seeded|peeled|skinless|boneless|can|cans|tin|tins|beaten|separated|fried|pounded|thin|torn|shredded|cubed|quartered|halved|crumbled|wilted|cooked|drained|warmed|roasted)\b/g,
      " "
    );
}

export function parseIngredientQuantity(value) {
  if (!value) {
    return null;
  }

  const mixedMatch = value.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = Number(mixedMatch[1]);
    const top = Number(mixedMatch[2]);
    const bottom = Number(mixedMatch[3]);
    return bottom !== 0 ? whole + top / bottom : null;
  }

  if (value.includes("/")) {
    const [numerator, denominator] = value.split("/");
    const top = Number(numerator);
    const bottom = Number(denominator);
    return Number.isFinite(top) && Number.isFinite(bottom) && bottom !== 0 ? top / bottom : null;
  }

  const quantity = Number(value);
  return Number.isFinite(quantity) ? quantity : null;
}

export function formatQuantity(value) {
  if (!Number.isFinite(value)) {
    return "";
  }

  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

// Scales just the leading quantity of an ingredient line (e.g. "2 cups flour, sifted")
// and leaves the rest of the text untouched, so wording and prep notes survive scaling.
export function scaleIngredientText(text, factor) {
  if (!text || !Number.isFinite(factor) || factor <= 0 || factor === 1) {
    return text;
  }

  const match = text.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)(\s|$)/);
  if (!match) {
    return text;
  }

  const quantity = parseIngredientQuantity(match[1]);
  if (quantity === null) {
    return text;
  }

  return `${formatQuantity(quantity * factor)}${text.slice(match[1].length)}`;
}

export function singularizeWord(word) {
  if (!word) {
    return "";
  }

  if (word.endsWith("ies")) {
    return `${word.slice(0, -3)}y`;
  }

  if (word.endsWith("oes")) {
    return word.slice(0, -2);
  }

  if (word.endsWith("s") && !word.endsWith("ss")) {
    return word.slice(0, -1);
  }

  return word;
}

export function titleCaseIngredient(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function isIngredientUnit(word) {
  return INGREDIENT_UNITS.includes(word);
}
