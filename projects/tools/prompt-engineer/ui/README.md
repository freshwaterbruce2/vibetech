# UI Theme Management System

A comprehensive theme management system extracted from `streamlit_ui.py` for modular, reusable UI theming in Streamlit applications.

## 🎯 Features

- **Dynamic Theme Switching**: Light, Dark, and Auto (time-based) themes
- **CSS Caching**: Intelligent caching system for improved performance  
- **Session Persistence**: Theme preferences persist across sessions
- **Modular Architecture**: Separated CSS files for easy maintenance
- **Animation Support**: Rich animation library with accessibility considerations
- **Responsive Design**: Mobile-first responsive components
- **Accessibility**: High contrast and reduced motion support

## 📁 Structure

```
ui/
├── __init__.py              # Package initialization
├── components/
│   ├── __init__.py          # Components package  
│   └── theme.py            # ThemeManager class and utilities
├── styles/
│   ├── themes.css          # Light/Dark theme variables
│   ├── animations.css      # Animation definitions  
│   └── components.css      # Component-specific styles
├── examples/
│   └── theme_example.py    # Usage demonstration
└── README.md              # This file
```

## 🚀 Quick Start

### Basic Usage

```python
import streamlit as st
from ui.components.theme import ThemeManager

# Page config
st.set_page_config(page_title="My App", layout="wide")

# Initialize theme manager
theme_manager = ThemeManager(default_theme='auto')

# Apply theme (call this early)
theme_manager.apply_theme()

# Add theme controls to sidebar
theme_manager.render_theme_toggle(location="sidebar")

# Your app content here...
st.title("My Themed App")
```

### Alternative Import Methods

```python
# Import global instance
from ui import theme_manager, apply_theme, render_theme_toggle

# Use global functions
apply_theme()
render_theme_toggle()

# Or import specific components
from ui.components import ThemeManager
```

## 🎨 Theme Features

### Theme Types

- **Light**: Clean, professional light theme for daytime use
- **Dark**: Modern dark theme for reduced eye strain  
- **Auto**: Automatically switches based on time (6 AM - 6 PM = Light)

### CSS Variables

Both themes provide consistent CSS variables:

```css
/* Color System */
--primary-color, --primary-dark, --primary-light
--success-color, --warning-color, --danger-color, --info-color

/* Background System */  
--bg-primary, --bg-secondary, --bg-tertiary, --bg-card, --bg-sidebar

/* Text System */
--text-primary, --text-secondary, --text-muted, --text-inverse

/* Interactive System */
--border-color, --border-light, --border-focus
--shadow-sm, --shadow-md, --shadow-lg, --shadow-xl

/* Animation System */
--transition-base, --transition-spring, --transition-theme
```

### Custom Components

The system provides styled components that automatically adapt to themes:

```html
<!-- Metric Cards -->
<div class="metric-card-enhanced">
    <div class="metric-number">42</div>
    <div class="metric-label">Total Issues</div>
</div>

<!-- Issue Cards -->  
<div class="issue-card issue-high">
    <div class="issue-header">
        <span class="issue-icon">⚠️</span>
        <h3 class="issue-title">Issue Title</h3>
    </div>
    <div class="issue-description">Issue description...</div>
</div>

<!-- Health Gauge -->
<div class="health-gauge-container">
    <div class="health-gauge">
        <div class="health-score-text">85</div>
        <div class="health-score-label">Health Score</div>
    </div>
</div>
```

## 🎭 Animation System

### Available Animations

```css
/* Entry Animations */
.animate-fade-in     /* Fade in from bottom */
.animate-slide-in    /* Slide in from right */  
.animate-scale-in    /* Scale up from center */

/* Loading Animations */
.animate-pulse       /* Pulsing effect */
.animate-spin        /* Rotation */
.loading-skeleton    /* Shimmer loading */

/* Interactive Animations */
.animate-bounce      /* Bounce effect */
.animate-wiggle      /* Playful wiggle */
.animate-glow        /* Glowing border */

/* Delays */
.delay-100, .delay-200, .delay-300, .delay-500, .delay-700, .delay-1000
```

### Usage Example

```html
<div class="animate-fade-in delay-200">
    This content fades in after 200ms delay
</div>
```

## ⚙️ ThemeManager API

### Initialization

```python
# Basic initialization
theme_manager = ThemeManager()

# With custom default
theme_manager = ThemeManager(default_theme='dark')
```

### Methods

```python
# Apply theme and get complete CSS
css = theme_manager.apply_theme()
css = theme_manager.apply_theme('dark')  # Force specific theme

# Render theme controls
theme_manager.render_theme_toggle()                    # In main area
theme_manager.render_theme_toggle(location="sidebar")  # In sidebar

# Get current state
current_theme = theme_manager.get_current_theme()    # 'light' or 'dark'
preference = theme_manager.get_theme_preference()     # 'light', 'dark', or 'auto'

# Programmatic control
theme_manager.set_theme('dark')       # Set specific theme
theme_manager.clear_cache()           # Clear CSS cache

# Configuration management
config = theme_manager.export_theme_config()     # Export settings
theme_manager.import_theme_config(config)        # Import settings
```

## 🎯 Advanced Features

### CSS File Integration

The system automatically loads CSS from external files when available:

- `ui/styles/themes.css` - Theme variables and base styles
- `ui/styles/animations.css` - Animation definitions  
- `ui/styles/components.css` - Component-specific styles

If files are not found, it falls back to embedded CSS for reliability.

### Caching System

```python
# CSS is automatically cached for performance
# Cache keys: 'light_css', 'dark_css', 'animations_css', 'components_css'

# Manual cache management
theme_manager.clear_cache()           # Clear all cached CSS
theme_manager._css_cache['light_css'] # Access cache directly (advanced)
```

### Session State Management

```python
# Session state variables automatically managed:
st.session_state.theme_preference     # User's theme choice
st.session_state.current_theme        # Currently active theme

# These persist across Streamlit reruns and browser sessions
```

### Time-Based Auto Theme

```python
# Auto theme logic (when preference = 'auto'):
from datetime import datetime

current_hour = datetime.now().hour
theme = 'light' if 6 <= current_hour <= 18 else 'dark'
```

## 📱 Responsive Design

The system includes comprehensive responsive breakpoints:

```css
/* Mobile phones */
@media (max-width: 768px) {
    /* Simplified animations, larger touch targets */
}

/* Tablets */  
@media (max-width: 1024px) and (min-width: 769px) {
    /* Medium-sized adjustments */
}
```

## ♿ Accessibility

### High Contrast Support

```css
@media (prefers-contrast: high) {
    /* Enhanced contrast ratios */
}
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
    /* Minimal animations for motion-sensitive users */
}
```

### Focus Management

- Clear focus indicators for keyboard navigation
- Proper ARIA labels and semantic HTML
- Screen reader friendly components

## 🔧 Migration from streamlit_ui.py

### Before (Old Method)

```python
# In streamlit_ui.py
theme_css = get_theme_css(st.session_state.current_theme)
complete_css = theme_css + """..."""  # Embedded CSS
st.markdown(complete_css, unsafe_allow_html=True)
```

### After (New Method)

```python
# Using the new system
from ui.components.theme import ThemeManager

theme_manager = ThemeManager()
theme_manager.apply_theme()  # Handles everything automatically
```

### Key Benefits of Migration

1. **Modularity**: CSS is now separated into logical files
2. **Reusability**: Theme system can be used across multiple apps
3. **Maintainability**: Easy to update styles without touching main code
4. **Performance**: Intelligent caching reduces rendering overhead
5. **Extensibility**: Easy to add new themes and components

## 🧪 Testing and Examples

Run the example application:

```powershell
cd C:\dev\projects\tools\prompt-engineer
streamlit run ui\examples\theme_example.py
```

## 🎨 Customization

### Adding Custom Themes

1. Extend the `get_theme_css` method in `theme.py`
2. Add new CSS variables to `themes.css`  
3. Update the theme selector UI

### Adding Custom Components

1. Add styles to `components.css`
2. Use CSS variables for theme compatibility
3. Include responsive breakpoints
4. Test with both light and dark themes

### Custom Animations

1. Add keyframes to `animations.css`
2. Create utility classes following the naming convention
3. Include accessibility considerations

## 📋 Best Practices

1. **Always call `apply_theme()` early** in your Streamlit app
2. **Use CSS variables** instead of hard-coded colors
3. **Test both themes** during development
4. **Include responsive breakpoints** for mobile compatibility  
5. **Consider accessibility** in custom components
6. **Cache expensive operations** when extending the system

## 🐛 Troubleshooting

### Theme not applying
- Ensure `apply_theme()` is called before other Streamlit components
- Check browser console for CSS errors
- Clear cache with `theme_manager.clear_cache()`

### Animations not working  
- Verify CSS files are accessible
- Check for `prefers-reduced-motion` browser settings
- Ensure proper CSS class names are used

### Custom styles not showing
- CSS variables must be defined in both light and dark themes
- Use `!important` sparingly and only when necessary
- Check CSS selector specificity

## 🚧 Future Enhancements

- [ ] Custom color palette builder
- [ ] More pre-built component styles
- [ ] Theme transition animations  
- [ ] RTL (Right-to-Left) language support
- [ ] Print-friendly styles
- [ ] Color blindness accessibility testing

## 📄 License

This theme management system is part of the Prompt Engineer Tool project and follows the same licensing terms.

---

**Version**: 1.0.0  
**Author**: Prompt Engineer UI Team  
**Last Updated**: September 2024