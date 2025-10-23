"""
Theme Management System for Prompt Engineer UI

A comprehensive theme management system with dynamic CSS loading,
caching, and session state management for theme persistence.
"""

import streamlit as st
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional, Literal, Union
import json

ThemeType = Literal['light', 'dark', 'auto']

class ThemeManager:
    """
    Advanced theme management system with dynamic CSS loading and caching.
    
    Features:
    - Light/Dark/Auto theme switching
    - Session state persistence
    - Dynamic CSS loading and caching
    - Time-based auto theme detection
    - Complete CSS theme extraction from streamlit_ui.py
    """
    
    def __init__(self, default_theme: ThemeType = 'auto'):
        """Initialize the theme manager with default theme preference."""
        self.default_theme = default_theme
        self._css_cache: Dict[str, str] = {}
        self._initialize_session_state()
    
    def _initialize_session_state(self) -> None:
        """Initialize session state variables for theme management."""
        if 'theme_preference' not in st.session_state:
            st.session_state.theme_preference = self.default_theme
        
        if 'current_theme' not in st.session_state:
            st.session_state.current_theme = self._resolve_theme(st.session_state.theme_preference)
    
    def _resolve_theme(self, preference: ThemeType) -> Literal['light', 'dark']:
        """Resolve theme preference to actual theme (light or dark)."""
        if preference == 'auto':
            current_hour = datetime.now().hour
            return 'light' if 6 <= current_hour <= 18 else 'dark'
        return preference
    
    def get_theme_css(self, theme: Literal['light', 'dark']) -> str:
        """Generate theme-specific CSS with enhanced dark/light mode support."""
        
        # Cache check
        cache_key = f"{theme}_css"
        if cache_key in self._css_cache:
            return self._css_cache[cache_key]
        
        if theme == 'dark':
            css = """
<style>
/* ============ DARK THEME VARIABLES ============ */
:root {
    /* Primary Colors */
    --primary-color: #60a5fa;
    --primary-dark: #3b82f6;
    --primary-light: #93c5fd;
    
    /* Status Colors */
    --success-color: #34d399;
    --warning-color: #fbbf24;
    --danger-color: #f87171;
    --info-color: #60a5fa;
    
    /* Background Colors */
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-tertiary: #334155;
    --bg-card: #1e293b;
    --bg-sidebar: #0f172a;
    --bg-input: #334155;
    --bg-button: #475569;
    --bg-hover: #475569;
    
    /* Text Colors */
    --text-primary: #f1f5f9;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;
    --text-inverse: #0f172a;
    
    /* Border Colors */
    --border-color: #475569;
    --border-light: #334155;
    --border-focus: #60a5fa;
    
    /* Shadow Colors */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
    
    /* Transitions */
    --transition-base: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-spring: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    --transition-theme: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ============ DARK THEME GLOBAL OVERRIDES ============ */
.main .block-container {
    background-color: var(--bg-primary) !important;
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}

.stApp {
    background-color: var(--bg-primary) !important;
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}

/* Sidebar dark theme */
.css-1d391kg, .css-1y4p8pa {
    background: linear-gradient(180deg, var(--bg-sidebar) 0%, var(--bg-secondary) 100%) !important;
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}

/* Header dark theme */
header[data-testid="stHeader"] {
    background-color: var(--bg-primary) !important;
    transition: var(--transition-theme) !important;
}

/* Text elements */
h1, h2, h3, h4, h5, h6, p, span, div, label {
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}

/* Muted text */
.stMarkdown p, .css-1629p8f p {
    color: var(--text-secondary) !important;
}

/* Cards and containers */
.metric-card-enhanced, .issue-card, .prompt-card {
    background: var(--bg-card) !important;
    border-color: var(--border-color) !important;
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}

.metric-card-enhanced:hover, .issue-card:hover, .prompt-card:hover {
    background: var(--bg-tertiary) !important;
    box-shadow: var(--shadow-lg) !important;
}
"""
        else:  # light theme
            css = """
<style>
/* ============ LIGHT THEME VARIABLES ============ */
:root {
    /* Primary Colors */
    --primary-color: #3b82f6;
    --primary-dark: #1d4ed8;
    --primary-light: #93c5fd;
    
    /* Status Colors */
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --danger-color: #ef4444;
    --info-color: #3b82f6;
    
    /* Background Colors */
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --bg-tertiary: #f1f5f9;
    --bg-card: #ffffff;
    --bg-sidebar: #f8fafc;
    --bg-input: #ffffff;
    --bg-button: #f1f5f9;
    --bg-hover: #f1f5f9;
    
    /* Text Colors */
    --text-primary: #1f2937;
    --text-secondary: #4b5563;
    --text-muted: #6b7280;
    --text-inverse: #ffffff;
    
    /* Border Colors */
    --border-color: #e5e7eb;
    --border-light: #f3f4f6;
    --border-focus: #3b82f6;
    
    /* Shadow Colors */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    
    /* Transitions */
    --transition-base: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-spring: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    --transition-theme: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ============ LIGHT THEME GLOBAL STYLES ============ */
.main .block-container {
    background-color: var(--bg-primary) !important;
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}

.stApp {
    background-color: var(--bg-primary) !important;
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}

/* Sidebar light theme */
.css-1d391kg, .css-1y4p8pa {
    background: linear-gradient(180deg, var(--bg-sidebar) 0%, var(--bg-secondary) 100%) !important;
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}
"""
        
        # Close the style tag
        css += "</style>"
        
        # Cache the result
        self._css_cache[cache_key] = css
        return css
    
    def apply_theme(self, theme: Optional[ThemeType] = None) -> str:
        """
        Apply the current theme and return the complete CSS.
        
        Args:
            theme: Optional theme to override current theme
            
        Returns:
            Complete CSS string for the theme
        """
        if theme is not None:
            st.session_state.theme_preference = theme
            st.session_state.current_theme = self._resolve_theme(theme)
        
        current_theme = st.session_state.current_theme
        theme_css = self.get_theme_css(current_theme)
        
        # Load additional CSS files
        animations_css = self._load_animations_css()
        components_css = self._load_components_css()
        
        # Combine all CSS
        complete_css = theme_css + animations_css + components_css
        
        # Apply the CSS
        st.markdown(complete_css, unsafe_allow_html=True)
        
        return complete_css
    
    def _load_animations_css(self) -> str:
        """Load animation-specific CSS."""
        cache_key = "animations_css"
        if cache_key in self._css_cache:
            return self._css_cache[cache_key]
        
        # Check if external file exists, otherwise use embedded CSS
        animations_path = Path(__file__).parent.parent / "styles" / "animations.css"
        
        if animations_path.exists():
            try:
                with open(animations_path, 'r', encoding='utf-8') as f:
                    css_content = f"<style>{f.read()}</style>"
                    self._css_cache[cache_key] = css_content
                    return css_content
            except Exception:
                pass
        
        # Fallback to embedded animations CSS
        css = """
<style>
/* ============ GLOBAL ANIMATIONS ============ */

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeInDown {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(30px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes scaleIn {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes pulse {
    0%, 100% { 
        opacity: 1; 
        transform: scale(1);
    }
    50% { 
        opacity: 0.8; 
        transform: scale(1.05);
    }
}

@keyframes shimmer {
    0% {
        background-position: -200px 0;
    }
    100% {
        background-position: calc(200px + 100%) 0;
    }
}

@keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
        transform: translate3d(0,0,0);
    }
    40%, 43% {
        transform: translate3d(0, -6px, 0);
    }
    70% {
        transform: translate3d(0, -3px, 0);
    }
    90% {
        transform: translate3d(0, -1px, 0);
    }
}

@keyframes checkmark {
    0% {
        stroke-dashoffset: 100;
    }
    100% {
        stroke-dashoffset: 0;
    }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

@keyframes expandDown {
    0% {
        opacity: 0;
        max-height: 0;
        transform: translateY(-10px);
    }
    100% {
        opacity: 1;
        max-height: 1000px;
        transform: translateY(0);
    }
}
</style>
"""
        self._css_cache[cache_key] = css
        return css
    
    def _load_components_css(self) -> str:
        """Load component-specific CSS."""
        cache_key = "components_css"
        if cache_key in self._css_cache:
            return self._css_cache[cache_key]
        
        # Check if external file exists, otherwise use embedded CSS
        components_path = Path(__file__).parent.parent / "styles" / "components.css"
        
        if components_path.exists():
            try:
                with open(components_path, 'r', encoding='utf-8') as f:
                    css_content = f"<style>{f.read()}</style>"
                    self._css_cache[cache_key] = css_content
                    return css_content
            except Exception:
                pass
        
        # Fallback to embedded components CSS
        css = """
<style>
/* ============ ENHANCED COMPONENT STYLES ============ */

/* Enhanced Button Interactions */
.stButton > button, .copy-button, .action-button {
    transition: var(--transition-spring) !important;
    position: relative;
    overflow: hidden;
    border: none !important;
    outline: none !important;
}

.stButton > button:hover, .copy-button:hover, .action-button:hover {
    transform: translateY(-2px) scale(1.02) !important;
    box-shadow: var(--shadow-lg) !important;
}

/* Form Controls */
.stTextInput > div > div, .stTextArea > div > div, .stSelectbox > div > div {
    background-color: var(--bg-input) !important;
    border-color: var(--border-color) !important;
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}

/* Progress Bars */
.stProgress > div > div > div > div {
    background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-dark) 50%, var(--primary-light) 100%) !important;
    transition: var(--transition-theme) !important;
}

/* Cards */
.metric-card-enhanced {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    box-shadow: var(--shadow-sm);
    transition: var(--transition-spring);
    position: relative;
    overflow: hidden;
    animation: scaleIn 0.6s ease-out;
    cursor: pointer;
}

.issue-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-left: 4px solid var(--primary-color);
    padding: 1.5rem;
    margin: 1rem 0;
    border-radius: 0.75rem;
    box-shadow: var(--shadow-sm);
    transition: var(--transition-spring);
    position: relative;
    overflow: hidden;
    animation: fadeInUp 0.6s ease-out;
    cursor: pointer;
}

.prompt-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin: 1rem 0;
    box-shadow: var(--shadow-sm);
    position: relative;
    overflow: hidden;
    transition: var(--transition-theme);
}

/* Loading States */
.skeleton {
    animation: shimmer 1.5s ease-in-out infinite;
    background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%);
    background-size: 200px 100%;
    border-radius: 4px;
    transition: var(--transition-theme);
}

/* Health Gauge */
.health-gauge-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 2rem 0;
    animation: fadeInUp 0.8s ease-out;
}

.health-gauge {
    position: relative;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: conic-gradient(
        from 0deg,
        #ef4444 0deg,
        #f59e0b 72deg,
        #10b981 144deg
    );
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition-spring);
    cursor: pointer;
}

/* Tooltips */
.tooltip-container {
    position: relative;
    display: inline-block;
}

.tooltip {
    position: absolute;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: var(--transition-base);
    z-index: 1000;
    backdrop-filter: blur(10px);
}

/* Responsive Design */
@media (max-width: 768px) {
    .metric-card-enhanced {
        padding: 16px;
    }
    
    .tooltip-container .tooltip {
        display: none;
    }
    
    .health-gauge {
        width: 150px;
        height: 150px;
    }
}
</style>
"""
        self._css_cache[cache_key] = css
        return css
    
    def render_theme_toggle(self, location: str = "sidebar") -> None:
        """
        Render theme toggle controls.
        
        Args:
            location: Where to render the toggle ("sidebar" or "main")
        """
        container = st.sidebar if location == "sidebar" else st
        
        with container:
            st.markdown("### Theme Settings")
            
            # Theme selector
            theme_options = {
                "Auto (Time-based)": "auto",
                "Light": "light", 
                "Dark": "dark"
            }
            
            current_preference = st.session_state.theme_preference
            current_label = next(
                label for label, value in theme_options.items() 
                if value == current_preference
            )
            
            selected_theme = st.selectbox(
                "Theme Preference",
                options=list(theme_options.keys()),
                index=list(theme_options.keys()).index(current_label),
                key="theme_selector"
            )
            
            new_theme = theme_options[selected_theme]
            
            if new_theme != current_preference:
                self.apply_theme(new_theme)
                st.rerun()
            
            # Theme info
            resolved_theme = self._resolve_theme(st.session_state.theme_preference)
            theme_icon = "🌙" if resolved_theme == "dark" else "☀️"
            
            st.markdown(f"""
            <div style="
                padding: 10px;
                border-radius: 8px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                margin-top: 10px;
                text-align: center;
                transition: var(--transition-theme);
            ">
                <span style="font-size: 24px;">{theme_icon}</span>
                <p style="margin: 5px 0 0 0; color: var(--text-secondary);">
                    Currently using <strong>{resolved_theme.title()}</strong> theme
                </p>
            </div>
            """, unsafe_allow_html=True)
    
    def get_current_theme(self) -> Literal['light', 'dark']:
        """Get the currently active theme."""
        return st.session_state.current_theme
    
    def get_theme_preference(self) -> ThemeType:
        """Get the user's theme preference."""
        return st.session_state.theme_preference
    
    def set_theme(self, theme: ThemeType) -> None:
        """Set the theme programmatically."""
        self.apply_theme(theme)
    
    def clear_cache(self) -> None:
        """Clear the CSS cache."""
        self._css_cache.clear()
    
    def export_theme_config(self) -> Dict[str, Union[str, Dict]]:
        """Export current theme configuration for backup/restore."""
        return {
            "theme_preference": st.session_state.get('theme_preference', self.default_theme),
            "current_theme": st.session_state.get('current_theme', 'light'),
            "timestamp": datetime.now().isoformat(),
            "css_cache_size": len(self._css_cache)
        }
    
    def import_theme_config(self, config: Dict[str, Union[str, Dict]]) -> None:
        """Import theme configuration from backup."""
        if 'theme_preference' in config:
            st.session_state.theme_preference = config['theme_preference']
        if 'current_theme' in config:
            st.session_state.current_theme = config['current_theme']
        
        # Re-apply the imported theme
        self.apply_theme()


# Global theme manager instance
theme_manager = ThemeManager()

# Convenience functions for backward compatibility
def get_theme_css(theme: str = 'light') -> str:
    """Legacy function for backward compatibility."""
    return theme_manager.get_theme_css(theme)

def apply_theme(theme: Optional[ThemeType] = None) -> str:
    """Apply theme and return complete CSS."""
    return theme_manager.apply_theme(theme)

def render_theme_toggle(location: str = "sidebar") -> None:
    """Render theme toggle controls."""
    theme_manager.render_theme_toggle(location)