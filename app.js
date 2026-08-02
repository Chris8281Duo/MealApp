const STORAGE_KEYS = {
  recipes: "tableset-recipes",
  planner: "tableset-planner",
  selectedRecipeId: "tableset-selected-recipe-id",
};

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const SHOPPING_CATEGORIES = [
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

const INGREDIENT_SYNONYMS = [
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

const DEAL_THRESHOLD = 0.15;

const PI_BRAND_GATE_KEYWORDS = ["raspberry pi", "rpi"];

const PI_REFERENCE_VALUES = [
  { label: "Raspberry Pi 5 (8GB)", keywords: ["pi 5", "8gb"], value: 80 },
  { label: "Raspberry Pi 5 (4GB)", keywords: ["pi 5", "4gb"], value: 60 },
  { label: "Raspberry Pi 5 (2GB)", keywords: ["pi 5", "2gb"], value: 50 },
  { label: "Raspberry Pi 4 Model B (8GB)", keywords: ["pi 4", "8gb"], value: 75 },
  { label: "Raspberry Pi 4 Model B (4GB)", keywords: ["pi 4", "4gb"], value: 55 },
  { label: "Raspberry Pi 4 Model B (2GB)", keywords: ["pi 4", "2gb"], value: 45 },
  { label: "Raspberry Pi 4 Model B (1GB)", keywords: ["pi 4", "1gb"], value: 35 },
  { label: "Raspberry Pi 400", keywords: ["pi 400"], value: 70 },
  { label: "Raspberry Pi 3 Model B+", keywords: ["pi 3", "b+"], value: 35 },
  { label: "Raspberry Pi 3 Model B", keywords: ["pi 3", "model b"], value: 30 },
  { label: "Raspberry Pi Zero 2 W", keywords: ["zero 2 w"], value: 15 },
  { label: "Raspberry Pi Zero W", keywords: ["zero w"], value: 10 },
  { label: "Raspberry Pi Zero", keywords: ["pi zero"], value: 5 },
  { label: "Raspberry Pi Pico W", keywords: ["pico w"], value: 6 },
  { label: "Raspberry Pi Pico", keywords: ["pico"], value: 4 },
  { label: "Raspberry Pi Camera Module 3", keywords: ["camera module 3"], value: 25 },
  { label: "Raspberry Pi Camera Module", keywords: ["camera module"], value: 15 },
  { label: "Raspberry Pi Sense HAT", keywords: ["sense hat"], value: 40 },
  { label: "Raspberry Pi PoE+ HAT", keywords: ["poe+ hat", "poe hat"], value: 20 },
  {
    label: "Raspberry Pi Official 27W USB-C Power Supply",
    keywords: ["27w", "power supply"],
    value: 12,
  },
  { label: "Raspberry Pi Official Case", keywords: ["official case"], value: 10 },
];

const demoRecipes = [
  {
    id: crypto.randomUUID(),
    title: "One-Pan Tomato Basil Gnocchi",
    sourceUrl: "https://demo.local/gnocchi",
    description: "A quick weeknight pasta-style dinner with soft gnocchi and tomato sauce.",
    ingredients: [
      "500g shelf-stable gnocchi",
      "2 tbsp olive oil",
      "3 garlic cloves, minced",
      "400g chopped tomatoes",
      "120ml vegetable stock",
      "80g baby spinach",
      "1 handful basil leaves",
      "60g grated parmesan",
    ],
    instructions: [
      "Warm the olive oil in a large saute pan and cook the garlic for 30 seconds.",
      "Add chopped tomatoes, stock, and gnocchi, then simmer until the gnocchi is tender.",
      "Stir in spinach and basil until wilted, then finish with parmesan.",
    ],
    method:
      "Use one large pan, add the wet ingredients first, then simmer the gnocchi directly in the sauce so the starch thickens it naturally.",
    image: "",
    importedAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: "Coconut Chickpea Curry",
    sourceUrl: "https://demo.local/chickpea-curry",
    description: "Comforting curry with pantry ingredients and a bright finish.",
    ingredients: [
      "1 tbsp coconut oil",
      "1 onion, diced",
      "2 garlic cloves, minced",
      "1 tbsp grated ginger",
      "2 tbsp curry paste",
      "2 x 400g chickpeas, drained",
      "400ml coconut milk",
      "200g chopped tomatoes",
      "1 lime",
      "Fresh coriander",
    ],
    instructions: [
      "Cook the onion in coconut oil until soft, then add garlic, ginger, and curry paste.",
      "Add chickpeas, coconut milk, and tomatoes; simmer until thickened.",
      "Finish with lime juice and coriander before serving.",
    ],
    method:
      "Build the flavor base first, then reduce the sauce slowly so it clings to the chickpeas.",
    image: "",
    importedAt: new Date().toISOString(),
  },
];

const elements = {
  importForm: document.querySelector("#import-form"),
  recipeUrl: document.querySelector("#recipe-url"),
  recipeHtml: document.querySelector("#recipe-html"),
  importStatus: document.querySelector("#import-status"),
  shareStatus: document.querySelector("#share-status"),
  loadDemoButton: document.querySelector("#load-demo-button"),
  shareBoardButton: document.querySelector("#share-board-button"),
  recipeLibrary: document.querySelector("#recipe-library"),
  recipeDetail: document.querySelector("#recipe-detail"),
  weeklyMenu: document.querySelector("#weekly-menu"),
  shoppingList: document.querySelector("#shopping-list"),
  recipeCount: document.querySelector("#recipe-count"),
  plannedCount: document.querySelector("#planned-count"),
  shoppingCount: document.querySelector("#shopping-count"),
  recipeCardTemplate: document.querySelector("#recipe-card-template"),
  shoppingItemTemplate: document.querySelector("#shopping-item-template"),
  piDealsForm: document.querySelector("#pi-deals-form"),
  piDealsUrl: document.querySelector("#pi-deals-url"),
  piDealsHtml: document.querySelector("#pi-deals-html"),
  piDealsStatus: document.querySelector("#pi-deals-status"),
  piDealsResults: document.querySelector("#pi-deals-results"),
  piDealCardTemplate: document.querySelector("#pi-deal-card-template"),
};

let state = {
  recipes: readJson(STORAGE_KEYS.recipes, []),
  planner: readJson(
    STORAGE_KEYS.planner,
    WEEK_DAYS.reduce((days, day) => ({ ...days, [day]: "" }), {})
  ),
  selectedRecipeId: localStorage.getItem(STORAGE_KEYS.selectedRecipeId) || "",
};

const IS_HOSTED_APP = window.location.protocol !== "file:";

initializeApp();

async function initializeApp() {
  if (IS_HOSTED_APP) {
    await hydrateRemoteState();
  } else {
    await hydrateSharedState();
  }

  if (!Object.keys(state.planner).length) {
    state.planner = WEEK_DAYS.reduce((days, day) => ({ ...days, [day]: "" }), {});
  }

  if (
    state.recipes.length &&
    !state.recipes.some((recipe) => recipe.id === state.selectedRecipeId)
  ) {
    state.selectedRecipeId = state.recipes[0].id;
  }

  bindEvents();
  render();
}

function bindEvents() {
  elements.importForm.addEventListener("submit", handleImportSubmit);
  elements.loadDemoButton.addEventListener("click", handleLoadDemoRecipes);
  elements.shareBoardButton.addEventListener("click", handleShareBoard);
  elements.piDealsForm.addEventListener("submit", handlePiDealsSubmit);
}

async function handleImportSubmit(event) {
  event.preventDefault();
  const url = elements.recipeUrl.value.trim();
  const htmlFallback = elements.recipeHtml.value.trim();

  setStatus("Importing recipe...");

  try {
    const recipe = htmlFallback ? await saveRecipeHtml(htmlFallback, url) : await importRecipeFromUrl(url);

    if (!recipe.title || !recipe.ingredients.length) {
      throw new Error("The page did not contain enough recipe data to save.");
    }

    upsertRecipe(recipe);
    elements.importForm.reset();
    setStatus(`Imported "${recipe.title}".`);
  } catch (error) {
    setStatus(error.message || "Recipe import failed.");
  }
}

async function handleLoadDemoRecipes() {
  if (IS_HOSTED_APP) {
    try {
      const response = await fetch("/api/recipes/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipes: demoRecipes }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Could not load demo recipes.");
      }

      state.recipes = Array.isArray(payload.recipes) ? payload.recipes : state.recipes;
      if (!state.selectedRecipeId && state.recipes[0]) {
        state.selectedRecipeId = state.recipes[0].id;
      }
      persistState();
      render();
      setStatus("Loaded demo recipes into the shared meal board.");
      return;
    } catch (error) {
      setStatus(error.message || "Could not load demo recipes.");
      return;
    }
  }

  let added = 0;

  demoRecipes.forEach((recipe) => {
    if (!state.recipes.some((entry) => entry.title === recipe.title)) {
      state.recipes.unshift(recipe);
      added += 1;
    }
  });

  if (!state.selectedRecipeId && state.recipes[0]) {
    state.selectedRecipeId = state.recipes[0].id;
  }

  persistState();
  render();
  setStatus(added ? `Loaded ${added} demo recipe${added === 1 ? "" : "s"}.` : "Demo recipes are already loaded.");
}

async function handleShareBoard() {
  if (!state.recipes.length) {
    setShareStatus("Add some recipes first, then create a share link.");
    return;
  }

  try {
    const shareUrl = await buildShareUrl();
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus(
        IS_HOSTED_APP
          ? "Live link copied. Anyone opening it will see the shared meal board."
          : "Share link copied. Anyone opening it will see this recipe board."
      );
      return;
    }

    setShareStatus(shareUrl);
  } catch (error) {
    setShareStatus("Could not create a share link from this recipe board.");
  }
}

async function handlePiDealsSubmit(event) {
  event.preventDefault();
  const url = elements.piDealsUrl.value.trim();
  const htmlFallback = elements.piDealsHtml.value.trim();

  if (!url && !htmlFallback) {
    setPiDealsStatus("Add a listings page URL or paste its HTML first.");
    return;
  }

  setPiDealsStatus("Scanning for deals...");

  try {
    const result = htmlFallback
      ? await scanPiDeals({ html: htmlFallback, sourceUrl: url })
      : await scanPiDeals({ url });

    renderPiDeals(result.deals);
    setPiDealsStatus(
      result.deals.length
        ? `Found ${result.deals.length} deal${result.deals.length === 1 ? "" : "s"} below typical value (scanned ${result.scanned} listing${result.scanned === 1 ? "" : "s"}).`
        : `No deals below typical value were found (scanned ${result.scanned} listing${result.scanned === 1 ? "" : "s"}).`
    );
  } catch (error) {
    setPiDealsStatus(error.message || "Could not scan that page for deals.");
  }
}

async function scanPiDeals({ url = "", html = "", sourceUrl = "" }) {
  if (IS_HOSTED_APP) {
    return await scanPiDealsViaEndpoint({ url, html, sourceUrl });
  }

  const pageHtml = html || (await fetchListingMarkup(url));
  const listings = parseListingsHtml(pageHtml, sourceUrl || url);
  return evaluatePiDeals(listings);
}

async function scanPiDealsViaEndpoint({ url, html, sourceUrl }) {
  const response = await fetch("/api/pi-deals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, html, sourceUrl }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload.error ||
        "The hosted deal finder could not fetch that page. Try pasting the page HTML instead."
    );
  }

  return payload;
}

async function fetchListingMarkup(url) {
  if (!url) {
    throw new Error("Add a listings page URL first.");
  }

  const directResponse = await fetch(url);
  if (directResponse.ok) {
    return await directResponse.text();
  }

  throw new Error(
    "Could not fetch that URL directly. Paste the page HTML into the fallback field and scan again."
  );
}

function parseListingsHtml(html, sourceUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const ebayListings = extractEbayStyleListings(doc, sourceUrl);
  return ebayListings.length ? ebayListings : extractGenericListings(doc, sourceUrl);
}

function extractEbayStyleListings(doc, sourceUrl) {
  const listings = [];

  doc.querySelectorAll("li.s-item, div.s-item").forEach((item) => {
    const titleEl = item.querySelector(".s-item__title");
    const priceEl = item.querySelector(".s-item__price");
    const linkEl = item.querySelector("a.s-item__link") || item.querySelector("a");
    const imageEl = item.querySelector(".s-item__image-img") || item.querySelector("img");

    const title = normalizeText(titleEl?.textContent);
    if (!title || title.toLowerCase() === "shop on ebay") {
      return;
    }

    const price = parsePrice(priceEl?.textContent || "");
    if (!price) {
      return;
    }

    listings.push({
      title,
      price: price.amount,
      currency: price.currency,
      link: resolveUrl(linkEl?.getAttribute("href"), sourceUrl),
      image: resolveUrl(imageEl?.getAttribute("src"), sourceUrl),
    });
  });

  return listings;
}

function extractGenericListings(doc, sourceUrl) {
  const listings = [];
  const seenLinks = new Set();

  doc.querySelectorAll("a[href]").forEach((anchor) => {
    const anchorText = normalizeText(anchor.textContent);
    const container = anchor.closest("li, div, article") || anchor.parentElement;
    const contextText = normalizeText(container?.textContent || anchorText);

    const price = parsePrice(contextText);
    if (!price) {
      return;
    }

    const title = anchorText.length > 8 ? anchorText : contextText.slice(0, 120);
    if (!title) {
      return;
    }

    const link = resolveUrl(anchor.getAttribute("href"), sourceUrl);
    if (!link || seenLinks.has(link)) {
      return;
    }
    seenLinks.add(link);

    const imageEl = container?.querySelector("img") || anchor.querySelector("img");

    listings.push({
      title,
      price: price.amount,
      currency: price.currency,
      link,
      image: resolveUrl(imageEl?.getAttribute("src"), sourceUrl),
    });
  });

  return listings;
}

function evaluatePiDeals(listings) {
  const deals = listings
    .map((listing) => {
      const titleLower = listing.title.toLowerCase();
      if (!PI_BRAND_GATE_KEYWORDS.some((keyword) => titleLower.includes(keyword))) {
        return null;
      }

      const match = matchPiReferenceValue(titleLower);
      if (!match) {
        return null;
      }

      if (listing.price <= 0 || listing.price >= match.value) {
        return null;
      }

      const discount = (match.value - listing.price) / match.value;
      if (discount < DEAL_THRESHOLD) {
        return null;
      }

      return {
        title: listing.title,
        match: match.label,
        price: listing.price,
        currency: listing.currency,
        estimatedValue: match.value,
        discountPercent: Math.round(discount * 1000) / 10,
        link: listing.link,
        image: listing.image,
        comparable: listing.currency === "$",
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.discountPercent - left.discountPercent);

  return { deals, scanned: listings.length };
}

function matchPiReferenceValue(titleLower) {
  let bestMatch = null;
  let bestScore = 0;

  PI_REFERENCE_VALUES.forEach((entry) => {
    if (entry.keywords.every((keyword) => titleLower.includes(keyword))) {
      if (entry.keywords.length > bestScore) {
        bestScore = entry.keywords.length;
        bestMatch = entry;
      }
    }
  });

  return bestMatch;
}

function parsePrice(text) {
  if (!text) {
    return null;
  }

  const match = text.match(/([$£€])\s?(\d{1,3}(?:[,.]\d{3})*(?:\.\d{1,2})?)/);
  if (!match) {
    return null;
  }

  const amount = Number(match[2].replace(/,/g, ""));
  return Number.isFinite(amount) ? { currency: match[1], amount } : null;
}

function resolveUrl(value, sourceUrl) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value, sourceUrl || window.location.href).toString();
  } catch (error) {
    return "";
  }
}

function renderPiDeals(deals) {
  elements.piDealsResults.innerHTML = "";

  if (!deals.length) {
    elements.piDealsResults.className = "pi-deals-results empty-state";
    elements.piDealsResults.textContent =
      "No deals below typical value were found. Try a different search or listings page.";
    return;
  }

  elements.piDealsResults.className = "pi-deals-results";

  deals.forEach((deal) => {
    const node = elements.piDealCardTemplate.content.firstElementChild.cloneNode(true);
    const imageEl = node.querySelector(".pi-deal-image");
    if (deal.image) {
      imageEl.src = deal.image;
    } else {
      imageEl.remove();
    }

    node.querySelector(".pi-deal-title").textContent = deal.title;
    node.querySelector(".pi-deal-match").textContent = `Matched: ${deal.match}${
      deal.comparable ? "" : " (different currency, compare manually)"
    }`;
    node.querySelector(".pi-deal-price").textContent = `Listed: ${deal.currency}${deal.price.toFixed(2)}`;
    node.querySelector(".pi-deal-value").textContent = `Typical value: $${deal.estimatedValue.toFixed(2)}`;
    node.querySelector(".pi-deal-savings").textContent = `${deal.discountPercent}% under value`;

    const link = node.querySelector(".pi-deal-link");
    link.href = deal.link || "#";

    elements.piDealsResults.appendChild(node);
  });
}

function setPiDealsStatus(message) {
  elements.piDealsStatus.textContent = message;
}

async function importRecipeFromUrl(url) {
  if (!url) {
    throw new Error("Add a recipe URL first.");
  }

  if (IS_HOSTED_APP) {
    return await importRecipeViaEndpoint(url);
  }

  const html = await fetchRecipeMarkup(url);
  return extractRecipeFromHtml(html, url);
}

async function importRecipeViaEndpoint(url) {
  const response = await fetch("/api/import-recipe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload.error ||
        "The hosted importer could not fetch that recipe. Try pasting the page HTML instead."
    );
  }

  if (Array.isArray(payload.recipes)) {
    state.recipes = payload.recipes;
  }

  return payload.recipe;
}

async function saveRecipeHtml(html, sourceUrl) {
  if (!IS_HOSTED_APP) {
    return extractRecipeFromHtml(html, sourceUrl);
  }

  const response = await fetch("/api/recipes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ html, sourceUrl }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Could not save this recipe.");
  }

  if (Array.isArray(payload.recipes)) {
    state.recipes = payload.recipes;
  }

  return payload.recipe;
}

async function fetchRecipeMarkup(url) {
  const directResponse = await fetch(url);
  if (directResponse.ok) {
    return await directResponse.text();
  }

  throw new Error(
    "Could not fetch that URL directly. Paste the page HTML into the fallback field and import again."
  );
}

function extractRecipeFromHtml(html, sourceUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const jsonLdScripts = Array.from(
    doc.querySelectorAll('script[type="application/ld+json"]')
  );

  const candidateRecipes = jsonLdScripts
    .flatMap((script) => parseJsonLd(script.textContent))
    .flatMap(flattenJsonLdNodes)
    .filter((entry) => isRecipeNode(entry));

  const recipeNode = candidateRecipes[0];

  if (!recipeNode) {
    return extractRecipeFromVisibleHtml(doc, sourceUrl);
  }

  const instructions = normalizeInstructions(recipeNode.recipeInstructions);
  const ingredients = normalizeStringList(recipeNode.recipeIngredient);
  const description = normalizeText(recipeNode.description);
  const title = normalizeText(recipeNode.name) || inferTitleFromUrl(sourceUrl);
  const image = normalizeImage(recipeNode.image);

  return {
    id: crypto.randomUUID(),
    title,
    sourceUrl,
    description,
    ingredients,
    instructions,
    method: instructions.join(" "),
    image,
    importedAt: new Date().toISOString(),
  };
}

function extractRecipeFromVisibleHtml(doc, sourceUrl) {
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
    id: crypto.randomUUID(),
    title,
    sourceUrl,
    description,
    ingredients,
    instructions,
    method: instructions.join(" "),
    image: "",
    importedAt: new Date().toISOString(),
  };
}

function gatherListAfterHeading(doc, keywords) {
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

function parseJsonLd(text) {
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

function flattenJsonLdNodes(node) {
  if (!node) {
    return [];
  }

  const graph = Array.isArray(node["@graph"]) ? node["@graph"] : [];
  return [node, ...graph];
}

function isRecipeNode(node) {
  const type = node["@type"];
  if (Array.isArray(type)) {
    return type.includes("Recipe");
  }
  return type === "Recipe";
}

function normalizeInstructions(input) {
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

function normalizeStringList(input) {
  if (!input) {
    return [];
  }

  return (Array.isArray(input) ? input : [input])
    .map((entry) => normalizeText(String(entry)))
    .filter(Boolean);
}

function normalizeImage(image) {
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

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function inferTitleFromUrl(url) {
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

function upsertRecipe(recipe) {
  const existing = state.recipes.find((entry) => entry.sourceUrl === recipe.sourceUrl);

  if (existing) {
    Object.assign(existing, recipe, { id: existing.id });
    state.selectedRecipeId = existing.id;
  } else {
    state.recipes.unshift(recipe);
    state.selectedRecipeId = recipe.id;
  }

  persistState();
  render();
}

function persistState() {
  localStorage.setItem(STORAGE_KEYS.selectedRecipeId, state.selectedRecipeId);
  if (!IS_HOSTED_APP) {
    localStorage.setItem(STORAGE_KEYS.recipes, JSON.stringify(state.recipes));
    localStorage.setItem(STORAGE_KEYS.planner, JSON.stringify(state.planner));
  }
}

async function hydrateRemoteState() {
  try {
    const response = await fetch("/api/state");
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Could not load the shared meal board.");
    }

    state.recipes = Array.isArray(payload.recipes) ? payload.recipes : [];
    state.planner = payload.planner || state.planner;
  } catch (error) {
    setStatus("The shared meal board could not be loaded.");
  }
}

async function hydrateSharedState() {
  const params = new URLSearchParams(window.location.search);
  const shared = params.get("share");
  if (!shared) {
    return;
  }

  try {
    const decoded = await decodeSharedPayload(shared);
    state.recipes = Array.isArray(decoded.recipes) ? decoded.recipes : [];
    state.planner = decoded.planner || state.planner;
    state.selectedRecipeId = decoded.selectedRecipeId || state.selectedRecipeId;
    persistState();
  } catch (error) {
    setShareStatus("This share link could not be read.");
  }
}

async function buildShareUrl() {
  if (IS_HOSTED_APP) {
    const url = new URL(window.location.href);
    url.search = "";
    return url.toString();
  }

  const payload = {
    recipes: state.recipes,
    planner: state.planner,
    selectedRecipeId: state.selectedRecipeId,
  };
  const encoded = await encodeSharedPayload(payload);
  const url = new URL(window.location.href);
  url.searchParams.set("share", encoded);
  return url.toString();
}

async function encodeSharedPayload(payload) {
  const json = JSON.stringify(payload);
  const compressed = await gzipText(json);
  return bytesToBase64Url(compressed);
}

async function decodeSharedPayload(value) {
  const bytes = base64UrlToBytes(value);
  const json = await gunzipBytes(bytes);
  return JSON.parse(json);
}

function render() {
  renderWeeklyMenu();
  renderRecipeLibrary();
  renderRecipeDetail();
  renderShoppingList();
  renderStats();
}

function renderWeeklyMenu() {
  elements.weeklyMenu.innerHTML = "";

  WEEK_DAYS.forEach((day) => {
    const wrapper = document.createElement("label");
    wrapper.className = "day-plan";

    const dayName = document.createElement("span");
    dayName.className = "day-name";
    dayName.textContent = day;

    const select = document.createElement("select");
    select.dataset.day = day;

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose a recipe";
    select.appendChild(placeholder);

    state.recipes.forEach((recipe) => {
      const option = document.createElement("option");
      option.value = recipe.id;
      option.textContent = recipe.title;
      option.selected = state.planner[day] === recipe.id;
      select.appendChild(option);
    });

    select.addEventListener("change", (event) => {
      state.planner[day] = event.target.value;
      persistState();
      if (IS_HOSTED_APP) {
        savePlannerToBackend();
      }
      renderShoppingList();
      renderStats();
    });

    wrapper.append(dayName, select);
    elements.weeklyMenu.appendChild(wrapper);
  });
}

function renderRecipeLibrary() {
  elements.recipeLibrary.className = "recipe-library";
  elements.recipeLibrary.innerHTML = "";

  if (!state.recipes.length) {
    elements.recipeLibrary.classList.add("empty-state");
    elements.recipeLibrary.textContent =
      "No recipes yet. Import a recipe URL or load the demo set to start planning.";
    return;
  }

  state.recipes.forEach((recipe) => {
    const node = elements.recipeCardTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".recipe-card-title").textContent = recipe.title;
    node.querySelector(".recipe-card-meta").textContent = `${recipe.ingredients.length} ingredients | ${recipe.instructions.length} steps`;
    node.classList.toggle("active", recipe.id === state.selectedRecipeId);
    node.addEventListener("click", () => {
      state.selectedRecipeId = recipe.id;
      persistState();
      renderRecipeLibrary();
      renderRecipeDetail();
    });
    elements.recipeLibrary.appendChild(node);
  });
}

function renderRecipeDetail() {
  const recipe = state.recipes.find((entry) => entry.id === state.selectedRecipeId);
  elements.recipeDetail.className = "recipe-detail";

  if (!recipe) {
    elements.recipeDetail.classList.add("empty-state");
    elements.recipeDetail.textContent =
      "Import a recipe or choose one from your library to see ingredients, instructions, and method here.";
    return;
  }

  const ingredientsMarkup = recipe.ingredients
    .map((ingredient) => `<li>${escapeHtml(ingredient)}</li>`)
    .join("");
  const instructionsMarkup = recipe.instructions
    .map((instruction) => `<li>${escapeHtml(instruction)}</li>`)
    .join("");

  elements.recipeDetail.innerHTML = `
    <div class="detail-header">
      <h3>${escapeHtml(recipe.title)}</h3>
      <a class="detail-link" href="${escapeAttribute(recipe.sourceUrl)}" target="_blank" rel="noreferrer">
        View source recipe
      </a>
      <p>${escapeHtml(recipe.description || "Saved from the source page and ready for weekly planning.")}</p>
    </div>
    <div class="detail-grid">
      <section class="detail-block">
        <h4>Ingredients</h4>
        <ul>${ingredientsMarkup || "<li>No ingredients were found.</li>"}</ul>
      </section>
      <section class="detail-block">
        <h4>Instructions</h4>
        <ol>${instructionsMarkup || "<li>No instructions were found.</li>"}</ol>
      </section>
      <section class="detail-block">
        <h4>Method</h4>
        <p>${escapeHtml(recipe.method || recipe.instructions.join(" ") || "No method summary available.")}</p>
      </section>
    </div>
  `;
}

function renderShoppingList() {
  const selectedRecipes = WEEK_DAYS.map((day) => state.planner[day])
    .filter(Boolean)
    .map((recipeId) => state.recipes.find((recipe) => recipe.id === recipeId))
    .filter(Boolean);

  if (!selectedRecipes.length) {
    elements.shoppingList.className = "shopping-list empty-state";
    elements.shoppingList.textContent =
      "Choose recipes in the weekly menu to build a shopping list automatically.";
    return;
  }

  const combined = new Map();

  selectedRecipes.forEach((recipe) => {
    recipe.ingredients.forEach((ingredient) => {
      const parsed = parseIngredient(ingredient);
      const current = combined.get(parsed.key);
      if (current) {
        mergeIngredientEntry(current, parsed, recipe.title);
        return;
      }

      combined.set(parsed.key, createIngredientEntry(parsed, recipe.title));
    });
  });

  const items = Array.from(combined.values()).sort((left, right) =>
    left.label.localeCompare(right.label)
  );

  elements.shoppingList.className = "shopping-list";
  elements.shoppingList.innerHTML = "";

  const groupedItems = groupShoppingItems(items);
  groupedItems.forEach((group) => {
    const section = document.createElement("section");
    section.className = "shopping-category";

    const heading = document.createElement("h3");
    heading.className = "shopping-category-title";
    heading.textContent = group.label;

    const list = document.createElement("ul");
    group.items.forEach((item) => {
      const node = elements.shoppingItemTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector(".shopping-item-name").textContent = item.label;
      node.querySelector(".shopping-item-count").textContent = formatIngredientSummary(item);
      list.appendChild(node);
    });

    section.append(heading, list);
    elements.shoppingList.appendChild(section);
  });
}

function renderStats() {
  const plannedCount = WEEK_DAYS.filter((day) => state.planner[day]).length;
  const shoppingItems = buildShoppingItemCount();

  elements.recipeCount.textContent = String(state.recipes.length);
  elements.plannedCount.textContent = String(plannedCount);
  elements.shoppingCount.textContent = String(shoppingItems);
}

function buildShoppingItemCount() {
  const set = new Set();
  WEEK_DAYS.forEach((day) => {
    const recipeId = state.planner[day];
    const recipe = state.recipes.find((entry) => entry.id === recipeId);
    recipe?.ingredients.forEach((ingredient) => set.add(parseIngredient(ingredient).key));
  });
  return set.size;
}

async function savePlannerToBackend() {
  try {
    await fetch("/api/planner", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ planner: state.planner }),
    });
  } catch (error) {
    setStatus("The weekly menu could not be saved to the shared meal board.");
  }
}

function parseIngredient(ingredient) {
  const cleaned = normalizeIngredientLabel(ingredient);
  const quantityMatch = cleaned.match(/^(\d+(?:\.\d+)?(?:\/\d+)?)(?:\s+|-)?(.*)$/);
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

function createIngredientEntry(parsed, recipeTitle) {
  return {
    label: parsed.label,
    recipes: [recipeTitle],
    quantityTotal: parsed.quantity,
    unit: parsed.unit,
    rawCount: 1,
    sourceLabels: [parsed.original],
  };
}

function mergeIngredientEntry(entry, parsed, recipeTitle) {
  if (!entry.recipes.includes(recipeTitle)) {
    entry.recipes.push(recipeTitle);
  }

  entry.rawCount += 1;
  entry.sourceLabels.push(parsed.original);

  if (entry.unit === parsed.unit && entry.quantityTotal !== null && parsed.quantity !== null) {
    entry.quantityTotal += parsed.quantity;
    return;
  }

  if (!entry.unit && !parsed.unit && entry.quantityTotal !== null && parsed.quantity !== null) {
    entry.quantityTotal += parsed.quantity;
    return;
  }

  entry.quantityTotal = null;
}

function formatIngredientSummary(item) {
  if (item.quantityTotal !== null) {
    const quantity = formatQuantity(item.quantityTotal);
    return item.unit ? `${quantity} ${item.unit}` : quantity;
  }

  return item.recipes.length > 1 ? `${item.recipes.length} recipes` : item.recipes[0];
}

function groupShoppingItems(items) {
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

function findShoppingCategoryIndex(label) {
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

function normalizeIngredientLabel(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^[\-\u2022*]+\s*/, "")
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeIngredientKey(value) {
  return stripIngredientDescriptors(canonicalizeIngredientName(value))
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => singularizeWord(word))
    .join(" ");
}

function canonicalizeIngredientName(value) {
  const normalized = stripIngredientDescriptors(normalizeIngredientLabel(value))
    .replace(/\s+/g, " ")
    .trim();

  const synonymMatch = INGREDIENT_SYNONYMS.find((entry) =>
    entry.matches.some((match) => normalizeIngredientLabel(match) === normalized)
  );

  return synonymMatch ? synonymMatch.canonical : normalized;
}

function stripIngredientDescriptors(value) {
  return String(value || "")
    .replace(/\b\d+\s*x\s*/g, " ")
    .replace(/\bx\s+\d+/g, " ")
    .replace(/\b\d+(?:\.\d+)?\s*(g|kg|ml|l)\b/g, " ")
    .replace(/\b(heaped|level|pinch)\b/g, " ")
    .replace(/\b(powdered|ground)\b/g, " ")
    .replace(/\bcut into strips\b/g, " ")
    .replace(/\bcut into pieces\b/g, " ")
    .replace(/\bcut into chunks\b/g, " ")
    .replace(
      /\b(of|and|or|very|fresh|large|small|medium|extra|to taste|optional|sweet|smoked|crushed|chopped|finely|roughly|thinly|minced|diced|sliced|grated|deseeded|seeded|peeled|skinless|boneless|can|cans|tin|tins)\b/g,
      " "
    );
}

function parseIngredientQuantity(value) {
  if (!value) {
    return null;
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

function formatQuantity(value) {
  if (!Number.isFinite(value)) {
    return "";
  }

  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function singularizeWord(word) {
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

function titleCaseIngredient(value) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isIngredientUnit(word) {
  return [
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
  ].includes(word);
}

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function setStatus(message) {
  elements.importStatus.textContent = message;
}

function setShareStatus(message) {
  elements.shareStatus.textContent = message;
}

async function gzipText(value) {
  if (typeof CompressionStream === "undefined") {
    return new TextEncoder().encode(value);
  }

  const stream = new Blob([value]).stream().pipeThrough(new CompressionStream("gzip"));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

async function gunzipBytes(bytes) {
  if (typeof DecompressionStream === "undefined") {
    return new TextDecoder().decode(bytes);
  }

  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  return await new Response(stream).text();
}

function bytesToBase64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
