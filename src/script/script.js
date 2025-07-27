// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  showToast('Something went wrong. Please refresh the page.');
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showToast('Network error. Please check your connection.');
});

// --- DATA ---
// --- Load recipes from JSON file ---
let recipes = {};

// Show loading spinner
function showLoading() {
  const spinner = document.getElementById('loadingSpinner');
  const container = document.getElementById('cardContainer');
  if (spinner) spinner.style.display = 'flex';
  if (container) container.style.display = 'none';
}

// Hide loading spinner
function hideLoading() {
  const spinner = document.getElementById('loadingSpinner');
  const container = document.getElementById('cardContainer');
  if (spinner) spinner.style.display = 'none';
  if (container) container.style.display = 'grid';
}

// Enhanced error display for mobile
function showMobileError() {
  const existingError = document.querySelector('.mobile-error');
  if (existingError) existingError.remove();
  
  const errMsg = document.createElement('div');
  errMsg.className = 'mobile-error';
  errMsg.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 107, 107, 0.95);
    color: white;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    max-width: 90vw;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  `;
  errMsg.innerHTML = `
    <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
    <h3 style="margin: 0 0 10px 0; font-size: 18px;">Error Loading Recipes</h3>
    <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.4;">
      Unable to load recipes. Please check your internet connection and try refreshing the page.
    </p>
    <button onclick="location.reload()" style="
      background: #d2691e; 
      color: white; 
      border: none; 
      padding: 12px 24px; 
      border-radius: 8px; 
      cursor: pointer; 
      font-size: 16px;
      font-weight: bold;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    ">Retry</button>
  `;
  document.body.appendChild(errMsg);
}

showLoading();

// Enhanced fetch with better error handling and mobile optimization
fetch('./src/data/recipes.json')
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    // Normalize all recipes to have process_jargon and process_easy
    Object.keys(data).forEach(key => {
      const rec = data[key];
      // If only 'process' exists, use it for both fields
      if (!rec.process_jargon && rec.process) {
        rec.process_jargon = rec.process;
      }
      if (!rec.process_easy && rec.process) {
        rec.process_easy = rec.process;
      }
    });
    recipes = data;
    console.log('Loaded recipes:', Object.keys(recipes).length);
    window.selectedCategory = 'all'; // Always show all recipes by default
    hideLoading();
    renderCards(); // Call your function to render the recipe cards after loading
    // Place any other code that depends on recipes here
    initUI(); // Ensure UI is initialized after cards are rendered
    
    // Generate structured data for SEO
    addRecipeStructuredData();
  })
  .catch(error => {
    console.error('Error loading recipes:', error);
    hideLoading();
    
    // Check if we're on mobile and show appropriate error
    if (window.innerWidth <= 768) {
      showMobileError();
    } else {
      const errMsg = document.createElement('div');
      errMsg.style.cssText = 'color: #ff6b6b; text-align: center; margin: 20px; padding: 20px; background: rgba(255,107,107,0.1); border-radius: 8px; border: 1px solid #ff6b6b;';
      errMsg.innerHTML = `
        <h3>⚠️ Error Loading Recipes</h3>
        <p>Unable to load recipes. Please check your internet connection and try refreshing the page.</p>
        <button onclick="location.reload()" style="background: #d2691e; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">Retry</button>
      `;
      document.body.prepend(errMsg);
    }
  });

const additions = {
  none: { calories: 0, carbs: 0, protein: 0 },
  milk: { calories: 50, carbs: 5, protein: 2 },
  sugar: { calories: 30, carbs: 8, protein: 0 },
  "milk+sugar": { calories: 80, carbs: 13, protein: 2 }
};

const cardContainer = document.getElementById("cardContainer");

// --- Persistent Favorites ---
function getFavorites() {
  return JSON.parse(localStorage.getItem('favorites') || '{}');
}
function setFavorites(favs) {
  localStorage.setItem('favorites', JSON.stringify(favs));
}
let favorites = getFavorites();

function updateFavoriteUI() {
  favorites = getFavorites(); // Always sync with localStorage
  document.querySelectorAll('.recipe-card').forEach(card => {
    const title = card.querySelector('.card-title').textContent;
    const heart = card.querySelector('.bi-heart, .bi-heart-fill');
    if (favorites[title]) {
      heart.classList.add('bi-heart-fill');
      heart.classList.remove('bi-heart');
    } else {
      heart.classList.remove('bi-heart-fill');
      heart.classList.add('bi-heart');
    }
  });
}

// --- MISSING FILTER/SEARCH FUNCTIONS ---
function filterRecipes(category) {
  window.selectedCategory = category;
  applyCombinedFilter();
}

function searchRecipes() {
  applyCombinedFilter();
}

function applyCombinedFilter() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  let anyVisible = false;
  document.querySelectorAll(".recipe-card").forEach(card => {
    const type = card.getAttribute("data-type");
    const titleElem = card.querySelector(".card-title");
    const title = titleElem.textContent.toLowerCase();
    const heartIcon = card.querySelector(".bi-heart, .bi-heart-fill");
    const isFav = heartIcon && heartIcon.classList.contains("bi-heart-fill");

    let matchCategory = false;
    
    if (window.selectedCategory === "all") {
      matchCategory = true;
    } else if (window.selectedCategory === "favourites") {
      matchCategory = isFav; // Only show favorited items
    } else if (window.selectedCategory === "hot") {
      matchCategory = type === "hot";
    } else if (window.selectedCategory === "iced") {
      matchCategory = type === "iced";
    } else {
      matchCategory = true; // Default to show all
    }

    const matchSearch = !input || title.includes(input);
    const shouldShow = matchCategory && matchSearch;
    
    card.style.display = shouldShow ? "block" : "none";
    
    if (shouldShow) {
      anyVisible = true;
      // Highlight match
      if (input && title.includes(input)) {
        const re = new RegExp(`(${input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
        titleElem.innerHTML = card.querySelector(".card-title").textContent.replace(re, '<mark>$1</mark>');
      } else {
        titleElem.innerHTML = card.querySelector(".card-title").textContent;
      }
    } else {
      // Remove highlight if hidden
      titleElem.innerHTML = card.querySelector(".card-title").textContent;
    }
  });
  document.getElementById('noResults').style.display = anyVisible ? 'none' : 'block';
}

// --- Sorting Logic ---
const sortSelect = document.getElementById('sortSelect');
sortSelect.addEventListener('change', () => {
  renderCards();
  updateFavoriteUI();
  applyCombinedFilter();
});

// --- Popularity order for most common coffees ---
const popularityOrder = [
  "espresso", "cappuccino", "latte", "americano", "mocha", "macchiato", "flatwhite", "coldbrew", "frappe", "affogato",
  "cortado", "dalgona", "mochavalencia", "irishcoffee", "vienna", "cafeaulait", "affogatoalcaffe", "cafezorro", "cafeviennois",
  // ...add more as desired, or let the rest follow
];

function getSortedRecipeKeys() {
  const keys = Object.keys(recipes);
  const sortValue = document.getElementById('sortSelect').value;
  if (sortValue === 'name') {
    return keys.sort((a, b) => {
      const titleA = recipes[a].title.toLowerCase();
      const titleB = recipes[b].title.toLowerCase();
      return titleA.localeCompare(titleB);
    });
  } else if (sortValue === 'calories') {
    return keys.sort((a, b) => {
      const calA = recipes[a].baseNutrition ? recipes[a].baseNutrition.calories : 0;
      const calB = recipes[b].baseNutrition ? recipes[b].baseNutrition.calories : 0;
      return calA - calB;
    });
  } else if (sortValue === 'type') {
    return keys.sort((a, b) => {
      const typeA = recipes[a].type || '';
      const typeB = recipes[b].type || '';
      if (typeA === typeB) {
        return recipes[a].title.localeCompare(recipes[b].title);
      }
      return typeA.localeCompare(typeB);
    });
  } else {
    // Default: most popular at top, rest alphabetically
    const popular = popularityOrder.filter(key => keys.includes(key));
    const rest = keys.filter(key => !popularityOrder.includes(key))
      .sort((a, b) => recipes[a].title.localeCompare(recipes[b].title));
    return [...popular, ...rest];
  }
}

function renderCards() {
  cardContainer.innerHTML = '';
  getSortedRecipeKeys().forEach(key => {
    const recipe = recipes[key];
    const card = document.createElement('div');
    card.className = 'card recipe-card';
    card.setAttribute('data-type', recipe.type);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View ${recipe.title} recipe`);

        card.innerHTML = `
      <img src="${recipe.img}" alt="${recipe.title}" loading="lazy" onerror="this.style.display='none'">
      <div class="card-body">
        <h3 class="card-title recipe-title">${recipe.title}</h3>
        <p class="card-cont">${
          (recipe.process || recipe.process_easy || recipe.process_jargon || '').toString().slice(0, 40)
        }...</p>
        <button class="bi bi-heart" aria-label="Add to favorites"></button>
      </div>
    `;
    const heartBtn = card.querySelector('.bi-heart');
    heartBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      const title = card.querySelector('.card-title').textContent;
      favorites = getFavorites(); // Always reload before update
      if (favorites[title]) {
        delete favorites[title];
      } else {
        favorites[title] = true;
      }
      setFavorites(favorites);
      favorites = getFavorites(); // Always reload after update
      updateFavoriteUI();
      showToast(favorites[title] ? `Added to favorites!` : `Removed from favorites!`);
      applyCombinedFilter();
    });
    card.addEventListener('click', () => openModal(key));
    cardContainer.appendChild(card);
  });
}

// --- MODAL LOGIC ---
function openModal(recipeKey) {
  const recipe = recipes[recipeKey];
  const modal = document.getElementById("recipeModal");
  
  // Prevent body scroll on mobile
  if (window.innerWidth <= 768) {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  }
  
  document.getElementById("modalTitle").textContent = recipe.title;
  document.getElementById("modalImage").src = recipe.img;

  // Ingredients
  const ingredientsList = document.getElementById("modalIngredients");
  ingredientsList.innerHTML = "";
  recipe.ingredients.forEach(ing => {
    const li = document.createElement("li");
    li.textContent = ing;
    ingredientsList.appendChild(li);
  });

  // Segmented button toggle logic
  const processElem = document.getElementById("modalProcess");
  const easyBtn = document.getElementById("jargonEasyBtn");
  const jargonBtn = document.getElementById("jargonJargonBtn");
  function renderProcess(showJargon) {
    if (showJargon && recipe.process_jargon) {
      processElem.innerHTML = Array.isArray(recipe.process_jargon)
        ? '<ul>' + recipe.process_jargon.map(step => `<li>${step}</li>`).join('') + '</ul>'
        : `<ul><li>${recipe.process_jargon}</li></ul>`;
    } else if (recipe.process_easy) {
      processElem.innerHTML = Array.isArray(recipe.process_easy)
        ? '<ul>' + recipe.process_easy.map(step => `<li>${step}</li>`).join('') + '</ul>'
        : `<ul><li>${recipe.process_easy}</li></ul>`;
    } else if (recipe.process_jargon) {
      processElem.innerHTML = Array.isArray(recipe.process_jargon)
        ? '<ul>' + recipe.process_jargon.map(step => `<li>${step}</li>`).join('') + '</ul>'
        : `<ul><li>${recipe.process_jargon}</li></ul>`;
    } else {
      processElem.innerHTML = '';
    }
  }
  // Default: show easy if available, else jargon
  let showJargon = false;
  if (easyBtn && jargonBtn) {
    easyBtn.classList.add('seg-btn-active');
    easyBtn.setAttribute('aria-pressed', 'true');
    jargonBtn.classList.remove('seg-btn-active');
    jargonBtn.setAttribute('aria-pressed', 'false');
    easyBtn.onclick = () => {
      showJargon = false;
      easyBtn.classList.add('seg-btn-active');
      easyBtn.setAttribute('aria-pressed', 'true');
      jargonBtn.classList.remove('seg-btn-active');
      jargonBtn.setAttribute('aria-pressed', 'false');
      renderProcess(false);
    };
    jargonBtn.onclick = () => {
      showJargon = true;
      jargonBtn.classList.add('seg-btn-active');
      jargonBtn.setAttribute('aria-pressed', 'true');
      easyBtn.classList.remove('seg-btn-active');
      easyBtn.setAttribute('aria-pressed', 'false');
      renderProcess(true);
    };
  }
  renderProcess(showJargon);

  // Nutrition
  const nutritionElem = document.getElementById("modalNutrition");
  const baseNutrition = recipe.baseNutrition || { calories: 0, carbs: 0, protein: 0 };
  nutritionElem.innerHTML = `
    <div class="nutrition">
      <span>Calories: ${baseNutrition.calories}</span>
      <span>Carbs: ${baseNutrition.carbs}g</span>
      <span>Protein: ${baseNutrition.protein}g</span>
    </div>
  `;

  // Customization
  const customElem = document.getElementById("modalCustom");
  customElem.innerHTML = `
    <h4>Customize Your Drink</h4>
    <div class="customization-options">
      <label><input type="checkbox" id="addMilk"> Add Milk (+50 cal)</label>
      <label><input type="checkbox" id="addSugar"> Add Sugar (+30 cal)</label>
    </div>
    <div class="custom-nutrition">
      <span>Total Calories: <span id="totalCalories">${baseNutrition.calories}</span></span>
      <span>Total Carbs: <span id="totalCarbs">${baseNutrition.carbs}g</span></span>
      <span>Total Protein: <span id="totalProtein">${baseNutrition.protein}g</span></span>
    </div>
  `;

  // Customization logic
  const milkCheckbox = document.getElementById("addMilk");
  const sugarCheckbox = document.getElementById("addSugar");
  
  function updateCaffeine() {
    const caffeineElem = document.getElementById("modalCaffeine");
    if (caffeineElem && recipe.caffeine) {
      const strength = document.getElementById("brewStrength")?.value || "medium";
      const caffeineEstimate = updateCaffeineEstimate(recipe, strength);
      caffeineElem.textContent = `Caffeine: ~${caffeineEstimate}mg`;
    }
  }
  
  function updateNutritionCustom() {
    let totalCalories = baseNutrition.calories;
    let totalCarbs = baseNutrition.carbs;
    let totalProtein = baseNutrition.protein;
    
    if (milkCheckbox && milkCheckbox.checked) {
      totalCalories += additions.milk.calories;
      totalCarbs += additions.milk.carbs;
      totalProtein += additions.milk.protein;
    }
    if (sugarCheckbox && sugarCheckbox.checked) {
      totalCalories += additions.sugar.calories;
      totalCarbs += additions.sugar.carbs;
      totalProtein += additions.sugar.protein;
    }
    
    document.getElementById("totalCalories").textContent = totalCalories;
    document.getElementById("totalCarbs").textContent = totalCarbs + "g";
    document.getElementById("totalProtein").textContent = totalProtein + "g";
  }
  
  if (milkCheckbox) {
    milkCheckbox.addEventListener('change', updateNutritionCustom);
  }
  if (sugarCheckbox) {
    sugarCheckbox.addEventListener('change', updateNutritionCustom);
  }
  
  // Brew strength selector
  const strengthSelect = document.getElementById("brewStrength");
  if (strengthSelect) {
    strengthSelect.addEventListener('change', updateCaffeine);
  }
  
  // Flavor profile chart
  if (recipe.flavorProfile) {
    const chartContainer = document.getElementById("flavorRadarChart");
    if (chartContainer) {
      renderFlavorRadarChart(recipe.flavorProfile);
    }
  }
  
  // Show modal with mobile optimization
  modal.style.display = "flex";
  modal.classList.remove("hidden");
  
  // Focus management for accessibility
  const closeBtn = modal.querySelector('.close-btn');
  if (closeBtn) {
    closeBtn.focus();
  }
  
  // Mobile-specific optimizations
  if (window.innerWidth <= 768) {
    // Scroll to top of modal content
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.scrollTop = 0;
    }
    
    // Add touch event listeners for better mobile interaction
    modal.addEventListener('touchstart', function(e) {
      e.stopPropagation();
    }, { passive: true });
  }
  
  updateCaffeine();
  updateNutritionCustom();
}

function closeModal() {
  const modal = document.getElementById("recipeModal");
  modal.style.display = "none";
  modal.classList.add("hidden");
  
  // Restore body scroll on mobile
  if (window.innerWidth <= 768) {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }
  
  // Remove blur from main content
  const mainContent = document.getElementById("mainContent");
  if (mainContent) {
    mainContent.classList.remove("blurred");
  }
  
  // Clear any mobile error messages
  const mobileError = document.querySelector('.mobile-error');
  if (mobileError) {
    mobileError.remove();
  }
  
  // Reset focus to a safe element
  const firstCard = document.querySelector('.recipe-card');
  if (firstCard) {
    firstCard.focus();
  }
}

// Replace initial card rendering with renderCards()
// renderCards(); // This line is now redundant as renderCards is called after fetch
updateFavoriteUI();

// 1. Radar chart in modal using Chart.js and flavorProfile
let radarChart;
function renderFlavorRadarChart(profile) {
  const ctx = document.getElementById('flavorRadarChart').getContext('2d');
  if (radarChart) radarChart.destroy();
  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Bitterness', 'Sweetness', 'Acidity', 'Strength', 'Body'],
      datasets: [{
        label: 'Flavor Profile',
        data: [profile.bitterness, profile.sweetness, profile.acidity, profile.strength, profile.body],
        backgroundColor: 'rgba(160, 82, 45, 0.2)',
        borderColor: '#a0522d',
        pointBackgroundColor: '#a0522d',
        borderWidth: 2
      }]
    },
    options: {
      responsive: false,
      plugins: { legend: { display: false } },
      scales: { r: { min: 0, max: 5, ticks: { stepSize: 1 } } }
    }
  });
}

// 2. Brew strength & caffeine calculator
function updateCaffeineEstimate(recipe, strength) {
  // Default: scale caffeine by strength (1-5, default 3)
  const base = recipe.caffeine || 64;
  const scaled = Math.round(base * (0.6 + 0.2 * (strength - 1)));
  document.getElementById('caffeineEstimate').textContent = `Estimated Caffeine: ${scaled} mg`;
  document.getElementById('brewStrengthValue').textContent = strength;
  return scaled;
}

// 3. Daily fact/tip rotation
const coffeeFacts = [
  "Did you know? Coffee is the world's second most traded commodity.",
  "Espresso has less caffeine per serving than drip coffee!",
  "Arabica beans are sweeter, Robusta beans are stronger.",
  "The word 'coffee' comes from the Arabic 'qahwa'.",
  "Cold brew is less acidic than hot brewed coffee.",
  "The first webcam watched a coffee pot at Cambridge University.",
  "Adding a pinch of salt to coffee can reduce bitterness.",
  "Finland consumes the most coffee per capita in the world.",
  "Coffee was originally chewed, not sipped!",
  "There are over 30 types of coffee drinks worldwide."
];
function showDailyFact() {
  // Show a random fact on every page load
  const idx = Math.floor(Math.random() * coffeeFacts.length);
  document.getElementById('dailyFactBanner').textContent = coffeeFacts[idx];
}

// 4. Navigation and display logic for Remix and Quiz sections
function showSection(sectionId) {
  // Ensure .main-content exists
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;
  
  // Remove any existing dynamic section
  const existingRemix = document.getElementById('remixSection');
  if (existingRemix) existingRemix.remove();
  const existingQuiz = document.getElementById('quizSection');
  if (existingQuiz) existingQuiz.remove();
  
  // Hide cardContainer by default
  cardContainer.classList.add('section-hidden');
  
  if (sectionId === 'remixSection') {
    // --- Remix Generator UI ---
    const remixSection = document.createElement('section');
    remixSection.id = 'remixSection';
    remixSection.innerHTML = `
      <h2 class="section-heading">Remix Generator</h2>
      <form id="remixForm" style="margin:32px auto;max-width:400px;text-align:left;">
        <label style="color:#3a2a1a;font-weight:500;">Base:
          <select id="remixBase" style="width:100%;margin-bottom:12px;">
            <option value="espresso">Espresso</option>
            <option value="coffee">Coffee</option>
            <option value="coldbrew">Cold Brew</option>
            <option value="matcha">Matcha</option>
          </select>
        </label><br>
        <label style="color:#3a2a1a;font-weight:500;">Milk:
          <select id="remixMilk" style="width:100%;margin-bottom:12px;">
            <option value="none">None</option>
            <option value="whole">Whole Milk</option>
            <option value="skim">Skim Milk</option>
            <option value="oat">Oat Milk</option>
            <option value="almond">Almond Milk</option>
            <option value="soy">Soy Milk</option>
            <option value="coconut">Coconut Milk</option>
          </select>
        </label><br>
        <label style="color:#3a2a1a;font-weight:500;">Flavor:
          <select id="remixFlavor" style="width:100%;margin-bottom:12px;">
            <option value="none">None</option>
            <option value="vanilla">Vanilla</option>
            <option value="caramel">Caramel</option>
            <option value="chocolate">Chocolate</option>
            <option value="hazelnut">Hazelnut</option>
            <option value="cinnamon">Cinnamon</option>
            <option value="mint">Mint</option>
            <option value="pumpkin">Pumpkin Spice</option>
          </select>
        </label><br>
        <button type="button" id="remixBtn" style="margin-top:16px;width:100%;padding:10px 0;font-size:1.1em;">Generate Remix</button>
      </form>
      <div id="remixResult"></div>
    `;
    remixSection.style.minHeight = '300px';
    mainContent.appendChild(remixSection);
    // Remix logic: find a real recipe that matches user preferences
    document.getElementById('remixBtn').onclick = function() {
      const base = document.getElementById('remixBase').value;
      const milk = document.getElementById('remixMilk').value;
      const flavor = document.getElementById('remixFlavor').value;
      // Try to find a recipe that matches all selected aspects
      let match = null;
      for (const key in recipes) {
        const r = recipes[key];
        // Base match: check if base is in title or ingredients
        const baseMatch = r.title.toLowerCase().includes(base) || r.ingredients.some(i => i.toLowerCase().includes(base));
        // Milk match: if not 'none', must be in ingredients
        const milkMatch = milk === 'none' || r.ingredients.some(i => i.toLowerCase().includes(milk));
        // Flavor match: if not 'none', must be in ingredients or title
        const flavorMatch = flavor === 'none' || r.title.toLowerCase().includes(flavor) || r.ingredients.some(i => i.toLowerCase().includes(flavor));
        if (baseMatch && milkMatch && flavorMatch) {
          match = r;
          break;
        }
      }
      let resultHtml = '';
      if (match) {
        resultHtml = `
          <div class='card recipe-card' style='margin:32px auto;max-width:340px;cursor:pointer;' onclick="openModal('${Object.keys(recipes).find(k => recipes[k] === match)}')">
            <img src='${match.img}' alt='${match.title}' onerror="this.style.display='none'">
            <div class='card-body'>
              <h3 class='card-title recipe-title'>${match.title}</h3>
              <p class='card-cont'>${(match.process || match.process_easy || match.process_jargon || '').toString().slice(0, 60)}...</p>
            </div>
          </div>
          <div style='text-align:center;color:#a0522d;font-size:1em;margin-top:8px;'>This is a real recipe from our collection that matches your preferences!</div>
        `;
      } else {
        // Fallback: show a custom card
        let title = base.charAt(0).toUpperCase() + base.slice(1);
        if (milk !== 'none') title += ' + ' + milk.charAt(0).toUpperCase() + milk.slice(1) + ' Milk';
        if (flavor !== 'none') title += ' + ' + flavor.charAt(0).toUpperCase() + flavor.slice(1);
        let desc = `A custom drink with ${base}`;
        if (milk !== 'none') desc += `, ${milk} milk`;
        if (flavor !== 'none') desc += `, and ${flavor}`;
        desc += '.';
        resultHtml = `
          <div class='card recipe-card' style='margin:32px auto;max-width:340px;'>
            <div class='card-body'>
              <h3 class='card-title recipe-title'>${title}</h3>
              <p class='card-cont'>${desc}</p>
            </div>
          </div>
          <div style='text-align:center;color:#a0522d;font-size:1em;margin-top:8px;'>No exact match found, but here's your custom remix!</div>
        `;
      }
      document.getElementById('remixResult').innerHTML = resultHtml;
    };
  } else if (sectionId === 'quizSection') {
    // --- Find Your Brew Quiz UI ---
    const quizSection = document.createElement('section');
    quizSection.id = 'quizSection';
    quizSection.innerHTML = `
      <h2 class="section-heading">Find Your Brew</h2>
      <form id="brewQuiz" style="margin:32px auto;max-width:400px;text-align:left;">
        <label style="color:#3a2a1a;font-weight:500;">Hot or Iced?
          <select id="quizType" style="width:100%;margin-bottom:12px;">
            <option value="hot">Hot</option>
            <option value="iced">Iced</option>
          </select>
        </label><br>
        <label style="color:#3a2a1a;font-weight:500;">Strength:
          <select id="quizStrength" style="width:100%;margin-bottom:12px;">
            <option value="mild">Mild</option>
            <option value="medium">Medium</option>
            <option value="strong">Strong</option>
          </select>
        </label><br>
        <label style="color:#3a2a1a;font-weight:500;">Milk?
          <select id="quizMilk" style="width:100%;margin-bottom:12px;">
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label><br>
        <label style="color:#3a2a1a;font-weight:500;">Sweetness:
          <select id="quizSweet" style="width:100%;margin-bottom:12px;">
            <option value="any">Any</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label><br>
        <label style="color:#3a2a1a;font-weight:500;">Flavor:
          <select id="quizFlavor" style="width:100%;margin-bottom:12px;">
            <option value="any">Any</option>
            <option value="chocolate">Chocolate</option>
            <option value="vanilla">Vanilla</option>
            <option value="caramel">Caramel</option>
            <option value="nutty">Nutty</option>
            <option value="spice">Spice</option>
            <option value="fruit">Fruit</option>
          </select>
        </label><br>
        <label style="color:#3a2a1a;font-weight:500;">Caffeine:
          <select id="quizCaffeine" style="width:100%;margin-bottom:12px;">
            <option value="any">Any</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label><br>
        <button type="button" id="quizBtn" style="margin-top:16px;width:100%;padding:10px 0;font-size:1.1em;">Find My Brew</button>
      </form>
      <div id="quizResult"></div>
    `;
    quizSection.style.minHeight = '300px';
    mainContent.appendChild(quizSection);
    // Quiz logic: show up to 3 matching recipes, allow clicking to open modal
    document.getElementById('quizBtn').onclick = function() {
      const type = document.getElementById('quizType').value;
      const strength = document.getElementById('quizStrength').value;
      const milk = document.getElementById('quizMilk').value;
      const sweet = document.getElementById('quizSweet').value;
      const flavor = document.getElementById('quizFlavor').value;
      const caffeine = document.getElementById('quizCaffeine').value;
      // Find up to 3 matches
      let matches = [];
      for (const key in recipes) {
        const r = recipes[key];
        if (
          (type === 'hot' ? r.type === 'hot' : r.type === 'iced') &&
          ((strength === 'mild' && r.flavorProfile && r.flavorProfile.strength <= 2) ||
           (strength === 'medium' && r.flavorProfile && r.flavorProfile.strength === 3) ||
           (strength === 'strong' && r.flavorProfile && r.flavorProfile.strength >= 4)) &&
          ((milk === 'yes' && r.ingredients.some(i => i.toLowerCase().includes('milk'))) ||
           (milk === 'no' && !r.ingredients.some(i => i.toLowerCase().includes('milk')))) &&
          (sweet === 'any' || (r.flavorProfile && (
            (sweet === 'low' && r.flavorProfile.sweetness <= 2) ||
            (sweet === 'medium' && r.flavorProfile.sweetness === 3) ||
            (sweet === 'high' && r.flavorProfile.sweetness >= 4)
          ))) &&
          (flavor === 'any' || r.title.toLowerCase().includes(flavor) || r.ingredients.some(i => i.toLowerCase().includes(flavor))) &&
          (caffeine === 'any' || (typeof r.caffeine === 'number' && (
            (caffeine === 'low' && r.caffeine < 50) ||
            (caffeine === 'medium' && r.caffeine >= 50 && r.caffeine < 100) ||
            (caffeine === 'high' && r.caffeine >= 100)
          )))
        ) {
          matches.push({ key, recipe: r });
          if (matches.length >= 3) break;
        }
      }
      let resultHtml = '';
      if (matches.length > 0) {
        resultHtml = matches.map(m => `
          <div class='card recipe-card' style='margin:32px auto;max-width:340px;cursor:pointer;display:inline-block;vertical-align:top;' onclick="openModal('${m.key}')">
            <img src='${m.recipe.img}' alt='${m.recipe.title}' onerror=\"this.style.display='none'\">
            <div class='card-body'>
              <h3 class='card-title recipe-title'>${m.recipe.title}</h3>
              <p class='card-cont'>${(m.recipe.process || m.recipe.process_easy || m.recipe.process_jargon || '').toString().slice(0, 60)}...</p>
            </div>
          </div>
        `).join('');
        resultHtml = `<div style='text-align:center;'>${resultHtml}</div>`;
      } else {
        resultHtml = `<div style='margin:32px auto;text-align:center;color:#a0522d;'>No perfect match found, but try exploring our recipes!</div>`;
      }
      document.getElementById('quizResult').innerHTML = resultHtml;
    };
  } else {
    // Show home/recipes
    cardContainer.classList.remove('section-hidden');
    // Remove any dynamic section if present
    const existingRemix = document.getElementById('remixSection');
    if (existingRemix) existingRemix.remove();
    const existingQuiz = document.getElementById('quizSection');
    if (existingQuiz) existingQuiz.remove();
  }
}

// --- Section/page transitions and heading animation ---
function transitionSection(showId) {
  const sections = ['remixSection', 'quizSection', 'cardContainer'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id === showId) {
        el.classList.remove('section-hidden');
        if (el.querySelector('.section-heading')) {
          el.querySelector('.section-heading').style.animation = 'none';
          void el.querySelector('.section-heading').offsetWidth;
          el.querySelector('.section-heading').style.animation = null;
        }
      } else {
        el.classList.add('section-hidden');
      }
    }
  });
}

// --- Update setActiveNav to set aria-current ---
function setActiveNav(btnId) {
  const navBtns = ['allBtn','hotBtn','icedBtn','favBtn','remixNavBtn','quizNavBtn'];
  navBtns.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.classList.remove('active');
      btn.removeAttribute('aria-current');
    }
  });
  if (btnId) {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'page');
    }
  }
}

// --- Clear search when switching to different sections ---
function clearSearchAndApplyFilter() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = '';
  }
  updateFavoriteUI(); // Ensure favorites are updated
  applyCombinedFilter();
}

function initUI() {
  // Make BrewIt logo clickable to go home (full reload)
  const homeLogo = document.getElementById('homeLogo');
  if (homeLogo) {
    homeLogo.onclick = () => {
      window.location.reload();
    };
    homeLogo.style.cursor = 'pointer';
    homeLogo.setAttribute('tabindex', '0');
    homeLogo.setAttribute('role', 'button');
    homeLogo.setAttribute('aria-label', 'Go to all recipes');
  }
  // Nav button listeners
  document.getElementById('remixNavBtn').onclick = () => { 
    showSection('remixSection'); 
    setActiveNav('remixNavBtn'); 
  };
  document.getElementById('quizNavBtn').onclick = () => { 
    showSection('quizSection'); 
    setActiveNav('quizNavBtn'); 
  };
  document.getElementById('allBtn').onclick = () => { 
    filterRecipes('all'); 
    setActiveNav('allBtn'); 
    showSection('cardContainer'); 
    clearSearchAndApplyFilter();
  };
  document.getElementById('hotBtn').onclick = () => { 
    filterRecipes('hot'); 
    setActiveNav('hotBtn'); 
    showSection('cardContainer'); 
    clearSearchAndApplyFilter();
  };
  document.getElementById('icedBtn').onclick = () => { 
    filterRecipes('iced'); 
    setActiveNav('icedBtn'); 
    showSection('cardContainer'); 
    clearSearchAndApplyFilter();
  };
  document.getElementById('favBtn').onclick = () => { 
    filterRecipes('favourites'); 
    setActiveNav('favBtn'); 
    showSection('cardContainer'); 
    clearSearchAndApplyFilter();
  };
  // Back to Top button
  let backToTopBtn = document.getElementById('backToTopBtn');
  if (!backToTopBtn) {
    backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'backToTopBtn';
    backToTopBtn.innerHTML = '<i class=\'bi bi-arrow-up\'></i>';
    document.body.appendChild(backToTopBtn);
  }
  window.addEventListener('scroll', function() {
    if (window.scrollY > 200) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  });
  backToTopBtn.onclick = function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  // Dark mode toggle (ensure only one event listener)
  const darkModeToggle = document.getElementById('darkModeToggle');
  const body = document.body;
  function setDarkMode(enabled) {
    if (enabled) {
      body.classList.remove('light-mode');
      darkModeToggle.innerHTML = '<i class="bi bi-sun"></i>';
      localStorage.setItem('darkMode', 'true');
    } else {
      body.classList.add('light-mode');
      darkModeToggle.innerHTML = '<i class="bi bi-moon"></i>';
      localStorage.setItem('darkMode', 'false');
    }
  }
  const saved = localStorage.getItem('darkMode');
  // Set dark mode as default if no preference is saved
  setDarkMode(saved === null ? true : saved === 'true');
  // Remove all previous event listeners by replacing the element
  const newToggle = darkModeToggle.cloneNode(true);
  darkModeToggle.parentNode.replaceChild(newToggle, darkModeToggle);
  newToggle.addEventListener('click', () => {
    setDarkMode(body.classList.contains('light-mode'));
  });
  // Search
  document.getElementById('searchInput').addEventListener('input', function() {
    searchRecipes();
  });
}

// --- Keyboard navigation and shortcuts ---
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('cardContainer').classList.remove('section-hidden');
  initUI();
  // Show daily fact/tip
  showDailyFact();
  // Update UI for favorites on load
  updateFavoriteUI();
  // Fix scroll-to-top button at the bottom
  let bottomScrollBtn = document.getElementById('bottomScrollToTopBtn');
  if (bottomScrollBtn) {
    bottomScrollBtn.onclick = function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }
  // Initialize with 'all' category and apply filter
  window.selectedCategory = 'all';
  // Ensure favorites are loaded from localStorage
  favorites = getFavorites();
  updateFavoriteUI();
  applyCombinedFilter();
});

// --- Toast notification function ---
function showToast(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.pointerEvents = 'auto';
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.pointerEvents = 'none';
    }, 3000);
  }
}

// Make key functions globally accessible
window.searchRecipes = searchRecipes;
window.filterRecipes = filterRecipes;
window.applyCombinedFilter = applyCombinedFilter;
window.openModal = openModal;
window.showToast = showToast;

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Function to generate structured data for recipes
function generateRecipeStructuredData(recipe, recipeId) {
  const baseUrl = 'https://sai-naman-gangiredla.github.io/BrewIt';
  
  // Convert ingredients array to proper format
  const recipeIngredients = recipe.ingredients.map(ingredient => {
    // Add quantities if not present
    if (!ingredient.includes('g') && !ingredient.includes('ml') && !ingredient.includes('cup')) {
      return `1 ${ingredient}`;
    }
    return ingredient;
  });

  // Generate instructions array
  const instructions = recipe.process_easy || [recipe.process_jargon || recipe.process];
  const recipeInstructions = instructions.map((step, index) => ({
    "@type": "HowToStep",
    "position": index + 1,
    "text": step
  }));

  // Calculate cooking time based on recipe type
  const getCookTime = (recipeType) => {
    switch(recipeType) {
      case 'hot': return 'PT5M';
      case 'iced': return 'PT3M';
      default: return 'PT4M';
    }
  };

  // Generate aggregate rating (simulated for now)
  const aggregateRating = {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "reviewCount": Math.floor(Math.random() * 50) + 10
  };

  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": recipe.title,
    "description": `${recipe.title} - A delicious coffee recipe with detailed instructions and nutrition information`,
    "image": `${baseUrl}/${recipe.img}`,
    "recipeCategory": "Coffee",
    "recipeCuisine": "International",
    "prepTime": "PT2M",
    "cookTime": getCookTime(recipe.type),
    "totalTime": "PT7M",
    "recipeYield": "1 serving",
    "recipeIngredient": recipeIngredients,
    "recipeInstructions": recipeInstructions,
    "author": {
      "@type": "Person",
      "name": "Sai Naman Gangiredla",
      "email": "sainamangangiredla@gmail.com"
    },
    "aggregateRating": aggregateRating,
    "nutrition": {
      "@type": "NutritionInformation",
      "calories": `${recipe.baseNutrition.calories} calories`,
      "carbohydrateContent": `${recipe.baseNutrition.carbs}g`,
      "proteinContent": `${recipe.baseNutrition.protein}g`
    },
    "suitableForDiet": "VegetarianDiet",
    "recipeCuisine": "Coffee",
    "keywords": `${recipe.title}, coffee, recipe, ${recipe.type}`,
    "datePublished": "2024-01-01",
    "dateModified": "2024-12-01"
  };
}

// Function to add structured data to the page
function addRecipeStructuredData() {
  // Remove existing recipe structured data
  const existingStructuredData = document.querySelectorAll('script[type="application/ld+json"]');
  existingStructuredData.forEach(script => {
    if (script.textContent.includes('"@type": "Recipe"')) {
      script.remove();
    }
  });

  // Generate structured data for all recipes
  Object.keys(recipes).forEach(recipeId => {
    const recipe = recipes[recipeId];
    const structuredData = generateRecipeStructuredData(recipe, recipeId);
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
  });
}