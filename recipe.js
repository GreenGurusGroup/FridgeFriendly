// ============================================================
// RECIPE FINDER (Recipes Page) — Checkbox selector version
// ============================================================

// --- Storage ---
function readStore() {
  try { return JSON.parse(localStorage.getItem("mf_ingredients") || "[]"); }
  catch { return []; }
}

// --- API helpers ---
async function searchByIngredient(ing) {
  const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ing)}`);
  const data = await res.json();
  return data.meals || [];
}

async function lookupMeal(id) {
  const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
  const data = await res.json();
  return data.meals ? data.meals[0] : null;
}

// --- UI: render saved ingredient selector as CHECKBOXES ---
function renderSavedIngredientsSelector() {
  const box = document.getElementById("savedIngredients");
  if (!box) return;

  const items = readStore();
  if (!items.length) {
    box.innerHTML = "<p>No saved ingredients yet. Add some on the Ingredients page.</p>";
    return;
  }

  // Build checkbox list
  box.innerHTML = items.map(item => `
    <label class="ingredient-card" style="width:auto;gap:8px;align-items:center;cursor:pointer">
      <input type="checkbox" value="${escapeHtml(item.name)}" />
      <div class="ingredient-thumb" style="width:40px;height:40px">
        <img src="https://www.themealdb.com/images/ingredients/${encodeURIComponent(item.name)}.png"
             alt="${escapeHtml(item.name)}"
             onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=&quot;placeholder&quot; style=&quot;width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:#ddd;font-weight:600&quot;>${escapeHtml(item.name).slice(0,2).toUpperCase()}</div>'">
      </div>
      <span class="ingredient-name">${escapeHtml(item.name)}</span>
    </label>
  `).join("");
}

function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// --- Results rendering ---
function renderMeals(meals) {
  const container = document.getElementById("results");
  if (!container) return;
  if (!meals.length) { container.innerHTML = "<p>No recipes found.</p>"; return; }

  container.innerHTML = meals.map(m => `
    <div class="meal-card" data-id="${m.idMeal}">
      <img src="${m.strMealThumb}" alt="${escapeHtml(m.strMeal)}">
      <div class="meal-title">${escapeHtml(m.strMeal)}</div>
    </div>
  `).join("");

  // Card click → details
  container.querySelectorAll(".meal-card").forEach(card => {
    card.addEventListener("click", () => openMealModal(card.dataset.id));
  });
}

// --- Modal open/close ---
async function openMealModal(id) {
  const modal = document.getElementById("modal");
  const content = document.getElementById("modalContent");
  const meal = await lookupMeal(id);
  if (!meal) return;

  let ingredientsHTML = "";
  for (let i=1;i<=20;i++){
    const ing = meal[`strIngredient${i}`];
    const meas = meal[`strMeasure${i}`];
    if (ing && ing.trim()) ingredientsHTML += `<li>${escapeHtml(ing)} — ${escapeHtml(meas||"")}</li>`;
  }

  content.innerHTML = `
    <h2>${escapeHtml(meal.strMeal)}</h2>
    <img src="${meal.strMealThumb}" style="width:100%;border-radius:8px;margin:8px 0">
    <h3>Ingredients</h3>
    <ul>${ingredientsHTML}</ul>
    <h3>Instructions</h3>
    <p>${escapeHtml(meal.strInstructions || "")}</p>
  `;

  modal.classList.remove("hidden");
}

// Close when clicking outside the modal content
document.addEventListener("click", (e) => {
  const modal = document.getElementById("modal");
  if (!modal || modal.classList.contains("hidden")) return;
  if (e.target === modal) modal.classList.add("hidden");
});

// --- Button actions ---
async function doQuickSearch() {
  const val = document.getElementById("quickIngredient").value.trim();
  if (!val) { alert("Enter an ingredient."); return; }
  const meals = await searchByIngredient(val);
  renderMeals(meals);
}

async function doSelectedSearch() {
  const selected = Array.from(document.querySelectorAll("#savedIngredients input[type=checkbox]:checked"))
                        .map(cb => cb.value);
  if (!selected.length) { alert("Select at least one saved ingredient."); return; }

  // Fetch result set per ingredient
  const sets = await Promise.all(selected.map(s => searchByIngredient(s)));

  // If any set is empty, intersection is empty
  if (sets.some(arr => arr.length === 0)) { renderMeals([]); return; }

  // Intersect by idMeal
  const ids = sets.map(list => new Set(list.map(m => m.idMeal)))
                  .reduce((acc, set) => new Set([...acc].filter(id => set.has(id))));
  const meals = await Promise.all([...ids].map(id => lookupMeal(id)));
  renderMeals(meals.filter(Boolean));
}

// --- Wire up on load ---
document.addEventListener("DOMContentLoaded", () => {
  renderSavedIngredientsSelector();

  const quickBtn = document.getElementById("quickSearch");
  if (quickBtn) quickBtn.addEventListener("click", doQuickSearch);

  const selectedBtn = document.getElementById("searchWithSelected");
  if (selectedBtn) selectedBtn.addEventListener("click", doSelectedSearch);

  const clearBtn = document.getElementById("clearSelection");
  if (clearBtn) clearBtn.addEventListener("click", () => {
    document.querySelectorAll("#savedIngredients input[type=checkbox]").forEach(cb => cb.checked = false);
  });
});
