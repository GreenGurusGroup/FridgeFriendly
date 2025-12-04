// Ingredients manager: stores in localStorage under key 'mf_ingredients'
// Each item: { id, name, expiryISO }
const STORAGE_KEY = 'mf_ingredients';


function readStore(){
try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
catch(e){ return []; }
}
function writeStore(items){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }


function daysUntil(dateISO){
const now = new Date();
const then = new Date(dateISO);
// zero out times for day-accurate diff
const msPerDay = 24*60*60*1000;
const diff = Math.ceil((then.setHours(0,0,0,0) - new Date(now.setHours(0,0,0,0))) / msPerDay);
return diff;
}
function colorForDays(d){
// green -> yellow -> orange -> red
if (d <= 2) return '#ef4444'; // red
if (d <= 6) return '#fb923c'; // orange
if (d <= 14) return '#fbbf24'; // yellow
return '#10b981'; // green
}


function renderList(){
const list = readStore();
const container = document.getElementById('ingredientList');
if (!container) return;


// compute days left
const withDays = list.map(it => ({...it, daysLeft: daysUntil(it.expiryISO)}));


// sort ascending by daysLeft
withDays.sort((a,b) => a.daysLeft - b.daysLeft);


if (withDays.length === 0){ container.innerHTML = '<p>No ingredients yet. Add some above.</p>'; return; }


container.innerHTML = withDays.map(it => {
const color = colorForDays(it.daysLeft);
return `
<div class="ingredient-card" data-id="${it.id}" style="border-left:6px solid ${color}">
<div class="ingredient-thumb" data-name="${escapeHtml(it.name)}">
<img src="https://www.themealdb.com/images/ingredients/${encodeURIComponent(it.name)}.png" alt="${escapeHtml(it.name)}" onerror="this.style.display='none'; renderPlaceholder(this.parentElement, '${escapeJs(it.name)}')">
</div>
<div class="ingredient-info">
<div class="ingredient-name">${escapeHtml(it.name)}</div>
<div class="days-left">${it.daysLeft} day(s) left (${formatISO(it.expiryISO)})</div>
</div>
<div>
<button onclick="removeIngredient('${it.id}')" class="secondary">Remove</button>
</div>
</div>
`;
}).join('');
}
function renderPlaceholder(parent, name){
// parent is .ingredient-thumb element
parent.innerHTML = '';
const box = document.createElement('div');
box.className = 'placeholder';
// create a deterministic color from the name
box.style.background = stringToColor(name);
box.textContent = name.slice(0,2).toUpperCase();
parent.appendChild(box);
}


function escapeHtml(s){ return String(s).replace(/[&<>\"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function escapeJs(s){ return String(s).replace(/'/g, "\\'"); }
function formatISO(iso){ return new Date(iso).toLocaleDateString(); }


function stringToColor(str){
// simple hash to HSL
let h = 0; for (let i=0;i<str.length;i++) h = (h<<5) - h + str.charCodeAt(i);
h = Math.abs(h) % 360; return `hsl(${h} 70% 40%)`;
}


// remove by id
window.removeIngredient = function(id){
let items = readStore(); items = items.filter(x => x.id !== id); writeStore(items); renderList(); renderSavedIngredientsPreview();
}


// UI wiring
document.addEventListener('DOMContentLoaded', ()=>{
const radioDate = document.querySelector('input[name="expType"][value="date"]');
const radioDays = document.querySelector('input[name="expType"][value="days"]');
const dateRow = document.getElementById('dateRow');
const daysRow = document.getElementById('daysRow');


function toggleRows(){
if (radioDate.checked){ dateRow.classList.remove('hidden'); daysRow.classList.add('hidden'); }
else { dateRow.classList.add('hidden'); daysRow.classList.remove('hidden'); }
}
radioDate.addEventListener('change', toggleRows);
radioDays.addEventListener('change', toggleRows);


document.getElementById('addIngredient').addEventListener('click', ()=>{
const name = document.getElementById('ingredientName').value.trim();
if (!name) return alert('Enter ingredient name');


let expiryISO;
if (radioDate.checked){
const d = document.getElementById('expDate').value;
if (!d) return alert('Pick a date');
expiryISO = new Date(d).toISOString();
} else {
const days = parseInt(document.getElementById('daysInput').value,10);
if (isNaN(days)) return alert('Enter days');
const dt = new Date(); dt.setDate(dt.getDate()+days); expiryISO = dt.toISOString();
}


const store = readStore();
store.push({ id: String(Date.now()), name: name, expiryISO });
writeStore(store);
document.getElementById('ingredientName').value = '';
document.getElementById('expDate').value = '';
document.getElementById('daysInput').value = '';
renderList();
renderSavedIngredientsPreview();
});


renderList();
renderSavedIngredientsPreview();

function renderSavedIngredientsPreview(){
  const preview = document.getElementById('savedIngredientsPreview');
  if (!preview) return;

  const list = readStore();
  if (list.length === 0){
    preview.innerHTML = '<p>No saved ingredients.</p>';
    return;
  }

  preview.innerHTML = list.map(item => 
    `<span class="pill">${escapeHtml(item.name)}</span>`
  ).join('');
}
});

