"""
Theme Management System Usage Example

Demonstrates how to use the new modular theme management system 
that was extracted from streamlit_ui.py.
"""

import sys
from pathlib import Path

# Add the project root to the path so we can import our UI components
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

import streamlit as st
from ui.components.theme import ThemeManager

# Alternative import methods:
# from ui import theme_manager, apply_theme, render_theme_toggle
# from ui.components import theme_manager

def main():
    """Main application demonstrating theme management."""
    
    # Page configuration
    st.set_page_config(
        page_title="Theme Management Example",
        page_icon="🎨",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    # Initialize theme manager (or use the global instance)
    theme_manager = ThemeManager(default_theme='auto')
    
    # Apply the current theme - this must be called early in your app
    complete_css = theme_manager.apply_theme()
    
    # Main content
    st.title("🎨 Theme Management System Demo")
    
    st.markdown("""
    This example demonstrates the new modular theme management system 
    that has been extracted from `streamlit_ui.py` into a reusable package.
    """)
    
    # Theme toggle in sidebar
    with st.sidebar:
        st.markdown("## 🎨 Theme Controls")
        theme_manager.render_theme_toggle(location="sidebar")
        
        # Show current theme info
        current_theme = theme_manager.get_current_theme()
        preference = theme_manager.get_theme_preference()
        
        st.markdown(f"""
        **Current Theme:** {current_theme.title()}  
        **Preference:** {preference.title()}
        """)
    
    # Demo content sections
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("### 📊 Sample Metrics")
        
        # Create sample metric cards using our CSS classes
        metrics_html = """
        <div class="metric-card-enhanced">
            <div class="metric-number">42</div>
            <div class="metric-label">Total Issues</div>
        </div>
        
        <div class="metric-card-enhanced">
            <div class="metric-number">87%</div>
            <div class="metric-label">Code Coverage</div>
        </div>
        """
        st.markdown(metrics_html, unsafe_allow_html=True)
        
        # Interactive buttons
        st.markdown("### 🔘 Interactive Elements")
        
        if st.button("Primary Action", key="primary"):
            st.success("✅ Primary action completed!")
        
        if st.button("Secondary Action", key="secondary"):  
            st.info("ℹ️ Secondary action triggered!")
            
    with col2:
        st.markdown("### 🔍 Issue Card Example")
        
        # Sample issue card
        issue_html = """
        <div class="issue-card issue-high">
            <div class="issue-header">
                <span class="issue-icon">⚠️</span>
                <h3 class="issue-title">High Priority Issue</h3>
            </div>
            <div class="issue-description">
                This is an example of how issue cards appear with the new theme system.
                They automatically adapt to light and dark themes.
            </div>
            <div class="issue-location">src/example/component.py:42</div>
            <div class="issue-action">🔧 Fix recommended</div>
        </div>
        """
        st.markdown(issue_html, unsafe_allow_html=True)
        
        st.markdown("### 🎯 Health Gauge")
        
        # Health gauge example
        health_html = """
        <div class="health-gauge-container">
            <div class="health-gauge">
                <div class="health-score-text">85</div>
                <div class="health-score-label">Health Score</div>
            </div>
        </div>
        """
        st.markdown(health_html, unsafe_allow_html=True)
    
    # Progress indicators section
    st.markdown("### 📈 Progress Indicators")
    
    progress_col1, progress_col2 = st.columns(2)
    
    with progress_col1:
        st.markdown("**Enhanced Progress Bar**")
        st.progress(0.7, text="Analysis Progress: 70%")
    
    with progress_col2:
        st.markdown("**Custom Progress Stage**")
        progress_html = """
        <div class="progress-stage-enhanced">
            <div class="stage-active">🔄 Currently Processing</div>
            <div class="progress-file-info">
                Processing: analysis_engine.py
            </div>
        </div>
        """
        st.markdown(progress_html, unsafe_allow_html=True)
    
    # Animation examples
    st.markdown("### ✨ Animation Examples")
    
    anim_col1, anim_col2, anim_col3 = st.columns(3)
    
    with anim_col1:
        if st.button("Fade In Animation"):
            st.markdown(
                '<div class="animate-fade-in">🎭 This content fades in!</div>', 
                unsafe_allow_html=True
            )
    
    with anim_col2:
        if st.button("Slide In Animation"):
            st.markdown(
                '<div class="animate-slide-in">🎪 This content slides in!</div>', 
                unsafe_allow_html=True
            )
    
    with anim_col3:
        if st.button("Scale In Animation"):
            st.markdown(
                '<div class="animate-scale-in">🎯 This content scales in!</div>', 
                unsafe_allow_html=True
            )
    
    # Theme management operations
    st.markdown("### ⚙️ Theme Management Operations")
    
    mgmt_col1, mgmt_col2, mgmt_col3 = st.columns(3)
    
    with mgmt_col1:
        if st.button("Export Theme Config"):
            config = theme_manager.export_theme_config()
            st.json(config)
    
    with mgmt_col2:
        if st.button("Clear CSS Cache"):
            theme_manager.clear_cache()
            st.success("CSS cache cleared!")
    
    with mgmt_col3:
        if st.button("Force Light Theme"):
            theme_manager.set_theme('light')
            st.rerun()
    
    # Code example
    st.markdown("### 💻 Code Usage Example")
    
    st.code('''
# Basic usage in your Streamlit app:

from ui.components.theme import ThemeManager

# Initialize theme manager
theme_manager = ThemeManager(default_theme='auto')

# Apply theme (call this early in your app)
complete_css = theme_manager.apply_theme()

# Render theme toggle controls
theme_manager.render_theme_toggle(location="sidebar")

# Get current theme programmatically
current_theme = theme_manager.get_current_theme()  # 'light' or 'dark'

# Set theme programmatically
theme_manager.set_theme('dark')

# Export/import theme configuration
config = theme_manager.export_theme_config()
theme_manager.import_theme_config(config)
    ''', language='python')
    
    # Footer
    st.markdown("---")
    st.markdown("""
    <div style="text-align: center; color: var(--text-muted);">
        🎨 Theme Management System v1.0.0<br>
        Modular • Caching • Session Persistence • Auto Detection
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()