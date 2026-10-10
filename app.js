import {
  parseIngredient,
  createIngredientEntry,
  mergeIngredientEntry,
  formatIngredientSummary,
  groupShoppingItems,
  scaleIngredientText,
} from "./ingredients.js";
import { extractRecipeFromHtml, normalizeText } from "./recipe-parser.js";
import { encodeSharedPayload, decodeSharedPayload } from "./share.js";

const STORAGE_KEYS = {
  recipes: "tableset-recipes",
  planner: "tableset-planner",
  selectedRecipeId: "tableset-selected-recipe-id",
  piDealOverrides: "tableset-pi-deal-overrides",
  shoppingOverrides: "tableset-shopping-overrides",
  desiredServings: "tableset-desired-servings",
  household: "tableset-household",
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

// crypto.randomUUID() is only defined in secure contexts (HTTPS or
// http://localhost), so plain-HTTP LAN/hosted access needs a fallback.
function generateId() {
  if (window.crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

const DEAL_THRESHOLD = 0.15;

const PI_BRAND_GATE_KEYWORDS = ["raspberry pi", "rpi"];

const EXCHANGE_RATES_TO_USD = { $: 1.0, "£": 1.27, "€": 1.08 };

// Board keywords spell out "raspberry pi" in full (rather than a bare
// "pi 4") so a clone board that merely mentions Raspberry Pi for
// compatibility (e.g. "Orange Pi 4", "for Raspberry Pi") can't satisfy
// them by coincidence.
const DEFAULT_PI_REFERENCE_VALUES = [
  { label: "Raspberry Pi 5 (8GB)", keywords: ["raspberry pi 5", "8gb"], value: 80, kind: "board" },
  { label: "Raspberry Pi 5 (4GB)", keywords: ["raspberry pi 5", "4gb"], value: 60, kind: "board" },
  { label: "Raspberry Pi 5 (2GB)", keywords: ["raspberry pi 5", "2gb"], value: 50, kind: "board" },
  { label: "Raspberry Pi 4 Model B (8GB)", keywords: ["raspberry pi 4", "8gb"], value: 75, kind: "board" },
  { label: "Raspberry Pi 4 Model B (4GB)", keywords: ["raspberry pi 4", "4gb"], value: 55, kind: "board" },
  { label: "Raspberry Pi 4 Model B (2GB)", keywords: ["raspberry pi 4", "2gb"], value: 45, kind: "board" },
  { label: "Raspberry Pi 4 Model B (1GB)", keywords: ["raspberry pi 4", "1gb"], value: 35, kind: "board" },
  { label: "Raspberry Pi 400", keywords: ["raspberry pi 400"], value: 70, kind: "board" },
  { label: "Raspberry Pi 3 Model B+", keywords: ["raspberry pi 3", "b+"], value: 35, kind: "board" },
  { label: "Raspberry Pi 3 Model B", keywords: ["raspberry pi 3", "model b"], value: 30, kind: "board" },
  { label: "Raspberry Pi 3 Model A+", keywords: ["raspberry pi 3", "model a+"], value: 25, kind: "board" },
  { label: "Raspberry Pi 2 Model B", keywords: ["raspberry pi 2"], value: 25, kind: "board" },
  { label: "Raspberry Pi 1 Model B+", keywords: ["raspberry pi model b+"], value: 20, kind: "board" },
  { label: "Raspberry Pi Zero 2 W", keywords: ["raspberry pi zero 2 w"], value: 15, kind: "board" },
  { label: "Raspberry Pi Zero W", keywords: ["raspberry pi zero w"], value: 10, kind: "board" },
  { label: "Raspberry Pi Zero", keywords: ["raspberry pi zero"], value: 5, kind: "board" },
  { label: "Raspberry Pi Pico 2 W", keywords: ["pico 2 w"], value: 8, kind: "board" },
  { label: "Raspberry Pi Pico 2", keywords: ["pico 2"], value: 5, kind: "board" },
  { label: "Raspberry Pi Pico W", keywords: ["pico w"], value: 6, kind: "board" },
  { label: "Raspberry Pi Pico", keywords: ["pico"], value: 4, kind: "board" },
  { label: "Raspberry Pi Compute Module 5", keywords: ["compute module 5"], value: 45, kind: "board" },
  { label: "Raspberry Pi Compute Module 4", keywords: ["compute module 4"], value: 30, kind: "board" },
  { label: "Raspberry Pi Camera Module 3", keywords: ["camera module 3"], value: 25, kind: "accessory" },
  { label: "Raspberry Pi Camera Module", keywords: ["camera module"], value: 15, kind: "accessory" },
  { label: "Raspberry Pi High Quality Camera", keywords: ["high quality camera"], value: 50, kind: "accessory" },
  { label: "Raspberry Pi Sense HAT", keywords: ["sense hat"], value: 40, kind: "accessory" },
  { label: "Raspberry Pi Build HAT", keywords: ["build hat"], value: 25, kind: "accessory" },
  { label: "Raspberry Pi AI HAT+", keywords: ["ai hat"], value: 110, kind: "accessory" },
  { label: "Raspberry Pi AI Kit", keywords: ["ai kit"], value: 70, kind: "accessory" },
  { label: "Raspberry Pi M.2 HAT+", keywords: ["m.2 hat"], value: 15, kind: "accessory" },
  { label: "Raspberry Pi PoE+ HAT", keywords: ["poe+ hat"], value: 20, kind: "accessory" },
  { label: "Raspberry Pi PoE HAT", keywords: ["poe hat"], value: 18, kind: "accessory" },
  { label: "Raspberry Pi Touch Display 2", keywords: ["touch display 2"], value: 60, kind: "accessory" },
  { label: "Raspberry Pi Touch Display", keywords: ["touch display"], value: 55, kind: "accessory" },
  { label: "Raspberry Pi Official Keyboard", keywords: ["official keyboard"], value: 12, kind: "accessory" },
  { label: "Raspberry Pi Official Mouse", keywords: ["official mouse"], value: 8, kind: "accessory" },
  { label: "Raspberry Pi Active Cooler", keywords: ["active cooler"], value: 5, kind: "accessory" },
  {
    label: "Raspberry Pi Official 27W USB-C Power Supply",
    keywords: ["27w", "power supply"],
    value: 12,
    kind: "accessory",
  },
  { label: "Raspberry Pi Official Case", keywords: ["official case"], value: 10, kind: "accessory" },
];

// Accessory listings often mention a board only for compatibility ("Case for
// Raspberry Pi 4", "Supports Raspberry Pi 3B+/4B"). Without this, that
// mention alone can satisfy a board's keywords and get mispriced as the
// board itself.
const ACCESSORY_PHRASE_PATTERN =
  /\b(?:for|supports?|compatible(?:\s+with)?|works\s+with|fits)\s+(?:the\s+)?(?:raspberry\s+pi|rpi)\b/i;

const demoRecipes = [
  {
    id: generateId(),
    title: "One-Pan Tomato Basil Gnocchi",
    sourceUrl: "https://demo.local/gnocchi",
    description: "A quick weeknight pasta-style dinner with soft gnocchi and tomato sauce.",
    servings: 4,
    ingredients: [
      "500g shelf-stable gnocchi",
      "28g olive oil",
      "3 garlic cloves, minced",
      "400g chopped tomatoes",
      "120ml vegetable stock",
      "80g baby spinach",
      "15g basil leaves",
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
    id: generateId(),
    title: "Coconut Chickpea Curry",
    sourceUrl: "https://demo.local/chickpea-curry",
    description: "Comforting curry with pantry ingredients and a bright finish.",
    servings: 4,
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
  appShell: document.querySelector("#app-shell"),
  authPanel: document.querySelector("#auth-panel"),
  authForm: document.querySelector("#auth-form"),
  authEmail: document.querySelector("#auth-email"),
  authPassword: document.querySelector("#auth-password"),
  authStatus: document.querySelector("#auth-status"),
  authSubmit: document.querySelector("#auth-submit"),
  authHeading: document.querySelector("#auth-heading"),
  authToggleMode: document.querySelector("#auth-toggle-mode"),
  userBar: document.querySelector("#user-bar"),
  userEmail: document.querySelector("#user-email"),
  logoutButton: document.querySelector("#logout-button"),
  importForm: document.querySelector("#import-form"),
  recipeUrl: document.querySelector("#recipe-url"),
  recipeHtml: document.querySelector("#recipe-html"),
  importStatus: document.querySelector("#import-status"),
  shareStatus: document.querySelector("#share-status"),
  loadDemoButton: document.querySelector("#load-demo-button"),
  shareBoardButton: document.querySelector("#share-board-button"),
  recipeSearch: document.querySelector("#recipe-search"),
  householdAdults: document.querySelector("#household-adults"),
  householdChildren: document.querySelector("#household-children"),
  householdChildrenShare: document.querySelector("#household-children-share"),
  householdTotal: document.querySelector("#household-total"),
  recipeLibrary: document.querySelector("#recipe-library"),
  recipeDetail: document.querySelector("#recipe-detail"),
  weeklyMenu: document.querySelector("#weekly-menu"),
  shoppingList: document.querySelector("#shopping-list"),
  shoppingTotal: document.querySelector("#shopping-total"),
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
  piDealsThreshold: document.querySelector("#pi-deals-threshold"),
  piDealsValuesList: document.querySelector("#pi-deals-values-list"),
  piDealsResetButton: document.querySelector("#pi-deals-reset-button"),
  piDealValueRowTemplate: document.querySelector("#pi-deal-value-row-template"),
};

const IS_HOSTED_APP = window.location.protocol !== "file:";

let state = {
  user: null,
  recipes: IS_HOSTED_APP ? [] : readJson(STORAGE_KEYS.recipes, []),
  planner: IS_HOSTED_APP
    ? WEEK_DAYS.reduce((days, day) => ({ ...days, [day]: "" }), {})
    : readJson(
        STORAGE_KEYS.planner,
        WEEK_DAYS.reduce((days, day) => ({ ...days, [day]: "" }), {})
      ),
  selectedRecipeId: IS_HOSTED_APP ? "" : localStorage.getItem(STORAGE_KEYS.selectedRecipeId) || "",
  editingRecipeId: null,
  desiredServingsByRecipe: readJson(STORAGE_KEYS.desiredServings, {}),
  household: readJson(STORAGE_KEYS.household, { adults: 0, children: 0, childrenShare: false }),
  shoppingOverrides: readJson(STORAGE_KEYS.shoppingOverrides, { signature: "", removed: {}, prices: {} }),
  piDealOverrides: readJson(STORAGE_KEYS.piDealOverrides, { threshold: null, values: {} }),
};

// The items currently shown in the shopping list, kept around so a price
// edit can recompute the total without re-rendering (and losing focus on)
// every input on the list.
let currentShoppingItems = [];

let authMode = "login";
let recipeSearchTerm = "";

initializeApp();

async function initializeApp() {
  if (typeof state.piDealOverrides !== "object" || state.piDealOverrides === null) {
    state.piDealOverrides = { threshold: null, values: {} };
  }
  if (typeof state.piDealOverrides.values !== "object" || state.piDealOverrides.values === null) {
    state.piDealOverrides.values = {};
  }

  bindEvents();

  if (IS_HOSTED_APP) {
    const user = await fetchCurrentUser();
    if (!user) {
      showAuth();
      return;
    }
    state.user = user;
    showApp();
    await hydrateRemoteState();
  } else {
    await hydrateSharedState();
  }

  finishInitialRender();
}

function finishInitialRender() {
  if (!Object.keys(state.planner).length) {
    state.planner = WEEK_DAYS.reduce((days, day) => ({ ...days, [day]: "" }), {});
  }

  if (
    state.recipes.length &&
    !state.recipes.some((recipe) => recipe.id === state.selectedRecipeId)
  ) {
    state.selectedRecipeId = state.recipes[0].id;
  }

  render();
  renderPiDealsSettings();
}

function bindEvents() {
  elements.importForm.addEventListener("submit", handleImportSubmit);
  elements.loadDemoButton.addEventListener("click", handleLoadDemoRecipes);
  elements.shareBoardButton.addEventListener("click", handleShareBoard);
  elements.piDealsForm.addEventListener("submit", handlePiDealsSubmit);
  elements.piDealsThreshold.addEventListener("change", handlePiDealsThresholdChange);
  elements.piDealsResetButton.addEventListener("click", handlePiDealsResetSettings);
  elements.authForm.addEventListener("submit", handleAuthSubmit);
  elements.authToggleMode.addEventListener("click", handleAuthToggleMode);
  elements.logoutButton.addEventListener("click", handleLogout);
  elements.recipeSearch.addEventListener("input", (event) => {
    recipeSearchTerm = event.target.value.trim().toLowerCase();
    renderRecipeLibrary();
  });
  elements.householdAdults.addEventListener("change", handleHouseholdChange);
  elements.householdChildren.addEventListener("change", handleHouseholdChange);
  elements.householdChildrenShare.addEventListener("change", handleHouseholdChange);
}

function showApp() {
  elements.appShell.classList.remove("hidden");
  elements.authPanel.classList.add("hidden");
  elements.userBar.classList.remove("hidden");
  elements.userEmail.textContent = state.user?.email || "";
}

function showAuth() {
  elements.appShell.classList.add("hidden");
  elements.authPanel.classList.remove("hidden");
  elements.userBar.classList.add("hidden");
}

async function fetchCurrentUser() {
  try {
    const response = await fetch("/api/auth/me", { credentials: "same-origin" });
    const payload = await response.json().catch(() => ({}));
    return payload.user || null;
  } catch (error) {
    return null;
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const email = elements.authEmail.value.trim();
  const password = elements.authPassword.value;
  const endpoint = authMode === "register" ? "/api/auth/register" : "/api/auth/login";

  setAuthStatus(authMode === "register" ? "Creating your account..." : "Signing in...");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email, password }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || "Could not sign in.");
    }

    state.user = payload.user;
    elements.authForm.reset();
    setAuthStatus("");
    showApp();
    await hydrateRemoteState();
    finishInitialRender();
  } catch (error) {
    setAuthStatus(error.message || "Could not sign in.");
  }
}

function handleAuthToggleMode() {
  authMode = authMode === "login" ? "register" : "login";
  const isRegister = authMode === "register";
  elements.authHeading.textContent = isRegister
    ? "Create your meal board account"
    : "Sign in to your meal board";
  elements.authSubmit.textContent = isRegister ? "Create account" : "Sign in";
  elements.authToggleMode.textContent = isRegister
    ? "Already have an account? Sign in"
    : "Need an account? Register";
  elements.authPassword.setAttribute("autocomplete", isRegister ? "new-password" : "current-password");
  setAuthStatus("");
}

async function handleLogout() {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
  } catch (error) {
    // Fall through and clear local state even if the network call failed.
  }

  state.user = null;
  state.recipes = [];
  state.planner = WEEK_DAYS.reduce((days, day) => ({ ...days, [day]: "" }), {});
  state.selectedRecipeId = "";
  state.editingRecipeId = null;
  state.desiredServingsByRecipe = {};
  state.shoppingOverrides = { signature: "", removed: {}, prices: {} };
  persistDesiredServings();
  persistShoppingOverrides();
  showAuth();
}

async function hostedFetch(path, options = {}) {
  const response = await fetch(path, { ...options, credentials: "same-origin" });
  if (response.status === 401) {
    state.user = null;
    showAuth();
  }
  return response;
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
      const response = await hostedFetch("/api/recipes/bulk", {
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
          ? "Live link copied. Anyone signed in will see the shared meal board."
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
  const response = await hostedFetch("/api/pi-deals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      html,
      sourceUrl,
      threshold: getEffectiveDealThreshold(),
      valueOverrides: state.piDealOverrides.values,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) {
    throw new Error("Sign in to use the hosted deal finder.");
  }
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

  doc.querySelectorAll("li.s-item, div.s-item, li.s-card, div.s-card").forEach((item) => {
    const titleEl = item.querySelector(".s-item__title, .s-card__title");
    const priceEl = item.querySelector(".s-item__price, .s-card__price");
    const linkEl = item.querySelector("a.s-item__link, a.s-card__link") || item.querySelector("a");
    const imageEl = item.querySelector(".s-item__image-img, .s-card__image") || item.querySelector("img");

    const title = extractListingTitle(titleEl);
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
      isAuction: isAuctionListing(item),
    });
  });

  return listings;
}

function extractListingTitle(titleEl) {
  if (!titleEl) {
    return "";
  }

  const clone = titleEl.cloneNode(true);
  clone.querySelectorAll(".clipped").forEach((node) => node.remove());
  const title = normalizeText(clone.textContent);
  return title.replace(/^New [Ll]isting\s+/, "").trim();
}

function isAuctionListing(item) {
  // A live auction's current price is just the highest bid so far, not a
  // price you can actually pay today, so it can't be judged as a "deal".
  return /\d+\s+bids?\b/i.test(normalizeText(item.textContent));
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
      isAuction: container ? isAuctionListing(container) : false,
    });
  });

  return listings;
}

function evaluatePiDeals(listings) {
  const referenceValues = getEffectivePiReferenceValues();
  const threshold = getEffectiveDealThreshold();

  const deals = listings
    .map((listing) => {
      if (listing.isAuction) {
        return null;
      }

      const titleLower = listing.title.toLowerCase();
      if (!PI_BRAND_GATE_KEYWORDS.some((keyword) => titleLower.includes(keyword))) {
        return null;
      }

      const match = matchPiReferenceValue(titleLower, referenceValues);
      if (!match) {
        return null;
      }

      if (match.kind === "board" && ACCESSORY_PHRASE_PATTERN.test(titleLower)) {
        return null;
      }

      const rate = EXCHANGE_RATES_TO_USD[listing.currency];
      if (!rate) {
        return null;
      }

      const priceUsd = listing.price * rate;
      if (priceUsd <= 0 || priceUsd >= match.value) {
        return null;
      }

      const discount = (match.value - priceUsd) / match.value;
      if (discount < threshold) {
        return null;
      }

      return {
        title: listing.title,
        match: match.label,
        price: listing.price,
        currency: listing.currency,
        priceUsd: Math.round(priceUsd * 100) / 100,
        estimatedValueUsd: match.value,
        discountPercent: Math.round(discount * 1000) / 10,
        link: listing.link,
        image: listing.image,
        approxConversion: listing.currency !== "$",
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.discountPercent - left.discountPercent);

  return { deals, scanned: listings.length };
}

function getEffectivePiReferenceValues() {
  const overrides = state.piDealOverrides.values || {};
  return DEFAULT_PI_REFERENCE_VALUES.map((entry) =>
    Number.isFinite(overrides[entry.label]) ? { ...entry, value: overrides[entry.label] } : entry
  );
}

function getEffectiveDealThreshold() {
  return Number.isFinite(state.piDealOverrides.threshold)
    ? state.piDealOverrides.threshold
    : DEAL_THRESHOLD;
}

function matchPiReferenceValue(titleLower, referenceValues) {
  let bestMatch = null;
  let bestScore = 0;

  referenceValues.forEach((entry) => {
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
      deal.approxConversion ? " (converted at an approximate exchange rate)" : ""
    }`;
    node.querySelector(".pi-deal-price").textContent = deal.approxConversion
      ? `Listed: ${deal.currency}${deal.price.toFixed(2)} (~$${deal.priceUsd.toFixed(2)})`
      : `Listed: $${deal.price.toFixed(2)}`;
    node.querySelector(".pi-deal-value").textContent = `Typical value: $${deal.estimatedValueUsd.toFixed(2)}`;
    node.querySelector(".pi-deal-savings").textContent = `${deal.discountPercent}% under value`;

    const link = node.querySelector(".pi-deal-link");
    link.href = deal.link || "#";

    elements.piDealsResults.appendChild(node);
  });
}

function setPiDealsStatus(message) {
  elements.piDealsStatus.textContent = message;
}

function renderPiDealsSettings() {
  const overrides = state.piDealOverrides.values || {};
  elements.piDealsThreshold.value = Math.round(getEffectiveDealThreshold() * 100);

  elements.piDealsValuesList.innerHTML = "";
  DEFAULT_PI_REFERENCE_VALUES.forEach((entry) => {
    const node = elements.piDealValueRowTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".pi-deal-value-row-label").textContent = entry.label;
    const input = node.querySelector("input");
    input.value = Number.isFinite(overrides[entry.label]) ? overrides[entry.label] : entry.value;
    input.addEventListener("change", () => handlePiDealValueChange(entry.label, entry.value, input));
    elements.piDealsValuesList.appendChild(node);
  });
}

function handlePiDealValueChange(label, defaultValue, input) {
  const parsed = Number(input.value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    input.value = defaultValue;
    delete state.piDealOverrides.values[label];
  } else if (parsed === defaultValue) {
    input.value = defaultValue;
    delete state.piDealOverrides.values[label];
  } else {
    state.piDealOverrides.values[label] = parsed;
  }

  savePiDealOverrides();
}

function handlePiDealsThresholdChange() {
  const parsed = Number(elements.piDealsThreshold.value);

  if (!Number.isFinite(parsed) || parsed <= 0 || parsed >= 100) {
    state.piDealOverrides.threshold = null;
    elements.piDealsThreshold.value = Math.round(DEAL_THRESHOLD * 100);
  } else {
    state.piDealOverrides.threshold = parsed / 100;
  }

  savePiDealOverrides();
}

function handlePiDealsResetSettings() {
  state.piDealOverrides = { threshold: null, values: {} };
  savePiDealOverrides();
  renderPiDealsSettings();
  setPiDealsStatus("Reference values and threshold reset to defaults.");
}

function savePiDealOverrides() {
  localStorage.setItem(STORAGE_KEYS.piDealOverrides, JSON.stringify(state.piDealOverrides));
}

async function importRecipeFromUrl(url) {
  if (!url) {
    throw new Error("Add a recipe URL first.");
  }

  if (IS_HOSTED_APP) {
    return await importRecipeViaEndpoint(url);
  }

  const html = await fetchRecipeMarkup(url);
  return extractRecipeFromHtml(new DOMParser().parseFromString(html, "text/html"), url);
}

async function importRecipeViaEndpoint(url) {
  const response = await hostedFetch("/api/import-recipe", {
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
    const doc = new DOMParser().parseFromString(html, "text/html");
    return extractRecipeFromHtml(doc, sourceUrl);
  }

  const response = await hostedFetch("/api/recipes", {
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

function upsertRecipe(recipe) {
  const existing = state.recipes.find((entry) => entry.sourceUrl === recipe.sourceUrl);

  if (existing) {
    Object.assign(existing, recipe, { id: existing.id });
    state.selectedRecipeId = existing.id;
  } else {
    state.recipes.unshift(recipe);
    state.selectedRecipeId = recipe.id;
  }

  delete state.desiredServingsByRecipe[state.selectedRecipeId];
  persistDesiredServings();
  persistState();
  render();
}

function handleSelectRecipe(recipeId) {
  state.selectedRecipeId = recipeId;
  state.editingRecipeId = null;
  persistState();
  renderRecipeLibrary();
  renderRecipeDetail();
}

function handleStartEdit(recipeId) {
  state.editingRecipeId = recipeId;
  renderRecipeDetail();
}

function handleCancelEdit() {
  state.editingRecipeId = null;
  renderRecipeDetail();
}

async function handleSaveRecipeEdit(event, recipeId) {
  event.preventDefault();
  const statusEl = document.querySelector("#edit-status");
  const existingRecipe = state.recipes.find((entry) => entry.id === recipeId);
  const updated = {
    id: recipeId,
    title: document.querySelector("#edit-title").value.trim(),
    description: document.querySelector("#edit-description").value.trim(),
    servings: document.querySelector("#edit-servings").value,
    ingredients: splitLines(document.querySelector("#edit-ingredients").value),
    instructions: splitLines(document.querySelector("#edit-instructions").value),
    method: document.querySelector("#edit-method").value.trim(),
    image: existingRecipe?.image || "",
    rating: existingRecipe?.rating || 0,
  };

  if (!updated.title) {
    statusEl.textContent = "A title is required.";
    return;
  }

  try {
    if (IS_HOSTED_APP) {
      const response = await hostedFetch(`/api/recipes/${encodeURIComponent(recipeId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Could not save changes.");
      }
      state.recipes = Array.isArray(payload.recipes) ? payload.recipes : state.recipes;
    } else {
      const existing = state.recipes.find((entry) => entry.id === recipeId);
      if (existing) {
        Object.assign(existing, updated, { servings: normalizeServingsInput(updated.servings) });
      }
    }

    state.editingRecipeId = null;
    delete state.desiredServingsByRecipe[recipeId];
    persistDesiredServings();
    persistState();
    render();
    setStatus(`Saved changes to "${updated.title}".`);
  } catch (error) {
    statusEl.textContent = error.message || "Could not save changes.";
  }
}

async function handleDeleteRecipe(recipeId) {
  const recipe = state.recipes.find((entry) => entry.id === recipeId);
  if (!recipe) {
    return;
  }

  if (!window.confirm(`Delete "${recipe.title}"? This cannot be undone.`)) {
    return;
  }

  try {
    if (IS_HOSTED_APP) {
      const response = await hostedFetch(`/api/recipes/${encodeURIComponent(recipeId)}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Could not delete this recipe.");
      }
      state.recipes = Array.isArray(payload.recipes) ? payload.recipes : state.recipes;
      state.planner = payload.planner || state.planner;
    } else {
      state.recipes = state.recipes.filter((entry) => entry.id !== recipeId);
      WEEK_DAYS.forEach((day) => {
        if (state.planner[day] === recipeId) {
          state.planner[day] = "";
        }
      });
    }

    if (state.selectedRecipeId === recipeId) {
      state.selectedRecipeId = state.recipes[0]?.id || "";
    }
    state.editingRecipeId = null;
    delete state.desiredServingsByRecipe[recipeId];
    persistDesiredServings();
    persistState();
    render();
    setStatus(`Deleted "${recipe.title}".`);
  } catch (error) {
    setStatus(error.message || "Could not delete this recipe.");
  }
}

function persistState() {
  if (!IS_HOSTED_APP) {
    localStorage.setItem(STORAGE_KEYS.selectedRecipeId, state.selectedRecipeId);
    localStorage.setItem(STORAGE_KEYS.recipes, JSON.stringify(state.recipes));
    localStorage.setItem(STORAGE_KEYS.planner, JSON.stringify(state.planner));
  }
}

async function hydrateRemoteState() {
  try {
    const response = await hostedFetch("/api/state");
    if (response.status === 401) {
      return;
    }
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

function render() {
  renderHouseholdSettings();
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

  const filteredRecipes = recipeSearchTerm
    ? state.recipes.filter((recipe) => recipe.title.toLowerCase().includes(recipeSearchTerm))
    : state.recipes;

  if (!filteredRecipes.length) {
    elements.recipeLibrary.classList.add("empty-state");
    elements.recipeLibrary.textContent = "No recipes match your search.";
    return;
  }

  filteredRecipes.forEach((recipe) => {
    const node = elements.recipeCardTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".recipe-card-title").textContent = recipe.title;
    node.querySelector(".recipe-card-meta").textContent = `${recipe.ingredients.length} ingredients | ${recipe.instructions.length} steps`;
    node.classList.toggle("active", recipe.id === state.selectedRecipeId);
    node.querySelector(".recipe-card-select").addEventListener("click", () => handleSelectRecipe(recipe.id));

    bindStarRating(node.querySelector(".recipe-card-rating"), recipe);

    const servingsLabel = node.querySelector(".recipe-card-servings");
    const servingsInput = node.querySelector(".recipe-card-servings-input");
    if (recipe.servings) {
      servingsInput.value = getDesiredServings(recipe) || recipe.servings;
      servingsInput.addEventListener("click", (event) => event.stopPropagation());
      servingsInput.addEventListener("change", (event) => {
        event.stopPropagation();
        setDesiredServings(recipe.id, event.target.value);
      });
    } else {
      servingsLabel.hidden = true;
    }

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

  if (state.editingRecipeId === recipe.id) {
    renderRecipeEditForm(recipe);
    return;
  }

  const desiredServings = getDesiredServings(recipe);
  const factor = recipe.servings && desiredServings ? desiredServings / recipe.servings : 1;

  const ingredientsMarkup = recipe.ingredients
    .map((ingredient) => `<li>${escapeHtml(scaleIngredientText(ingredient, factor))}</li>`)
    .join("");
  const instructionsMarkup = recipe.instructions
    .map((instruction) => `<li>${escapeHtml(instruction)}</li>`)
    .join("");
  const sourceLinkMarkup =
    recipe.sourceUrl && isSafeHttpUrl(recipe.sourceUrl)
      ? `<a class="detail-link" href="${escapeAttribute(recipe.sourceUrl)}" target="_blank" rel="noreferrer">
          View source recipe
        </a>`
      : "";
  const servingsControlMarkup = recipe.servings
    ? `<div class="servings-control">
        <label>Scale ingredients to
          <input type="number" id="servings-input" min="1" value="${desiredServings || recipe.servings}" />
          servings
        </label>
        <span class="servings-base">Recipe as saved serves ${recipe.servings}.</span>
      </div>`
    : "";

  elements.recipeDetail.innerHTML = `
    <div class="detail-header">
      <div class="detail-header-row">
        <h3>${escapeHtml(recipe.title)}</h3>
        <div class="detail-actions">
          <button id="edit-recipe-button" class="ghost-button" type="button">Edit</button>
          <button id="delete-recipe-button" class="ghost-button danger-button" type="button">Delete</button>
        </div>
      </div>
      <div class="star-rating" role="group" aria-label="Rate this recipe">
        <button type="button" class="star-button" data-value="1" aria-label="Rate 1 star">★</button>
        <button type="button" class="star-button" data-value="2" aria-label="Rate 2 stars">★</button>
        <button type="button" class="star-button" data-value="3" aria-label="Rate 3 stars">★</button>
        <button type="button" class="star-button" data-value="4" aria-label="Rate 4 stars">★</button>
        <button type="button" class="star-button" data-value="5" aria-label="Rate 5 stars">★</button>
      </div>
      ${sourceLinkMarkup}
      ${servingsControlMarkup}
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

  elements.recipeDetail
    .querySelector("#edit-recipe-button")
    .addEventListener("click", () => handleStartEdit(recipe.id));
  elements.recipeDetail
    .querySelector("#delete-recipe-button")
    .addEventListener("click", () => handleDeleteRecipe(recipe.id));
  bindStarRating(elements.recipeDetail.querySelector(".star-rating"), recipe);

  const servingsInput = elements.recipeDetail.querySelector("#servings-input");
  servingsInput?.addEventListener("change", (event) => {
    setDesiredServings(recipe.id, event.target.value);
  });
}

function renderRecipeEditForm(recipe) {
  elements.recipeDetail.innerHTML = `
    <form id="recipe-edit-form" class="import-form recipe-edit-form">
      <label class="field">
        <span>Title</span>
        <input id="edit-title" type="text" value="${escapeAttribute(recipe.title)}" required />
      </label>
      <label class="field">
        <span>Description</span>
        <textarea id="edit-description" rows="2">${escapeHtml(recipe.description || "")}</textarea>
      </label>
      <label class="field">
        <span>Servings</span>
        <input id="edit-servings" type="number" min="1" value="${recipe.servings || ""}" />
      </label>
      <label class="field">
        <span>Ingredients (one per line)</span>
        <textarea id="edit-ingredients" rows="8">${escapeHtml(recipe.ingredients.join("\n"))}</textarea>
      </label>
      <label class="field">
        <span>Instructions (one per line)</span>
        <textarea id="edit-instructions" rows="8">${escapeHtml(recipe.instructions.join("\n"))}</textarea>
      </label>
      <label class="field">
        <span>Method summary</span>
        <textarea id="edit-method" rows="3">${escapeHtml(recipe.method || "")}</textarea>
      </label>
      <div class="import-actions">
        <button class="primary-button" type="submit">Save changes</button>
        <button id="cancel-edit-button" class="ghost-button" type="button">Cancel</button>
        <p id="edit-status" class="status-text" aria-live="polite"></p>
      </div>
    </form>
  `;

  elements.recipeDetail
    .querySelector("#recipe-edit-form")
    .addEventListener("submit", (event) => handleSaveRecipeEdit(event, recipe.id));
  elements.recipeDetail.querySelector("#cancel-edit-button").addEventListener("click", handleCancelEdit);
}

function renderShoppingList() {
  ensureShoppingOverridesCurrent();

  const selectedRecipes = WEEK_DAYS.map((day) => state.planner[day])
    .filter(Boolean)
    .map((recipeId) => state.recipes.find((recipe) => recipe.id === recipeId))
    .filter(Boolean);

  if (!selectedRecipes.length) {
    currentShoppingItems = [];
    elements.shoppingList.className = "shopping-list empty-state";
    elements.shoppingList.textContent =
      "Choose recipes in the weekly menu to build a shopping list automatically.";
    updateShoppingTotalDisplay();
    return;
  }

  const combined = new Map();

  selectedRecipes.forEach((recipe) => {
    const desiredServings = getDesiredServings(recipe);
    const factor = recipe.servings && desiredServings ? desiredServings / recipe.servings : 1;

    recipe.ingredients.forEach((ingredient) => {
      const parsed = parseIngredient(scaleIngredientText(ingredient, factor));
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
  currentShoppingItems = items;

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
    const sortedItems = [...group.items].sort(
      (left, right) => Number(isItemRemoved(left)) - Number(isItemRemoved(right))
    );

    sortedItems.forEach((item) => {
      list.appendChild(buildShoppingItemNode(item));
    });

    section.append(heading, list);
    elements.shoppingList.appendChild(section);
  });

  updateShoppingTotalDisplay();
}

function buildShoppingItemNode(item) {
  const node = elements.shoppingItemTemplate.content.firstElementChild.cloneNode(true);
  const removed = isItemRemoved(item);

  node.classList.toggle("shopping-item--removed", removed);
  node.querySelector(".shopping-item-name").textContent = item.label;
  node.querySelector(".shopping-item-count").textContent = formatIngredientSummary(item);

  const priceInput = node.querySelector(".price-input");
  const existingPrice = state.shoppingOverrides.prices[item.key];
  priceInput.value = existingPrice === undefined || existingPrice === null ? "" : existingPrice;
  priceInput.disabled = removed;
  priceInput.addEventListener("input", (event) => {
    const value = event.target.value;
    if (value === "") {
      delete state.shoppingOverrides.prices[item.key];
    } else {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed >= 0) {
        state.shoppingOverrides.prices[item.key] = parsed;
      }
    }
    persistShoppingOverrides();
    updateShoppingTotalDisplay();
  });

  const removeButton = node.querySelector(".remove-item-button");
  const restoreButton = node.querySelector(".restore-item-button");
  removeButton.hidden = removed;
  restoreButton.hidden = !removed;
  removeButton.addEventListener("click", () => setItemRemoved(item.key, true));
  restoreButton.addEventListener("click", () => setItemRemoved(item.key, false));

  return node;
}

function isItemRemoved(item) {
  return Boolean(state.shoppingOverrides.removed[item.key]);
}

function setItemRemoved(key, removed) {
  if (removed) {
    state.shoppingOverrides.removed[key] = true;
  } else {
    delete state.shoppingOverrides.removed[key];
  }
  persistShoppingOverrides();
  renderShoppingList();
  renderStats();
}

function updateShoppingTotalDisplay() {
  const total = currentShoppingItems.reduce((sum, item) => {
    if (isItemRemoved(item)) {
      return sum;
    }
    const price = state.shoppingOverrides.prices[item.key];
    return Number.isFinite(price) ? sum + price : sum;
  }, 0);

  elements.shoppingTotal.textContent = `£${total.toFixed(2)}`;
}

function getPlannerSignature() {
  return WEEK_DAYS.map((day) => state.planner[day] || "").join("|");
}

function ensureShoppingOverridesCurrent() {
  const signature = getPlannerSignature();
  if (state.shoppingOverrides.signature === signature) {
    return;
  }

  state.shoppingOverrides = { signature, removed: {}, prices: {} };
  persistShoppingOverrides();
}

function persistShoppingOverrides() {
  localStorage.setItem(STORAGE_KEYS.shoppingOverrides, JSON.stringify(state.shoppingOverrides));
}

// A recipe-specific override always wins; otherwise default to the
// household size (if set) before falling back to the recipe's own
// saved serving count.
function getDesiredServings(recipe) {
  return (
    state.desiredServingsByRecipe[recipe.id] ||
    getHouseholdServings() ||
    recipe.servings ||
    null
  );
}

function getHouseholdServings() {
  const adults = Math.max(0, Number(state.household.adults) || 0);
  const children = Math.max(0, Number(state.household.children) || 0);
  const total = adults + (state.household.childrenShare ? 0 : children);
  return total > 0 ? total : null;
}

function handleHouseholdChange() {
  state.household = {
    adults: Math.max(0, Number(elements.householdAdults.value) || 0),
    children: Math.max(0, Number(elements.householdChildren.value) || 0),
    childrenShare: elements.householdChildrenShare.checked,
  };
  persistHousehold();
  render();
}

function persistHousehold() {
  localStorage.setItem(STORAGE_KEYS.household, JSON.stringify(state.household));
}

function renderHouseholdSettings() {
  elements.householdAdults.value = state.household.adults;
  elements.householdChildren.value = state.household.children;
  elements.householdChildrenShare.checked = state.household.childrenShare;
  elements.householdTotal.textContent = getHouseholdServings() || "—";
}

function setDesiredServings(recipeId, rawValue) {
  const recipe = state.recipes.find((entry) => entry.id === recipeId);
  const value = Number(rawValue);
  const normalized = Number.isFinite(value) && value > 0 ? Math.round(value) : recipe?.servings || null;

  if (recipe && normalized === recipe.servings) {
    delete state.desiredServingsByRecipe[recipeId];
  } else if (normalized) {
    state.desiredServingsByRecipe[recipeId] = normalized;
  }
  persistDesiredServings();

  renderRecipeLibrary();
  if (state.selectedRecipeId === recipeId) {
    renderRecipeDetail();
  }
  if (WEEK_DAYS.some((day) => state.planner[day] === recipeId)) {
    renderShoppingList();
    renderStats();
  }
}

function persistDesiredServings() {
  localStorage.setItem(STORAGE_KEYS.desiredServings, JSON.stringify(state.desiredServingsByRecipe));
}

// Lights up stars 1..rating and wires each button to set that value.
// Clicking the currently-set star again clears the rating back to 0.
function bindStarRating(container, recipe) {
  if (!container) {
    return;
  }

  const rating = recipe.rating || 0;
  container.querySelectorAll(".star-button").forEach((button) => {
    const value = Number(button.dataset.value);
    button.classList.toggle("filled", value <= rating);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      setRecipeRating(recipe.id, value === rating ? 0 : value);
    });
  });
}

async function setRecipeRating(recipeId, rating) {
  const recipe = state.recipes.find((entry) => entry.id === recipeId);
  if (!recipe) {
    return;
  }

  const updated = {
    id: recipeId,
    title: recipe.title,
    description: recipe.description,
    servings: recipe.servings,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    method: recipe.method,
    image: recipe.image,
    rating,
  };

  try {
    if (IS_HOSTED_APP) {
      const response = await hostedFetch(`/api/recipes/${encodeURIComponent(recipeId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Could not save the rating.");
      }
      state.recipes = Array.isArray(payload.recipes) ? payload.recipes : state.recipes;
    } else {
      recipe.rating = rating;
      persistState();
    }

    renderRecipeLibrary();
    if (state.selectedRecipeId === recipeId) {
      renderRecipeDetail();
    }
  } catch (error) {
    setStatus(error.message || "Could not save the rating.");
  }
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
  Object.keys(state.shoppingOverrides.removed).forEach((key) => set.delete(key));
  return set.size;
}

async function savePlannerToBackend() {
  try {
    await hostedFetch("/api/planner", {
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

function splitLines(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeServingsInput(value) {
  const servings = Number.parseInt(value, 10);
  return Number.isFinite(servings) && servings > 0 ? servings : null;
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

function setAuthStatus(message) {
  elements.authStatus.textContent = message;
}

function isSafeHttpUrl(value) {
  try {
    return ["http:", "https:"].includes(new URL(value, window.location.href).protocol);
  } catch (error) {
    return false;
  }
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
