#!/usr/bin/env python3
"""
Modular Streamlit UI for the Prompt Engineer Tool

Refactored version using modular components while maintaining full backward compatibility.
This version uses the new ui.main.PromptEngineerUI orchestrator with fallback support.
"""

import sys
import os
from pathlib import Path

# Add paths for imports
sys.path.insert(0, str(Path(__file__).parent / 'src'))
sys.path.insert(0, str(Path(__file__).parent))

import streamlit as st

# Try to use modular UI first, fallback to original if needed
USE_MODULAR_UI = True

try:
    from ui.main import PromptEngineerUI
    modular_ui_available = True
except ImportError as e:
    print(f"Modular UI not available: {e}")
    modular_ui_available = False

# Import original UI functions as fallback
try:
    from src.analyzers.project_intelligence import ProjectIntelligenceAnalyzer
    from src.generators.smart_prompts import SmartPromptGenerator
    from src.wizards.new_project_wizard import NewProjectWizard
    from src.database.analysis_history import AnalysisHistoryManager, AnalysisSnapshot, ComparisonReport
    fallback_imports_available = True
except ImportError as e:
    st.error(f"Critical import error: {e}")
    fallback_imports_available = False
    st.stop()

def main():
    """Main entry point with modular UI and fallback support."""
    
    # Try modular UI first
    if USE_MODULAR_UI and modular_ui_available:
        try:
            app = PromptEngineerUI()
            app.run()
            return
        except Exception as e:
            st.error(f"Modular UI error: {e}")
            st.error("Falling back to original UI...")
            # Continue to fallback
    
    # Fallback to original UI implementation
    if not fallback_imports_available:
        st.error("Neither modular UI nor fallback UI components are available.")
        st.stop()
    
    # Initialize original UI
    run_original_ui()

def run_original_ui():
    """Run the original UI as fallback."""
    st.markdown("# 🤖 Prompt Engineer - Legacy Mode")
    st.markdown("*Running in legacy mode - modular UI unavailable*")
    
    # Page configuration (already set above, but included for completeness)
    try:
        st.set_page_config(
            page_title="Prompt Engineer - Intelligent Analysis",
            page_icon="🤖",
            layout="wide",
            initial_sidebar_state="expanded"
        )
    except st.errors.StreamlitAPIException:
        pass  # Config already set
    
    # Initialize session state
    initialize_legacy_session_state()
    
    # Apply basic theme
    apply_basic_theme()
    
    # Render navigation
    render_legacy_navigation()
    
    # Route to appropriate page
    current_page = st.session_state.get('current_page', 'analysis')
    
    if current_page == 'analysis':
        render_legacy_analysis_page()
    elif current_page == 'history':
        render_legacy_history_page()
    elif current_page == 'trends':
        render_legacy_trends_page()
    else:
        render_legacy_analysis_page()

def initialize_legacy_session_state():
    """Initialize session state for legacy UI."""
    if 'current_page' not in st.session_state:
        st.session_state.current_page = 'analysis'
    
    if 'theme_preference' not in st.session_state:
        st.session_state.theme_preference = 'light'
    
    if 'project_path' not in st.session_state:
        st.session_state.project_path = ""
    
    if 'analysis_result' not in st.session_state:
        st.session_state.analysis_result = None

def apply_basic_theme():
    """Apply basic theme styling for legacy mode."""
    basic_css = """
    <style>
    .main .block-container {
        padding: 2rem 1rem;
    }
    
    .stAlert {
        margin: 1rem 0;
    }
    
    .metric-card {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        border: 1px solid #e9ecef;
        margin: 0.5rem 0;
    }
    
    .success-message {
        color: #28a745;
        font-weight: bold;
    }
    
    .error-message {
        color: #dc3545;
        font-weight: bold;
    }
    </style>
    """
    st.markdown(basic_css, unsafe_allow_html=True)

def render_legacy_navigation():
    """Render navigation for legacy UI."""
    with st.sidebar:
        st.title("🤖 Prompt Engineer")
        st.markdown("*Legacy Mode*")
        st.markdown("---")
        
        # Theme toggle
        if st.button("🌓 Toggle Theme"):
            st.session_state.theme_preference = 'dark' if st.session_state.theme_preference == 'light' else 'light'
            st.rerun()
        
        st.markdown("---")
        
        # Navigation
        if st.button("📊 Analysis", use_container_width=True):
            st.session_state.current_page = 'analysis'
            st.rerun()
        
        if st.button("📈 History", use_container_width=True):
            st.session_state.current_page = 'history'
            st.rerun()
        
        if st.button("📉 Trends", use_container_width=True):
            st.session_state.current_page = 'trends'
            st.rerun()

def render_legacy_analysis_page():
    """Render analysis page in legacy mode."""
    st.markdown("# 📊 Project Analysis")
    
    # Project path input
    project_path = st.text_input(
        "Project Path",
        value=st.session_state.project_path,
        placeholder="Enter path to your project directory"
    )
    
    if project_path != st.session_state.project_path:
        st.session_state.project_path = project_path
    
    # Analysis options
    col1, col2 = st.columns(2)
    
    with col1:
        max_files = st.number_input("Max Files", min_value=10, max_value=10000, value=1000)
    
    with col2:
        include_tests = st.checkbox("Include Test Execution", value=False)
    
    # Analysis button
    if st.button("🔍 Start Analysis", type="primary"):
        if not project_path:
            st.error("Please enter a project path")
            return
        
        if not Path(project_path).exists():
            st.error("Project path does not exist")
            return
        
        # Run analysis
        with st.spinner("Analyzing project..."):
            try:
                analyzer = ProjectIntelligenceAnalyzer()
                result = analyzer.analyze_project(project_path, max_files)
                st.session_state.analysis_result = result
                
                st.success("✅ Analysis completed!")
                
                # Display basic results
                display_legacy_analysis_results(result)
                
            except Exception as e:
                st.error(f"Analysis failed: {str(e)}")

def display_legacy_analysis_results(result):
    """Display analysis results in legacy mode."""
    if not result:
        return
    
    st.markdown("## 📋 Analysis Results")
    
    # Basic metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Health Score", f"{result.health_score}/100")
    
    with col2:
        st.metric("Critical Issues", len(result.critical_issues))
    
    with col3:
        st.metric("High Priority", len(result.high_priority_issues))
    
    with col4:
        st.metric("Total Issues", 
                 len(result.critical_issues) + len(result.high_priority_issues) + 
                 len(result.medium_priority_issues) + len(result.low_priority_issues))
    
    # Critical issues
    if result.critical_issues:
        st.markdown("### 🚨 Critical Issues")
        for i, issue in enumerate(result.critical_issues[:5], 1):
            with st.expander(f"{i}. {issue.title}"):
                st.write(f"**Description:** {issue.description}")
                if issue.suggested_action:
                    st.write(f"**Action:** {issue.suggested_action}")
                if issue.file_path:
                    st.write(f"**File:** {issue.file_path}")
    
    # High priority issues
    if result.high_priority_issues:
        st.markdown("### ⚠️ High Priority Issues")
        for i, issue in enumerate(result.high_priority_issues[:5], 1):
            with st.expander(f"{i}. {issue.title}"):
                st.write(f"**Description:** {issue.description}")
                if issue.suggested_action:
                    st.write(f"**Action:** {issue.suggested_action}")

def render_legacy_history_page():
    """Render history page in legacy mode."""
    st.markdown("# 📈 Analysis History")
    st.markdown("*History functionality available in full modular UI*")
    
    # Try to load history
    try:
        history_manager = AnalysisHistoryManager()
        
        # Get recent analyses
        recent_analyses = history_manager.get_recent_analyses(limit=10)
        
        if recent_analyses:
            st.markdown("## Recent Analyses")
            
            for analysis in recent_analyses:
                with st.expander(f"Analysis: {analysis.project_name} - {analysis.timestamp}"):
                    st.write(f"**Health Score:** {analysis.health_score}/100")
                    st.write(f"**Total Issues:** {analysis.total_issues}")
                    st.write(f"**Project Path:** {analysis.project_path}")
        else:
            st.info("No analysis history found. Run some analyses first!")
    
    except Exception as e:
        st.error(f"Failed to load history: {e}")

def render_legacy_trends_page():
    """Render trends page in legacy mode."""
    st.markdown("# 📉 Trends")
    st.markdown("*Advanced trends analysis available in full modular UI*")
    
    st.info("Trends visualization requires the full modular UI components.")
    
    # Basic trend information
    if st.session_state.analysis_result:
        result = st.session_state.analysis_result
        st.markdown("## Current Project Metrics")
        
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Current Health Score", f"{result.health_score}/100")
        with col2:
            st.metric("Project Type", result.project_type)
        
        if result.tech_stack:
            st.markdown("### Technology Stack")
            for tech in result.tech_stack:
                st.write(f"• {tech}")
    else:
        st.info("No analysis data available. Please run an analysis first.")

# Development mode toggle
if __name__ == "__main__":
    # Check for development flags
    if "--legacy" in sys.argv:
        USE_MODULAR_UI = False
        print("Running in legacy mode (--legacy flag detected)")
    
    if "--debug" in sys.argv:
        st.markdown("**Debug Mode Enabled**")
        st.write(f"Modular UI Available: {modular_ui_available}")
        st.write(f"Fallback Imports Available: {fallback_imports_available}")
        st.write(f"Using Modular UI: {USE_MODULAR_UI}")
    
    main()