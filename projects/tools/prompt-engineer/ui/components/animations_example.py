"""
Animation Components Usage Example

This example demonstrates how to use the AnimationComponents class
for creating animated UI elements in Streamlit applications.
"""

import streamlit as st
from .animations import AnimationComponents

def example_animations_usage():
    """
    Example showing how to use the AnimationComponents class.
    """
    # Initialize animation components
    animations = AnimationComponents()
    
    # Inject CSS (should be called once at app startup)
    animations.inject_css(theme='light')
    
    st.title("Animation Components Example")
    
    # Example 1: Loading Skeleton
    st.header("1. Loading Skeletons")
    
    col1, col2 = st.columns(2)
    with col1:
        if st.button("Show Analysis Skeleton"):
            animations.show_loading_skeleton("analysis", count=2)
    
    with col2:
        if st.button("Show Metrics Skeleton"):
            animations.show_loading_skeleton("metrics")
    
    # Example 2: Success Animation
    st.header("2. Success Animation")
    
    if st.button("Show Success Message"):
        animations.show_success_animation("Operation completed successfully!", duration=2)
    
    # Example 3: Progress Indicator
    st.header("3. Progress Indicator")
    
    progress_value = st.slider("Progress", 0, 100, 50)
    if st.button("Show Progress"):
        animations.show_progress_indicator(
            stage="processing",
            progress=progress_value,
            status="Processing files...",
            max_files=1000,
            project_path="/example/project"
        )
    
    # Example 4: Enhanced Loading State
    st.header("4. Enhanced Loading State")
    
    if st.button("Show Loading State"):
        container = animations.show_enhanced_loading_state(
            stage="code_scan",
            progress=75,
            message="Scanning code files..."
        )
    
    # Example 5: Metric Cards with Tooltips
    st.header("5. Metric Cards")
    
    metric_card_html = animations.create_metric_card(
        title="Files Processed",
        value=42,
        icon="📄",
        tooltip="Total number of files analyzed"
    )
    
    st.markdown(metric_card_html, unsafe_allow_html=True)
    
    # Example 6: Health Gauge
    st.header("6. Health Gauge")
    
    score = st.slider("Health Score", 0, 100, 85)
    health_gauge_html = animations.create_health_gauge(score, "Project Health")
    st.markdown(health_gauge_html, unsafe_allow_html=True)
    
    # Example 7: Page Transitions
    st.header("7. Page Transitions")
    
    st.markdown("""
    To use page transitions, decorate your page functions:
    
    ```python
    @animations.add_page_transition_wrapper
    def my_page():
        st.write("This page will have transition animations")
    
    my_page()
    ```
    """)
    
    # Example 8: Staggered Animations
    st.header("8. Staggered Animations")
    
    if st.button("Show Staggered Items"):
        items = [
            "<div style='padding: 20px; background: #f0f9ff; margin: 10px; border-radius: 8px;'>Item 1</div>",
            "<div style='padding: 20px; background: #ecfdf5; margin: 10px; border-radius: 8px;'>Item 2</div>",
            "<div style='padding: 20px; background: #fef3c7; margin: 10px; border-radius: 8px;'>Item 3</div>"
        ]
        staggered_html = animations.create_staggered_container(items, delay_step=0.2)
        st.markdown(staggered_html, unsafe_allow_html=True)

if __name__ == "__main__":
    example_animations_usage()