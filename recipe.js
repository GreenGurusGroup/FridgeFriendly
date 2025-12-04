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
            <div class="meal-title">${meal.strMeal}</div>
        `;

        card.addEventListener("click", () => openMealModal(meal.idMeal));

        container.appendChild(card);
    });
}

// === MODAL ===
async function openMealModal(id) {
    const meal = await lookupMeal(id);
    if (!meal) return;

    const modal = document.getElementById("modal");
    const content = document.getElementById("modalContent");

    let ingredientsHTML = "";
    for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`];
        const meas = meal[`strMeasure${i}`];
        if (ing && ing.trim()) {
            ingredientsHTML += `<li>${ing} — ${meas}</li>`;
        }
    }

    content.innerHTML = `
        <h2>${meal.strMeal}</h2>
        <img src="${meal.strMealThumb}">
        <h3>Ingredients</h3>
        <ul>${ingredientsHTML}</ul>
        <h3>Instructions</h3>
        <p>${meal.strInstructions}</p>
    `;

    modal.classList.remove("hidden");

    // Clicking outside content closes modal
    modal.addEventListener("click", e => {
        if (e.target.id === "modal") {
            modal.classList.add("hidden");
        }
    });
}

// === BUTTON WIRING ===
document.addEventListener("DOMContentLoaded", () => {

    // Load saved ingredients list
    renderSavedIngredients();

    // Quick search
    document.getElementById("quickSearch").addEventListener("click", async () => {
        const ing = document.getElementById("quickIngredient").value.trim();
        if (!ing) return alert("Enter an ingredient.");

        const meals = await searchByIngredient(ing);
        renderMeals(meals);
    });

    // Search using selected saved ingredients
    document.getElementById("searchWithSelected").addEventListener("click", async () => {
        const selected = [...document.querySelectorAll(".saved-chip[data-selected='true']")]
            .map(el => el.dataset.name);

        if (selected.length === 0) return alert("Select at least one ingredient.");

        // fetch meals for each ingredient → intersect results
        let resultSets = [];
        for (const ing of selected) {
            const meals = await searchByIngredient(ing);
            resultSets.push(meals);
        }

        // intersection by idMeal
        const intersection = resultSets.reduce((acc, list) => {
            if (acc === null) return list;
            return acc.filter(a => list.some(b => b.idMeal === a.idMeal));
        }, null) || [];

        renderMeals(intersection);
    });

    // Clear ingredient selections
    document.getElementById("clearSelection").addEventListener("click", () => {
        document.querySelectorAll(".saved-chip").forEach(el => {
            el.dataset.selected = "false";
            el.classList.remove("selected");
        });
    });

});
