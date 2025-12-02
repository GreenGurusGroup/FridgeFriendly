document.getElementById('searchBtn').addEventListener('click', searchMeals);
document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('modal').classList.add('hidden');
});

async function searchMeals() {
  const ingredient = document.getElementById('ingredientInput').value.trim();
  const resultsBox = document.getElementById('results');

  if (!ingredient) {
    resultsBox.innerHTML = "<p>Please enter an ingredient.</p>";
    return;
  }

  const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${ingredient}`);
  const data = await res.json();

  if (!data.meals) {
    resultsBox.innerHTML = "<p>No meals found for that ingredient.</p>";
    return;
  }

  resultsBox.innerHTML = data.meals
    .map(meal => `
      <div class="meal-card" onclick="loadMeal('${meal.idMeal}')">
        <img src="${meal.strMealThumb}" />
        <h3>${meal.strMeal}</h3>
      </div>
    `)
    .join('');
}

async function loadMeal(id) {
  const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
  const data = await res.json();
  const meal = data.meals[0];

  const modal = document.getElementById('modal');
  const detailBox = document.getElementById('mealDetail');

  // Format ingredients
  let ingredientsHTML = "";
  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing) ingredientsHTML += `<li>${ing} - ${measure}</li>`;
  }

  detailBox.innerHTML = `
    <h2>${meal.strMeal}</h2>
    <img src="${meal.strMealThumb}" width="100%" />
    <h3>Ingredients</h3>
    <ul>${ingredientsHTML}</ul>
    <h3>Instructions</h3>
    <p>${meal.strInstructions}</p>
  `;

  modal.classList.remove("hidden");
}
