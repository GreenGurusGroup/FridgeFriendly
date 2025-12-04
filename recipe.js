// ============================================================
// RECIPE FINDER (Recipes Page)
// ============================================================

// Load saved ingredients
function readStore() {
    try {
        return JSON.parse(localStorage.getItem("mf_ingredients") || "[]");
    } catch (e) {
        return [];
    }
}

// -----------------------------
// Render ingredient selector chips
// -----------------------------
function renderSavedIngredientsSelector() {
    const box = document.getElementById("savedIngredients");
    if (!box) return;

    const list = readStore();

    if (list.length === 0) {
        box.innerHTML = "<p>No saved ingredients yet.</p>";
        return;
    }

    box.innerHTML = list
        .map(i => `
            <div class="chip" data-name="${i.name}" data-selected="false">
                ${i.name}
            </div>
        `)
        .join("");

    document.querySelectorAll(".chip").forEach(chip => {
        chip.addEventListener("click", () => {
            const selected = chip.dataset.selected === "true";
            chip.dataset.selected = selected ? "false" : "true";
            chip.classList.toggle("selected");
        });
    });
}

// -----------------------------
// API Calls
// -----------------------------
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

// -----------------------------
// Render recipe cards
// -----------------------------
function renderMeals(meals) {
    const box = document.getElementById("results");
    box.innerHTML = "";

    if (!meals.length) {
        box.innerHTML = "<p>No recipes found.</p>";
        return;
    }

    meals.forEach(meal => {
        const card = document.createElement("div");
        card.className = "meal-card";

        card.innerHTML = `
            <img src="${meal.strMealThumb}">
            <h3>${meal.strMeal}</h3>
        `;

        card.addEventListener("click", () => openMealModal(meal.idMeal));

        box.appendChild(card);
    });
}

// -----------------------------
// Modal
// -----------------------------
async function openMealModal(id) {
    const modal = document.getElementById("modal");
    const content = document.getElementById("modalContent");

    const meal = await lookupMeal(id);
    if (!meal) return;

    let ingList = "";
    for (let i = 1; i <= 20; i++) {
        let ing = meal[`strIngredient${i}`];
        let meas = meal[`strMeasure${i}`];
        if (ing && ing.trim()) ingList += `<li>${ing} — ${meas}</li>`;
    }

    content.innerHTML = `
        <h2>${meal.strMeal}</h2>
        <img src="${meal.strMealThumb}">
        <h3>Ingredients</h3>
        <ul>${ingList}</ul>
        <h3>Instructions</h3>
        <p>${meal.strInstructions}</p>
    `;

    modal.classList.remove("hidden");

    modal.addEventListener("click", (e) => {
        if (e.target.id === "modal") {
            modal.classList.add("hidden");
        }
    });
}

// -----------------------------
// Search logic
// -----------------------------
async function doQuickSearch() {
    const ing = document.getElementById("quickIngredient").value.trim();
    if (!ing) return alert("Enter an ingredient.");

    const meals = await searchByIngredient(ing);
    renderMeals(meals);
}

async function doSelectedSearch() {
    const selected = [...document.querySelectorAll(".chip[data-selected='true']")]
        .map(x => x.dataset.name);

    if (!selected.length) return alert("Select at least one saved ingredient.");

    const resultSets = [];
    for (let ing of selected) {
        const meals = await searchByIngredient(ing);
        resultSets.push(meals);
    }

    // Intersect results by id
    const ids = resultSets
        .map(list => list.map(m => m.idMeal))
        .reduce((a, b) => a.filter(id => b.includes(id)));

    const meals = await Promise.all(ids.map(id => lookupMeal(id)));
    renderMeals(meals.filter(Boolean));
}

// -----------------------------
// DOM Wiring
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
    renderSavedIngredientsSelector();

    document.getElementById("quickSearch").addEventListener("click", doQuickSearch);
    document.getElementById("searchWithSelected").addEventListener("click", doSelectedSearch);

    document.getElementById("clearSelection").addEventListener("click", () => {
        document.querySelectorAll(".chip").forEach(chip => {
            chip.dataset.selected = "false";
            chip.classList.remove("selected");
        });
    });
});
