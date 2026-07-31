import {
  parseIngredient,
  createIngredientEntry,
  mergeIngredientEntry,
  formatIngredientSummary,
  groupShoppingItems,
  scaleIngredientText,
} from "./ingredients.js";
import { extractRecipeFromHtml } from "./recipe-parser.js";
import { encodeSharedPayload, decodeSharedPayload } from "./share.js";

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

const demoRecipes = [
  {
    id: crypto.randomUUID(),
    title: "One-Pan Tomato Basil Gnocchi",
    sourceUrl: "https://demo.local/gnocchi",
    description: "A quick weeknight pasta-style dinner with soft gnocchi and tomato sauce.",
    servings: 4,
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
  recipeLibrary: document.querySelector("#recipe-library"),
  recipeDetail: document.querySelector("#recipe-detail"),
  weeklyMenu: document.querySelector("#weekly-menu"),
  shoppingList: document.querySelector("#shopping-list"),
  recipeCount: document.querySelector("#recipe-count"),
  plannedCount: document.querySelector("#planned-count"),
  shoppingCount: document.querySelector("#shopping-count"),
  recipeCardTemplate: document.querySelector("#recipe-card-template"),
  shoppingItemTemplate: document.querySelector("#shopping-item-template"),
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
  desiredServings: null,
};

let authMode = "login";

initializeApp();

async function initializeApp() {
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
}

function bindEvents() {
  elements.importForm.addEventListener("submit", handleImportSubmit);
  elements.loadDemoButton.addEventListener("click", handleLoadDemoRecipes);
  elements.shareBoardButton.addEventListener("click", handleShareBoard);
  elements.authForm.addEventListener("submit", handleAuthSubmit);
  elements.authToggleMode.addEventListener("click", handleAuthToggleMode);
  elements.logoutButton.addEventListener("click", handleLogout);
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
  state.desiredServings = null;
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

  state.desiredServings = null;
  persistState();
  render();
}

function handleSelectRecipe(recipeId) {
  state.selectedRecipeId = recipeId;
  state.editingRecipeId = null;
  state.desiredServings = null;
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
  const updated = {
    id: recipeId,
    title: document.querySelector("#edit-title").value.trim(),
    description: document.querySelector("#edit-description").value.trim(),
    servings: document.querySelector("#edit-servings").value,
    ingredients: splitLines(document.querySelector("#edit-ingredients").value),
    instructions: splitLines(document.querySelector("#edit-instructions").value),
    method: document.querySelector("#edit-method").value.trim(),
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
    state.desiredServings = null;
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
      state.desiredServings = null;
    }
    state.editingRecipeId = null;
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
    node.addEventListener("click", () => handleSelectRecipe(recipe.id));
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

  if (!state.desiredServings && recipe.servings) {
    state.desiredServings = recipe.servings;
  }

  const factor = recipe.servings && state.desiredServings ? state.desiredServings / recipe.servings : 1;

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
          <input type="number" id="servings-input" min="1" value="${state.desiredServings || recipe.servings}" />
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

  const servingsInput = elements.recipeDetail.querySelector("#servings-input");
  servingsInput?.addEventListener("change", (event) => {
    const value = Number(event.target.value);
    state.desiredServings = Number.isFinite(value) && value > 0 ? value : recipe.servings;
    renderRecipeDetail();
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
