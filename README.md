# ☕ BrewIt - Coffee Recipe Hub

[![Live Site](https://img.shields.io/badge/Live%20Site-View%20Demo-blue?style=for-the-badge&logo=github)](https://sai-naman-gangiredla.github.io/BrewIt)
[![PWA](https://img.shields.io/badge/PWA-Installable-green?style=for-the-badge&logo=pwa)](https://sai-naman-gangiredla.github.io/BrewIt)
[![Offline](https://img.shields.io/badge/Offline-Supported-orange?style=for-the-badge&logo=wifi)](https://sai-naman-gangiredla.github.io/BrewIt)
[![Mobile Optimized](https://img.shields.io/badge/Mobile-Optimized-purple?style=for-the-badge&logo=mobile)](https://sai-naman-gangiredla.github.io/BrewIt)

A comprehensive, interactive **Progressive Web App (PWA)** featuring 170+ coffee recipes with detailed instructions, nutrition information, and customization options. Installable on any device with offline functionality and **optimized mobile navigation**.

## 🌟 Features

### **🚀 Progressive Web App (PWA)**
- **Installable** - Add to home screen on mobile and desktop
- **Offline Support** - Works without internet connection
- **App-like Experience** - Native app feel with smooth animations
- **Service Worker** - Intelligent caching for fast loading
- **Manifest File** - Proper app metadata and icons

### **📱 Mobile-First Design**
- **Horizontal Scrollable Navigation** - Compact toolbar for mobile devices
- **Touch-Optimized Interface** - 44px minimum touch targets
- **Responsive Layout** - Adapts seamlessly to all screen sizes
- **Mobile Navigation Redesign** - Horizontal scrollable filter buttons
- **Cache-Busting Strategy** - Ensures fresh styles load on mobile
- **Aggressive CSS Overrides** - Force new mobile layout with !important rules

### **⚡ Performance & Optimization**
- **Lazy Loading** - Images load only when needed
- **Resource Preloading** - Critical resources loaded first
- **Loading States** - Professional loading spinners
- **Error Handling** - Graceful error recovery with retry options
- **Performance Monitoring** - Real-time performance tracking
- **Cache-Busting** - JavaScript-based CSS refresh for mobile

### **♿ Accessibility & UX**
- **ARIA Labels** - Screen reader compatibility
- **Keyboard Navigation** - Full keyboard support
- **Focus Management** - Proper focus indicators
- **High Contrast** - Better visibility for all users
- **Error Boundaries** - Robust error handling
- **Touch-Friendly Design** - Optimized for mobile interaction

### **Interactive Recipe Management**
- **170+ Coffee Recipes** - From classic espresso to specialty drinks
- **Smart Search & Filtering** - Find recipes by name, type (hot/iced), or favorites
- **Advanced Sorting** - Sort by popularity, name, calories, or type
- **Favorites System** - Save and manage your favorite recipes with localStorage persistence

### **Rich Recipe Details**
- **Dual Instructions** - Toggle between jargon and beginner-friendly steps
- **Nutrition Calculator** - Real-time nutrition calculations with customization options
- **Flavor Profiles** - Interactive radar charts showing bitterness, sweetness, acidity, strength, and body
- **Caffeine Estimates** - Dynamic caffeine calculation based on brew strength
- **Customization Options** - Add milk, sugar, ice, foam, and toppings with quantity controls

### **User Experience**
- **Dark Mode** - Toggle between light and dark themes with persistence
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Daily Coffee Facts** - Rotating tips and interesting coffee trivia
- **Smooth Animations** - Professional transitions and hover effects
- **Toast Notifications** - User feedback for all interactions

### **Special Sections**
- **Remix Generator** - Create custom coffee combinations
- **Find Your Brew Quiz** - Personalized coffee recommendations
- **Coffee Brewing Guide** - Comprehensive brewing techniques

## 📸 Screenshots

### **Main Interface - Dark Mode**
![Main Interface](https://raw.githubusercontent.com/Sai-Naman-Gangiredla/BrewIt/main/public/images/screenshots/main-interface-dark.png)
*The main interface showcasing the dark mode theme with recipe cards and navigation*


### **Recipe Details Modal**
![Recipe Details](https://raw.githubusercontent.com/Sai-Naman-Gangiredla/BrewIt/main/public/images/screenshots/recipe-modal.png)
*Detailed recipe view with nutrition info*

### **Customization Panel**
![Customization](https://raw.githubusercontent.com/Sai-Naman-Gangiredla/BrewIt/main/public/images/screenshots/customization-panel.png)
*Recipe customization with ingredient options and quantity controls*

### **Flavor Profile Chart**
![Flavor Profile](https://raw.githubusercontent.com/Sai-Naman-Gangiredla/BrewIt/main/public/images/screenshots/flavour-panel.png)
*Interactive flavor profile radar chart showing bitterness, sweetness, acidity, strength, and body*

### **Light Mode Theme**
![Light Mode](https://raw.githubusercontent.com/Sai-Naman-Gangiredla/BrewIt/main/public/images/screenshots/light-mode.png)
*Light mode theme with warm colors and improved readability*

### **Mobile Responsive Design**
![Mobile View](https://raw.githubusercontent.com/Sai-Naman-Gangiredla/BrewIt/main/public/images/screenshots/mobile-view.png)
*Fully responsive design optimized for mobile devices*

### **Search and Filtering**
![Search Interface](https://raw.githubusercontent.com/Sai-Naman-Gangiredla/BrewIt/main/public/images/screenshots/search-filtering.png)
*Advanced search and filtering capabilities with category buttons*

### **Remix Generator**
![Remix Generator](https://raw.githubusercontent.com/Sai-Naman-Gangiredla/BrewIt/main/public/images/screenshots/remix-generator.png)
*Interactive remix generator for creating custom coffee combinations*

### **Find Your Brew Quiz**
![Quiz Interface](https://raw.githubusercontent.com/Sai-Naman-Gangiredla/BrewIt/main/public/images/screenshots/quiz-interface.png)
*Personalized coffee recommendation quiz*

## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with Flexbox/Grid layouts
- **Charts**: Chart.js for flavor profile visualization
- **Icons**: Bootstrap Icons
- **PWA**: Service Worker, Web App Manifest
- **Data Storage**: localStorage for user preferences
- **Performance**: Lazy loading, resource preloading
- **Analytics**: Google Analytics integration
- **SEO**: Structured data, robots.txt, sitemap.xml
- **Mobile Optimization**: Aggressive CSS overrides, cache-busting

## 📁 Project Structure

```
BrewIt/
├── index.html              # Main application file
├── manifest.json           # PWA manifest file
├── sw.js                  # Service worker for offline support
├── robots.txt             # SEO configuration
├── sitemap.xml            # Search engine sitemap
├── src/
│   ├── script/
│   │   └── script.js      # Core JavaScript functionality
│   ├── styles/
│   │   └── styles.css     # All styling and animations
│   └── data/
│       └── recipes.json   # Recipe database (170+ recipes)
├── public/
│   ├── images/            # Recipe images (170+ images)
│   ├── docs/              # Documentation
│   └── videos/            # Video content
└── README.md             # This file
```

## 🚀 Getting Started

### **Prerequisites**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software installation required

### **Installation**
1. Clone the repository:
   ```bash
   git clone https://github.com/Sai-Naman-Gangiredla/BrewIt.git
   cd BrewIt
   ```

2. Open `index.html` in your web browser

3. **Install as PWA** (Optional):
   - On Chrome/Edge: Click the install icon in the address bar
   - On mobile: Use "Add to Home Screen" option
   - Enjoy offline functionality!

### **Usage**
- **Browse Recipes**: Click on any recipe card to view details
- **Search**: Use the search bar to find specific recipes
- **Filter**: Use category buttons (All, Hot, Iced, Favorites)
- **Sort**: Choose from different sorting options
- **Customize**: Modify recipes with additional ingredients
- **Save Favorites**: Click the heart icon to save recipes
- **Offline Mode**: Use the app without internet connection
- **Mobile Navigation**: Horizontal scrollable toolbar on mobile devices

## 📊 Recipe Database

The application includes a comprehensive database of coffee recipes:

- **Classic Drinks**: Espresso, Cappuccino, Latte, Americano
- **Specialty Drinks**: Pumpkin Spice Latte, Caramel Macchiato, Mocha
- **Iced Beverages**: Cold Brew, Iced Latte, Frappuccino-style drinks
- **International**: Turkish Coffee, Vietnamese Coffee, Irish Coffee
- **Modern Trends**: Nitro Cold Brew, Dalgona Coffee, Affogato

Each recipe includes:
- High-quality images
- Detailed ingredients list
- Step-by-step instructions (jargon and beginner-friendly)
- Nutrition information
- Flavor profile data
- Caffeine estimates

## 🎨 Customization Features

### **Recipe Customization**
- **Milk Options**: Whole, Skim, Almond, Soy, Oat
- **Sweeteners**: Sugar, Honey, Syrups
- **Additions**: Ice, Foam, Toppings
- **Quantity Controls**: Adjust amounts for precise customization

### **Nutrition Calculator**
- Real-time calorie calculations
- Carbohydrate and protein tracking
- Custom ingredient additions
- Dynamic updates based on modifications

## 🔧 Development

### **Recent Updates (Latest)**
- **Mobile Navigation Redesign**: Horizontal scrollable toolbar for better mobile UX
- **Cache-Busting Strategy**: JavaScript-based CSS refresh for mobile devices
- **Aggressive CSS Overrides**: Force new mobile layout with !important rules
- **Service Worker Updates**: Network-first strategy for CSS files
- **Inline Critical CSS**: Ensures mobile navigation loads immediately

### **Adding New Recipes**
1. Add recipe data to `src/data/recipes.json`
2. Include corresponding image in `public/images/`
3. Follow the existing data structure format

### **Modifying Styles**
- Main styles: `src/styles/styles.css`
- Responsive design included
- Dark mode support built-in
- Mobile-first approach with aggressive overrides

### **JavaScript Features**
- Modular function structure
- Event-driven architecture
- localStorage for data persistence
- Chart.js integration for visualizations
- Service worker for offline functionality
- Error handling and performance monitoring
- Cache-busting for mobile CSS

### **PWA Development**
- **Manifest**: `manifest.json` for app metadata
- **Service Worker**: `sw.js` for offline caching
- **Icons**: Ensure proper icon sizes for different devices
- **Testing**: Use Chrome DevTools for PWA testing

## 📱 Browser Support

- ✅ Chrome (recommended for PWA features)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### **PWA Support**
- ✅ Chrome/Edge (full PWA support)
- ✅ Firefox (basic PWA support)
- ✅ Safari (limited PWA support)
- ✅ Mobile browsers (installable on home screen)

## 🚀 Performance Features

### **Loading Optimization**
- **Resource Preloading**: Critical resources loaded first
- **Lazy Loading**: Images load only when visible
- **Service Worker Caching**: Intelligent caching strategy
- **Compression**: Optimized assets for faster loading
- **Cache-Busting**: JavaScript-based CSS refresh

### **User Experience**
- **Loading Spinners**: Professional loading states
- **Error Recovery**: Graceful error handling with retry options
- **Offline Support**: Full functionality without internet
- **Performance Monitoring**: Real-time performance tracking
- **Mobile Navigation**: Horizontal scrollable toolbar

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### **Development Guidelines**
- Follow existing code style
- Test PWA functionality
- Ensure accessibility compliance
- Optimize for performance
- Test mobile navigation thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Chart.js for visualization capabilities
- Bootstrap Icons for the icon set
- PWA community for progressive web app standards

## 📞 Contact

**Sai Naman Gangiredla** - [sainamangangiredla@gmail.com](mailto:sainamangangiredla@gmail.com)

**Nallam Sruja** - [nallamsruja@gmail.com](mailto:nallamsruja@gmail.com)

Project Link: [https://github.com/Sai-Naman-Gangiredla/BrewIt](https://github.com/Sai-Naman-Gangiredla/BrewIt)

Live Demo: [https://sai-naman-gangiredla.github.io/BrewIt](https://sai-naman-gangiredla.github.io/BrewIt)

---

⭐ **Star this repository if you found it helpful!**

🔧 **Install as PWA for the best experience!**

📱 **Optimized for mobile with horizontal navigation!** 