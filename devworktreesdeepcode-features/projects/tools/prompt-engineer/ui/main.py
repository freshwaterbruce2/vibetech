#!/usr/bin/env python3
"""
UI Main Orchestrator - New main UI orchestrator

Provides backward compatibility while using modular components.
This replaces the monolithic streamlit_ui.py with a clean, maintainable architecture.
"""

import streamlit as st
import sys
from pathlib import Path

# Add paths for imports
current_dir = Path(__file__).parent.parent
sys.path.insert(0, str(current_dir))

# Import modular components (with fallback handling)
try:
    from ui.components import charts, theme, animations, widgets
    from ui.pages import analysis, history, trends, settings
    from ui.utils import state_manager
except ImportError as e:
    st.error(f"Component import error: {e}")
    st.stop()

class PromptEngineerUI:
    """Main UI orchestrator maintaining backward compatibility."""
    
    def __init__(self):
        """Initialize the modular UI system."""
        self.state_manager = state_manager.StateManager()
        self.theme_manager = theme.ThemeManager()
        self.charts = charts.ChartComponents()
        self.animations = animations.AnimationComponents()
        self.widgets = widgets.WidgetComponents()
        
        # Initialize progress components if available
        try:
            from ui.components.progress import ProgressComponents
            self.progress = ProgressComponents(self.theme_manager)
        except ImportError:
            self.progress = None
        
        # Initialize Streamlit configuration
        self._initialize_streamlit_config()
        
    def _initialize_streamlit_config(self):
        """Initialize Streamlit page configuration."""
        try:
            st.set_page_config(
                page_title="Prompt Engineer - Intelligent Analysis",
                page_icon="🤖",
                layout="wide",
                initial_sidebar_state="expanded"
            )
        except st.errors.StreamlitAPIException:
            # Config already set, skip
            pass
    
    def run(self):
        """Main entry point matching original streamlit_ui.py interface."""
        try:
            # Initialize theme first
            self.theme_manager.apply_theme()
            
            # Initialize session state
            self.state_manager.initialize_session_state()
            
            # Render navigation
            self._render_navigation()
            
            # Route to appropriate page
            current_page = st.session_state.get('current_page', 'analysis')
            self._route_to_page(current_page)
            
        except Exception as e:
            st.error(f"UI Error: {str(e)}")
            self._render_error_fallback()
    
    def _render_navigation(self):
        """Render main navigation sidebar."""
        with st.sidebar:
            st.title("🤖 Prompt Engineer")
            
            # Theme toggle
            self.theme_manager.render_theme_toggle()
            
            st.markdown("---")
            
            # Navigation menu
            page_options = {
                'analysis': '📊 Analysis',
                'history': '📈 History', 
                'trends': '📉 Trends',
                'settings': '⚙️ Settings'
            }
            
            for page_key, page_label in page_options.items():
                if st.button(
                    page_label, 
                    key=f"nav_{page_key}",
                    use_container_width=True,
                    type="primary" if st.session_state.get('current_page', 'analysis') == page_key else "secondary"
                ):
                    st.session_state.current_page = page_key
                    st.rerun()
    
    def _route_to_page(self, current_page: str):
        """Route to the appropriate page component."""
        page_router = {
            'analysis': self._render_analysis_page,
            'history': self._render_history_page,
            'trends': self._render_trends_page,
            'settings': self._render_settings_page
        }
        
        render_function = page_router.get(current_page, self._render_analysis_page)
        render_function()
    
    def _render_analysis_page(self):
        """Render the analysis page."""
        try:
            analysis_page = analysis.AnalysisPage(
                theme_manager=self.theme_manager,
                charts=self.charts,
                animations=self.animations,
                widgets=self.widgets,
                progress=self.progress
            )
            analysis_page.render()
        except Exception as e:
            st.error(f"Analysis page error: {e}")
            self._fallback_analysis_page()
    
    def _render_history_page(self):
        """Render the history page."""
        try:
            history_page = history.HistoryPage(
                theme_manager=self.theme_manager,
                charts=self.charts,
                widgets=self.widgets
            )
            history_page.render()
        except Exception as e:
            st.error(f"History page error: {e}")
            self._fallback_history_page()
    
    def _render_trends_page(self):
        """Render the trends page."""
        try:
            trends_page = trends.TrendsPage(
                theme_manager=self.theme_manager,
                charts=self.charts,
                widgets=self.widgets
            )
            trends_page.render()
        except Exception as e:
            st.error(f"Trends page error: {e}")
            self._fallback_trends_page()
    
    def _render_settings_page(self):
        """Render the settings page."""
        try:
            settings_page = settings.SettingsPage(
                theme_manager=self.theme_manager,
                state_manager=self.state_manager
            )
            settings_page.render()
        except Exception as e:
            st.error(f"Settings page error: {e}")
            self._fallback_settings_page()
    
    def _render_error_fallback(self):
        """Render error fallback page."""
        st.markdown("# ⚠️ Application Error")
        st.markdown("The application encountered an error. Please refresh the page.")
        
        if st.button("🔄 Refresh"):
            st.rerun()
    
    def _fallback_analysis_page(self):
        """Fallback analysis page with minimal functionality."""
        st.markdown("# 📊 Project Analysis")
        st.markdown("Analysis page is temporarily unavailable.")
        
        if st.button("🔄 Retry"):
            st.rerun()
    
    def _fallback_history_page(self):
        """Fallback history page."""
        st.markdown("# 📈 Analysis History")
        st.markdown("History page is temporarily unavailable.")
    
    def _fallback_trends_page(self):
        """Fallback trends page."""
        st.markdown("# 📉 Trends")
        st.markdown("Trends page is temporarily unavailable.")
    
    def _fallback_settings_page(self):
        """Fallback settings page."""
        st.markdown("# ⚙️ Settings")
        st.markdown("Settings page is temporarily unavailable.")

# Backward compatibility function
def main():
    """Main entry point for backward compatibility with original streamlit_ui.py."""
    app = PromptEngineerUI()
    app.run()

# For direct execution
if __name__ == "__main__":
    main()