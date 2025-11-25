"""
Animation Components Module

This module contains all animation-related components and utilities extracted from streamlit_ui.py.
Provides reusable animation functions, CSS styles, and interactive elements for the Streamlit application.
"""

import streamlit as st
import time
from pathlib import Path
from typing import Literal, Optional, Union


class AnimationComponents:
    """
    A comprehensive class for managing animations and microinteractions in the Streamlit UI.
    
    Features:
    - Loading skeletons with shimmer effects
    - Success animations with checkmarks
    - Progress indicators with enhanced styling
    - Page transitions and staggered animations
    - Interactive tooltips and hover effects
    """
    
    def __init__(self):
        """Initialize the AnimationComponents class."""
        self.css_loaded = False
    
    def get_animation_css(self, theme: Literal['light', 'dark'] = 'light') -> str:
        """
        Generate comprehensive CSS for all animations based on theme.
        
        Args:
            theme: Theme type ('light' or 'dark')
            
        Returns:
            Complete CSS string with all animation styles
        """
        # Base CSS variables for both themes
        base_css = """
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
    from {
        opacity: 0;
        max-height: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        max-height: 500px;
        transform: translateY(0);
    }
}

/* ============ LOADING SKELETONS ============ */

.skeleton {
    animation: shimmer 1.5s ease-in-out infinite;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200px 100%;
    border-radius: 4px;
}

.skeleton-text {
    height: 16px;
    margin: 8px 0;
    border-radius: 4px;
}

.skeleton-title {
    height: 24px;
    width: 60%;
    margin: 12px 0;
    border-radius: 4px;
}

.skeleton-card {
    padding: 20px;
    border-radius: 12px;
    background: white;
    box-shadow: var(--shadow-sm);
    margin: 16px 0;
}

.skeleton-button {
    height: 40px;
    width: 120px;
    border-radius: 8px;
    margin: 8px 4px;
}

.loading-skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

/* ============ SUCCESS ANIMATIONS ============ */

.success-animation {
    display: inline-flex;
    align-items: center;
    animation: fadeInUp 0.6s ease-out;
}

.checkmark-container {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--success-color);
    margin-right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: scaleIn 0.4s ease-out 0.2s both;
}

.checkmark {
    width: 12px;
    height: 12px;
    color: white;
    stroke-width: 2;
    animation: checkmark 0.3s ease-out 0.4s both;
}

.success-message {
    animation: slideInRight 0.4s ease-out 0.3s both;
}

/* ============ INTERACTIVE TOOLTIPS ============ */

.tooltip-container {
    position: relative;
    display: inline-block;
}

.tooltip {
    position: absolute;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
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

.tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.9);
}

.tooltip-container:hover .tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(-4px);
}

.rich-tooltip {
    background: white;
    color: #1f2937;
    box-shadow: var(--shadow-xl);
    border: 1px solid #e5e7eb;
    max-width: 300px;
    white-space: normal;
}

/* ============ LOADING STATES ============ */

.loading-container {
    animation: fadeInUp 0.4s ease-out;
}

.analysis-loading {
    text-align: center;
    padding: 40px 20px;
    animation: fadeInDown 0.6s ease-out;
}

.loading-spinner {
    display: inline-block;
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-radius: 50%;
    border-top-color: var(--primary-color);
    animation: spin 1s ease-in-out infinite;
    margin: 20px auto;
}

.loading-dots {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.loading-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--primary-color);
    animation: pulse 1.4s ease-in-out infinite both;
}

.loading-dot:nth-child(2) {
    animation-delay: 0.2s;
}

.loading-dot:nth-child(3) {
    animation-delay: 0.4s;
}

/* ============ PAGE TRANSITIONS ============ */

.page-container {
    animation: fadeInUp 0.8s ease-out;
}

.section-fade-in {
    animation: fadeInUp 0.6s ease-out;
}

.section-slide-in {
    animation: slideInRight 0.6s ease-out;
}

.stagger-animation {
    animation: fadeInUp 0.6s ease-out;
}

.stagger-animation:nth-child(1) { animation-delay: 0.1s; }
.stagger-animation:nth-child(2) { animation-delay: 0.2s; }
.stagger-animation:nth-child(3) { animation-delay: 0.3s; }
.stagger-animation:nth-child(4) { animation-delay: 0.4s; }
.stagger-animation:nth-child(5) { animation-delay: 0.5s; }

/* ============ ENHANCED PROGRESS INDICATORS ============ */

.progress-stage-enhanced {
    animation: slideInRight 0.4s ease-out;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    margin: 12px 0;
    box-shadow: var(--shadow-md);
    position: relative;
    overflow: hidden;
    transition: var(--transition-base);
}

.progress-stage-enhanced:hover {
    border-color: var(--primary-color);
    box-shadow: var(--shadow-lg);
    transform: translateX(4px);
}

.progress-stage-enhanced::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(180deg, var(--primary-color), var(--primary-dark));
    transform: scaleY(0);
    transform-origin: bottom;
    transition: var(--transition-base);
}

.progress-stage-enhanced:hover::before {
    transform: scaleY(1);
}

/* ============ METRIC CARD ENHANCEMENTS ============ */

.metric-card-enhanced {
    background: white;
    border: 1px solid #e5e7eb;
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

.metric-card-enhanced:hover {
    box-shadow: var(--shadow-xl);
    transform: translateY(-4px) scale(1.02);
    border-color: var(--primary-color);
}

.metric-card-enhanced::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
    transform: scaleX(0);
    transition: var(--transition-base);
}

.metric-card-enhanced:hover::before {
    transform: scaleX(1);
    left: 0;
}

/* ============ HEALTH GAUGE ANIMATIONS ============ */

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

.health-gauge:hover {
    transform: scale(1.05) rotate(5deg);
    box-shadow: var(--shadow-xl);
}

.health-gauge::before {
    content: '';
    position: absolute;
    width: 160px;
    height: 160px;
    border-radius: 50%;
    background: white;
    transition: var(--transition-base);
}

.health-gauge:hover::before {
    background: linear-gradient(135deg, #f9fafb, #f3f4f6);
}

/* ============ ENHANCED ISSUE CARDS ============ */

.issue-card {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 1px solid #e2e8f0;
    border-left: 4px solid #3b82f6;
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

.issue-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(29, 78, 216, 0.02) 100%);
    opacity: 0;
    transition: var(--transition-base);
}

.issue-card:hover {
    box-shadow: var(--shadow-xl);
    transform: translateY(-4px) scale(1.01);
    border-left-width: 6px;
}

.issue-card:hover::before {
    opacity: 1;
}

/* ============ RESPONSIVE DESIGN ============ */

@media (max-width: 768px) {
    .loading-skeleton-grid {
        grid-template-columns: 1fr;
    }
    
    .tooltip-container .tooltip {
        display: none;
    }
    
    .metric-card-enhanced {
        padding: 16px;
    }
    
    .progress-stage-enhanced {
        padding: 16px;
    }
}
"""
        
        return f"<style>{base_css}</style>"
    
    def inject_css(self, theme: Literal['light', 'dark'] = 'light'):
        """
        Inject animation CSS into the Streamlit app.
        
        Args:
            theme: Theme type for styling
        """
        if not self.css_loaded:
            st.markdown(self.get_animation_css(theme), unsafe_allow_html=True)
            self.css_loaded = True
    
    def show_loading_skeleton(self, skeleton_type: Literal["analysis", "metrics", "health_gauge"] = "analysis", count: int = 3):
        """
        Display loading skeletons for different content types.
        
        Args:
            skeleton_type: Type of skeleton to display
            count: Number of skeleton items to show
        """
        if skeleton_type == "analysis":
            st.markdown(f"""
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
    
    def show_enhanced_loading_state(self, stage: str = "initializing", progress: int = 0, message: str = "Starting analysis..."):
        """
        Display enhanced loading state with animations.
        
        Args:
            stage: Current processing stage
            progress: Progress percentage (0-100)
            message: Loading message to display
            
        Returns:
            Streamlit container for updating the loading state
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
    
    def show_success_animation(self, message: str = "Action completed successfully!", duration: int = 3):
        """
        Display success animation with checkmark.
        
        Args:
            message: Success message to display
            duration: Duration in seconds to show the animation
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
    
    def show_progress_indicator(self, stage: str, progress: int, status: str, max_files: int = 1000, project_path: str = ""):
        """
        Display enhanced progress indicator with stage information.
        
        Args:
            stage: Current processing stage
            progress: Progress percentage
            status: Status message
            max_files: Maximum files to process
            project_path: Path to the project
        """
        stage_icons = {
            "initialization": "🔍",
            "code_scan": "📄", 
            "testing": "🧪",
            "features": "⚙️",
            "security": "🛡️",
            "processing": "⚡",
            "finalization": "📊",
            "complete": "✅"
        }
        
        stage_icon = stage_icons.get(stage, "🔄")
        stage_name = stage.replace("_", " ").title()
        
        # Enhanced stage indicator with microinteractions
        st.markdown(f"""
        <div class="progress-stage-enhanced">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <span style="font-size: 1.8rem; margin-right: 15px; 
                            {f'animation: spin 2s linear infinite;' if progress < 100 else 'animation: bounce 0.6s ease-out;'}">
                    {stage_icon}
                </span>
                <div style="flex: 1;">
                    <h3 style="margin: 0; color: #1f2937; font-size: 1.4rem; font-weight: 600;">
                        {stage_name}
                    </h3>
                    <div style="color: #6b7280; font-size: 0.9rem; margin-top: 4px;">
                        Stage {min(7, max(1, int(progress / 14) + 1))} of 7 • {progress}% Complete
                    </div>
                </div>
                <div class="tooltip-container">
                    <span style="background: var(--primary-color); color: white; 
                                 padding: 8px 16px; border-radius: 20px; font-weight: 500;">
                        {progress}%
                    </span>
                    <div class="tooltip">Analysis progress</div>
                </div>
            </div>
            <div style="background: #f1f5f9; border-radius: 6px; padding: 12px; color: #475569;">
                💬 {status}
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        # Enhanced progress bar
        st.progress(progress / 100, text=f"🚀 Analyzing your project... {progress}% complete")
        
        # File processing info with enhanced styling
        if "files" in status.lower() or "scanning" in status.lower():
            st.markdown(f"""
            <div class="progress-file-info" style="animation: slideInRight 0.3s ease-out;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center;">
                        <span style="font-size: 1.2rem; margin-right: 10px;">📁</span>
                        <div>
                            <strong style="color: #0c4a6e;">Processing Files</strong>
                            <div style="font-size: 0.875rem; color: #0369a1;">
                                Scanning up to {max_files:,} files
                            </div>
                        </div>
                    </div>
                    <code style="padding: 4px 12px; background: #dbeafe; border-radius: 6px; 
                                 color: #1e40af; font-weight: 500;">{Path(project_path).name if project_path else 'Project'}</code>
                </div>
            </div>
            """, unsafe_allow_html=True)
    
    def create_tooltip(self, content: str, tooltip_text: str, rich_content: Optional[str] = None) -> str:
        """
        Create interactive tooltip wrapper.
        
        Args:
            content: Main content to wrap
            tooltip_text: Simple tooltip text
            rich_content: Optional rich HTML content for tooltip
            
        Returns:
            HTML string with tooltip wrapper
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
    
    def add_page_transition_wrapper(self, content_func):
        """
        Decorator to add page transition animations.
        
        Args:
            content_func: Function to wrap with page transitions
            
        Returns:
            Wrapped function with page transition animations
        """
        def wrapper(*args, **kwargs):
            st.markdown('<div class="page-container">', unsafe_allow_html=True)
            result = content_func(*args, **kwargs)
            st.markdown('</div>', unsafe_allow_html=True)
            return result
        return wrapper
    
    def create_staggered_container(self, items: list, delay_step: float = 0.1) -> str:
        """
        Create a container with staggered animation for multiple items.
        
        Args:
            items: List of HTML content items
            delay_step: Delay between each item animation
            
        Returns:
            HTML string with staggered animations
        """
        staggered_html = ""
        for i, item in enumerate(items):
            delay = i * delay_step
            staggered_html += f"""
            <div class="stagger-animation" style="animation-delay: {delay}s;">
                {item}
            </div>
            """
        return staggered_html
    
    def create_health_gauge(self, score: int, label: str = "Health Score") -> str:
        """
        Create an animated health gauge component.
        
        Args:
            score: Health score (0-100)
            label: Label for the gauge
            
        Returns:
            HTML string for the health gauge
        """
        return f"""
        <div class="health-gauge-container">
            <div class="health-gauge">
                <div class="health-score-text">{score}</div>
                <div class="health-score-label">{label}</div>
            </div>
        </div>
        """
    
    def create_metric_card(self, title: str, value: Union[str, int], icon: str = "📊", tooltip: str = "") -> str:
        """
        Create an animated metric card.
        
        Args:
            title: Card title
            value: Metric value to display
            icon: Icon for the metric
            tooltip: Optional tooltip text
            
        Returns:
            HTML string for the metric card
        """
        card_content = f"""
        <div class="metric-card-enhanced">
            <div style="font-size: 2rem; margin-bottom: 10px;">{icon}</div>
            <div style="font-size: 2rem; font-weight: bold; color: var(--primary-color); margin-bottom: 5px;">
                {value}
            </div>
            <div style="color: #6b7280; font-size: 0.9rem;">
                {title}
            </div>
        </div>
        """
        
        if tooltip:
            return self.create_tooltip(card_content, tooltip)
        return card_content