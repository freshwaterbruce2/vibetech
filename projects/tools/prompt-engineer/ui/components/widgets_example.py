"""
Widget Components Example

This file demonstrates how to use the extracted WidgetComponents class
from the widgets.py module.
"""

import streamlit as st
from .widgets import WidgetComponents

# Example of using WidgetComponents in a Streamlit app
def main():
    """Example usage of WidgetComponents."""
    
    st.title("🎯 Widget Components Demo")
    
    # Color palette example
    st.header("🎨 Color Palette")
    colors = WidgetComponents.create_custom_color_palette()
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(f'<div style="background: {colors["critical"]}; color: white; padding: 10px; border-radius: 5px;">Critical</div>', unsafe_allow_html=True)
    with col2:
        st.markdown(f'<div style="background: {colors["high"]}; color: white; padding: 10px; border-radius: 5px;">High</div>', unsafe_allow_html=True)
    with col3:
        st.markdown(f'<div style="background: {colors["medium"]}; color: white; padding: 10px; border-radius: 5px;">Medium</div>', unsafe_allow_html=True)
    with col4:
        st.markdown(f'<div style="background: {colors["low"]}; color: white; padding: 10px; border-radius: 5px;">Low</div>', unsafe_allow_html=True)
    
    # Metric cards example
    st.header("📊 Metric Cards")
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        WidgetComponents.create_metric_card("Total Issues", 42, delta="+5", enhanced=True)
    with col2:
        WidgetComponents.create_metric_card("Health Score", 85.3, delta="+2.1")
    with col3:
        WidgetComponents.create_metric_card("Files Analyzed", 150)
    with col4:
        WidgetComponents.create_metric_card("Code Quality", "Good", help_text="Based on analysis metrics")
    
    # Status indicators
    st.header("🚨 Status Indicators")
    
    status_examples = [
        ("Critical Error Found", "critical"),
        ("Warning: Potential Issue", "warning"),
        ("Analysis Complete", "success"),
        ("Processing...", "info")
    ]
    
    for status, status_type in status_examples:
        status_html = WidgetComponents.create_status_indicator(
            status=status, 
            animated=status == "Processing...",
            icon="⚠️" if "warning" in status.lower() else "✅" if "complete" in status.lower() else None
        )
        st.markdown(status_html, unsafe_allow_html=True)
    
    # Health score display
    st.header("💪 Health Score Display")
    WidgetComponents.create_health_score_display(score=78.5, show_details=True)
    
    # Progress gauge
    st.header("📈 Progress Gauge")
    gauge_fig = WidgetComponents.create_progress_gauge(
        value=78.5, 
        title="Project Health",
        color_scheme="health"
    )
    st.plotly_chart(gauge_fig, use_container_width=True)
    
    # Issue card example
    st.header("🐛 Issue Card")
    WidgetComponents.create_issue_card(
        issue_title="Missing Error Handling",
        issue_description="Function does not handle potential null pointer exceptions",
        severity="high",
        category="Error Handling",
        file_location="src/utils/helper.py",
        line_number=45,
        fix_suggestion="Add try-catch block around database operations",
        card_key="example_issue"
    )
    
    # Navigation buttons
    st.header("🧭 Navigation Example")
    pages = {
        "analysis": "🔍 Analysis",
        "history": "📊 History", 
        "trends": "📈 Trends",
        "settings": "⚙️ Settings"
    }
    
    # Initialize current page if not set
    if 'current_page' not in st.session_state:
        st.session_state.current_page = 'analysis'
    
    WidgetComponents.create_navigation_buttons(
        current_page=st.session_state.current_page,
        pages=pages
    )
    
    st.write(f"Current page: **{st.session_state.current_page}**")
    
    # Loading states
    st.header("⏳ Loading States")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Loading Skeletons")
        if st.button("Show Analysis Skeleton"):
            WidgetComponents.show_loading_skeleton("analysis", count=2)
    
    with col2:
        st.subheader("Metrics Skeleton")
        if st.button("Show Metrics Skeleton"):
            WidgetComponents.show_loading_skeleton("metrics", count=1)
    
    # File selector widget
    st.header("📁 File Selector")
    
    recent_projects = [
        "C:\\dev\\project1",
        "C:\\dev\\project2", 
        "C:\\dev\\project3"
    ]
    
    selected_path = WidgetComponents.create_file_selector_widget(
        label="Select Project Path:",
        path_key="demo_path",
        recent_projects=recent_projects,
        placeholder="Enter your project path..."
    )
    
    if selected_path:
        st.success(f"Selected path: {selected_path}")
    
    # Analysis options sidebar
    st.header("⚙️ Analysis Options (Sidebar)")
    st.write("Check the sidebar for analysis options configured by WidgetComponents")
    
    # Show analysis options in sidebar
    analysis_options = WidgetComponents.create_analysis_options_sidebar()
    
    # Display selected options
    with st.expander("📋 Current Analysis Configuration"):
        st.json(analysis_options)
    
    # Tooltip example
    st.header("💡 Tooltip Example")
    tooltip_html = WidgetComponents.create_tooltip(
        content='<button style="padding: 8px 16px; background: #3B82F6; color: white; border: none; border-radius: 4px;">Hover me</button>',
        tooltip_text="Simple Tooltip",
        rich_content='<h4>Rich Tooltip</h4><p>This is a <strong>rich content</strong> tooltip with HTML formatting!</p>'
    )
    st.markdown(tooltip_html, unsafe_allow_html=True)

if __name__ == "__main__":
    main()