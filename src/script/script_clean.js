// Global variables
let recipes = {};
let favorites = {};
let cardContainer;

// Loading functions
function showLoading() {
  const loadingSpinner = document.getElementById('loadingSpinner');
  if (loadingSpinner) {
    loadingSpinner.style.display = 'block';
  }
}

function hideLoading() {
  const loadingSpinner = document.getElementById('loadingSpinner');
  if (loadingSpinner) {
    loadingSpinner.style.display = 'none';
  }
}

// Recipe loading
function loadRecipes() {
  cardContainer = document.getElementById("cardContainer");
  if (!cardContainer) {
    console.error('Card container not found');
    return;
  }
  
  showLoading();

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
      return;
    }

    try {
      const response = await fetchStrategies[strategyIndex]();
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
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
      window.selectedCategory = 'all';
      hideLoading();
      renderCards();
      initUI();
      addRecipeStructuredData();
      
    } catch (error) {
      console.error(`Fetch strategy ${strategyIndex + 1} failed:`, error);
      setTimeout(() => tryFetch(strategyIndex + 1), 100);
    }
  }

  tryFetch(0);
}

// Favorites management
function getFavorites() {
  const stored = localStorage.getItem('favorites');
  return stored ? JSON.parse(stored) : {};
}

function setFavorites(favs) {
  localStorage.setItem('favorites', JSON.stringify(favs));
}

function updateFavoriteUI() {
  const heartBtns = document.querySelectorAll('.bi-heart');
  heartBtns.forEach(btn => {
    const card = btn.closest('.recipe-card');
    if (card) {
      const title = card.querySelector('.card-title').textContent;
      if (favorites[title]) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
}

// Filtering and search
function filterRecipes(category) {
  window.selectedCategory = category;
  applyCombinedFilter();
}

function searchRecipes() {
  applyCombinedFilter();
}

function applyCombinedFilter() {
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const selectedCategory = window.selectedCategory || 'all';
  const cards = document.querySelectorAll('.recipe-card');
  
  cards.forEach(card => {
    const title = card.querySelector('.card-title').textContent.toLowerCase();
    const type = card.getAttribute('data-type') || '';
    const isFavorite = favorites[title];
    
    let showCard = true;
    
    // Category filter
    if (selectedCategory === 'favorites') {
      showCard = isFavorite;
    } else if (selectedCategory !== 'all') {
      showCard = type === selectedCategory;
    }
    
    // Search filter
    if (showCard && searchTerm) {
      showCard = title.includes(searchTerm);
    }
    
    card.style.display = showCard ? 'block' : 'none';
  });
}

function getSortedRecipeKeys() {
  const keys = Object.keys(recipes);
  return keys.sort((a, b) => {
    const recipeA = recipes[a];
    const recipeB = recipes[b];
    
    // Sort by type first, then by title
    if (recipeA.type !== recipeB.type) {
      return recipeA.type.localeCompare(recipeB.type);
    }
    
    return recipeA.title.localeCompare(recipeB.title);
  });
}

// Card rendering
function renderCards() {
  if (!cardContainer) {
    console.error('cardContainer is not initialized');
    return;
  }
  
  cardContainer.innerHTML = '';
  const sortedKeys = getSortedRecipeKeys();
  
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
        favorites = getFavorites();
        if (favorites[title]) {
          delete favorites[title];
        } else {
          favorites[title] = true;
        }
        setFavorites(favorites);
        favorites = getFavorites();
        updateFavoriteUI();
        showToast(favorites[title] ? `Added to favorites!` : `Removed from favorites!`);
        applyCombinedFilter();
      });
    }
    
    card.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openModal(key);
    });
    
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModal(key);
      }
    });
    
    cardContainer.appendChild(card);
  });
}

// Modal functions
function openModal(recipeKey) {
  if (!recipeKey || !recipes[recipeKey]) {
    showToast('Recipe not found. Please try again.');
    return;
  }
  
  try {
    const recipe = recipes[recipeKey];
    const modal = document.getElementById("recipeModal");
    if (!modal) {
      showToast('Modal not found. Please refresh the page.');
      return;
    }
    
    // Show modal
    modal.style.cssText = `
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      z-index: 10000 !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: rgba(0, 0, 0, 0.8) !important;
    `;
    
    // Show modal content
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.style.cssText = `
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        background: #2d2217 !important;
        color: #f2ddc9 !important;
        z-index: 10001 !important;
        position: relative !important;
        width: 90% !important;
        max-width: 800px !important;
        margin: 20px auto !important;
        border-radius: 12px !important;
        overflow: hidden !important;
      `;
    }
    
    // Show modal right content
    const modalRight = modal.querySelector('.modal-right');
    if (modalRight) {
      modalRight.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        color: #f2ddc9 !important;
        background: #2d2217 !important;
        padding: 20px !important;
        overflow-y: auto !important;
        max-height: 80vh !important;
        z-index: 10002 !important;
        position: relative !important;
        flex: 1 !important;
      `;
    }
    
    // Prevent body scroll on mobile
    if (window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }
    
    // Set modal content
    const modalTitle = document.getElementById("modalTitle");
    const modalImage = document.getElementById("modalImage");
    if (modalTitle) {
      modalTitle.textContent = recipe.title;
      modalTitle.style.cssText = `
        color: #f2ddc9 !important;
        visibility: visible !important;
        opacity: 1 !important;
        display: block !important;
        font-size: 1.5em !important;
        font-weight: bold !important;
        margin-bottom: 15px !important;
      `;
    }
    if (modalImage) {
      modalImage.src = recipe.img;
      modalImage.style.cssText = `
        visibility: visible !important;
        opacity: 1 !important;
        display: block !important;
        width: 100% !important;
        height: auto !important;
        max-height: 300px !important;
        object-fit: cover !important;
      `;
    }

    // Set ingredients
    const ingredientsList = document.getElementById("modalIngredients");
    if (ingredientsList) {
      ingredientsList.innerHTML = "";
      ingredientsList.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        color: #f2ddc9 !important;
        margin: 10px 0 !important;
        list-style-type: disc !important;
        padding-left: 20px !important;
      `;
      
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ing => {
          const li = document.createElement("li");
          li.textContent = ing;
          li.style.cssText = `
            color: #f2ddc9 !important;
            visibility: visible !important;
            opacity: 1 !important;
            display: list-item !important;
            margin: 5px 0 !important;
            list-style-type: disc !important;
          `;
          ingredientsList.appendChild(li);
        });
      }
    }

    // Set process
    const processElem = document.getElementById("modalProcess");
    const easyBtn = document.getElementById("jargonEasyBtn");
    const jargonBtn = document.getElementById("jargonJargonBtn");
    
    function renderProcess(showJargon) {
      if (!processElem) return;
      
      processElem.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        color: #f2ddc9 !important;
        margin: 10px 0 !important;
      `;
      
      if (showJargon && recipe.process_jargon) {
        const processSteps = Array.isArray(recipe.process_jargon) ? recipe.process_jargon : [recipe.process_jargon];
        processElem.innerHTML = '<ol style="margin: 10px 0; padding-left: 20px;">' + 
          processSteps.map(step => `<li style="color: #f2ddc9; visibility: visible; opacity: 1; display: list-item; margin: 5px 0;">${step}</li>`).join('') + 
          '</ol>';
      } else if (recipe.process_easy) {
        const processSteps = Array.isArray(recipe.process_easy) ? recipe.process_easy : [recipe.process_easy];
        processElem.innerHTML = '<ol style="margin: 10px 0; padding-left: 20px;">' + 
          processSteps.map(step => `<li style="color: #f2ddc9; visibility: visible; opacity: 1; display: list-item; margin: 5px 0;">${step}</li>`).join('') + 
          '</ol>';
      } else {
        processElem.innerHTML = '<p style="color: #f2ddc9; visibility: visible; opacity: 1;">Process not available</p>';
      }
    }
    
    // Set up toggle buttons
    if (easyBtn && jargonBtn) {
      easyBtn.addEventListener('click', () => {
        easyBtn.classList.add('seg-btn-active');
        jargonBtn.classList.remove('seg-btn-active');
        easyBtn.setAttribute('aria-pressed', 'true');
        jargonBtn.setAttribute('aria-pressed', 'false');
        renderProcess(false);
      });
      
      jargonBtn.addEventListener('click', () => {
        jargonBtn.classList.add('seg-btn-active');
        easyBtn.classList.remove('seg-btn-active');
        jargonBtn.setAttribute('aria-pressed', 'true');
        easyBtn.setAttribute('aria-pressed', 'false');
        renderProcess(true);
      });
      
      // Start with easy process
      renderProcess(false);
    }
    
    // Set up customization
    const milkType = document.getElementById('milkType');
    const addMilk = document.getElementById('addMilk');
    const milkQty = document.getElementById('milkQty');
    const addSugar = document.getElementById('addSugar');
    const sugarQty = document.getElementById('sugarQty');
    const addIce = document.getElementById('addIce');
    const iceQty = document.getElementById('iceQty');
    const addFoam = document.getElementById('addFoam');
    const foamQty = document.getElementById('foamQty');
    const toppingType = document.getElementById('toppingType');
    const toppingQty = document.getElementById('toppingQty');
    const customToppingFields = document.getElementById('customToppingFields');
    const resetCustomize = document.getElementById('resetCustomize');
    
    function toggleInput(checkbox, input) {
      if (checkbox.checked) {
        input.style.display = 'inline-block';
      } else {
        input.style.display = 'none';
        input.value = '0';
      }
      updateNutritionCustom();
    }
    
    function updateNutritionCustom() {
      let totalCalories = 0;
      let totalCarbs = 0;
      let totalProtein = 0;
      
      // Base recipe nutrition
      if (recipe.nutrition) {
        totalCalories += recipe.nutrition.calories || 0;
        totalCarbs += recipe.nutrition.carbs || 0;
        totalProtein += recipe.nutrition.protein || 0;
      }
      
      // Add customization nutrition
      if (addMilk && addMilk.checked && milkQty) {
        const milkQtyValue = parseInt(milkQty.value) || 0;
        const milkTypeValue = milkType ? milkType.value : 'whole';
        
        const milkNutrition = {
          whole: { calories: 61, carbs: 4.8, protein: 3.2 },
          skim: { calories: 42, carbs: 5.0, protein: 3.4 },
          oat: { calories: 43, carbs: 7.0, protein: 1.0 },
          almond: { calories: 17, carbs: 0.6, protein: 0.6 },
          soy: { calories: 33, carbs: 1.8, protein: 3.3 },
          coconut: { calories: 45, carbs: 2.0, protein: 0.5 }
        };
        
        const nutrition = milkNutrition[milkTypeValue] || milkNutrition.whole;
        totalCalories += (nutrition.calories * milkQtyValue) / 100;
        totalCarbs += (nutrition.carbs * milkQtyValue) / 100;
        totalProtein += (nutrition.protein * milkQtyValue) / 100;
      }
      
      if (addSugar && addSugar.checked && sugarQty) {
        const sugarQtyValue = parseInt(sugarQty.value) || 0;
        totalCalories += sugarQtyValue * 4;
        totalCarbs += sugarQtyValue;
      }
      
      if (addFoam && addFoam.checked && foamQty) {
        const foamQtyValue = parseInt(foamQty.value) || 0;
        totalCalories += (foamQtyValue * 61) / 100;
        totalCarbs += (foamQtyValue * 4.8) / 100;
        totalProtein += (foamQtyValue * 3.2) / 100;
      }
      
      if (toppingType && toppingType.value && toppingQty) {
        const toppingQtyValue = parseInt(toppingQty.value) || 0;
        
        const toppingNutrition = {
          whipped: { calories: 257, carbs: 2.2, protein: 2.1 },
          chocolate: { calories: 546, carbs: 61.4, protein: 4.9 },
          cinnamon: { calories: 6, carbs: 2.1, protein: 0.1 },
          caramel: { calories: 382, carbs: 77.8, protein: 0.1 },
          hazelnut: { calories: 290, carbs: 70.0, protein: 0.0 },
          honey: { calories: 304, carbs: 82.4, protein: 0.3 },
          maple: { calories: 260, carbs: 67.0, protein: 0.0 }
        };
        
        const nutrition = toppingNutrition[toppingType.value];
        if (nutrition) {
          totalCalories += (nutrition.calories * toppingQtyValue) / 100;
          totalCarbs += (nutrition.carbs * toppingQtyValue) / 100;
          totalProtein += (nutrition.protein * toppingQtyValue) / 100;
        }
      }
      
      // Update nutrition display
      const caloriesSpan = document.getElementById('calories');
      const carbsSpan = document.getElementById('carbs');
      const proteinSpan = document.getElementById('protein');
      
      if (caloriesSpan) caloriesSpan.textContent = Math.round(totalCalories);
      if (carbsSpan) carbsSpan.textContent = Math.round(totalCarbs);
      if (proteinSpan) proteinSpan.textContent = Math.round(totalProtein);
    }
    
    // Set up event listeners
    if (addMilk && milkQty) {
      addMilk.addEventListener('change', () => toggleInput(addMilk, milkQty));
    }
    if (addSugar && sugarQty) {
      addSugar.addEventListener('change', () => toggleInput(addSugar, sugarQty));
    }
    if (addIce && iceQty) {
      addIce.addEventListener('change', () => toggleInput(addIce, iceQty));
    }
    if (addFoam && foamQty) {
      addFoam.addEventListener('change', () => toggleInput(addFoam, foamQty));
    }
    if (toppingType && toppingQty) {
      toppingType.addEventListener('change', () => {
        if (toppingType.value === 'custom') {
          customToppingFields.style.display = 'block';
          toppingQty.style.display = 'inline-block';
        } else if (toppingType.value) {
          customToppingFields.style.display = 'none';
          toppingQty.style.display = 'inline-block';
        } else {
          customToppingFields.style.display = 'none';
          toppingQty.style.display = 'none';
          toppingQty.value = '0';
        }
        updateNutritionCustom();
      });
    }
    if (resetCustomize) {
      resetCustomize.addEventListener('click', () => {
        if (addMilk) addMilk.checked = false;
        if (milkQty) milkQty.value = '0';
        if (addSugar) addSugar.checked = false;
        if (sugarQty) sugarQty.value = '0';
        if (addIce) addIce.checked = false;
        if (iceQty) iceQty.value = '0';
        if (addFoam) addFoam.checked = false;
        if (foamQty) foamQty.value = '0';
        if (toppingType) toppingType.value = '';
        if (toppingQty) toppingQty.value = '0';
        if (customToppingFields) customToppingFields.style.display = 'none';
        updateNutritionCustom();
      });
    }
    
    // Initialize nutrition
    updateNutritionCustom();
    
    // Set up caffeine estimation
    const brewStrength = document.getElementById('brewStrength');
    const brewStrengthValue = document.getElementById('brewStrengthValue');
    const caffeineEstimate = document.getElementById('caffeineEstimate');
    
    function updateCaffeine() {
      const strength = parseInt(brewStrength.value) || 3;
      if (brewStrengthValue) brewStrengthValue.textContent = strength;
      
      const caffeine = updateCaffeineEstimate(recipe, strength);
      if (caffeineEstimate) {
        caffeineEstimate.innerHTML = `Estimated caffeine: <strong>${caffeine}mg</strong>`;
      }
    }
    
    if (brewStrength) {
      brewStrength.addEventListener('input', updateCaffeine);
      updateCaffeine();
    }
    
    // Set up flavor radar chart
    if (recipe.flavor_profile) {
      renderFlavorRadarChart(recipe.flavor_profile);
    }
    
  } catch (error) {
    console.error('Error opening modal:', error);
    showToast('Error opening recipe. Please try again.');
  }
}

function closeModal() {
  const modal = document.getElementById("recipeModal");
  if (!modal) return;
  
  // Reset body scroll on mobile
  if (window.innerWidth <= 768) {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }
  
  // Hide modal
  modal.style.cssText = `
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    z-index: 1000 !important;
  `;
  
  // Reset modal content
  const modalContent = modal.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.cssText = '';
  }
  
  const modalRight = modal.querySelector('.modal-right');
  if (modalRight) {
    modalRight.style.cssText = '';
  }
  
  // Reset all text elements
  const textElements = modal.querySelectorAll('h2, h4, p, li, span, div');
  textElements.forEach(element => {
    element.style.cssText = '';
  });
}

// Utility functions
function renderFlavorRadarChart(profile) {
  const canvas = document.getElementById('flavorRadarChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Bitter', 'Sweet', 'Sour', 'Salty', 'Umami'],
      datasets: [{
        label: 'Flavor Profile',
        data: [
          profile.bitter || 0,
          profile.sweet || 0,
          profile.sour || 0,
          profile.salty || 0,
          profile.umami || 0
        ],
        backgroundColor: 'rgba(255, 230, 179, 0.2)',
        borderColor: '#ffe6b3',
        borderWidth: 2,
        pointBackgroundColor: '#ffe6b3',
        pointBorderColor: '#d2691e',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          max: 10,
          ticks: {
            stepSize: 2
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

function updateCaffeineEstimate(recipe, strength) {
  const baseCaffeine = {
    espresso: 63,
    americano: 63,
    cappuccino: 63,
    latte: 63,
    mocha: 63,
    macchiato: 63,
    flat_white: 63,
    cold_brew: 200,
    filter_coffee: 95
  };
  
  const recipeType = recipe.type || 'espresso';
  const baseAmount = baseCaffeine[recipeType] || 63;
  
  // Adjust based on strength (1-5 scale)
  const strengthMultiplier = strength / 3;
  
  return Math.round(baseAmount * strengthMultiplier);
}

function showDailyFact() {
  const facts = [
    "Coffee was originally chewed, not sipped!",
    "Espresso has less caffeine per serving than drip coffee!",
    "Coffee beans are actually seeds!",
    "The world's most expensive coffee comes from animal poop!",
    "Coffee can help you live longer!"
  ];
  
  const randomFact = facts[Math.floor(Math.random() * facts.length)];
  const factBanner = document.getElementById('dailyFactBanner');
  if (factBanner) {
    factBanner.textContent = randomFact;
  }
}

// UI functions
function showSection(sectionId) {
  const sections = ['cardContainer', 'remixSection', 'quizSection'];
  sections.forEach(id => {
    const section = document.getElementById(id);
    if (section) {
      if (id === sectionId) {
        section.style.display = 'grid';
        section.classList.remove('section-hidden');
      } else {
        section.style.display = 'none';
        section.classList.add('section-hidden');
      }
    }
  });
  
  // Update navigation
  setActiveNav(sectionId === 'cardContainer' ? 'homeNavBtn' : 
               sectionId === 'remixSection' ? 'remixNavBtn' : 'quizNavBtn');
  
  // Show toast notification
  const sectionNames = {
    'cardContainer': 'Coffee Recipes',
    'remixSection': 'Coffee Remix',
    'quizSection': 'Find Your Brew'
  };
  
  const toast = document.getElementById('sectionToast');
  if (toast && sectionNames[sectionId]) {
    toast.textContent = `Switched to ${sectionNames[sectionId]}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }
}

function setActiveNav(btnId) {
  const navButtons = ['homeNavBtn', 'remixNavBtn', 'quizNavBtn'];
  navButtons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      if (id === btnId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
}

function clearSearchAndApplyFilter() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = '';
  }
  applyCombinedFilter();
}

// Initialize UI
function initUI() {
  // Initialize favorites
  favorites = getFavorites();
  updateFavoriteUI();
  
  // Set up event listeners
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterRecipes(btn.getAttribute('data-category'));
    });
  });
  
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', searchRecipes);
  }
  
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', applyCombinedFilter);
  }
  
  // Navigation buttons
  const homeNavBtn = document.getElementById('homeNavBtn');
  const remixNavBtn = document.getElementById('remixNavBtn');
  const quizNavBtn = document.getElementById('quizNavBtn');
  
  if (homeNavBtn) {
    homeNavBtn.addEventListener('click', () => showSection('cardContainer'));
  }
  if (remixNavBtn) {
    remixNavBtn.addEventListener('click', () => showSection('remixSection'));
  }
  if (quizNavBtn) {
    quizNavBtn.addEventListener('click', () => showSection('quizSection'));
  }
  
  // Dark mode toggle
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
    darkModeToggle.checked = savedMode;
    
    darkModeToggle.addEventListener('change', (e) => {
      setDarkMode(e.target.checked);
    });
  }
  
  // Show daily fact
  showDailyFact();
}

function setDarkMode(enabled) {
  const body = document.body;
  if (enabled) {
    body.classList.add('light-mode');
  } else {
    body.classList.remove('light-mode');
  }
  localStorage.setItem('darkMode', enabled);
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.bottom = '40px';
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.bottom = '20px';
    }, 3000);
  }
}

// SEO and structured data
function generateRecipeStructuredData(recipe, recipeId) {
  const getCookTime = (recipeType) => {
    const cookTimes = {
      espresso: 'PT2M',
      americano: 'PT3M',
      cappuccino: 'PT4M',
      latte: 'PT5M',
      mocha: 'PT6M',
      macchiato: 'PT3M',
      flat_white: 'PT4M',
      cold_brew: 'PT720M',
      filter_coffee: 'PT5M'
    };
    return cookTimes[recipeType] || 'PT5M';
  };
  
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": recipe.title,
    "description": recipe.description || `${recipe.title} recipe with detailed instructions`,
    "image": recipe.img,
    "author": {
      "@type": "Organization",
      "name": "BrewIt"
    },
    "datePublished": "2025-01-01",
    "prepTime": "PT2M",
    "cookTime": getCookTime(recipe.type),
    "totalTime": getCookTime(recipe.type),
    "recipeCategory": "Coffee",
    "recipeCuisine": "International",
    "recipeYield": "1 serving",
    "nutrition": {
      "@type": "NutritionInformation",
      "calories": `${recipe.nutrition?.calories || 0} kcal`,
      "carbohydrateContent": `${recipe.nutrition?.carbs || 0} g`,
      "proteinContent": `${recipe.nutrition?.protein || 0} g`
    },
    "recipeIngredient": recipe.ingredients || [],
    "recipeInstructions": Array.isArray(recipe.process_easy) ? 
      recipe.process_easy.map(step => ({ "@type": "HowToStep", "text": step })) :
      [{ "@type": "HowToStep", "text": recipe.process_easy || "Follow the recipe instructions" }]
  };
}

function addRecipeStructuredData() {
  const sortedKeys = getSortedRecipeKeys();
  sortedKeys.forEach((key, index) => {
    const recipe = recipes[key];
    if (recipe) {
      const structuredData = generateRecipeStructuredData(recipe, `recipe-${index}`);
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Ensure modal starts closed
  const modal = document.getElementById("recipeModal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.add("hidden");
  }
  
  // Clear URL parameters that might trigger modal
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('recipe') || urlParams.has('modal') || urlParams.has('open')) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  
  // Load recipes
  loadRecipes();
}); 