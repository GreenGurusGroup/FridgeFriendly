// === Load ingredients from localStorage ===
const STORAGE_KEY = "mf_ingredients";

function readStore() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
        return [];
    }
}

// === Render saved ingredients as selectable chips ===
function renderSavedIngredients() {
    const list = readStore();
    const container = document.getElementById("savedIngredients");
    container.innerHTML = "";

    list.forEach(item => {
        const daysLeft = daysUntil(item.expiryISO);

        const el = document.createElement("div");
        el.className = "saved-chip";
        el.textContent = `${item.name} (${daysLeft}d)`;
        el.dataset.name = item.name;
        el.dataset.selected = "false";

        el.addEventListener("click", () => {
            const selected = el.dataset.selected === "true";
            el.dataset.selected = selected ? "false" : "true";
            el.classList.toggle("selected");
        });

        container.appendChild(el);
    });
}

// shared from your ingredients page logic
function daysUntil(dateISO) {
    const now = new Date();
    const then = new Date(dateISO);
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.ceil((then - now) / msPerDay);
}

// === SEARCH FUNCTIONS ===
async function searchByIngredient(ing) {
    const url = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ing)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.meals || [];
}

async function lookupMeal(id) {
    const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.meals ? data.meals[0] : null;
}

// === RENDER RESULTS ===
function renderMeals(meals) {
    const container = document.getElementById("results");
    container.innerHTML = "";

    if (!meals.length) {
        container.innerHTML = "<p>No results found.</p>";
        return;
    }

    meals.forEach(meal => {
        const card = document.createElement("div");
        card.className = "meal-card";

        card.innerHTML = `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            <div class="me
