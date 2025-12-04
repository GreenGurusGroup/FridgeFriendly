// === Recipe Finder Logic ===

// TheMealDB base API URL
const API_URL = "https://www.themealdb.com/api/json/v1/1/search.php?s=";

// Load ingredients saved from the Ingredients page
function loadSavedIngredients() {
    try {
        return JSON.parse(localStorage.getItem("mf_ingredients") || "[]");
    } catch (e) {
        return [];
    }
}

// Build small ingredient preview cards for the search bar
function renderSavedIngredientsPreview() {
    const container = document.getElementById("savedIngredients");
    if (!container) return;

    const items = loadSavedIngredients();
    if (items.length === 0) {
        container.innerHTML = "<p>No saved ingredients yet.</p>";
        return;
    }

    container.innerHTML = items
        .map(
            (i) => `
        <label class="ingredient-check">
            <input type="checkbox" value="${i.name}">
            <span>${i.name}</span>
        </label>`
        )
        .join("");
}

// Search button clicked → gather selected ingredients & call API
async function performSearch() {
    const checked = [
        ...document.querySelectorAll("#savedIngredients input:checked"),
    ].map((x) => x.value);

    const q = document.getElementById("searchInput").value.trim();
    const query = q || checked.join(" ");

    if (!query) {
        alert("Enter a search term or select ingredients.");
        return;
    }

    const result = await fetch(API_URL + encodeURIComponent(query));
    const data = await result.json();

    renderRecipes(data.meals || []);
}

// Render recipe cards
function renderRecipes(meals) {
    const list = document.getElementById("results");
    if (!list) return;

    if (meals.length === 0) {
        list.innerHTML = "<p>No recipes found.</p>";
        return;
    }

    list.innerHTML = meals
        .map(
            (m) => `
        <div class="recipe-card" data-id="${m.idMeal}">
            <img src="${m.strMealThumb}" class="thumb">
            <h3>${m.strMeal}</h3>
        </div>`
        )
        .join("");

    document.querySelectorAll(".recipe-card").forEach((card) => {
        card.addEventListener("click", () =>
            openRecipeDetails(card.dataset.id)
        );
    });
}

// Fetch + open recipe details
async function openRecipeDetails(id) {
    const box = document.getElementById("recipeDetails");
    box.classList.remove("hidden");

    const res = await fetch(
        "https://www.themealdb.com/api/json/v1/1/lookup.php?i=" + id
    );
    const data = await res.json();
    const meal = data.meals[0];

    box.innerHTML = `
        <div class="details-inner">
            <h2>${meal.strMeal}</h2>
            <img src="${meal.strMealThumb}" class="detail-thumb">
            <p>${meal.strInstructions}</p>
        </div>
    `;
}

// Clicking outside closes recipe details
document.addEventListener("click", (e) => {
    const box = document.getElementById("recipeDetails");
    if (!box) return;

    if (!box.classList.contains("hidden")) {
        if (!box.contains(e.target) && !e.target.closest(".recipe-card")) {
            box.classList.add("hidden");
        }
    }
});

// On page load
document.addEventListener("DOMContentLoaded", () => {
    renderSavedIngredientsPreview();
    document
        .getElementById("searchButton")
        .addEventListener("click", performSearch);
});

