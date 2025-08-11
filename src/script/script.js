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

// Performance optimization: Preload critical images
function preloadCriticalImages() {
  const criticalImages = [
    './public/images/beansbg.jpg',
    './public/images/bg.jpg',
    './public/images/coffeebeans.jpg'
  ];
  
  criticalImages.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}

// Enhanced image loading with fallbacks
function loadImageWithFallback(imgElement, src, fallbacks = []) {
  if (!imgElement) return;
  
  const tryLoad = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject();
      img.src = url;
    });
  };
  
  // Try main source first
  tryLoad(src)
    .then(url => {
      imgElement.src = url;
      imgElement.style.display = 'block';
    })
    .catch(() => {
      // Try fallbacks
      const fallbackPromises = fallbacks.map(fallback => tryLoad(fallback));
      Promise.any(fallbackPromises)
        .then(url => {
          imgElement.src = url;
          imgElement.style.display = 'block';
        })
        .catch(() => {
          // Hide image if all fail
          imgElement.style.display = 'none';
          console.warn('Failed to load image:', src);
        });
    });
}

// Enhanced recipe loading with better error handling
async function loadRecipes() {
  console.log('Loading recipes...');
  showLoading();
  
  const urls = [
    './src/data/recipes.json',
    'src/data/recipes.json',
    '/BrewIt/src/data/recipes.json',
    'https://sai-naman-gangiredla.github.io/BrewIt/src/data/recipes.json'
  ];
  
  for (const url of urls) {
    try {
      console.log('Trying to load recipes from:', url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data && typeof data === 'object' && Object.keys(data).length > 0) {
        window.recipes = data;
        recipes = data; // Ensure global variable is set
        console.log('Recipes loaded successfully from:', url);
        console.log('Number of recipes:', Object.keys(data).length);
        hideLoading();
        
        // Initialize UI after successful load with direct rendering
        setTimeout(() => {
          // Ensure cardContainer is available
          if (!cardContainer) {
            cardContainer = document.getElementById('cardContainer');
          }
          
          // Force render all recipes initially
          if (cardContainer && recipes) {
            renderFilteredCards(Object.keys(recipes));
            updateFavoriteUI();
            console.log('Recipes rendered successfully');
          } else {
            console.error('cardContainer or recipes not available for rendering');
          }
        }, 100);
        
        return data;
      } else {
        throw new Error('Invalid data format or empty data');
      }
    } catch (error) {
      console.warn('Failed to load from:', url, error.message);
      continue;
    }
  }
  
  // If all URLs fail, show error
  console.error('Failed to load recipes from all sources');
  hideLoading();
  showMobileError();
  return null;
}

// Wait for DOM to be ready before loading recipes
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, starting initialization...');
  
  // Initialize cardContainer first
  cardContainer = document.getElementById('cardContainer');
  if (!cardContainer) {
    console.error('cardContainer element not found!');
    return;
  }
  
  initUI(); // Initialize UI and navigation buttons
  loadRecipes(); // Load recipes after UI is initialized
});

// Initialize UI elements and event handlers
function initUI() {
  console.log('Initializing UI...');
  
  // Initialize filter buttons
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      // Remove active class from all buttons
      filterButtons.forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
      });
      
      // Add active class to clicked button
      this.classList.add('active');
      this.setAttribute('aria-current', 'page');
      
      // Apply filter
      const category = this.getAttribute('data-category');
      filterRecipes(category);
    });
  });
  
  // Initialize search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      applyCombinedFilter();
    });
  }
  
  // Initialize sort select
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      applyCombinedFilter();
    });
  }
  
  // Initialize dark mode toggle
  const darkModeToggle = document.getElementById('darkModeToggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
  }
  
  // Initialize navigation buttons
  const remixNavBtn = document.getElementById('remixNavBtn');
  const quizNavBtn = document.getElementById('quizNavBtn');
  
  if (remixNavBtn) {
    remixNavBtn.addEventListener('click', () => {
      // Filter to show remix-style recipes
      filterRecipes('remix');
      showToast('Showing remix-style recipes!');
    });
  }
  
  if (quizNavBtn) {
    quizNavBtn.addEventListener('click', () => {
      // Show quiz modal or functionality
      showQuizModal();
    });
  }
  
  // Initialize modal close functionality
  const modal = document.getElementById('recipeModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('show')) {
        closeModal();
      }
    });
  }
  
  // Initialize back to top button
  const backToTopBtn = document.getElementById('backToTopBtn');
  const bottomScrollBtn = document.getElementById('bottomScrollToTopBtn');
  
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  
  if (bottomScrollBtn) {
    bottomScrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  
  // Show/hide back to top button on scroll
  window.addEventListener('scroll', function() {
    if (backToTopBtn) {
      if (window.pageYOffset > 300) {
        backToTopBtn.style.display = 'block';
      } else {
        backToTopBtn.style.display = 'none';
      }
    }
  });
  
  console.log('UI initialization complete');
}

// Filter recipes by category
function filterRecipes(category) {
  console.log('Filtering by category:', category);
  applyCombinedFilter();
}

// Apply combined filter (category + search + sort)
function applyCombinedFilter() {
  console.log('applyCombinedFilter called, recipes available:', !!recipes, recipes ? Object.keys(recipes).length : 0);
  
  if (!recipes || Object.keys(recipes).length === 0) {
    console.log('No recipes loaded yet, showing no results');
    const noResults = document.getElementById('noResults');
    if (noResults) {
      noResults.style.display = 'block';
    }
    return;
  }
  
  // Get filter, search, and sort values
  const activeFilter = document.querySelector('.filter-btn.active');
  const category = activeFilter ? activeFilter.getAttribute('data-category') : 'all';
  const searchQuery = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase() : '';
  const sortSelect = document.getElementById('sortSelect');
  const sortBy = sortSelect ? sortSelect.value : 'default';
  
  console.log('Filtering with:', { category, searchQuery, sortBy });
  
  // Filter by category
  let filteredRecipes = [];
  if (category === 'all') {
    filteredRecipes = Object.entries(recipes);
  } else if (category === 'favourites') {
    const favorites = getFavorites();
    filteredRecipes = Object.entries(recipes).filter(([key]) => favorites.includes(key));
  } else {
    filteredRecipes = Object.entries(recipes).filter(([_, recipe]) => {
      return recipe.type && recipe.type.toLowerCase() === category.toLowerCase();
    });
  }
  
  // Filter by search query
  if (searchQuery) {
    filteredRecipes = filteredRecipes.filter(([_, recipe]) => {
      const titleMatch = recipe.title && recipe.title.toLowerCase().includes(searchQuery);
      const ingredientMatch = recipe.ingredients && 
        recipe.ingredients.some(ing => ing.toLowerCase().includes(searchQuery));
      return titleMatch || ingredientMatch;
    });
  }
  
  // Sort recipes if sort is specified
  if (sortBy !== 'default') {
    filteredRecipes.sort((a, b) => {
      const recipeA = a[1];
      const recipeB = b[1];
      
      // Handle different sort criteria
      switch (sortBy) {
        case 'name':
          // Sort by recipe title (A-Z)
          return (recipeA.title || '').localeCompare(recipeB.title || '');
          
        case 'calories':
          // Sort by calories (low to high)
          const caloriesA = parseInt(recipeA.nutrition?.calories) || 0;
          const caloriesB = parseInt(recipeB.nutrition?.calories) || 0;
          return caloriesA - caloriesB;
          
        case 'type':
          // Sort by type (hot/iced)
          const typeA = recipeA.type || '';
          const typeB = recipeB.type || '';
          return typeA.localeCompare(typeB);
          
        default:
          return 0;
      }
    });
    console.log('Sorted recipes by:', sortBy);
  }
  
  console.log('Final filtered recipes count:', filteredRecipes.length);
  
  // Convert back to object for rendering
  const filteredRecipesObj = Object.fromEntries(filteredRecipes);
  
  // Render the filtered and sorted recipes
  if (filteredRecipes.length > 0) {
    renderFilteredCards(filteredRecipesObj);
  } else {
    // Clear the container if no results
    const cardContainer = document.getElementById('cardContainer');
    if (cardContainer) cardContainer.innerHTML = '';
  }
  
  // Show/hide no results message
  const noResults = document.getElementById('noResults');
  if (noResults) {
    noResults.style.display = filteredRecipes.length === 0 ? 'block' : 'none';
  }
  
  // Return the filtered and sorted recipes for potential further processing
  return filteredRecipesObj;
}

// Render filtered recipe cards
function renderFilteredCards(filteredRecipes) {
  console.log('Rendering filtered cards, count:', Object.keys(filteredRecipes).length);
  const cardContainer = document.getElementById('cardContainer');
  if (!cardContainer) {
    console.error('Card container not found');
    return;
  }
  
  // Clear existing cards
  cardContainer.innerHTML = '';
  
  // Get favorites for heart icon state
  const favorites = getFavorites();
  
  // Create and append recipe cards
  Object.entries(filteredRecipes).forEach(([recipeKey, recipe]) => {
    if (recipe) {
      const isFavorite = favorites.includes(recipeKey);
      const card = createRecipeCard(recipe, recipeKey, isFavorite);
      if (card) {
        // Set card attributes
        card.setAttribute('data-type', recipe.type || 'other');
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `View ${recipe.title} recipe`);
        
        // Add click handler to open modal
        card.addEventListener('click', (e) => {
          // Don't open modal if clicking on favorite button
          if (!e.target.closest('.favorite-btn')) {
            openRecipeModal(recipeKey);
          }
        });
        
        // Add keyboard support
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openRecipeModal(recipeKey);
          }
        });
        
        cardContainer.appendChild(card);
      } else {
        console.error('Failed to create card for recipe:', recipeKey);
      }
    }
  });
}

// =====================
// Favorites Management
// =====================

// Initialize favorites array
let favorites = [];

// Load favorites from localStorage with validation
function loadFavorites() {
  try {
    const saved = localStorage.getItem('brewItFavorites');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Only keep favorites that exist in recipes
      favorites = Array.isArray(parsed) 
        ? parsed.filter(key => key in recipes)
        : [];
    } else {
      favorites = [];
    }
  } catch (e) {
    console.error('Error loading favorites:', e);
    favorites = [];
  }
  return [...favorites]; // Return a copy
}

// Save favorites to localStorage and update UI
function saveFavorites(newFavorites) {
  try {
    // Ensure we're only storing valid recipe keys
    const validFavorites = Array.isArray(newFavorites) 
      ? [...new Set(newFavorites.filter(key => key in recipes))] // Remove duplicates
      : [];
    
    favorites = validFavorites;
    localStorage.setItem('brewItFavorites', JSON.stringify(favorites));
    updateFavoriteUI();
    return true;
  } catch (e) {
    console.error('Error saving favorites:', e);
    return false;
  }
}

// Toggle favorite status for a recipe
function toggleFavorite(recipeKey, event) {
  if (event) {
    event.stopPropagation(); // Prevent card click event
  }
  
  if (!recipeKey || !(recipeKey in recipes)) {
    console.error('Invalid recipe key:', recipeKey);
    return false;
  }
  
  const currentFavorites = loadFavorites();
  const isFavorited = currentFavorites.includes(recipeKey);
  let updatedFavorites;
  
  if (isFavorited) {
    updatedFavorites = currentFavorites.filter(key => key !== recipeKey);
  } else {
    updatedFavorites = [...currentFavorites, recipeKey];
  }
  
  const success = saveFavorites(updatedFavorites);
  if (success) {
    // Update all favorite buttons for this recipe
    updateFavoriteUI();
    
    // Show feedback with appropriate message and emoji
    showToast(
      updatedFavorites.includes(recipeKey) 
        ? 'Added to favorites ❤️' 
        : 'Removed from favorites',
      'success'
    );
    
    // If modal is open for this recipe, update its favorite button
    const modal = document.getElementById('recipeModal');
    if (modal && modal.style.display === 'flex' && window.currentRecipeKey === recipeKey) {
      const favBtn = modal.querySelector('.favorite-btn');
      if (favBtn) {
        const isNowFavorited = updatedFavorites.includes(recipeKey);
        favBtn.innerHTML = isNowFavorited ? '❤️' : '🤍';
        favBtn.classList.toggle('favorited', isNowFavorited);
        favBtn.setAttribute('aria-label', 
          isNowFavorited ? 'Remove from favorites' : 'Add to favorites');
        
        // Add animation class for visual feedback
        favBtn.classList.add('heart-beat');
        setTimeout(() => favBtn.classList.remove('heart-beat'), 1000);
      }
    }
    
    // Update filter if favorites filter is active
    const activeFilter = document.querySelector('.filter-btn.active');
    if (activeFilter && activeFilter.id === 'favBtn') {
      applyCombinedFilter();
    }
  }
  
  return updatedFavorites.includes(recipeKey);
}

// Update favorite button in modal
function updateModalFavoriteButton(recipeKey) {
  const modal = document.getElementById('recipeModal');
  if (!modal || modal.style.display !== 'flex') return;
  
  const favBtn = modal.querySelector('.favorite-btn');
  if (!favBtn) return;
  
  const isFavorited = favorites.includes(recipeKey);
  favBtn.innerHTML = isFavorited ? '❤️' : '🤍';
  favBtn.classList.toggle('favorited', isFavorited);
  favBtn.setAttribute('aria-label', 
    isFavorited ? 'Remove from favorites' : 'Add to favorites');
  
  // Add animation
  favBtn.classList.add('heart-beat');
  setTimeout(() => favBtn.classList.remove('heart-beat'), 1000);
}

// Update favorite indicators in the UI
function updateFavoriteUI() {
  const currentFavorites = loadFavorites();
  
  // Update recipe cards
  document.querySelectorAll('.recipe-card').forEach(card => {
    const recipeKey = card.getAttribute('data-recipe-key');
    if (!recipeKey) return;
    
    const isFavorited = currentFavorites.includes(recipeKey);
    
    // Update favorite indicator
    const favIndicator = card.querySelector('.favorite-indicator');
    if (favIndicator) {
      favIndicator.style.display = isFavorited ? 'block' : 'none';
    }
    
    // Update favorite button in card
    const favBtn = card.querySelector('.favorite-btn');
    if (favBtn) {
      favBtn.innerHTML = isFavorited ? '❤️' : '🤍';
      favBtn.dataset.recipeKey = recipeKey; // Ensure recipe key is set
      favBtn.classList.toggle('favorited', isFavorited);
      favBtn.setAttribute('aria-label', 
        isFavorited ? 'Remove from favorites' : 'Add to favorites');
      
      // Add animation class for visual feedback
      if (isFavorited) {
        favBtn.classList.add('heart-beat');
        setTimeout(() => favBtn.classList.remove('heart-beat'), 1000);
      }
    }
  });
  
  // Update modal favorite button if open
  const modal = document.getElementById('recipeModal');
  if (modal && modal.style.display === 'flex' && window.currentRecipeKey) {
    const modalFavBtn = modal.querySelector('#modalFavoriteBtn');
    if (modalFavBtn) {
      const isFavorited = currentFavorites.includes(window.currentRecipeKey);
      modalFavBtn.innerHTML = isFavorited ? '❤️' : '🤍';
      modalFavBtn.setAttribute('aria-label', 
        isFavorited ? 'Remove from favorites' : 'Add to favorites');
    }
  }
  
  // Update favorites filter button state
  if (typeof updateFilterButtons === 'function') {
    updateFilterButtons();
  }
}

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadFavorites();
  updateFavoriteUI();
  
  // Event delegation for favorite buttons in the card container
  document.addEventListener('click', (event) => {
    // Handle favorite button clicks in cards
    const favBtn = event.target.closest('.favorite-btn');
    if (favBtn && favBtn.dataset.recipeKey) {
      toggleFavorite(favBtn.dataset.recipeKey, event);
    }
  });
  
  // Handle favorite button in modal
  document.addEventListener('click', (event) => {
    const modalFavBtn = event.target.closest('#modalFavoriteBtn');
    if (modalFavBtn && window.currentRecipeKey) {
      toggleFavorite(window.currentRecipeKey, event);
    }
  });
});

// Store current recipe globally for nutrition calculations
let currentRecipe = null;

function setCurrentRecipe(recipe) {
  window.currentRecipe = recipe;
  currentRecipe = recipe;
  console.log('Current recipe set:', recipe?.name || 'No recipe');
}

// Close modal function
function closeModal() {
  const modal = document.getElementById('recipeModal');
  if (!modal) return;
  
  // Start fade out animation
  modal.classList.add('fade-out');
  const modalImg = modal.querySelector('.modal-img');
  if (modalImg) {
    modalImg.classList.remove('fade-in');
  }
  
  // Wait for animation to complete before hiding
  setTimeout(() => {
    modal.style.display = 'none';
    modal.classList.remove('fade-out');
    if (modalImg) {
      modalImg.classList.remove('fade-in');
    }
    
    // Reset form if exists
    const form = document.getElementById('remixForm');
    if (form) form.reset();
    
    // Notify any listeners that the modal was closed
    modal.dispatchEvent(new Event('modal-closed'));
  }, 300); // Match this with CSS transition duration
}

// Initialize modal event listeners
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('recipeModal');
  if (modal) {
    // Close modal when clicking outside content
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        closeModal();
      }
    });
  }
});

// ... (rest of the code remains the same)

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

  // Show modal with CSS class
  modal.classList.add('show');
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
  console.log('Initializing customization controls...');
  
  // Initialize milk type selector
  const milkType = document.getElementById('milkType');
  if (milkType) {
    milkType.value = 'whole';
    console.log('Milk type initialized');
  }

  // Initialize checkboxes and their associated input fields
  const addMilk = document.getElementById('addMilk');
  const milkQty = document.getElementById('milkQty');
  const addSugar = document.getElementById('addSugar');
  const sugarQty = document.getElementById('sugarQty');
  const addIce = document.getElementById('addIce');
  const iceQty = document.getElementById('iceQty');
  const addFoam = document.getElementById('addFoam');
  const foamQty = document.getElementById('foamQty');
  
  console.log('Elements found:', { 
    addMilk: !!addMilk, milkQty: !!milkQty,
    addSugar: !!addSugar, sugarQty: !!sugarQty,
    addIce: !!addIce, iceQty: !!iceQty,
    addFoam: !!addFoam, foamQty: !!foamQty
  });
  
  // Initialize all checkboxes as unchecked and inputs as disabled
  if (addMilk) {
    addMilk.checked = false;
    if (milkQty) {
      milkQty.disabled = true;
      milkQty.value = '0';
    }
    console.log('Milk checkbox unchecked, input disabled');
  }

  if (addSugar) {
    addSugar.checked = false;
    if (sugarQty) {
      sugarQty.disabled = true;
      sugarQty.value = '0';
    }
    console.log('Sugar checkbox unchecked, input disabled');
  }

  if (addIce) {
    addIce.checked = false;
    if (iceQty) {
      iceQty.disabled = true;
      iceQty.value = '0';
    }
    console.log('Ice checkbox unchecked, input disabled');
  }

  if (addFoam) {
    addFoam.checked = false;
    if (foamQty) {
      foamQty.disabled = true;
      foamQty.value = '0';
    }
    console.log('Foam checkbox unchecked, input disabled');
  }

  // Initialize topping selector
  const toppingType = document.getElementById('toppingType');
  if (toppingType) {
    toppingType.value = '';
  }

  // Add event listeners for checkboxes
  if (addMilk && milkQty) {
    addMilk.addEventListener('change', function() {
      milkQty.disabled = !this.checked;
      if (!this.checked) {
        milkQty.value = '0';
      }
      updateNutritionDisplay(window.currentRecipe);
    });
    milkQty.addEventListener('input', function() {
      updateNutritionDisplay(window.currentRecipe);
    });
  }

  if (addSugar && sugarQty) {
    addSugar.addEventListener('change', function() {
      sugarQty.disabled = !this.checked;
      if (!this.checked) {
        sugarQty.value = '0';
      }
      updateNutritionDisplay(window.currentRecipe);
    });
    sugarQty.addEventListener('input', function() {
      updateNutritionDisplay(window.currentRecipe);
    });
  }

  if (addIce && iceQty) {
    addIce.addEventListener('change', function() {
      iceQty.disabled = !this.checked;
      if (!this.checked) {
        iceQty.value = '0';
      }
      updateNutritionDisplay(window.currentRecipe);
    });
    iceQty.addEventListener('input', function() {
      updateNutritionDisplay(window.currentRecipe);
    });
  }

  if (addFoam && foamQty) {
    addFoam.addEventListener('change', function() {
      foamQty.disabled = !this.checked;
      if (!this.checked) {
        foamQty.value = '0';
      }
      updateNutritionDisplay(window.currentRecipe);
    });
    foamQty.addEventListener('input', function() {
      updateNutritionDisplay(window.currentRecipe);
    });
  }

  if (toppingType) {
    toppingType.addEventListener('change', function() {
      updateNutritionDisplay(window.currentRecipe);
    });
  }

  // Add reset button functionality
  const resetCustomize = document.getElementById('resetCustomize');
  if (resetCustomize) {
    resetCustomize.addEventListener('click', function() {
      if (addMilk) {
        addMilk.checked = false;
        if (milkQty) {
          milkQty.disabled = true;
          milkQty.value = '0';
        }
      }
      if (addSugar) {
        addSugar.checked = false;
        if (sugarQty) {
          sugarQty.disabled = true;
          sugarQty.value = '0';
        }
      }
      if (addIce) {
        addIce.checked = false;
        if (iceQty) {
          iceQty.disabled = true;
          iceQty.value = '0';
        }
      }
      if (addFoam) {
        addFoam.checked = false;
        if (foamQty) {
          foamQty.disabled = true;
          foamQty.value = '0';
        }
      }
      if (toppingType) toppingType.value = '';
      if (milkType) milkType.value = 'whole';
      updateNutritionDisplay(window.currentRecipe);
    });
  }
}

function closeModal() {
  console.log('Closing modal...');
  
  const modal = document.getElementById('recipeModal');
  if (modal) {
    modal.classList.remove('show');
    
    // Restore body scroll - use empty string to reset to default
    document.body.style.overflow = '';
    
    console.log('Modal closed successfully');
  } else {
    console.error('Modal element not found when trying to close');
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
  console.log('showSection called with:', sectionId);
  
  // Ensure .main-content exists
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;
  
  // Get or initialize cardContainer
  if (!cardContainer) {
    cardContainer = document.getElementById('cardContainer');
  }

  // Hide all sections first
  const allSections = document.querySelectorAll('section, #cardContainer');
  allSections.forEach(section => {
    section.classList.add('section-hidden');
    section.style.display = 'none';
  });

  // Remove any existing dynamic sections to prevent duplicates
  const existingRemix = document.getElementById('remixSection');
  const existingQuiz = document.getElementById('quizSection');
  if (existingRemix) existingRemix.remove();
  if (existingQuiz) existingQuiz.remove();
  
  if (sectionId === 'remixSection') {
    console.log('Creating Remix section');
    // --- Remix Generator UI ---
    const remixSection = document.createElement('section');
    remixSection.id = 'remixSection';
    remixSection.style.display = 'block';
    remixSection.style.padding = '20px';
    remixSection.style.maxWidth = '800px';
    remixSection.style.margin = '0 auto';
    remixSection.style.backgroundColor = 'rgba(0,0,0,0.05)';
    remixSection.style.borderRadius = '12px';
    remixSection.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    
    remixSection.innerHTML = `
      <h2 class="section-heading" style="color: #3a2a1a; text-align: center; margin-bottom: 20px;">Remix Generator</h2>
      <form id="remixForm" style="margin: 32px auto; max-width: 400px; text-align: left; background: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="margin-bottom: 20px;">
          <label style="color:#3a2a1a;font-weight:500;display:block;margin-bottom:8px;">Base:</label>
          <select id="remixBase" style="width:100%;padding:10px;border-radius:6px;border:1px solid #ddd;font-size:16px;">
            <option value="espresso">Espresso</option>
            <option value="coffee">Coffee</option>
            <option value="coldbrew">Cold Brew</option>
            <option value="matcha">Matcha</option>
          </select>
        </div>
        <div style="margin-bottom: 20px;">
          <label style="color:#3a2a1a;font-weight:500;display:block;margin-bottom:8px;">Milk:
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
    console.log('Creating Quiz section');
    // --- Find Your Brew Quiz UI ---
    const quizSection = document.createElement('section');
    quizSection.id = 'quizSection';
    quizSection.style.display = 'block';
    quizSection.style.padding = '20px';
    quizSection.style.maxWidth = '800px';
    quizSection.style.margin = '0 auto';
    quizSection.style.backgroundColor = 'rgba(0,0,0,0.05)';
    quizSection.style.borderRadius = '12px';
    quizSection.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
    
    quizSection.innerHTML = `
      <h2 class="section-heading" style="color: #3a2a1a; text-align: center; margin-bottom: 20px;">Find Your Perfect Brew</h2>
      <form id="brewQuiz" style="margin: 32px auto; max-width: 400px; text-align: left; background: white; padding: 24px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="margin-bottom: 20px;">
          <label style="color:#3a2a1a;font-weight:500;display:block;margin-bottom:8px;">What's your coffee style?
          <select id="quizType" style="width:100%;margin-bottom:12px;">
            <option value="hot">Hot</option>
            <option value="iced">Iced</option>
          </select>
        </label><br>
        <label style="color:#3a2a1a;font-weight:500;display:block;margin-bottom:8px;">How strong do you like it?
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
    if (cardContainer) {
      cardContainer.classList.remove('section-hidden');
    }
    // Remove any dynamic section if present
    const existingRemix2 = document.getElementById('remixSection');
    if (existingRemix2) existingRemix2.remove();
    const existingQuiz2 = document.getElementById('quizSection');
    if (existingQuiz2) existingQuiz2.remove();
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
  const remixBtn = document.getElementById('remixNavBtn');
  const quizBtn = document.getElementById('quizNavBtn');
  
  if (remixBtn) {
    remixBtn.onclick = (e) => {
      e.preventDefault();
      console.log('Remix button clicked');
      showSection('remixSection');
      setActiveNav('remixNavBtn');
      // Show the section immediately
      const remixSection = document.getElementById('remixSection');
      if (remixSection) {
        remixSection.style.display = 'block';
        remixSection.classList.remove('section-hidden');
      }
    };
  }

  if (quizBtn) {
    quizBtn.onclick = (e) => {
      e.preventDefault();
      console.log('Quiz button clicked');
      showSection('quizSection');
      setActiveNav('quizNavBtn');
      // Show the section immediately
      const quizSection = document.getElementById('quizSection');
      if (quizSection) {
        quizSection.style.display = 'block';
        quizSection.classList.remove('section-hidden');
      }
    };
  }
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
  // Dark mode functionality
  function initializeDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (!darkModeToggle) return;
    
    // Set initial state
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDarkMode = savedMode === null ? prefersDark : savedMode === 'true';
    
    // Apply dark mode
    function setDarkMode(enabled) {
      if (enabled) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        darkModeToggle.innerHTML = '<i class="bi bi-sun"></i>';
        darkModeToggle.setAttribute('aria-label', 'Switch to light mode');
        localStorage.setItem('darkMode', 'true');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
        darkModeToggle.innerHTML = '<i class="bi bi-moon"></i>';
        darkModeToggle.setAttribute('aria-label', 'Switch to dark mode');
        localStorage.setItem('darkMode', 'false');
      }
    }
    
    // Initialize with saved or system preference
    setDarkMode(isDarkMode);
    
    // Toggle on click
    darkModeToggle.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark-mode');
      setDarkMode(!isDark);
    });
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (localStorage.getItem('darkMode') === null) {
        setDarkMode(e.matches);
      }
    });
  }
  
  // Initialize dark mode
  initializeDarkMode();
  // Search and sort event listeners
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  
  if (searchInput) {
    searchInput.addEventListener('input', searchRecipes);
  }
  
  // Sort functionality
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      console.log('Sort changed to:', this.value);
      applyCombinedFilter();
    });
  }
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
function showToast(message, type = 'info', duration = 3000) {
  console.log('Showing toast:', message, type);
  
  // Remove any existing toasts
  const existingToasts = document.querySelectorAll('.toast-notification');
  existingToasts.forEach(toast => toast.remove());
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Close notification" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  // Add toast styles
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 350px;
    background: ${type === 'error' ? '#d32f2f' : type === 'success' ? '#388e3c' : '#1976d2'};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 100000;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
    font-size: 14px;
    line-height: 1.4;
  `;
  
  // Add to page
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Auto remove after duration
  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (toast.parentElement) {
            toast.remove();
          }
        }, 300);
      }
    }, duration);
  }
  
  // Mobile responsive positioning
  if (window.innerWidth <= 768) {
    toast.style.cssText += `
      top: 10px;
      right: 10px;
      left: 10px;
      max-width: none;
      transform: translateY(-100%);
    `;
    
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
    }, 10);
  }
  
  return toast;
}

// Show quiz modal for finding your brew
function showQuizModal() {
  // Create a simple quiz modal for now
  const quizQuestions = [
    "Do you prefer hot or iced coffee?",
    "How strong do you like your coffee?",
    "Do you like milk in your coffee?"
  ];
  
  // For now, show a toast with quiz info
  showToast('Coffee Quiz: Answer a few questions to find your perfect brew!');
  
  // TODO: Implement full quiz modal functionality
  console.log('Quiz modal would show questions:', quizQuestions);
}

// Make key functions globally accessible
window.searchRecipes = searchRecipes;
window.filterRecipes = filterRecipes;
window.applyCombinedFilter = applyCombinedFilter;
window.openModal = openModal;
window.showToast = showToast;
window.showQuizModal = showQuizModal;

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