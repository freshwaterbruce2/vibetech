"""
UI Components Package

Theme management and component utilities for the Prompt Engineer UI.
"""

from .theme import ThemeManager, theme_manager, apply_theme, render_theme_toggle, get_theme_css
from .animations import AnimationComponents
from .widgets import WidgetComponents

try:
    from .charts import ChartComponents
    from .progress import ProgressComponents
    CHARTS_AVAILABLE = True
    PROGRESS_AVAILABLE = True
except ImportError:
    ChartComponents = None
    ProgressComponents = None
    CHARTS_AVAILABLE = False
    PROGRESS_AVAILABLE = False

__all__ = [
    "ThemeManager",
    "theme_manager",
    "apply_theme", 
    "render_theme_toggle",
    "get_theme_css",
    "AnimationComponents",
    "WidgetComponents",
    "ChartComponents",
    "ProgressComponents",
    "CHARTS_AVAILABLE",
    "PROGRESS_AVAILABLE"
]