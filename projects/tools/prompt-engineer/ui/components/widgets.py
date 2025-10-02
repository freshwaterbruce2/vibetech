"""
Widget Components Module

Reusable UI widget components extracted from streamlit_ui.py for creating
interactive elements, metrics, indicators, forms, and buttons.

This module provides a centralized location for all reusable UI components
used across the application.
"""

import streamlit as st
import time
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Union, Callable
import plotly.graph_objects as go
import plotly.express as px


class WidgetComponents:
    """
    Centralized collection of reusable UI widget components for Streamlit applications.
    
    This class contains methods for creating various types of interactive widgets,
    indicators, forms, buttons, and visual elements that can be reused throughout
    the application.
    """
    
    @staticmethod
    def create_custom_color_palette() -> Dict[str, str]:
        """
        Create a professional color palette for charts and widgets.
        
        Returns:
            Dict[str, str]: Color palette mapping with professional color codes
        """
        return {
            'critical': '#DC2626',    # Red
            'high': '#F59E0B',        # Amber
            'medium': '#3B82F6',      # Blue
            'low': '#10B981',         # Green
            'background': '#F8FAFC',
            'text': '#1F2937',
            'accent': '#6366F1'
        }
    
    @staticmethod
    def create_tooltip(content: str, tooltip_text: str, rich_content: Optional[str] = None) -> str:
        """
        Create interactive tooltip wrapper for enhanced user experience.
        
        Args:
            content (str): The main content to wrap with tooltip
            tooltip_text (str): Simple tooltip text
            rich_content (Optional[str]): Rich HTML content for advanced tooltips
            
        Returns:
            str: HTML string with tooltip functionality
        """
        if rich_content:
            return f"""
            <div class="tooltip-container">
                {content}
                <div class="tooltip rich-tooltip">
                    {rich_content}
                </div>
            </div>
            """
        else:
            return f"""
            <div class="tooltip-container">
                {content}
                <div class="tooltip">{tooltip_text}</div>
            </div>
            """
    
    @staticmethod
    def create_metric_card(
        label: str, 
        value: Union[str, int, float], 
        delta: Optional[Union[str, int, float]] = None,
        help_text: Optional[str] = None,
        enhanced: bool = True
    ) -> None:
        """
        Create enhanced metric cards with optional styling and help text.
        
        Args:
            label (str): The metric label
            value (Union[str, int, float]): The metric value
            delta (Optional[Union[str, int, float]]): Change indicator value
            help_text (Optional[str]): Help tooltip text
            enhanced (bool): Whether to use enhanced styling
        """
        if enhanced:
            # Create enhanced metric card with custom styling
            st.markdown(f"""
            <div class="metric-card-enhanced" title="{help_text or label}">
                <div class="metric-label">{label}</div>
                <div class="metric-value">{value}</div>
                {f'<div class="metric-delta">{delta}</div>' if delta else ''}
            </div>
            """, unsafe_allow_html=True)
        else:
            # Use standard Streamlit metric
            st.metric(label, value, delta=delta, help=help_text)
    
    @staticmethod
    def create_status_indicator(
        status: str, 
        color: Optional[str] = None, 
        icon: Optional[str] = None,
        animated: bool = False
    ) -> str:
        """
        Create visual status indicators with optional animations.
        
        Args:
            status (str): Status text to display
            color (Optional[str]): Custom color override
            icon (Optional[str]): Icon to display with status
            animated (bool): Whether to add pulsing animation
            
        Returns:
            str: HTML string for status indicator
        """
        colors = WidgetComponents.create_custom_color_palette()
        
        # Determine color based on status if not provided
        if not color:
            if 'critical' in status.lower() or 'error' in status.lower():
                color = colors['critical']
            elif 'warning' in status.lower() or 'high' in status.lower():
                color = colors['high']
            elif 'success' in status.lower() or 'good' in status.lower():
                color = colors['low']
            else:
                color = colors['medium']
        
        animation_class = 'status-pulse' if animated else ''
        icon_html = f'<span class="status-icon">{icon}</span>' if icon else ''
        
        return f"""
        <div class="status-indicator {animation_class}" style="border-left: 4px solid {color};">
            {icon_html}
            <span class="status-text">{status}</span>
        </div>
        """
    
    @staticmethod
    def create_progress_gauge(
        value: float, 
        max_value: float = 100, 
        title: str = "Progress",
        color_scheme: str = "default",
        show_percentage: bool = True
    ) -> go.Figure:
        """
        Create circular progress gauge with customizable styling.
        
        Args:
            value (float): Current value
            max_value (float): Maximum value for gauge
            title (str): Gauge title
            color_scheme (str): Color scheme ('default', 'health', 'warning', 'danger')
            show_percentage (bool): Whether to show percentage in center
            
        Returns:
            go.Figure: Plotly gauge chart
        """
        colors = WidgetComponents.create_custom_color_palette()
        
        # Define color schemes
        color_schemes = {
            'default': colors['accent'],
            'health': colors['low'],
            'warning': colors['high'],
            'danger': colors['critical']
        }
        
        gauge_color = color_schemes.get(color_scheme, colors['accent'])
        percentage = (value / max_value) * 100 if max_value > 0 else 0
        
        fig = go.Figure(go.Indicator(
            mode="gauge+number" if show_percentage else "gauge",
            value=percentage,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': title, 'font': {'size': 20}},
            gauge={
                'axis': {'range': [None, 100], 'tickwidth': 1, 'tickcolor': "darkblue"},
                'bar': {'color': gauge_color},
                'bgcolor': "white",
                'borderwidth': 2,
                'bordercolor': "gray",
                'steps': [
                    {'range': [0, 50], 'color': 'lightgray'},
                    {'range': [50, 85], 'color': 'yellow'},
                    {'range': [85, 100], 'color': 'lightgreen'}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 90
                }
            }
        ))
        
        fig.update_layout(
            height=300,
            margin=dict(l=20, r=20, t=40, b=20),
            font={'color': colors['text'], 'family': "Arial"}
        )
        
        return fig
    
    @staticmethod
    def create_health_score_display(
        score: float, 
        max_score: float = 100,
        show_details: bool = True
    ) -> None:
        """
        Create health score display with visual indicators and interpretation.
        
        Args:
            score (float): Current health score
            max_score (float): Maximum possible score
            show_details (bool): Whether to show detailed interpretation
        """
        percentage = (score / max_score) * 100 if max_score > 0 else 0
        
        # Determine health level and color
        if percentage >= 90:
            level = "Excellent"
            color = "#10B981"
            icon = "🟢"
        elif percentage >= 75:
            level = "Good"
            color = "#3B82F6"
            icon = "🔵"
        elif percentage >= 50:
            level = "Fair"
            color = "#F59E0B"
            icon = "🟡"
        else:
            level = "Needs Improvement"
            color = "#DC2626"
            icon = "🔴"
        
        # Main health score display
        col1, col2, col3 = st.columns([2, 1, 2])
        
        with col2:
            st.markdown(f"""
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 3rem; color: {color}; margin-bottom: 10px;">
                    {score:.1f}
                </div>
                <div style="font-size: 1rem; color: #6B7280; margin-bottom: 5px;">
                    Health Score
                </div>
                <div style="font-size: 1.2rem; color: {color}; font-weight: 600;">
                    {icon} {level}
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        if show_details:
            with st.expander(f"📊 Health Score Details ({percentage:.1f}%)", expanded=False):
                st.markdown(f"""
                **Score Interpretation:**
                - **90-100%**: Excellent project health
                - **75-89%**: Good project health with minor improvements needed
                - **50-74%**: Fair project health with several areas for improvement
                - **Below 50%**: Significant improvements needed
                
                **Current Status**: Your project scores {score:.1f} out of {max_score}, 
                placing it in the **{level}** category.
                """)
    
    @staticmethod
    def create_issue_card(
        issue_title: str,
        issue_description: str,
        severity: str,
        category: str,
        file_location: Optional[str] = None,
        line_number: Optional[int] = None,
        fix_suggestion: Optional[str] = None,
        card_key: Optional[str] = None
    ) -> None:
        """
        Create issue cards with severity indicators and action buttons.
        
        Args:
            issue_title (str): Issue title
            issue_description (str): Detailed issue description
            severity (str): Issue severity level
            category (str): Issue category
            file_location (Optional[str]): File where issue is located
            line_number (Optional[int]): Line number of issue
            fix_suggestion (Optional[str]): Suggested fix
            card_key (Optional[str]): Unique key for interactive elements
        """
        colors = WidgetComponents.create_custom_color_palette()
        
        # Determine severity color and icon
        severity_config = {
            'critical': {'color': colors['critical'], 'icon': '🚨'},
            'high': {'color': colors['high'], 'icon': '⚠️'},
            'medium': {'color': colors['medium'], 'icon': 'ℹ️'},
            'low': {'color': colors['low'], 'icon': '💡'}
        }
        
        config = severity_config.get(severity.lower(), severity_config['medium'])
        
        # Create expandable issue card
        with st.expander(f"{config['icon']} {issue_title}", expanded=False):
            # Issue details
            col1, col2 = st.columns([3, 1])
            
            with col1:
                st.markdown(f"**Description:** {issue_description}")
                
                if file_location:
                    location_text = f"{file_location}"
                    if line_number:
                        location_text += f" (Line {line_number})"
                    st.markdown(f"**Location:** `{location_text}`")
                
                st.markdown(f"**Category:** {category}")
                
                if fix_suggestion:
                    st.markdown(f"**Suggested Fix:** {fix_suggestion}")
            
            with col2:
                # Severity badge
                st.markdown(f"""
                <div style="text-align: center;">
                    <div style="background-color: {config['color']}; color: white; 
                               padding: 8px 16px; border-radius: 20px; font-weight: bold;">
                        {severity.upper()}
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
                # Action button
                if card_key and st.button(f"🔧 Generate Fix", key=f"fix_{card_key}", help="Generate specific fix for this issue"):
                    st.session_state[f'generate_fix_{card_key}'] = True
                    st.rerun()
    
    @staticmethod
    def create_theme_toggle_widget() -> None:
        """
        Create theme toggle widget for sidebar with enhanced styling.
        """
        current_theme = st.session_state.get('current_theme', 'light')
        
        # Theme toggle section
        st.sidebar.markdown("---")
        st.sidebar.markdown("### 🎨 Theme")
        
        # Current theme indicator
        theme_icon = "🌙" if current_theme == "dark" else "☀️"
        theme_name = "Dark Mode" if current_theme == "dark" else "Light Mode"
        
        st.sidebar.markdown(f"**Current: {theme_icon} {theme_name}**")
        
        # Theme selection options
        theme_options = {
            "auto": "🔄 Auto (System)",
            "light": "☀️ Light Mode",
            "dark": "🌙 Dark Mode"
        }
        
        selected_theme = st.sidebar.selectbox(
            "Theme Preference:",
            options=list(theme_options.keys()),
            format_func=lambda x: theme_options[x],
            index=list(theme_options.keys()).index(st.session_state.get('theme_preference', 'auto')),
            key="theme_selector"
        )
        
        # Quick toggle buttons
        col1, col2 = st.sidebar.columns(2)
        
        with col1:
            if st.button("☀️", key="quick_light", help="Switch to Light Mode", use_container_width=True):
                st.session_state.theme_preference = 'light'
                st.session_state.current_theme = 'light'
                st.rerun()
        
        with col2:
            if st.button("🌙", key="quick_dark", help="Switch to Dark Mode", use_container_width=True):
                st.session_state.theme_preference = 'dark'
                st.session_state.current_theme = 'dark'
                st.rerun()
        
        # Auto theme info
        if st.session_state.get('theme_preference') == 'auto':
            current_hour = datetime.now().hour
            if 6 <= current_hour <= 18:
                st.sidebar.info("🌅 Auto theme: Light (Daytime)")
            else:
                st.sidebar.info("🌃 Auto theme: Dark (Nighttime)")
        
        st.sidebar.markdown("---")
    
    @staticmethod
    def create_navigation_buttons(
        current_page: str,
        pages: Dict[str, str],
        button_columns: int = 4
    ) -> None:
        """
        Create navigation buttons with active state indicators.
        
        Args:
            current_page (str): Currently active page
            pages (Dict[str, str]): Mapping of page keys to display names
            button_columns (int): Number of columns for button layout
        """
        # Create button layout
        cols = st.columns(button_columns)
        
        for i, (page_key, page_name) in enumerate(pages.items()):
            col_index = i % button_columns
            with cols[col_index]:
                button_type = "primary" if current_page == page_key else "secondary"
                
                if st.button(page_name, type=button_type, use_container_width=True, key=f"nav_{page_key}"):
                    st.session_state.current_page = page_key
                    st.rerun()
    
    @staticmethod
    def create_export_buttons(
        fig: go.Figure, 
        chart_name: str, 
        key_suffix: str = "",
        export_formats: List[str] = ["png", "pdf", "html"]
    ) -> None:
        """
        Create export buttons for charts with download functionality.
        
        Args:
            fig (go.Figure): Plotly figure to export
            chart_name (str): Name for exported files
            key_suffix (str): Suffix for button keys to ensure uniqueness
            export_formats (List[str]): List of formats to support
        """
        cols = st.columns(len(export_formats))
        
        for i, fmt in enumerate(export_formats):
            with cols[i]:
                if fmt == "png":
                    if st.button(f"📊 PNG Export", key=f"png_{chart_name}_{key_suffix}", 
                               help="Download as PNG image"):
                        try:
                            img_bytes = fig.to_image(format="png", width=1200, height=800, scale=2)
                            st.download_button(
                                label="📥 Download PNG",
                                data=img_bytes,
                                file_name=f"{chart_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png",
                                mime="image/png",
                                key=f"download_png_{chart_name}_{key_suffix}"
                            )
                        except Exception as e:
                            st.error(f"Export failed: {str(e)}")
                
                elif fmt == "pdf":
                    if st.button(f"📄 PDF Export", key=f"pdf_{chart_name}_{key_suffix}", 
                               help="Download as PDF"):
                        try:
                            pdf_bytes = fig.to_image(format="pdf", width=1200, height=800)
                            st.download_button(
                                label="📥 Download PDF", 
                                data=pdf_bytes,
                                file_name=f"{chart_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf",
                                mime="application/pdf",
                                key=f"download_pdf_{chart_name}_{key_suffix}"
                            )
                        except Exception as e:
                            st.error(f"Export failed: {str(e)}")
                
                elif fmt == "html":
                    if st.button(f"🌐 HTML Export", key=f"html_{chart_name}_{key_suffix}", 
                               help="Download as interactive HTML"):
                        try:
                            html_str = fig.to_html(
                                include_plotlyjs='cdn',
                                config={
                                    'displayModeBar': True,
                                    'displaylogo': False,
                                    'modeBarButtonsToRemove': ['pan2d', 'lasso2d']
                                }
                            )
                            st.download_button(
                                label="📥 Download HTML",
                                data=html_str,
                                file_name=f"{chart_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html",
                                mime="text/html",
                                key=f"download_html_{chart_name}_{key_suffix}"
                            )
                        except Exception as e:
                            st.error(f"Export failed: {str(e)}")
    
    @staticmethod
    def show_loading_skeleton(skeleton_type: str = "analysis", count: int = 3) -> None:
        """
        Display loading skeletons for different content types.
        
        Args:
            skeleton_type (str): Type of skeleton ('analysis', 'metrics', 'health_gauge')
            count (int): Number of skeleton elements to show
        """
        if skeleton_type == "analysis":
            st.markdown("""
            <div class="loading-skeleton-grid">
            """ + "".join([f"""
                <div class="skeleton-card">
                    <div class="skeleton skeleton-title"></div>
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text" style="width: 80%;"></div>
                    <div class="skeleton skeleton-text" style="width: 60%;"></div>
                    <div class="skeleton skeleton-button"></div>
                </div>
            """ for _ in range(count)]) + """
            </div>
            """, unsafe_allow_html=True)
        
        elif skeleton_type == "metrics":
            cols = st.columns(4)
            for i, col in enumerate(cols):
                with col:
                    st.markdown(f"""
                    <div class="metric-card-enhanced">
                        <div class="skeleton skeleton-title" style="width: 50%; margin: 0 auto 16px;"></div>
                        <div class="skeleton skeleton-text" style="width: 70%; margin: 0 auto;"></div>
                    </div>
                    """, unsafe_allow_html=True)
        
        elif skeleton_type == "health_gauge":
            st.markdown("""
            <div class="health-gauge-container">
                <div class="skeleton" style="width: 200px; height: 200px; border-radius: 50%; margin: 2rem 0;"></div>
            </div>
            """, unsafe_allow_html=True)
    
    @staticmethod
    def show_enhanced_loading_state(
        stage: str = "initializing", 
        progress: int = 0, 
        message: str = "Starting analysis..."
    ) -> st.empty:
        """
        Display enhanced loading state with animations and progress.
        
        Args:
            stage (str): Current processing stage
            progress (int): Progress percentage (0-100)
            message (str): Loading message to display
            
        Returns:
            st.empty: Container for updating loading state
        """
        loading_container = st.empty()
        
        with loading_container.container():
            st.markdown(f"""
            <div class="analysis-loading">
                <div class="loading-spinner"></div>
                <h3 style="color: var(--primary-color); margin: 20px 0;">{stage.replace('_', ' ').title()}</h3>
                <div class="loading-dots">
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                    <div class="loading-dot"></div>
                </div>
                <p style="margin-top: 16px; color: #6b7280;">{message}</p>
            </div>
            """, unsafe_allow_html=True)
            
            # Progress bar with enhanced styling
            progress_bar = st.progress(progress / 100, text=f"📊 {progress}% Complete")
        
        return loading_container
    
    @staticmethod
    def show_success_animation(
        message: str = "Action completed successfully!", 
        duration: int = 3
    ) -> None:
        """
        Display success animation with checkmark.
        
        Args:
            message (str): Success message to display
            duration (int): Duration to show animation (seconds)
        """
        success_placeholder = st.empty()
        
        with success_placeholder.container():
            st.markdown(f"""
            <div class="success-animation">
                <div class="checkmark-container">
                    <svg class="checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <span class="success-message" style="color: var(--success-color); font-weight: 500;">
                    {message}
                </span>
            </div>
            """, unsafe_allow_html=True)
        
        # Auto-clear after duration
        time.sleep(duration)
        success_placeholder.empty()
    
    @staticmethod
    def create_floating_help_button() -> None:
        """
        Create floating help button with comprehensive tooltips.
        """
        help_tooltip = WidgetComponents.create_tooltip(
            content='<div class="floating-help">?</div>',
            tooltip_text="Help",
            rich_content='''
            <h4>Quick Help</h4>
            <p><strong>Existing Project:</strong> Analyze your codebase for issues and improvements</p>
            <p><strong>New Project:</strong> Guided setup with requirements gathering</p>
            <p><strong>Export:</strong> Save analysis results in multiple formats</p>
            <p><strong>Smart Prompts:</strong> AI-optimized prompts based on real project data</p>
            '''
        )
        
        st.markdown(help_tooltip, unsafe_allow_html=True)
    
    @staticmethod
    def create_file_selector_widget(
        label: str,
        path_key: str,
        recent_projects: List[str] = None,
        placeholder: str = "Enter file or directory path..."
    ) -> Optional[str]:
        """
        Create file/directory selector widget with recent options.
        
        Args:
            label (str): Label for the selector
            path_key (str): Session state key for storing path
            recent_projects (List[str]): List of recent project paths
            placeholder (str): Placeholder text for input
            
        Returns:
            Optional[str]: Selected file path
        """
        # Recent projects dropdown if available
        if recent_projects:
            st.subheader("Recent Projects")
            selected_recent = st.selectbox(
                "Choose from recent:",
                [""] + recent_projects,
                key=f"recent_{path_key}"
            )
            if selected_recent:
                st.session_state[path_key] = selected_recent
        
        # Manual path input
        path = st.text_input(
            label,
            value=st.session_state.get(path_key, ''),
            placeholder=placeholder,
            help="Enter the full path to your project directory"
        )
        
        if path:
            st.session_state[path_key] = path
            return path
        
        return None
    
    @staticmethod
    def create_analysis_options_sidebar() -> Dict[str, Any]:
        """
        Create comprehensive analysis options sidebar.
        
        Returns:
            Dict[str, Any]: Analysis configuration options
        """
        st.sidebar.subheader("⚙️ Analysis Options")
        
        options = {}
        
        options['max_files'] = st.sidebar.slider(
            "Max Files to Analyze:",
            min_value=10,
            max_value=1000,
            value=200,
            step=10,
            help="Limit files for large projects"
        )
        
        options['save_analysis'] = st.sidebar.checkbox(
            "Save Analysis Results",
            value=True,
            help="Save detailed analysis as JSON"
        )
        
        options['include_tests'] = st.sidebar.checkbox(
            "Include Test Files",
            value=True,
            help="Analyze test files for coverage insights"
        )
        
        options['deep_analysis'] = st.sidebar.checkbox(
            "Deep Code Analysis",
            value=False,
            help="Perform detailed code quality analysis (slower)"
        )
        
        st.sidebar.subheader("📥 Export Options")
        
        options['export_format'] = st.sidebar.selectbox(
            "Export Format:",
            ["JSON Report", "Markdown Report", "Quick Summary"],
            help="Choose export format for analysis results"
        )
        
        return options