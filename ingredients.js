// ============================================================
// INGREDIENTS MANAGER (Ingredients Page)
// ============================================================

const STORAGE_KEY = "mf_ingredients";

// -----------------------------
// LocalStorage helpers
// -----------------------------
function readStore() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
        return [];
    }
}

function writeStore(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// -----------------------------
// Expiration helpers
// -----------------------------
function daysUntil(dateISO) {
    const now = new Date();
    const then = new Date(dateISO);
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((then.setHours(0,0,0,0) - now.setHours(0,0,0,0)) / msPerDay);
}

function colorForDays(d) {
    if (d <= 2) return "#ef4444";
    if (d <= 6) return "#fb923c";
    if (d <= 14) return "#fbbf24";
    return "#10b981";
}

// -----------------------------
// Helpers for HTML escaping + colors
// -----------------------------
function escapeHtml(s) {
    return String(s).replace(/[&<>\"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function escapeJs(s) {
    return String(s).replace(/'/g, "\\'");
}

function formatISO(iso) {
    return new Date(iso).toLocaleDateString();
}

function stringToColor(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
    h = Math.abs(h) % 360;
    return `hsl(${h}, 70%, 40%)`;
}

// -----------------------------
// Thumbnail fallback
// -----------------------------
function renderPlaceholder(parent, name) {
    parent.innerHTML = "";
    const box = document.createElement("div");
    box.className = "placeholder";
    box.style.background = stringToColor(name);
    box.textContent = name.slice(0, 2).toUpperCase();
    parent.appendChild(box);
}

// -----------------------------
// Render ingredient list
// -----------------------------
function renderList() {
    const container = document.getElementById("ingredientList");
    if (!container) return;

    const list = readStore();
    const withDays = list.map(i => ({ ...i, daysLeft: daysUntil(i.expiryISO) }))
                         .sort((a, b) => a.daysLeft - b.daysLeft);

    if (withDays.length === 0) {
        container.innerHTML = "<p>No ingredients yet. Add some above.</p>";
        return;
    }

    container.innerHTML = withDays
        .map(i => `
            <div class="ingredient-card" style="border-left: 6px solid ${colorForDays(i.daysLeft)}">
                <div class="ingredient-thumb">
                    <img src="https://www.themealdb.com/images/ingredients/${encodeURIComponent(i.name)}.png"
                        onerror="this.style.display='none'; renderPlaceholder(this.parentElement, '${escapeJs(i.name)}')">
                </div>

                <div class="ingredient-info">
                    <div class="ingredient-name">${escapeHtml(i.name)}</div>
                    <div class="days-left">${i.daysLeft} days left (${formatISO(i.expiryISO)})</div>
                </div>

                <button onclick="removeIngredient('${i.id}')" class="secondary">Remove</button>
            </div>
        `)
        .join("");
}

// -----------------------------
// Remove ingredient
// -----------------------------
window.removeIngredient = function (id) {
    let items = readStore().filter(x => x.id !== id);
    writeStore(items);
    renderList();
    renderSavedIngredientsPreview();
};

// -----------------------------
// Preview (used by recipes page)
// -----------------------------
function renderSavedIngredientsPreview() {
    const box = document.getElementById("savedIngredientsPreview");
    if (!box) return; // Safe no-op on pages without it

    const list = readStore();
    if (list.length === 0) {
        box.innerHTML = "<p>No saved ingredients.</p>";
        return;
    }

    box.innerHTML = list.map(i => `<span class="pill">${escapeHtml(i.name)}</span>`).join("");
}

// -----------------------------
// DOM Wiring
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
    const radioDate = document.querySelector(`input[name="expType"][value="date"]`);
    const radioDays = document.querySelector(`input[name="expType"][value="days"]`);
    const dateRow  = document.getElementById("dateRow");
    const daysRow  = document.getElementById("daysRow");

    function toggleRows() {
        if (radioDate.checked) {
            dateRow.classList.remove("hidden");
            daysRow.classList.add("hidden");
        } else {
            dateRow.classList.add("hidden");
            daysRow.classList.remove("hidden");
        }
    }
    radioDate.addEventListener("change", toggleRows);
    radioDays.addEventListener("change", toggleRows);

    document.getElementById("addIngredient").addEventListener("click", () => {
        const name = document.getElementById("ingredientName").value.trim();
        if (!name) return alert("Enter ingredient name");

        let expiryISO;
        if (radioDate.checked) {
            const date = document.getElementById("expDate").value;
            if (!date) return alert("Pick a date");
            expiryISO = new Date(date).toISOString();
        } else {
            const days = parseInt(document.getElementById("daysInput").value, 10);
            if (isNaN(days)) return alert("Enter number of days");
            const d = new Date();
            d.setDate(d.getDate() + days);
            expiryISO = d.toISOString();
        }

        const store = readStore();
        store.push({ id: String(Date.now()), name, expiryISO });
        writeStore(store);

        document.getElementById("ingredientName").value = "";
        document.getElementById("expDate").value = "";
        document.getElementById("daysInput").value = "";

        renderList();
        renderSavedIngredientsPreview();
    });

    renderList();
    renderSavedIngredientsPreview();
});
