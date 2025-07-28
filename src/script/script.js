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

// Global cardContainer reference
let cardContainer;

// Show loading spinner
function showLoading() {
  const spinner = document.getElementById('loadingSpinner');
  if (cardContainer) cardContainer.style.display = 'none';
  if (spinner) spinner.style.display = 'flex';
}

// Hide loading spinner
function hideLoading() {
  const spinner = document.getElementById('loadingSpinner');
  if (cardContainer) cardContainer.style.display = 'grid';
  if (spinner) spinner.style.display = 'none';
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

// Load recipes function
function loadRecipes() {
  // Initialize cardContainer
  cardContainer = document.getElementById("cardContainer");
  if (!cardContainer) {
    console.error('Card container not found');
    return;
  }
  
  showLoading();

  // Try multiple fetch strategies
  const fetchStrategies = [
    () => fetch('src/data/recipes.json'),
    () => fetch('./src/data/recipes.json'),
    () => fetch('/BrewIt/src/data/recipes.json'),
    () => fetch('https://sai-naman-gangiredla.github.io/BrewIt/src/data/recipes.json'),
    () => fetch(window.location.origin + '/BrewIt/src/data/recipes.json'),
    () => fetch(window.location.origin + '/src/data/recipes.json')
  ];

  async function tryFetch(strategyIndex = 0) {
    if (strategyIndex >= fetchStrategies.length) {
      console.error('All fetch strategies failed');
      hideLoading();
      
      // Show error message
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
      return;
    }

    try {
      console.log(`Trying fetch strategy ${strategyIndex + 1}...`);
      const response = await fetchStrategies[strategyIndex]();
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Successfully loaded recipes with strategy ${strategyIndex + 1}:`, data);
      
      // Normalize all recipes to have process_jargon and process_easy
      Object.keys(data).forEach(key => {
        const rec = data[key];
        if (!rec.process_jargon && rec.process) {
          rec.process_jargon = rec.process;
        }
        if (!rec.process_easy && rec.process) {
          rec.process_easy = rec.process;
        }
      });
      
      recipes = data;
      console.log('Loaded recipes:', Object.keys(recipes).length);
      window.selectedCategory = 'all';
      hideLoading();
      renderCards();
      initUI();
      addRecipeStructuredData();
      
    } catch (error) {
      console.error(`Fetch strategy ${strategyIndex + 1} failed:`, error);
      // Try next strategy
      setTimeout(() => tryFetch(strategyIndex + 1), 100);
    }
  }

  // Start with first strategy
  tryFetch(0);
}

// Wait for DOM to be ready before loading recipes
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, starting recipe load...');
  initUI(); // Initialize UI and navigation buttons
  loadRecipes();
});

const additions = {
  none: { calories: 0, carbs: 0, protein: 0 },
  milk: { calories: 50, carbs: 5, protein: 2 },
  sugar: { calories: 30, carbs: 8, protein: 0 },
  "milk+sugar": { calories: 80, carbs: 13, protein: 2 }
};

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
  console.log('renderCards called, recipes count:', Object.keys(recipes).length);
  
  if (!cardContainer) {
    console.error('cardContainer is not initialized');
    return;
  }
  
  cardContainer.innerHTML = '';
  const sortedKeys = getSortedRecipeKeys();
  console.log('Sorted recipe keys:', sortedKeys.length);
  
  sortedKeys.forEach(key => {
    const recipe = recipes[key];
    if (!recipe) {
      console.error('Recipe not found for key:', key);
      return;
    }
    
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
    if (heartBtn) {
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
    }
    
    // Add click event for modal
    card.addEventListener('click', (event) => {
      console.log('Card clicked for recipe:', key);
      event.preventDefault();
      event.stopPropagation();
      openModal(key);
    });
    
    // Add keyboard support
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModal(key);
      }
    });
    
    cardContainer.appendChild(card);
  });
  
  console.log('Cards rendered successfully');
}

// --- MODAL LOGIC ---
function openModal(recipeKey) {
  console.log('Opening modal for recipe:', recipeKey);
  
  const recipe = recipes[recipeKey];
  if (!recipe) {
    console.error('Recipe not found:', recipeKey);
    showToast('Recipe not found');
    return;
  }

  // Store current recipe globally for nutrition calculations
  window.currentRecipe = recipe;

  console.log('Recipe data:', recipe);

  const modal = document.getElementById('recipeModal');
  const modalImage = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalIngredients = document.getElementById('modalIngredients');
  const modalProcess = document.getElementById('modalProcess');

  console.log('Modal elements found:', {
    modal: !!modal,
    modalImage: !!modalImage,
    modalTitle: !!modalTitle,
    modalIngredients: !!modalIngredients,
    modalProcess: !!modalProcess
  });

  if (!modal || !modalImage || !modalTitle || !modalIngredients || !modalProcess) {
    console.error('Modal elements not found');
    showToast('Error opening recipe details');
    return;
  }

  // Set modal content
  modalImage.src = recipe.img || recipe.image || `./public/images/${recipeKey}.jpeg`;
  modalImage.alt = recipe.title || recipe.name || recipeKey;
  modalTitle.textContent = recipe.title || recipe.name || recipeKey;

  console.log('Setting modal content:', {
    image: modalImage.src,
    title: modalTitle.textContent,
    recipeTitle: recipe.title,
    recipeName: recipe.name,
    recipeKey: recipeKey
  });

  // Debug: Check if title is actually set
  console.log('Title element after setting:', {
    textContent: modalTitle.textContent,
    innerHTML: modalTitle.innerHTML,
    style: modalTitle.style.display,
    computedStyle: window.getComputedStyle(modalTitle).display
  });

  // Populate ingredients
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    modalIngredients.innerHTML = recipe.ingredients.map(ingredient => 
      `<li>${ingredient}</li>`
    ).join('');
    console.log('Ingredients populated:', modalIngredients.innerHTML);
  } else {
    modalIngredients.innerHTML = '<li>Ingredients not available</li>';
    console.log('No ingredients available');
  }

  // Populate process - check multiple possible property names
  if (recipe.process_easy && Array.isArray(recipe.process_easy)) {
    modalProcess.innerHTML = recipe.process_easy.map((step, index) => 
      `<p>${index + 1}. ${step}</p>`
    ).join('');
    console.log('Process populated (easy):', modalProcess.innerHTML);
  } else if (recipe.process_jargon && Array.isArray(recipe.process_jargon)) {
    modalProcess.innerHTML = recipe.process_jargon.map((step, index) => 
      `<p>${index + 1}. ${step}</p>`
    ).join('');
    console.log('Process populated (jargon):', modalProcess.innerHTML);
  } else if (recipe.process && typeof recipe.process === 'string') {
    // Handle string process (split by steps)
    const steps = recipe.process.split(/\d+\.\s*/).filter(step => step.trim());
    modalProcess.innerHTML = steps.map((step, index) => 
      `<p>${index + 1}. ${step.trim()}</p>`
    ).join('');
    console.log('Process populated (string):', modalProcess.innerHTML);
  } else {
    modalProcess.innerHTML = '<p>Process not available</p>';
    console.log('No process available');
  }

  // Initialize flavor radar chart if recipe has flavor profile
  if (recipe.flavorProfile) {
    try {
      renderFlavorRadarChart(recipe.flavorProfile);
      console.log('Flavor radar chart rendered');
    } catch (error) {
      console.error('Error rendering flavor radar chart:', error);
    }
  } else {
    // Provide default flavor profile if none exists
    const defaultProfile = {
      bitterness: 3,
      sweetness: 2,
      acidity: 2,
      strength: 3,
      body: 3
    };
    try {
      renderFlavorRadarChart(defaultProfile);
      console.log('Default flavor radar chart rendered');
    } catch (error) {
      console.error('Error rendering default flavor radar chart:', error);
    }
  }

  // Initialize brew strength and caffeine estimate
  try {
    const brewStrength = document.getElementById('brewStrength');
    const brewStrengthValue = document.getElementById('brewStrengthValue');
    const caffeineEstimate = document.getElementById('caffeineEstimate');
    
    if (brewStrength && brewStrengthValue) {
      const strength = 3; // Default strength
      updateCaffeineEstimate(recipe, strength);
      console.log('Brew strength and caffeine estimate initialized');
    }
  } catch (error) {
    console.error('Error initializing brew strength:', error);
  }

  // Initialize nutrition calculation
  try {
    updateNutritionDisplay(recipe);
    console.log('Nutrition display updated');
  } catch (error) {
    console.error('Error updating nutrition display:', error);
  }

  // Initialize customization controls
  try {
    initializeCustomizationControls();
    console.log('Customization controls initialized');
  } catch (error) {
    console.error('Error initializing customization controls:', error);
  }

  // Show modal
  modal.style.display = 'flex';
  modal.style.visibility = 'visible';
  modal.style.opacity = '1';

  console.log('Modal displayed');

  // Prevent body scroll on mobile
  document.body.style.overflow = 'hidden';

  console.log('Modal opened successfully for:', recipeKey);
}

// Function to update nutrition display
function updateNutritionDisplay(recipe) {
  const caloriesElement = document.getElementById('calories');
  const carbsElement = document.getElementById('carbs');
  const proteinElement = document.getElementById('protein');
  
  if (caloriesElement && carbsElement && proteinElement) {
    // Default nutrition values (can be customized based on recipe)
    let totalCalories = recipe.calories || 5;
    let totalCarbs = recipe.carbs || 1;
    let totalProtein = recipe.protein || 1;
    
    // Get customization values
    const addMilk = document.getElementById('addMilk');
    const milkQty = document.getElementById('milkQty');
    const milkType = document.getElementById('milkType');
    
    const addSugar = document.getElementById('addSugar');
    const sugarQty = document.getElementById('sugarQty');
    
    const addIce = document.getElementById('addIce');
    const iceQty = document.getElementById('iceQty');
    
    const addFoam = document.getElementById('addFoam');
    const foamQty = document.getElementById('foamQty');
    
    const toppingType = document.getElementById('toppingType');
    const toppingQty = document.getElementById('toppingQty');
    
    // Calculate additional nutrition from customizations
    if (addMilk && addMilk.checked && milkQty && milkQty.value > 0) {
      const milkAmount = parseInt(milkQty.value);
      const selectedMilkType = milkType ? milkType.value : 'whole';
      
      // Nutrition values per 100ml for different milk types
      const milkNutrition = {
        'whole': { calories: 61, carbs: 4.8, protein: 3.2 },
        'skim': { calories: 42, carbs: 5.0, protein: 3.4 },
        'oat': { calories: 48, carbs: 7.0, protein: 1.0 },
        'almond': { calories: 17, carbs: 0.6, protein: 0.6 },
        'soy': { calories: 33, carbs: 1.8, protein: 3.3 },
        'coconut': { calories: 19, carbs: 0.6, protein: 0.5 }
      };
      
      const milkValues = milkNutrition[selectedMilkType] || milkNutrition['whole'];
      const milkRatio = milkAmount / 100;
      
      totalCalories += Math.round(milkValues.calories * milkRatio);
      totalCarbs += Math.round(milkValues.carbs * milkRatio * 10) / 10;
      totalProtein += Math.round(milkValues.protein * milkRatio * 10) / 10;
    }
    
    if (addSugar && addSugar.checked && sugarQty && sugarQty.value > 0) {
      const sugarAmount = parseInt(sugarQty.value);
      // Sugar: 4 calories per gram, 100% carbs
      totalCalories += sugarAmount * 4;
      totalCarbs += sugarAmount;
    }
    
    if (addIce && addIce.checked && iceQty && iceQty.value > 0) {
      // Ice doesn't add nutrition, but we can track it
      // For now, no nutrition addition
    }
    
    if (addFoam && addFoam.checked && foamQty && foamQty.value > 0) {
      const foamAmount = parseInt(foamQty.value);
      // Foam is mostly air, minimal nutrition
      // Small amount of milk protein
      totalProtein += Math.round(foamAmount * 0.01 * 10) / 10;
    }
    
    if (toppingType && toppingType.value && toppingQty && toppingQty.value > 0) {
      const toppingAmount = parseInt(toppingQty.value);
      const selectedTopping = toppingType.value;
      
      // Nutrition values for different toppings
      const toppingNutrition = {
        'whipped': { calories: 257, carbs: 2.2, protein: 2.1 },
        'chocolate': { calories: 545, carbs: 61, protein: 4.9 },
        'cinnamon': { calories: 247, carbs: 80, protein: 4.0 },
        'caramel': { calories: 382, carbs: 88, protein: 0.0 },
        'hazelnut': { calories: 628, carbs: 17, protein: 15.0 },
        'honey': { calories: 304, carbs: 82, protein: 0.3 },
        'maple': { calories: 260, carbs: 67, protein: 0.0 }
      };
      
      const toppingValues = toppingNutrition[selectedTopping];
      if (toppingValues) {
        const toppingRatio = toppingAmount / 100;
        totalCalories += Math.round(toppingValues.calories * toppingRatio);
        totalCarbs += Math.round(toppingValues.carbs * toppingRatio * 10) / 10;
        totalProtein += Math.round(toppingValues.protein * toppingRatio * 10) / 10;
      }
    }
    
    // Update the display
    caloriesElement.textContent = totalCalories;
    carbsElement.textContent = totalCarbs.toFixed(1);
    proteinElement.textContent = totalProtein.toFixed(1);
  }
}

// Function to initialize customization controls
function initializeCustomizationControls() {
  // Initialize milk type selector
  const milkType = document.getElementById('milkType');
  if (milkType) {
    milkType.value = 'whole';
  }

  // Initialize checkboxes and their associated input fields
  const addMilk = document.getElementById('addMilk');
  const milkQty = document.getElementById('milkQty');
  if (addMilk && milkQty) {
    addMilk.checked = false;
    milkQty.style.display = 'none';
    milkQty.value = '0';
  }

  const addSugar = document.getElementById('addSugar');
  const sugarQty = document.getElementById('sugarQty');
  if (addSugar && sugarQty) {
    addSugar.checked = false;
    sugarQty.style.display = 'none';
    sugarQty.value = '0';
  }

  const addIce = document.getElementById('addIce');
  const iceQty = document.getElementById('iceQty');
  if (addIce && iceQty) {
    addIce.checked = false;
    iceQty.style.display = 'none';
    iceQty.value = '0';
  }

  const addFoam = document.getElementById('addFoam');
  const foamQty = document.getElementById('foamQty');
  if (addFoam && foamQty) {
    addFoam.checked = false;
    foamQty.style.display = 'none';
    foamQty.value = '0';
  }

  // Initialize topping selector
  const toppingType = document.getElementById('toppingType');
  const toppingQty = document.getElementById('toppingQty');
  if (toppingType && toppingQty) {
    toppingType.value = '';
    toppingQty.style.display = 'none';
    toppingQty.value = '0';
  }

  // Add event listeners for checkboxes
  if (addMilk && milkQty) {
    addMilk.addEventListener('change', function() {
      milkQty.style.display = this.checked ? 'inline' : 'none';
      if (!this.checked) milkQty.value = '0';
      updateNutritionDisplay(window.currentRecipe);
    });
    milkQty.addEventListener('input', function() {
      updateNutritionDisplay(window.currentRecipe);
    });
  }

  if (addSugar && sugarQty) {
    addSugar.addEventListener('change', function() {
      sugarQty.style.display = this.checked ? 'inline' : 'none';
      if (!this.checked) sugarQty.value = '0';
      updateNutritionDisplay(window.currentRecipe);
    });
    sugarQty.addEventListener('input', function() {
      updateNutritionDisplay(window.currentRecipe);
    });
  }

  if (addIce && iceQty) {
    addIce.addEventListener('change', function() {
      iceQty.style.display = this.checked ? 'inline' : 'none';
      if (!this.checked) iceQty.value = '0';
      updateNutritionDisplay(window.currentRecipe);
    });
    iceQty.addEventListener('input', function() {
      updateNutritionDisplay(window.currentRecipe);
    });
  }

  if (addFoam && foamQty) {
    addFoam.addEventListener('change', function() {
      foamQty.style.display = this.checked ? 'inline' : 'none';
      if (!this.checked) foamQty.value = '0';
      updateNutritionDisplay(window.currentRecipe);
    });
    foamQty.addEventListener('input', function() {
      updateNutritionDisplay(window.currentRecipe);
    });
  }

  if (toppingType && toppingQty) {
    toppingType.addEventListener('change', function() {
      toppingQty.style.display = this.value ? 'inline' : 'none';
      if (!this.value) toppingQty.value = '0';
      updateNutritionDisplay(window.currentRecipe);
    });
    toppingQty.addEventListener('input', function() {
      updateNutritionDisplay(window.currentRecipe);
    });
  }

  if (milkType) {
    milkType.addEventListener('change', function() {
      updateNutritionDisplay(window.currentRecipe);
    });
  }

  // Initialize reset button
  const resetCustomize = document.getElementById('resetCustomize');
  if (resetCustomize) {
    resetCustomize.addEventListener('click', function() {
      if (addMilk) addMilk.checked = false;
      if (milkQty) { milkQty.style.display = 'none'; milkQty.value = '0'; }
      if (addSugar) addSugar.checked = false;
      if (sugarQty) { sugarQty.style.display = 'none'; sugarQty.value = '0'; }
      if (addIce) addIce.checked = false;
      if (iceQty) { iceQty.style.display = 'none'; iceQty.value = '0'; }
      if (addFoam) addFoam.checked = false;
      if (foamQty) { foamQty.style.display = 'none'; foamQty.value = '0'; }
      if (toppingType) toppingType.value = '';
      if (toppingQty) { toppingQty.style.display = 'none'; toppingQty.value = '0'; }
    });
  }
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
      document.body.classList.remove('light-mode');
      darkModeToggle.innerHTML = '<i class="bi bi-sun"></i>';
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.add('light-mode');
      darkModeToggle.innerHTML = '<i class="bi bi-moon"></i>';
      localStorage.setItem('darkMode', 'false');
    }
  }
  // Initialize dark mode with dark as default
  const saved = localStorage.getItem('darkMode');
  if (saved === null) {
    // Default to dark mode
    setDarkMode(true);
  } else {
    setDarkMode(saved === 'true');
  }
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
  try {
    const baseUrl = 'https://sai-naman-gangiredla.github.io/BrewIt';
    
    // Convert ingredients array to proper format with null check
    const recipeIngredients = recipe.ingredients && Array.isArray(recipe.ingredients) 
      ? recipe.ingredients.map(ingredient => {
          // Add quantities if not present
          if (!ingredient.includes('g') && !ingredient.includes('ml') && !ingredient.includes('cup')) {
            return `1 ${ingredient}`;
          }
          return ingredient;
        })
      : [];

    // Generate instructions array with proper null checks
    let instructions = [];
    if (recipe.process_easy && Array.isArray(recipe.process_easy)) {
      instructions = recipe.process_easy;
    } else if (recipe.process_jargon && Array.isArray(recipe.process_jargon)) {
      instructions = recipe.process_jargon;
    } else if (recipe.process) {
      instructions = [recipe.process];
    } else {
      instructions = ['Follow the recipe instructions carefully.'];
    }
    
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

    // Add null checks for nutrition data
    const nutrition = recipe.baseNutrition ? {
      "@type": "NutritionInformation",
      "calories": `${recipe.baseNutrition.calories || 0} calories`,
      "carbohydrateContent": `${recipe.baseNutrition.carbs || 0}g`,
      "proteinContent": `${recipe.baseNutrition.protein || 0}g`
    } : {
      "@type": "NutritionInformation",
      "calories": "0 calories",
      "carbohydrateContent": "0g",
      "proteinContent": "0g"
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
      "nutrition": nutrition,
      "suitableForDiet": "VegetarianDiet",
      "recipeCuisine": "Coffee",
      "keywords": `${recipe.title}, coffee, recipe, ${recipe.type || 'hot'}`,
      "datePublished": "2024-01-01",
      "dateModified": "2024-12-01"
    };
  } catch (error) {
    console.error('Error generating structured data for recipe:', recipeId, error);
    return null;
  }
}

// Function to add structured data to the page
function addRecipeStructuredData() {
  try {
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
      if (!recipe) {
        console.warn('Recipe not found for ID:', recipeId);
        return;
      }
      
      const structuredData = generateRecipeStructuredData(recipe, recipeId);
      if (structuredData) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData);
        document.head.appendChild(script);
      }
    });
  } catch (error) {
    console.error('Error adding structured data:', error);
  }
}