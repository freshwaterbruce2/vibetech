"""
UI Package for Prompt Engineer Tool

A comprehensive UI management system with modular theme management,
animations, and component styling for Streamlit applications.
"""

from .components.theme import ThemeManager, theme_manager, apply_theme, render_theme_toggle, get_theme_css

__version__ = "1.0.0"
__author__ = "Prompt Engineer UI Team"

__all__ = [
    "ThemeManager",
    "theme_manager", 
    "apply_theme",
    "render_theme_toggle",
    "get_theme_css"
]