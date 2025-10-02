"""
Pages Package

Modular page components for the Prompt Engineer UI.
Each page is a self-contained class with render() method.
"""

# Import page classes for easy access
try:
    from .analysis import AnalysisPage
    from .history import HistoryPage
    from .trends import TrendsPage
    from .settings import SettingsPage
    
    __all__ = ['AnalysisPage', 'HistoryPage', 'TrendsPage', 'SettingsPage']
    
except ImportError as e:
    print(f"Warning: Page component import error: {e}")
    # Graceful degradation
    
    class PageStub:
        """Stub page class for fallback."""
        def __init__(self, *args, **kwargs):
            pass
        
        def render(self):
            import streamlit as st
            st.error("Page component not available")
    
    AnalysisPage = PageStub
    HistoryPage = PageStub  
    TrendsPage = PageStub
    SettingsPage = PageStub
    
    __all__ = ['AnalysisPage', 'HistoryPage', 'TrendsPage', 'SettingsPage']