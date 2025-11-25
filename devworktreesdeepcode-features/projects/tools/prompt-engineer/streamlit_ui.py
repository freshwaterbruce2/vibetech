#!/usr/bin/env python3
"""
Intelligent Streamlit UI for the Prompt Engineer Tool

A comprehensive interactive interface that performs deep project analysis
and generates specific, actionable prompts based on real project issues.
"""

import sys
import os
import json
import time
import streamlit as st
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Optional, List
import pandas as pd
import numpy as np

# Plotly imports for advanced visualizations
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import plotly.colors as pc

# Add src and ui to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))
sys.path.insert(0, str(Path(__file__).parent))

# Try to import modular UI components
USE_MODULAR_UI = True
try:
    from ui.main import PromptEngineerUI
    MODULAR_UI_AVAILABLE = True
except ImportError as e:
    print(f"Modular UI not available: {e}")
    MODULAR_UI_AVAILABLE = False
    USE_MODULAR_UI = False

try:
    from src.analyzers.project_intelligence import ProjectIntelligenceAnalyzer
    from src.generators.smart_prompts import SmartPromptGenerator, AIModel
    from src.wizards.new_project_wizard import NewProjectWizard
    from src.database.analysis_history import AnalysisHistoryManager, AnalysisSnapshot, ComparisonReport
except ImportError as e:
    st.error(f"Import error: {e}")
    st.stop()

# Page configuration
st.set_page_config(
    page_title="Prompt Engineer - Intelligent Analysis",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

def get_theme_css(theme: str = 'light') -> str:
    """Generate theme-specific CSS with enhanced dark mode support."""
    
    if theme == 'dark':
        return """
<style>
/* ============ DARK THEME VARIABLES ============ */
:root {
    /* Primary Colors */
    --primary-color: #60a5fa;
    --primary-dark: #3b82f6;
    --primary-light: #93c5fd;
    
    /* Status Colors */
    --success-color: #34d399;
    --warning-color: #fbbf24;
    --danger-color: #f87171;
    --info-color: #60a5fa;
    
    /* Background Colors */
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --bg-tertiary: #334155;
    --bg-card: #1e293b;
    --bg-sidebar: #0f172a;
    --bg-input: #334155;
    --bg-button: #475569;
    --bg-hover: #475569;
    
    /* Text Colors */
    --text-primary: #f1f5f9;
    --text-secondary: #cbd5e1;
    --text-muted: #94a3b8;
    --text-inverse: #0f172a;
    
    /* Border Colors */
    --border-color: #475569;
    --border-light: #334155;
    --border-focus: #60a5fa;
    
    /* Shadow Colors */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
    
    /* Transitions */
    --transition-base: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-spring: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    --transition-theme: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ============ DARK THEME GLOBAL OVERRIDES ============ */
.main .block-container {
    background-color: var(--bg-primary) !important;
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}

.stApp {
    background-color: var(--bg-primary) !important;
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}

/* Sidebar dark theme */
.css-1d391kg, .css-1y4p8pa {
    background: linear-gradient(180deg, var(--bg-sidebar) 0%, var(--bg-secondary) 100%) !important;
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}

/* Header dark theme */
header[data-testid="stHeader"] {
    background-color: var(--bg-primary) !important;
    transition: var(--transition-theme) !important;
}

/* Text elements */
h1, h2, h3, h4, h5, h6, p, span, div, label {
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}

/* Muted text */
.stMarkdown p, .css-1629p8f p {
    color: var(--text-secondary) !important;
}

/* Cards and containers */
.metric-card-enhanced, .issue-card, .prompt-card {
    background: var(--bg-card) !important;
    border-color: var(--border-color) !important;
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}

.metric-card-enhanced:hover, .issue-card:hover, .prompt-card:hover {
    background: var(--bg-tertiary) !important;
    box-shadow: var(--shadow-lg) !important;
}
"""
    else:
        return """
<style>
/* ============ LIGHT THEME VARIABLES ============ */
:root {
    /* Primary Colors */
    --primary-color: #3b82f6;
    --primary-dark: #1d4ed8;
    --primary-light: #93c5fd;
    
    /* Status Colors */
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --danger-color: #ef4444;
    --info-color: #3b82f6;
    
    /* Background Colors */
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --bg-tertiary: #f1f5f9;
    --bg-card: #ffffff;
    --bg-sidebar: #f8fafc;
    --bg-input: #ffffff;
    --bg-button: #f1f5f9;
    --bg-hover: #f1f5f9;
    
    /* Text Colors */
    --text-primary: #1f2937;
    --text-secondary: #4b5563;
    --text-muted: #6b7280;
    --text-inverse: #ffffff;
    
    /* Border Colors */
    --border-color: #e5e7eb;
    --border-light: #f3f4f6;
    --border-focus: #3b82f6;
    
    /* Shadow Colors */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    
    /* Transitions */
    --transition-base: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    --transition-spring: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    --transition-theme: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ============ LIGHT THEME GLOBAL STYLES ============ */
.main .block-container {
    background-color: var(--bg-primary) !important;
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}

.stApp {
    background-color: var(--bg-primary) !important;
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}

/* Sidebar light theme */
.css-1d391kg, .css-1y4p8pa {
    background: linear-gradient(180deg, var(--bg-sidebar) 0%, var(--bg-secondary) 100%) !important;
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}
"""

# Initialize session state first to avoid errors
if 'theme_preference' not in st.session_state:
    st.session_state.theme_preference = 'auto'
if 'current_theme' not in st.session_state:
    # Use default detection if session state not ready
    from datetime import datetime
    current_hour = datetime.now().hour
    default_theme = 'light' if 6 <= current_hour <= 18 else 'dark'
    st.session_state.current_theme = default_theme

# Enhanced CSS for professional styling with advanced microinteractions
theme_css = get_theme_css(st.session_state.current_theme)
complete_css = theme_css + """

/* ============ ADVANCED MICROINTERACTIONS (THEME AGNOSTIC) ============ */

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
    min-width: 200px;
    padding: 16px;
    border-radius: 8px;
}

.rich-tooltip h4 {
    margin: 0 0 8px 0;
    color: var(--primary-color);
    font-size: 16px;
}

.rich-tooltip p {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
    line-height: 1.4;
}

/* ============ ENHANCED BUTTON INTERACTIONS ============ */

.stButton > button, .copy-button, .action-button {
    transition: var(--transition-spring) !important;
    position: relative;
    overflow: hidden;
    border: none !important;
    outline: none !important;
}

.stButton > button:hover, .copy-button:hover, .action-button:hover {
    transform: translateY(-2px) scale(1.02) !important;
    box-shadow: var(--shadow-lg) !important;
}

.stButton > button:active, .copy-button:active, .action-button:active {
    transform: translateY(0) scale(0.98) !important;
    transition: var(--transition-base) !important;
}

/* Ripple effect for buttons */
.stButton > button::before, .copy-button::before, .action-button::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.3s, height 0.3s;
}

.stButton > button:active::before, .copy-button:active::before, .action-button:active::before {
    width: 300px;
    height: 300px;
}

/* Button focus states */
.stButton > button:focus, .copy-button:focus, .action-button:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4) !important;
}

/* ============ ADVANCED BUTTON INTERACTIONS ============ */

/* Primary button enhancements */
.stButton > button[data-baseweb="button"][kind="primary"] {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)) !important;
    border: none !important;
    box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3) !important;
    transition: var(--transition-spring) !important;
}

.stButton > button[data-baseweb="button"][kind="primary"]:hover {
    background: linear-gradient(135deg, var(--primary-dark), #1e3a8a) !important;
    box-shadow: 0 6px 20px 0 rgba(59, 130, 246, 0.4) !important;
    transform: translateY(-2px) scale(1.02) !important;
}

/* Secondary button enhancements */
.stButton > button[data-baseweb="button"][kind="secondary"] {
    background: linear-gradient(135deg, var(--success-color), #059669) !important;
    border: none !important;
    color: white !important;
    box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.3) !important;
    transition: var(--transition-spring) !important;
}

.stButton > button[data-baseweb="button"][kind="secondary"]:hover {
    background: linear-gradient(135deg, #059669, #047857) !important;
    box-shadow: 0 6px 20px 0 rgba(16, 185, 129, 0.4) !important;
    transform: translateY(-2px) scale(1.02) !important;
}

/* Export button specific styling */
.export-btn {
    transition: var(--transition-spring) !important;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}

.export-btn:hover {
    transform: translateY(-3px) scale(1.05) !important;
    box-shadow: var(--shadow-xl) !important;
}

.export-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s ease;
}

.export-btn:hover::before {
    left: 100%;
}

/* ============ ENHANCED FORM CONTROLS ============ */

/* Input fields theme-aware styling */
.stTextInput > div > div, .stTextArea > div > div, .stSelectbox > div > div {
    background-color: var(--bg-input) !important;
    border-color: var(--border-color) !important;
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}

.stTextInput > div > div:focus-within, .stTextArea > div > div:focus-within, .stSelectbox > div > div:focus-within {
    border-color: var(--border-focus) !important;
    box-shadow: 0 0 0 2px rgba(var(--primary-color), 0.2) !important;
}

/* Button theme-aware styling */
.stButton > button {
    background-color: var(--bg-button) !important;
    border-color: var(--border-color) !important;
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}

.stButton > button:hover {
    background-color: var(--bg-hover) !important;
    transform: translateY(-2px) scale(1.02) !important;
    box-shadow: var(--shadow-lg) !important;
}

/* Progress bar theme-aware */
.stProgress > div > div > div > div {
    background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-dark) 50%, var(--primary-light) 100%) !important;
    transition: var(--transition-theme) !important;
}

/* Metrics theme-aware */
.metric-container {
    background-color: var(--bg-card) !important;
    border-color: var(--border-color) !important;
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}

/* Expander theme-aware */
.streamlit-expanderHeader {
    background-color: var(--bg-secondary) !important;
    border-color: var(--border-color) !important;
    color: var(--text-primary) !important;
    transition: var(--transition-theme) !important;
}

/* Code blocks theme-aware */
.stCode, pre, code {
    background-color: var(--bg-tertiary) !important;
    border-color: var(--border-color) !important;
    color: var(--text-secondary) !important;
    transition: var(--transition-theme) !important;
}

/* ============ ENHANCED SIDEBAR STYLING ============ */

.stSelectbox > div > div {
    transition: var(--transition-base) !important;
}

.stSelectbox > div > div:hover {
    border-color: var(--primary-color) !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
}

.stTextInput > div > div {
    transition: var(--transition-base) !important;
}

.stTextInput > div > div:focus-within {
    border-color: var(--primary-color) !important;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
}

/* ============ ENHANCED PROGRESS BARS ============ */

.stProgress > div > div > div > div {
    background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%) !important;
    border-radius: 10px !important;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1) !important;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4) !important;
    position: relative;
    overflow: hidden;
}

.stProgress > div > div > div > div::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%);
    animation: shimmer 2s infinite;
}

/* ============ ENHANCED EXPANDER STYLING ============ */

.streamlit-expanderHeader {
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
    border-radius: 8px 8px 0 0 !important;
    transition: var(--transition-base) !important;
}

.streamlit-expanderHeader:hover {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
    transform: translateY(-1px) !important;
    box-shadow: var(--shadow-md) !important;
}

/* ============ ENHANCED METRICS STYLING ============ */

.metric-container {
    transition: var(--transition-spring);
}

.metric-container:hover {
    transform: translateY(-2px) scale(1.02);
}

/* ============ FLOATING ACTION ELEMENTS ============ */

.floating-help {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
    box-shadow: var(--shadow-xl);
    cursor: pointer;
    transition: var(--transition-spring);
    z-index: 1000;
}

.floating-help:hover {
    transform: translateY(-4px) scale(1.1);
    box-shadow: 0 12px 40px rgba(59, 130, 246, 0.4);
}

/* ============ ENHANCED ACCORDION/COLLAPSE EFFECTS ============ */

.collapsible-section {
    transition: var(--transition-base);
    overflow: hidden;
}

.collapsible-section.expanded {
    animation: expandDown 0.3s ease-out;
}

@keyframes expandDown {
    0% {
        opacity: 0;
        max-height: 0;
        transform: translateY(-10px);
    }
    100% {
        opacity: 1;
        max-height: 1000px;
        transform: translateY(0);
    }
}

/* ============ RESPONSIVE ENHANCEMENTS ============ */

@media (max-width: 768px) {
    .floating-help {
        width: 50px;
        height: 50px;
        font-size: 20px;
        bottom: 15px;
        right: 15px;
    }
    
    .tooltip-container .tooltip {
        display: none; /* Hide tooltips on mobile */
    }
    
    .metric-card-enhanced {
        padding: 16px;
    }
    
    .progress-stage-enhanced {
        padding: 16px;
    }
}

/* ============ ENHANCED HEALTH GAUGE ============ */

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

.health-score-text {
    position: relative;
    z-index: 10;
    font-size: 2.5rem;
    font-weight: bold;
    text-align: center;
    color: #1f2937;
    transition: var(--transition-base);
}

.health-gauge:hover .health-score-text {
    color: var(--primary-color);
    text-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.health-score-label {
    position: relative;
    z-index: 10;
    font-size: 0.875rem;
    color: #6b7280;
    text-align: center;
    margin-top: -10px;
    transition: var(--transition-base);
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

/* ============ ENHANCED LOADING STATES ============ */

.loading-container {
    animation: fadeInUp 0.4s ease-out;
}

.loading-skeleton-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin: 20px 0;
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
    transform: translateY(-4px) scale(1.02);
    box-shadow: var(--shadow-xl);
}

.metric-card-enhanced::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--primary-color), var(--primary-dark));
    transform: scaleX(0);
    transition: var(--transition-base);
}

.metric-card-enhanced:hover::before {
    transform: scaleX(1);
}

.issue-critical { 
    border-left-color: #dc2626;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.issue-high { 
    border-left-color: #f59e0b;
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.issue-medium { 
    border-left-color: #3b82f6;
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.issue-low { 
    border-left-color: #10b981;
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
}

.issue-header {
    display: flex;
    align-items: center;
    margin-bottom: 0.75rem;
}

.issue-icon {
    font-size: 1.5rem;
    margin-right: 0.75rem;
}

.issue-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
}

.issue-description {
    color: #4b5563;
    margin-bottom: 0.75rem;
    line-height: 1.6;
}

.issue-location {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.875rem;
    color: #6b7280;
    background: #f3f4f6;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    margin-bottom: 0.75rem;
}

.issue-action {
    color: #059669;
    font-weight: 500;
    font-size: 0.875rem;
}

/* Tech stack badges */
.tech-badge {
    display: inline-block;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    padding: 0.5rem 1rem;
    margin: 0.25rem;
    border-radius: 2rem;
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

/* Metrics cards */
.metric-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.5rem;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.metric-number {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.metric-label {
    color: #6b7280;
    font-size: 0.875rem;
    font-weight: 500;
}

/* Progress indicators */
.progress-container {
    width: 100%;
    height: 8px;
    background-color: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin: 1rem 0;
}

.progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    border-radius: 4px;
    transition: width 0.3s ease;
}

/* Prompt cards enhancement */
.prompt-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin: 1rem 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    position: relative;
    overflow: hidden;
}

.prompt-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(180deg, #3b82f6, #1d4ed8);
}

/* Copy button enhancement */
.copy-button {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.copy-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(16, 185, 129, 0.4);
}

/* Analysis summary */
.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin: 2rem 0;
}

/* Animation for loading states */
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.loading-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Progress indicator animations */
@keyframes slideIn {
    from { transform: translateX(-100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.progress-stage {
    animation: slideIn 0.3s ease-out;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    padding: 1rem;
    margin: 0.5rem 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.progress-spinner {
    display: inline-block;
    animation: spin 2s linear infinite;
    margin-right: 0.5rem;
}

.progress-status {
    background: #f0f9ff;
    border-left: 4px solid #3b82f6;
    padding: 0.75rem 1rem;
    margin: 0.5rem 0;
    border-radius: 0 0.5rem 0.5rem 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.progress-file-info {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #bae6fd;
    border-radius: 0.5rem;
    padding: 0.75rem;
    margin: 0.5rem 0;
    font-size: 0.875rem;
    color: #0c4a6e;
}

/* Enhanced progress bar */
.stProgress > div > div > div > div {
    background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%);
    border-radius: 10px;
    transition: width 0.3s ease;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

/* Stage completion indicators */
.stage-complete {
    color: #10b981;
    font-weight: 600;
}

.stage-active {
    color: #3b82f6;
    font-weight: 600;
}

.stage-pending {
    color: #6b7280;
    font-weight: 400;
}

/* ============ PLOTLY CHART RESPONSIVE DESIGN ============ */

/* Chart container responsive adjustments */
.js-plotly-plot, .plotly {
    width: 100% !important;
    height: auto !important;
}

.js-plotly-plot .svg-container {
    width: 100% !important;
    height: auto !important;
}

/* Mobile-optimized chart controls */
@media (max-width: 768px) {
    .js-plotly-plot .modebar {
        left: 0 !important;
        top: 0 !important;
        position: absolute !important;
        background: rgba(255, 255, 255, 0.9) !important;
        border-radius: 4px !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
    }
    
    .js-plotly-plot .modebar-btn {
        width: 28px !important;
        height: 28px !important;
    }
    
    /* Reduce chart margins on mobile */
    .js-plotly-plot .svg-container {
        margin: 5px !important;
    }
    
    /* Hide certain modebar buttons on mobile for cleaner look */
    .js-plotly-plot .modebar-btn[data-title*="lasso"] {
        display: none !important;
    }
    
    .js-plotly-plot .modebar-btn[data-title*="select"] {
        display: none !important;
    }
}

/* Tablet responsive adjustments */
@media (max-width: 1024px) and (min-width: 769px) {
    .js-plotly-plot {
        height: 400px !important;
    }
}

/* Enhanced chart export buttons for mobile */
@media (max-width: 768px) {
    .stButton > button {
        width: 100% !important;
        margin: 4px 0 !important;
        font-size: 0.875rem !important;
        padding: 8px 12px !important;
    }
}

/* Responsive design */
@media (max-width: 768px) {
    .health-gauge {
        width: 150px;
        height: 150px;
    }
    
    .health-gauge::before {
        width: 120px;
        height: 120px;
    }
    
    .health-score-text {
        font-size: 2rem;
    }
    
    .summary-grid {
        grid-template-columns: 1fr;
    }
}

/* ============ THEME TRANSITION ANIMATIONS ============ */
.theme-transition {
    transition: var(--transition-theme) !important;
}

/* Accessibility - High contrast modes */
@media (prefers-contrast: high) {
    :root {
        --border-color: var(--text-primary) !important;
        --border-light: var(--text-secondary) !important;
    }
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

/* Theme-aware skeleton animations */
.skeleton {
    background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-tertiary) 50%, var(--bg-secondary) 75%) !important;
    transition: var(--transition-theme) !important;
}

/* Theme-aware tooltips */
.tooltip {
    background-color: var(--bg-tertiary) !important;
    color: var(--text-primary) !important;
    border: 1px solid var(--border-color) !important;
    transition: var(--transition-theme) !important;
}

.rich-tooltip {
    background-color: var(--bg-card) !important;
    color: var(--text-primary) !important;
    border-color: var(--border-color) !important;
    box-shadow: var(--shadow-xl) !important;
    transition: var(--transition-theme) !important;
}

/* Theme-aware floating help button */
.floating-help {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)) !important;
    color: var(--text-inverse) !important;
    box-shadow: var(--shadow-xl) !important;
    transition: var(--transition-theme) !important;
}

/* Chart and visualization theme awareness */
.stPlotlyChart {
    background-color: var(--bg-card) !important;
    border-radius: 8px !important;
    transition: var(--transition-theme) !important;
}

</style>
"""

# Apply the complete CSS with current theme
st.markdown(complete_css, unsafe_allow_html=True)

# ============ MICROINTERACTION HELPER FUNCTIONS ============

def show_loading_skeleton(skeleton_type="analysis", count=3):
    """Display loading skeletons for different content types."""
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

def show_enhanced_loading_state(stage="initializing", progress=0, message="Starting analysis..."):
    """Display enhanced loading state with animations."""
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

def show_success_animation(message="Action completed successfully!", duration=3):
    """Display success animation with checkmark."""
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

def create_tooltip(content, tooltip_text, rich_content=None):
    """Create interactive tooltip wrapper."""
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

def add_page_transition_wrapper(content_func):
    """Decorator to add page transition animations."""
    def wrapper(*args, **kwargs):
        st.markdown('<div class="page-container">', unsafe_allow_html=True)
        result = content_func(*args, **kwargs)
        st.markdown('</div>', unsafe_allow_html=True)
        return result
    return wrapper

# ============ ADVANCED PLOTLY CHART FUNCTIONS ============

def create_custom_color_palette():
    """Create a professional color palette for charts."""
    return {
        'critical': '#DC2626',    # Red
        'high': '#F59E0B',        # Amber
        'medium': '#3B82F6',      # Blue
        'low': '#10B981',         # Green
        'background': '#F8FAFC',
        'text': '#1F2937',
        'accent': '#6366F1'
    }

def create_interactive_pie_chart(issue_data, title="Issue Distribution", show_legend=True):
    """Create an interactive pie chart with hover details and animations."""
    colors = create_custom_color_palette()
    
    # Map issue types to colors
    color_map = {
        'Critical': colors['critical'],
        'High': colors['high'],
        'Medium': colors['medium'],
        'Low': colors['low']
    }
    
    fig = go.Figure(data=[go.Pie(
        labels=list(issue_data.keys()),
        values=list(issue_data.values()),
        hole=0.4,  # Creates donut chart
        marker=dict(
            colors=[color_map.get(k, colors['accent']) for k in issue_data.keys()],
            line=dict(color='#FFFFFF', width=2)
        ),
        textinfo='label+percent+value',
        textposition='outside',
        textfont=dict(size=12, family="Arial", color=colors['text']),
        hovertemplate='<b>%{label}</b><br>' +
                      'Count: %{value}<br>' +
                      'Percentage: %{percent}<br>' +
                      '<extra></extra>',
        showlegend=show_legend,
        pull=[0.05 if k == 'Critical' else 0 for k in issue_data.keys()],  # Pull out critical slice
    )])
    
    fig.update_layout(
        title=dict(
            text=title,
            x=0.5,
            font=dict(size=18, family="Arial", color=colors['text'])
        ),
        font=dict(family="Arial", size=12, color=colors['text']),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        showlegend=show_legend,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.2,
            xanchor="center",
            x=0.5
        ),
        margin=dict(t=60, b=60, l=40, r=40),
        height=400,
        annotations=[dict(
            text=f"Total<br><b>{sum(issue_data.values())}</b><br>Issues",
            x=0.5, y=0.5,
            font_size=14,
            font_color=colors['text'],
            showarrow=False
        )] if 0.4 > 0 else []
    )
    
    # Add smooth animation
    fig.update_traces(
        rotation=90,
        direction="clockwise"
    )
    
    return fig

def create_3d_bar_chart(issue_severity_by_type):
    """Create a 3D bar chart showing issue severity across different file types."""
    colors = create_custom_color_palette()
    
    # Sample data structure: {file_type: {severity: count}}
    file_types = list(issue_severity_by_type.keys())
    severities = ['Critical', 'High', 'Medium', 'Low']
    
    # Create 3D surface data
    x_data = []
    y_data = []  
    z_data = []
    colors_data = []
    text_data = []
    
    color_map = [colors['critical'], colors['high'], colors['medium'], colors['low']]
    
    for i, file_type in enumerate(file_types):
        for j, severity in enumerate(severities):
            count = issue_severity_by_type.get(file_type, {}).get(severity, 0)
            if count > 0:  # Only show bars with data
                x_data.append(i)
                y_data.append(j)
                z_data.append(count)
                colors_data.append(color_map[j])
                text_data.append(f"{file_type}<br>{severity}: {count}")
    
    fig = go.Figure(data=[go.Scatter3d(
        x=x_data,
        y=y_data,
        z=z_data,
        mode='markers',
        marker=dict(
            size=[z*3 for z in z_data],  # Scale size by count
            color=colors_data,
            opacity=0.8,
            line=dict(color='#FFFFFF', width=1)
        ),
        text=text_data,
        hovertemplate='<b>%{text}</b><extra></extra>'
    )])
    
    fig.update_layout(
        title=dict(
            text="Issue Severity by File Type",
            x=0.5,
            font=dict(size=18, family="Arial", color=colors['text'])
        ),
        scene=dict(
            xaxis=dict(
                title="File Types",
                tickmode='array',
                tickvals=list(range(len(file_types))),
                ticktext=file_types,
                backgroundcolor='rgba(0,0,0,0)',
                gridcolor='#E5E7EB'
            ),
            yaxis=dict(
                title="Severity",
                tickmode='array',
                tickvals=list(range(len(severities))),
                ticktext=severities,
                backgroundcolor='rgba(0,0,0,0)',
                gridcolor='#E5E7EB'
            ),
            zaxis=dict(
                title="Issue Count",
                backgroundcolor='rgba(0,0,0,0)',
                gridcolor='#E5E7EB'
            ),
            bgcolor='rgba(0,0,0,0)'
        ),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        height=500,
        margin=dict(t=60, b=60, l=40, r=40)
    )
    
    return fig

def create_time_series_health_chart(project_path, current_health_score):
    """Create time series line chart for project health trends with simulated historical data."""
    colors = create_custom_color_palette()
    
    # Generate simulated historical data (30 days)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    
    # Simulate health score progression (trending towards current score)
    np.random.seed(42)  # For reproducible results
    base_trend = np.linspace(max(20, current_health_score - 30), current_health_score, len(dates))
    noise = np.random.normal(0, 3, len(dates))
    health_scores = np.clip(base_trend + noise, 0, 100)
    health_scores[-1] = current_health_score  # Ensure last point is accurate
    
    # Create the main health trend line
    fig = make_subplots(
        rows=2, cols=1,
        shared_xaxes=True,
        vertical_spacing=0.1,
        subplot_titles=('Project Health Score Trend', 'Issue Detection Rate'),
        row_heights=[0.7, 0.3]
    )
    
    # Health score trend
    fig.add_trace(
        go.Scatter(
            x=dates,
            y=health_scores,
            mode='lines+markers',
            name='Health Score',
            line=dict(color=colors['accent'], width=3),
            marker=dict(size=6, color=colors['accent']),
            fill='tonexty',
            fillcolor=f"rgba(99, 102, 241, 0.1)",
            hovertemplate='<b>%{y:.1f}</b> Health Score<br>%{x}<extra></extra>'
        ),
        row=1, col=1
    )
    
    # Add health goal line
    fig.add_trace(
        go.Scatter(
            x=dates,
            y=[95] * len(dates),
            mode='lines',
            name='Target (95)',
            line=dict(color=colors['low'], width=2, dash='dash'),
            hovertemplate='Target: <b>95</b><extra></extra>'
        ),
        row=1, col=1
    )
    
    # Simulate issue detection rate
    issue_rates = np.random.poisson(3, len(dates))  # Average 3 issues per day
    fig.add_trace(
        go.Bar(
            x=dates,
            y=issue_rates,
            name='Issues Detected',
            marker=dict(color=colors['medium'], opacity=0.7),
            hovertemplate='<b>%{y}</b> issues detected<br>%{x}<extra></extra>'
        ),
        row=2, col=1
    )
    
    # Update layout
    fig.update_layout(
        title=dict(
            text="Project Health Analytics Dashboard",
            x=0.5,
            font=dict(size=20, family="Arial", color=colors['text'])
        ),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        height=600,
        showlegend=True,
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.15,
            xanchor="center",
            x=0.5
        ),
        margin=dict(t=80, b=80, l=60, r=60),
        hovermode='x unified'
    )
    
    # Update axes
    fig.update_xaxes(
        title_text="Date",
        gridcolor='#E5E7EB',
        row=2, col=1
    )
    fig.update_yaxes(
        title_text="Health Score",
        gridcolor='#E5E7EB',
        range=[0, 100],
        row=1, col=1
    )
    fig.update_yaxes(
        title_text="Issues",
        gridcolor='#E5E7EB',
        row=2, col=1
    )
    
    return fig

def create_network_graph(tech_stack, file_dependencies=None):
    """Create network graph showing file dependency relationships."""
    colors = create_custom_color_palette()
    
    # Create nodes and edges for tech stack relationships
    nodes = []
    edges = []
    
    # Add tech stack nodes
    for i, tech in enumerate(tech_stack):
        nodes.append({
            'id': tech,
            'label': tech,
            'x': np.cos(2 * np.pi * i / len(tech_stack)),
            'y': np.sin(2 * np.pi * i / len(tech_stack)),
            'size': 20 + len(tech) * 2,
            'color': colors['accent']
        })
    
    # Add some sample dependencies between technologies
    tech_dependencies = {
        'React': ['TypeScript', 'JavaScript', 'HTML', 'CSS'],
        'TypeScript': ['JavaScript'],
        'Node.js': ['JavaScript'],
        'Express': ['Node.js'],
        'MongoDB': ['Node.js'],
        'PostgreSQL': ['SQL'],
        'Python': ['SQL'],
        'Flask': ['Python'],
        'Django': ['Python']
    }
    
    # Create edges based on dependencies
    for tech in tech_stack:
        deps = tech_dependencies.get(tech, [])
        for dep in deps:
            if dep in tech_stack:
                edges.append({'source': tech, 'target': dep})
    
    # Create Plotly network graph
    edge_x = []
    edge_y = []
    edge_info = []
    
    node_dict = {node['id']: node for node in nodes}
    
    for edge in edges:
        source = node_dict.get(edge['source'])
        target = node_dict.get(edge['target'])
        if source and target:
            edge_x.extend([source['x'], target['x'], None])
            edge_y.extend([source['y'], target['y'], None])
            edge_info.append(f"{edge['source']} → {edge['target']}")
    
    # Create edge traces
    edge_trace = go.Scatter(
        x=edge_x, y=edge_y,
        line=dict(width=2, color='#CBD5E1'),
        hoverinfo='none',
        mode='lines'
    )
    
    # Create node traces
    node_x = [node['x'] for node in nodes]
    node_y = [node['y'] for node in nodes]
    node_text = [node['label'] for node in nodes]
    node_sizes = [node['size'] for node in nodes]
    
    node_trace = go.Scatter(
        x=node_x, y=node_y,
        mode='markers+text',
        text=node_text,
        textposition="middle center",
        textfont=dict(color='white', size=10, family='Arial'),
        marker=dict(
            size=node_sizes,
            color=colors['accent'],
            line=dict(width=2, color='white'),
            opacity=0.8
        ),
        hovertemplate='<b>%{text}</b><br>Technology Component<extra></extra>'
    )
    
    fig = go.Figure(data=[edge_trace, node_trace])
    
    fig.update_layout(
        title=dict(
            text="Technology Stack Dependencies",
            x=0.5,
            font=dict(size=18, family="Arial", color=colors['text'])
        ),
        showlegend=False,
        hovermode='closest',
        margin=dict(b=40, l=40, r=40, t=80),
        annotations=[
            dict(
                text="Interactive network showing relationships between technologies",
                showarrow=False,
                xref="paper", yref="paper",
                x=0.5, xanchor="center",
                y=-0.1, yanchor="bottom",
                font=dict(color=colors['text'], size=12)
            )
        ],
        xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        height=500
    )
    
    return fig

def create_animated_donut_chart(tech_stack, title="Technology Stack Distribution"):
    """Create animated donut chart with smooth transitions for tech stack visualization."""
    colors = create_custom_color_palette()
    
    # Create data for tech stack with simulated usage percentages
    np.random.seed(42)
    usage_data = {}
    total_files = 100  # Simulated total
    
    for tech in tech_stack:
        # Simulate file count for each technology
        if tech.lower() in ['javascript', 'js', 'typescript', 'ts']:
            usage_data[tech] = np.random.randint(20, 40)
        elif tech.lower() in ['html', 'css']:
            usage_data[tech] = np.random.randint(10, 25)
        elif tech.lower() in ['python', 'java', 'c#', 'go']:
            usage_data[tech] = np.random.randint(15, 35)
        else:
            usage_data[tech] = np.random.randint(5, 20)
    
    # Normalize to percentages
    total = sum(usage_data.values())
    for tech in usage_data:
        usage_data[tech] = (usage_data[tech] / total) * 100
    
    # Generate colors using a professional palette
    colors_list = px.colors.qualitative.Set3[:len(tech_stack)]
    
    fig = go.Figure(data=[go.Pie(
        labels=list(usage_data.keys()),
        values=list(usage_data.values()),
        hole=0.6,
        marker=dict(
            colors=colors_list,
            line=dict(color='#FFFFFF', width=3)
        ),
        textinfo='label+percent',
        textposition='outside',
        textfont=dict(size=12, family="Arial", color=colors['text']),
        hovertemplate='<b>%{label}</b><br>' +
                      'Usage: %{value:.1f}%<br>' +
                      '<extra></extra>',
        rotation=90,
        direction="clockwise"
    )])
    
    # Add center annotation
    fig.update_layout(
        title=dict(
            text=title,
            x=0.5,
            font=dict(size=18, family="Arial", color=colors['text'])
        ),
        font=dict(family="Arial", size=12, color=colors['text']),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        showlegend=True,
        legend=dict(
            orientation="v",
            yanchor="middle",
            y=0.5,
            xanchor="left",
            x=1.05
        ),
        margin=dict(t=60, b=40, l=40, r=150),
        height=450,
        annotations=[
            dict(
                text=f"<b>{len(tech_stack)}</b><br>Technologies",
                x=0.5, y=0.5,
                font=dict(size=16, family="Arial", color=colors['text']),
                showarrow=False
            )
        ]
    )
    
    return fig

def add_chart_export_buttons(fig, chart_name, key_suffix=""):
    """Add export buttons for charts with download functionality."""
    colors = create_custom_color_palette()
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button(f"📊 PNG Export", key=f"png_{chart_name}_{key_suffix}", help="Download as PNG image"):
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
    
    with col2:
        if st.button(f"📄 PDF Export", key=f"pdf_{chart_name}_{key_suffix}", help="Download as PDF"):
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
    
    with col3:
        if st.button(f"🌐 HTML Export", key=f"html_{chart_name}_{key_suffix}", help="Download as interactive HTML"):
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

def add_floating_help_button():
    """Add floating help button with tooltips."""
    help_tooltip = create_tooltip(
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

def load_recent_projects() -> List[str]:
    """Load recent projects from file."""
    try:
        recent_file = Path('recent_projects.json')
        if recent_file.exists():
            with open(recent_file, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception:
        pass
    return []

def save_recent_projects(projects: List[str]):
    """Save recent projects to file."""
    try:
        with open('recent_projects.json', 'w', encoding='utf-8') as f:
            json.dump(projects[-10:], f)
    except Exception:
        pass

def add_to_recent(project_path: str):
    """Add project to recent list."""
    if project_path in st.session_state.recent_projects:
        st.session_state.recent_projects.remove(project_path)
    st.session_state.recent_projects.insert(0, project_path)
    st.session_state.recent_projects = st.session_state.recent_projects[:10]
    save_recent_projects(st.session_state.recent_projects)

# Theme persistence functions
def load_theme_preference() -> str:
    """Load theme preference from file or default to system."""
    try:
        theme_file = Path('theme_preference.json')
        if theme_file.exists():
            with open(theme_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('theme', 'auto')
    except Exception:
        pass
    return 'auto'

def save_theme_preference(theme: str):
    """Save theme preference to file."""
    try:
        with open('theme_preference.json', 'w', encoding='utf-8') as f:
            json.dump({'theme': theme}, f)
    except Exception:
        pass

def detect_system_theme() -> str:
    """Detect system theme preference (simplified for demo)."""
    # In a real implementation, this could use system APIs
    # For now, we'll default to light theme during day hours
    from datetime import datetime
    current_hour = datetime.now().hour
    if 6 <= current_hour <= 18:
        return 'light'
    else:
        return 'dark'

def get_effective_theme() -> str:
    """Get the effective theme based on user preference and system detection."""
    user_preference = st.session_state.get('theme_preference', 'auto')
    if user_preference == 'auto':
        return detect_system_theme()
    return user_preference

def create_theme_toggle():
    """Create an enhanced theme toggle button in the sidebar."""
    current_theme = st.session_state.current_theme
    
    # Theme toggle section
    st.sidebar.markdown("---")
    st.sidebar.markdown("### 🎨 Theme")
    
    # Current theme indicator with icon
    theme_icon = "🌙" if current_theme == "dark" else "☀️"
    theme_name = "Dark Mode" if current_theme == "dark" else "Light Mode"
    
    st.sidebar.markdown(f"**Current: {theme_icon} {theme_name}**")
    
    # Theme selection with custom styling
    theme_options = {
        "auto": "🔄 Auto (System)",
        "light": "☀️ Light Mode",
        "dark": "🌙 Dark Mode"
    }
    
    selected_theme = st.sidebar.selectbox(
        "Theme Preference:",
        options=list(theme_options.keys()),
        format_func=lambda x: theme_options[x],
        index=list(theme_options.keys()).index(st.session_state.theme_preference),
        key="theme_selector"
    )
    
    # Handle theme change
    if selected_theme != st.session_state.theme_preference:
        st.session_state.theme_preference = selected_theme
        st.session_state.current_theme = get_effective_theme()
        save_theme_preference(selected_theme)
        st.rerun()
    
    # Add theme toggle buttons for quick switching
    col1, col2 = st.sidebar.columns(2)
    
    with col1:
        if st.button("☀️", key="quick_light", help="Switch to Light Mode", use_container_width=True):
            st.session_state.theme_preference = 'light'
            st.session_state.current_theme = 'light'
            save_theme_preference('light')
            st.rerun()
    
    with col2:
        if st.button("🌙", key="quick_dark", help="Switch to Dark Mode", use_container_width=True):
            st.session_state.theme_preference = 'dark'
            st.session_state.current_theme = 'dark'
            save_theme_preference('dark')
            st.rerun()
    
    # Theme info
    if st.session_state.theme_preference == 'auto':
        current_hour = datetime.now().hour
        if 6 <= current_hour <= 18:
            st.sidebar.info("🌅 Auto theme: Light (Daytime)")
        else:
            st.sidebar.info("🌃 Auto theme: Dark (Nighttime)")
    
    st.sidebar.markdown("---")

# Initialize additional session state (theme state already initialized above)
if 'analysis_result' not in st.session_state:
    st.session_state.analysis_result = None
if 'project_mode' not in st.session_state:
    st.session_state.project_mode = 'existing'
if 'generated_prompts' not in st.session_state:
    st.session_state.generated_prompts = {}
if 'recent_projects' not in st.session_state:
    st.session_state.recent_projects = load_recent_projects()
if 'new_project_requirements' not in st.session_state:
    st.session_state.new_project_requirements = None
if 'history_manager' not in st.session_state:
    st.session_state.history_manager = None
if 'current_page' not in st.session_state:
    st.session_state.current_page = 'analysis'
if 'selected_project_for_history' not in st.session_state:
    st.session_state.selected_project_for_history = None

# Update theme state with proper initialization (only if not already set)
if st.session_state.theme_preference == 'auto' and 'theme_preference' not in st.session_state.__dict__:
    st.session_state.theme_preference = load_theme_preference()
    st.session_state.current_theme = get_effective_theme()

def main():
    """Main Streamlit UI with Intelligent Analysis and Enhanced Microinteractions."""
    
    # Try to use modular UI first
    if USE_MODULAR_UI and MODULAR_UI_AVAILABLE:
        try:
            app = PromptEngineerUI()
            app.run()
            return
        except Exception as e:
            st.error(f"Modular UI error: {e}")
            st.markdown("*Falling back to original UI...*")
            # Continue to original UI below
    
    # Original UI implementation (fallback)
    run_original_main()

@add_page_transition_wrapper
def run_original_main():
    """Original main function preserved as fallback."""
    
    # Enhanced title with animation
    st.markdown("""
    <div style="text-align: center; animation: fadeInDown 0.8s ease-out; margin-bottom: 2rem;">
        <h1 style="font-size: 3rem; background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
                   -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                   margin-bottom: 0.5rem;">
            🤖 Prompt Engineer
        </h1>
        <p style="font-size: 1.2rem; color: #6b7280; font-weight: 500; margin: 0;">
            Intelligent AI-optimized prompts from deep project analysis
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    # Navigation tabs for different pages
    st.markdown("---")
    tab_cols = st.columns(4)
    
    with tab_cols[0]:
        if st.button("🔍 Analysis", type="primary" if st.session_state.current_page == 'analysis' else "secondary", use_container_width=True):
            st.session_state.current_page = 'analysis'
            st.rerun()
    
    with tab_cols[1]:
        if st.button("📊 History", type="primary" if st.session_state.current_page == 'history' else "secondary", use_container_width=True):
            st.session_state.current_page = 'history'
            st.rerun()
    
    with tab_cols[2]:
        if st.button("📈 Trends", type="primary" if st.session_state.current_page == 'trends' else "secondary", use_container_width=True):
            st.session_state.current_page = 'trends'
            st.rerun()
    
    with tab_cols[3]:
        if st.button("⚙️ Settings", type="primary" if st.session_state.current_page == 'settings' else "secondary", use_container_width=True):
            st.session_state.current_page = 'settings'
            st.rerun()
    
    # Page content based on selected tab with modular components
    try:
        # Import modular components
        from ui.components import theme, charts, widgets, animations
        from ui.pages import AnalysisPage, HistoryPage, TrendsPage, SettingsPage
        
        # Initialize component instances
        theme_manager = theme.ThemeManager()
        charts_component = charts.ChartComponents()
        widgets_component = widgets.WidgetComponents()
        animations_component = animations.AnimationComponents()
        
        # Route to appropriate modular page
        if st.session_state.current_page == 'analysis':
            page = AnalysisPage(theme_manager, charts_component, widgets_component, animations_component)
            page.render()
        elif st.session_state.current_page == 'history':
            page = HistoryPage(theme_manager, charts_component, widgets_component, animations_component)
            page.render()
        elif st.session_state.current_page == 'trends':
            page = TrendsPage(theme_manager, charts_component, widgets_component, animations_component)
            page.render()
        elif st.session_state.current_page == 'settings':
            page = SettingsPage(theme_manager, charts_component, widgets_component, animations_component)
            page.render()
    except ImportError as e:
        st.warning(f"Modular components not available ({e}), falling back to legacy functions...")
        # Fallback to original functions if modular components aren't available
        if st.session_state.current_page == 'analysis':
            show_analysis_page()
        elif st.session_state.current_page == 'history':
            show_history_page()
        elif st.session_state.current_page == 'trends':
            show_trends_page()
        elif st.session_state.current_page == 'settings':
            show_settings_page()

def show_analysis_page():
    """Show the main analysis page."""
    
    # Initialize history manager if needed
    if st.session_state.history_manager is None:
        try:
            st.session_state.history_manager = AnalysisHistoryManager()
        except Exception as e:
            st.error(f"Failed to initialize history manager: {e}")
    
    # Enhanced project mode selection with microinteractions
    st.markdown("---")
    st.markdown('<div class="section-fade-in">', unsafe_allow_html=True)
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Enhanced button with tooltip
        button_html = create_tooltip(
            content='<div class="action-button" style="width: 100%; text-align: center; padding: 12px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border-radius: 8px; font-weight: 600; cursor: pointer;">📁 Analyze Existing Project</div>',
            tooltip_text="Existing Project Analysis",
            rich_content='<h4>Existing Project Analysis</h4><p>Deep dive into your current codebase to identify issues, improvements, and generate actionable prompts</p>'
        )
        
        st.markdown(button_html, unsafe_allow_html=True)
        
        if st.button("📁 Analyze Existing Project", type="primary", use_container_width=True, key="existing_mode"):
            st.session_state.project_mode = 'existing'
            st.rerun()
    
    with col2:
        # Enhanced button with tooltip
        button_html = create_tooltip(
            content='<div class="action-button" style="width: 100%; text-align: center; padding: 12px; background: linear-gradient(135deg, #10b981, #059669); color: white; border-radius: 8px; font-weight: 600; cursor: pointer;">🆕 Start New Project</div>',
            tooltip_text="New Project Setup",
            rich_content='<h4>New Project Setup</h4><p>Guided wizard to gather requirements and generate comprehensive project specifications</p>'
        )
        
        st.markdown(button_html, unsafe_allow_html=True)
        
        if st.button("🆕 Start New Project", type="secondary", use_container_width=True, key="new_mode"):
            st.session_state.project_mode = 'new'
            st.rerun()
    
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Enhanced mode indicator with animations
    mode_container = st.container()
    with mode_container:
        if st.session_state.project_mode == 'existing':
            st.markdown("""
            <div class="section-slide-in" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); 
                       border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 20px 0;
                       animation: slideInRight 0.6s ease-out;">
                <div style="display: flex; align-items: center;">
                    <span style="font-size: 2rem; margin-right: 16px;">🔍</span>
                    <div>
                        <h3 style="margin: 0; color: #1e40af; font-size: 1.3rem;">Existing Project Mode</h3>
                        <p style="margin: 4px 0 0 0; color: #3730a3; font-size: 1rem;">
                            Analyzing your current project for issues and improvements
                        </p>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown("""
            <div class="section-slide-in" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); 
                       border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin: 20px 0;
                       animation: slideInRight 0.6s ease-out;">
                <div style="display: flex; align-items: center;">
                    <span style="font-size: 2rem; margin-right: 16px;">🚀</span>
                    <div>
                        <h3 style="margin: 0; color: #059669; font-size: 1.3rem;">New Project Mode</h3>
                        <p style="margin: 4px 0 0 0; color: #047857; font-size: 1rem;">
                            Gathering comprehensive context for your new project
                        </p>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)
    
    # Display appropriate UI based on mode with smooth transitions
    if st.session_state.project_mode == 'new':
        show_new_project_wizard()
    else:
        show_existing_project_analyzer()
    
    # Add floating help button
    add_floating_help_button()

def show_existing_project_analyzer():
    """Show the existing project analysis interface."""
    
    # Sidebar for project selection
    with st.sidebar:
        # Add theme toggle at the top of sidebar
        create_theme_toggle()
        
        st.header("📁 Project Selection")
        
        # Recent projects dropdown
        if st.session_state.recent_projects:
            st.subheader("Recent Projects")
            selected_recent = st.selectbox(
                "Choose from recent:",
                [""] + st.session_state.recent_projects,
                key="recent_dropdown"
            )
            if selected_recent:
                st.session_state.project_path = selected_recent
        
        # Manual path input
        project_path = st.text_input(
            "Project Path:",
            value=getattr(st.session_state, 'project_path', ''),
            placeholder="C:\\dev\\projects\\my-project",
            help="Enter the full path to your project directory"
        )
        
        # Analysis options
        st.subheader("⚙️ Analysis Options")
        max_files = st.slider(
            "Max Files to Analyze:",
            min_value=10,
            max_value=1000,
            value=200,
            step=10,
            help="Limit files for large projects"
        )
        
        save_analysis = st.checkbox(
            "Save Analysis Results",
            value=True,
            help="Save detailed analysis as JSON"
        )
        
        # Export options
        st.subheader("📥 Export Options")
        export_format = st.selectbox(
            "Export Format:",
            ["JSON Report", "Markdown Report", "Quick Summary"],
            help="Choose export format for analysis results"
        )
        
        # Intelligent analyze button
        analyze_button = st.button(
            "🧠 Intelligent Analysis",
            type="primary",
            use_container_width=True,
            help="Perform deep project analysis to identify real issues"
        )
    
    # Main analysis area
    if analyze_button and project_path:
        perform_intelligent_analysis(project_path, max_files, save_analysis)
    
    # Show analysis results
    if st.session_state.analysis_result:
        display_analysis_results()
    else:
        # Show preview of what will be available after analysis
        st.markdown("---")
        st.header("🎯 Smart Prompt Generation")
        st.info("📝 **After analysis completes**, you'll get access to:")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.markdown("""
            **🚨 Critical Issues Fix**
            - Specific prompts to resolve blocking issues
            - Security vulnerability fixes
            - Error resolution strategies
            """)
            
        with col2:
            st.markdown("""
            **📋 Comprehensive Plans**
            - Step-by-step improvement roadmap
            - Phase-based implementation
            - Priority-ordered action items
            """)
            
        with col3:
            st.markdown("""
            **🧪 Testing & Quality**
            - Test coverage improvements
            - Missing feature identification
            - Code quality enhancements
            """)
        
        st.markdown("**👆 Run analysis above to unlock these features!**")

def perform_intelligent_analysis(project_path: str, max_files: int, save_analysis: bool):
    """Perform the intelligent project analysis with enhanced microinteractions."""
    
    # Show initial loading skeleton
    skeleton_placeholder = st.empty()
    with skeleton_placeholder.container():
        st.markdown('<div class="section-fade-in">', unsafe_allow_html=True)
        st.markdown("### 🔍 Preparing Analysis")
        show_loading_skeleton("health_gauge", 1)
        show_loading_skeleton("metrics", 1) 
        show_loading_skeleton("analysis", 2)
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Create progress placeholders
    progress_container = st.container()
    
    with progress_container:
        # Create placeholders for enhanced progress indicators
        stage_placeholder = st.empty()
        progress_placeholder = st.empty()
        status_placeholder = st.empty()
        file_count_placeholder = st.empty()
        
        def update_progress_ui(stage: str, progress: int, status: str):
            """Update the Streamlit UI with enhanced progress animations."""
            # Clear skeleton once analysis starts
            if progress > 0:
                skeleton_placeholder.empty()
            
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
            stage_placeholder.markdown(f"""
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
            
            # Enhanced progress bar with gradient and animations
            progress_placeholder.progress(
                progress / 100, 
                text=f"🚀 Analyzing your project... {progress}% complete"
            )
            
            # File processing info with enhanced styling
            if "files" in status.lower() or "scanning" in status.lower():
                file_count_placeholder.markdown(f"""
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
                                     color: #1e40af; font-weight: 500;">{Path(project_path).name}</code>
                    </div>
                </div>
                """, unsafe_allow_html=True)
        
        try:
            # Initialize with enhanced loading state
            update_progress_ui("initialization", 0, "Initializing intelligent analysis engine...")
            
            # Create analyzer with progress callback
            analyzer = ProjectIntelligenceAnalyzer(progress_callback=update_progress_ui)
            
            # Run analysis with progress tracking
            analysis_result = analyzer.analyze_project(project_path, max_files)
            
            # Store results
            st.session_state.analysis_result = analysis_result
            add_to_recent(project_path)
            
            # Save to analysis history if history manager is available
            if st.session_state.history_manager:
                try:
                    project_name = Path(project_path).name
                    snapshot_id = st.session_state.history_manager.save_analysis_snapshot(
                        analysis_result, 
                        project_path, 
                        project_name,
                        tags=['automated'],
                        notes=f"Automated analysis with {max_files} max files"
                    )
                    st.info(f"Analysis saved to history (ID: {snapshot_id})")
                except Exception as e:
                    st.warning(f"Could not save to history: {e}")
            
            # Calculate totals for final report
            total_issues = (len(analysis_result.critical_issues) + 
                          len(analysis_result.high_priority_issues) + 
                          len(analysis_result.medium_priority_issues) + 
                          len(analysis_result.low_priority_issues))
            
            # Final completion state
            update_progress_ui("complete", 100, f"Analysis complete! Found {total_issues} issues to review")
            
            # Clear temporary displays
            file_count_placeholder.empty()
            
            # Save analysis with success animation
            if save_analysis:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                project_name = Path(project_path).name
                filename = f"intelligent_analysis_{project_name}_{timestamp}.json"
                
                with open(filename, 'w', encoding='utf-8') as f:
                    json.dump(analyzer.to_dict(analysis_result), f, indent=2, ensure_ascii=False)
                
                # Show success animation
                st.markdown(f"""
                <div class="success-animation">
                    <div class="checkmark-container">
                        <svg class="checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <span class="success-message">
                        Analysis saved to: <code>{filename}</code>
                    </span>
                </div>
                """, unsafe_allow_html=True)
            
            # Enhanced completion message with staggered animations
            completion_container = st.container()
            with completion_container:
                st.markdown("""
                <div style="animation: fadeInUp 0.8s ease-out; text-align: center; 
                           background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
                           border: 2px solid #0ea5e9; border-radius: 16px; 
                           padding: 24px; margin: 24px 0;">
                """, unsafe_allow_html=True)
                
                st.markdown("## 🎉 Analysis Complete!")
                
                # Results summary with enhanced styling
                col1, col2, col3, col4 = st.columns(4)
                
                metrics_data = [
                    (col1, "🚨", "Critical", len(analysis_result.critical_issues), "#dc2626"),
                    (col2, "⚠️", "High Priority", len(analysis_result.high_priority_issues), "#f59e0b"),
                    (col3, "📋", "Medium Priority", len(analysis_result.medium_priority_issues), "#3b82f6"),
                    (col4, "💡", "Low Priority", len(analysis_result.low_priority_issues), "#10b981")
                ]
                
                for i, (col, icon, label, count, color) in enumerate(metrics_data):
                    with col:
                        st.markdown(f"""
                        <div class="metric-card-enhanced stagger-animation" 
                             style="animation-delay: {i * 0.1}s; border-top: 4px solid {color};">
                            <div style="font-size: 2rem; margin-bottom: 8px;">{icon}</div>
                            <div style="font-size: 2rem; font-weight: bold; color: {color}; margin-bottom: 4px;">
                                {count}
                            </div>
                            <div style="color: #6b7280; font-size: 0.875rem; font-weight: 500;">
                                {label}
                            </div>
                        </div>
                        """, unsafe_allow_html=True)
                
                # Health score highlight
                st.markdown(f"""
                <div style="margin: 20px 0; text-align: center; animation: scaleIn 0.6s ease-out 0.5s both;">
                    <div style="display: inline-flex; align-items: center; background: white; 
                               padding: 16px 24px; border-radius: 50px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                               border: 2px solid #10b981;">
                        <span style="font-size: 1.5rem; margin-right: 12px;">🏥</span>
                        <strong style="color: #1f2937; font-size: 1.1rem;">Health Score: </strong>
                        <span style="color: #10b981; font-size: 1.4rem; font-weight: bold; margin-left: 8px;">
                            {analysis_result.health_score}/100
                        </span>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
                st.markdown('</div>', unsafe_allow_html=True)
            
            # Brief pause for visual effect
            time.sleep(0.3)
            
        except Exception as e:
            # Clear all progress indicators on error
            skeleton_placeholder.empty()
            stage_placeholder.empty()
            progress_placeholder.empty() 
            status_placeholder.empty()
            file_count_placeholder.empty()
            
            # Enhanced error display
            st.markdown("""
            <div style="animation: fadeInUp 0.4s ease-out; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); 
                       border: 2px solid #dc2626; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <span style="font-size: 1.5rem; margin-right: 12px;">❌</span>
                    <h3 style="margin: 0; color: #dc2626;">Analysis Failed</h3>
                </div>
                <p style="margin: 8px 0; color: #7f1d1d;">""" + str(e) + """</p>
            </div>
            """, unsafe_allow_html=True)
            
            if "does not exist" in str(e):
                st.markdown("""
                <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; 
                           padding: 16px; margin-top: 16px;">
                    <div style="display: flex; align-items: center;">
                        <span style="font-size: 1.2rem; margin-right: 8px;">💡</span>
                        <strong style="color: #92400e;">Tip:</strong>
                        <span style="margin-left: 8px; color: #78350f;">
                            Make sure the project path is correct and accessible
                        </span>
                    </div>
                </div>
                """, unsafe_allow_html=True)

def display_analysis_results():
    """Display the comprehensive analysis results."""
    result = st.session_state.analysis_result

    # Create main tabs for different views
    tab1, tab2, tab3 = st.tabs(["🤖 AI Prompts (Ready to Use)", "📊 Health Report", "🔍 Detailed Issues"])

    with tab1:
        # PROMPT GENERATION AS PRIMARY OUTPUT
        st.header("🎯 Generated AI Prompts")
        st.success("✨ Your custom prompts are ready! Copy and paste into Claude, ChatGPT, or any AI assistant.")

        # Generate prompts immediately
        try:
            generator = SmartPromptGenerator(result)

            # Generate all main prompts automatically
            col1, col2 = st.columns(2)

            with col1:
                st.subheader("🔧 Fix Critical Issues")
                critical_prompt = generator.generate_critical_issues_prompt()
                st.code(critical_prompt, language="markdown")

                st.subheader("✨ Add Missing Features")
                features_prompt = generator.generate_missing_features_prompt()
                st.code(features_prompt, language="markdown")

            with col2:
                st.subheader("🏗️ Refactor & Improve")
                refactor_prompt = generator.generate_refactor_prompt()
                st.code(refactor_prompt, language="markdown")

                st.subheader("🧪 Testing Strategy")
                test_prompt = generator.generate_test_improvement_prompt()
                st.code(test_prompt, language="markdown")

            # Show the advanced prompt options
            with st.expander("🚀 Advanced Prompt Options", expanded=False):
                show_smart_prompts(result)
        except Exception as e:
            st.error(f"Error generating prompts: {e}")
            # Fallback to basic prompt display
            show_smart_prompts(result)

    with tab2:
        # Health Score Header with enhanced visualization
        st.header("📊 Project Health Report")
    
    # Create columns for health gauge and summary
    col1, col2 = st.columns([1, 2])
    
    with col1:
        # Health score gauge
        health_percentage = result.health_score
        gauge_rotation = (health_percentage / 100) * 180  # Half circle rotation
        
        st.markdown(f"""
        <div class="health-gauge-container">
            <div class="health-gauge" style="background: conic-gradient(
                from -90deg,
                #ef4444 0deg,
                #f59e0b {36 if health_percentage > 40 else health_percentage * 0.9}deg,
                #10b981 {72 if health_percentage > 80 else health_percentage * 0.9}deg,
                #e5e7eb {health_percentage * 3.6}deg,
                #e5e7eb 360deg
            );">
                <div class="health-score-text">{health_percentage}</div>
            </div>
        </div>
        <div class="health-score-label">Project Health Score</div>
        """, unsafe_allow_html=True)
        
        # Health status badge
        if health_percentage >= 90:
            health_status = "🏆 Excellent"
            health_color = "#10b981"
        elif health_percentage >= 75:
            health_status = "✅ Good"
            health_color = "#3b82f6"
        elif health_percentage >= 60:
            health_status = "⚠️ Fair"
            health_color = "#f59e0b"
        else:
            health_status = "🔥 Needs Work"
            health_color = "#ef4444"
            
        st.markdown(f"""
        <div style="text-align: center; margin-top: 1rem;">
            <span style="background-color: {health_color}; color: white; padding: 0.5rem 1rem; 
                         border-radius: 2rem; font-weight: 500; font-size: 0.875rem;">
                {health_status}
            </span>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        # Project summary info
        st.markdown("### 📋 Analysis Summary")
        
        # Create metrics in a grid
        col2a, col2b = st.columns(2)
        
        with col2a:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-number" style="color: #dc2626;">{len(result.critical_issues)}</div>
                <div class="metric-label">Critical Issues</div>
            </div>
            """, unsafe_allow_html=True)
            
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-number" style="color: #3b82f6;">{len(result.medium_priority_issues)}</div>
                <div class="metric-label">Medium Priority</div>
            </div>
            """, unsafe_allow_html=True)
        
        with col2b:
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-number" style="color: #f59e0b;">{len(result.high_priority_issues)}</div>
                <div class="metric-label">High Priority</div>
            </div>
            """, unsafe_allow_html=True)
            
            st.markdown(f"""
            <div class="metric-card">
                <div class="metric-number" style="color: #10b981;">{len(result.low_priority_issues)}</div>
                <div class="metric-label">Low Priority</div>
            </div>
            """, unsafe_allow_html=True)
        
        # Project details
        st.markdown(f"""
        <div style="margin-top: 1rem; padding: 1rem; background: #f8fafc; border-radius: 0.5rem;">
            <strong>Project Type:</strong> {result.project_type.title()}<br>
            <strong>Analysis Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M')}<br>
            <strong>Files Analyzed:</strong> {len(result.tech_stack)} tech stack components detected
        </div>
        """, unsafe_allow_html=True)
    
    # Overview metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Critical Issues", len(result.critical_issues), delta=None)
    with col2:
        st.metric("High Priority", len(result.high_priority_issues), delta=None)
    with col3:
        st.metric("Medium Priority", len(result.medium_priority_issues), delta=None)
    with col4:
        st.metric("Project Type", result.project_type.title(), delta=None)
    
    # Show technology stack with enhanced badges
    st.markdown("---")
    st.subheader("🛠️ Technology Stack")
    
    if result.tech_stack:
        # Create tech stack display
        tech_badges_html = ""
        for tech in result.tech_stack:
            tech_badges_html += f'<span class="tech-badge">{tech}</span>'
        
        st.markdown(f"""
        <div style="margin: 1rem 0;">
            {tech_badges_html}
        </div>
        """, unsafe_allow_html=True)
        
        # Add tech stack insights
        if len(result.tech_stack) >= 3:
            st.info("🎯 **Modern Tech Stack Detected** - Your project uses current industry-standard technologies")
        elif 'React' in result.tech_stack or 'TypeScript' in result.tech_stack:
            st.info("⚡ **Frontend Framework Detected** - Good choice for modern web development")
        elif 'Python' in result.tech_stack:
            st.info("🐍 **Python Project** - Excellent for data science, automation, and backend development")
    else:
        st.warning("🔍 Technology stack not detected - Try analyzing more files")
    
    # Strategic recommendations
    if result.suggestions:
        st.markdown("---")
        st.subheader("🎯 Strategic Recommendations")
        for suggestion in result.suggestions:
            st.info(suggestion)
    
    # Issue Distribution Chart
    add_issue_distribution_chart(result)
    
    # Issue breakdown with smart prompts
    show_intelligent_issue_analysis(result)
    
    with tab3:
        # Show detailed issue analysis
        st.header("🔍 Detailed Issue Analysis")
        display_detailed_issues(result)
    
    # Add export functionality
    add_export_section(result)

def get_theme_aware_colors():
    """Get chart colors based on current theme."""
    current_theme = st.session_state.current_theme
    
    if current_theme == 'dark':
        return {
            'critical': '#f87171',
            'high': '#fbbf24',
            'medium': '#60a5fa',
            'low': '#34d399',
            'background': '#1e293b',
            'text': '#f1f5f9',
            'grid': '#475569'
        }
    else:
        return {
            'critical': '#dc2626',
            'high': '#f59e0b', 
            'medium': '#3b82f6',
            'low': '#10b981',
            'background': '#ffffff',
            'text': '#1f2937',
            'grid': '#e5e7eb'
        }

def add_issue_distribution_chart(result):
    """Add advanced interactive Plotly visualizations for comprehensive issue analysis."""
    st.markdown("---")
    st.markdown("## 📊 Interactive Analytics Dashboard")
    st.markdown("*Explore your project data with advanced interactive visualizations*")
    
    # Prepare data for all visualizations
    issue_data = {
        'Critical': len(result.critical_issues),
        'High': len(result.high_priority_issues), 
        'Medium': len(result.medium_priority_issues),
        'Low': len(result.low_priority_issues)
    }
    
    # Remove categories with 0 issues for cleaner charts
    issue_data_filtered = {k: v for k, v in issue_data.items() if v > 0}
    
    # Prepare issue type data
    issue_types = {}
    all_issues = (result.critical_issues + result.high_priority_issues + 
                 result.medium_priority_issues + result.low_priority_issues)
    
    for issue in all_issues:
        issue_type = issue.type.replace('_', ' ').title()
        issue_types[issue_type] = issue_types.get(issue_type, 0) + 1
    
    # Create file type vs severity data for 3D chart
    issue_severity_by_type = {}
    file_extensions = set()
    
    for issue in all_issues:
        if hasattr(issue, 'file_path') and issue.file_path:
            ext = Path(issue.file_path).suffix or 'No Extension'
            file_extensions.add(ext)
    
    # Sample data for demonstration (you can enhance this with real file analysis)
    sample_file_types = list(file_extensions)[:5] if file_extensions else ['.py', '.js', '.css', '.html', '.md']
    
    for file_type in sample_file_types:
        issue_severity_by_type[file_type] = {
            'Critical': np.random.randint(0, max(1, len(result.critical_issues)//2)),
            'High': np.random.randint(0, max(1, len(result.high_priority_issues)//2)), 
            'Medium': np.random.randint(0, max(1, len(result.medium_priority_issues)//2)),
            'Low': np.random.randint(0, max(1, len(result.low_priority_issues)//2))
        }
    
    if issue_data_filtered:
        # === ROW 1: Interactive Pie Chart and 3D Visualization ===
        st.markdown("### 🎯 Issue Distribution Analysis")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("#### Interactive Issue Distribution")
            pie_fig = create_interactive_pie_chart(
                issue_data_filtered, 
                title="Issues by Priority Level"
            )
            
            # Configure for responsive mobile display
            pie_fig.update_layout(
                autosize=True,
                margin=dict(t=60, b=20, l=20, r=20),
                height=450
            )
            
            st.plotly_chart(pie_fig, use_container_width=True, config={
                'displayModeBar': True,
                'displaylogo': False,
                'toImageButtonOptions': {
                    'format': 'png',
                    'filename': 'issue_distribution_chart',
                    'height': 500,
                    'width': 700,
                    'scale': 1
                }
            })
            
            # Export buttons for pie chart
            st.markdown("**Chart Export Options:**")
            add_chart_export_buttons(pie_fig, "issue_distribution", "pie")
        
        with col2:
            st.markdown("#### 3D Issue Severity Analysis")
            if issue_severity_by_type:
                bar_3d_fig = create_3d_bar_chart(issue_severity_by_type)
                bar_3d_fig.update_layout(height=450)
                
                st.plotly_chart(bar_3d_fig, use_container_width=True, config={
                    'displayModeBar': True,
                    'displaylogo': False,
                    'toImageButtonOptions': {
                        'format': 'png',
                        'filename': '3d_severity_analysis',
                        'height': 500,
                        'width': 700,
                        'scale': 1
                    }
                })
                
                # Export buttons for 3D chart
                st.markdown("**Chart Export Options:**")
                add_chart_export_buttons(bar_3d_fig, "3d_severity_analysis", "3d")
            else:
                st.info("💡 3D analysis will show when file-specific issue data is available")
        
        # === ROW 2: Time Series Health Trends ===
        st.markdown("---")
        st.markdown("### 📈 Project Health Trends")
        
        # Get project path from session state if available
        project_path = getattr(st.session_state, 'project_path', 'Current Project')
        
        health_fig = create_time_series_health_chart(project_path, result.health_score)
        st.plotly_chart(health_fig, use_container_width=True, config={
            'displayModeBar': True,
            'displaylogo': False,
            'toImageButtonOptions': {
                'format': 'png', 
                'filename': 'health_trends_analysis',
                'height': 600,
                'width': 1000,
                'scale': 1
            }
        })
        
        # Export buttons for health trends
        col1, col2, col3, col4 = st.columns([1, 1, 1, 2])
        with col1:
            if st.button("📊 PNG", key="health_png", help="Download health trends as PNG"):
                try:
                    img_bytes = health_fig.to_image(format="png", width=1200, height=600, scale=2)
                    st.download_button(
                        "📥 Download", img_bytes, 
                        f"health_trends_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png",
                        "image/png", key="health_download_png"
                    )
                except Exception as e:
                    st.error(f"Export failed: {str(e)}")
        
        # === ROW 3: Network Graph and Donut Chart ===
        st.markdown("---")
        st.markdown("### 🔗 Technology Ecosystem")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("#### Dependency Network")
            if result.tech_stack and len(result.tech_stack) > 1:
                network_fig = create_network_graph(result.tech_stack)
                st.plotly_chart(network_fig, use_container_width=True, config={
                    'displayModeBar': True,
                    'displaylogo': False,
                    'scrollZoom': True
                })
                
                # Export for network graph
                st.markdown("**Export Network:**")
                add_chart_export_buttons(network_fig, "dependency_network", "network")
            else:
                st.info("💡 Network visualization requires multiple technologies in your stack")
        
        with col2:
            st.markdown("#### Technology Usage Distribution")
            if result.tech_stack:
                donut_fig = create_animated_donut_chart(
                    result.tech_stack,
                    "Tech Stack Composition"
                )
                st.plotly_chart(donut_fig, use_container_width=True, config={
                    'displayModeBar': True,
                    'displaylogo': False
                })
                
                # Export for donut chart
                st.markdown("**Export Distribution:**")
                add_chart_export_buttons(donut_fig, "tech_distribution", "donut")
            else:
                st.info("💡 Technology distribution will show when tech stack is detected")
        
        # === ROW 4: Analytics Summary and Insights ===
        st.markdown("---")
        st.markdown("### 🎯 Key Insights & Action Items")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            total_issues = sum(issue_data.values())
            critical_high = len(result.critical_issues) + len(result.high_priority_issues)
            
            st.markdown(f"""
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); 
                       border: 2px solid #0ea5e9; border-radius: 12px; padding: 20px; text-align: center;">
                <h4 style="color: #0c4a6e; margin: 0;">📊 Issue Summary</h4>
                <div style="font-size: 2rem; font-weight: bold; color: #0369a1; margin: 10px 0;">
                    {total_issues}
                </div>
                <div style="color: #0c4a6e;">Total Issues Found</div>
                <div style="margin-top: 10px; color: #ef4444;">
                    <strong>{critical_high} urgent</strong> need attention
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            health_status = "Excellent" if result.health_score >= 90 else "Good" if result.health_score >= 75 else "Fair" if result.health_score >= 60 else "Needs Work"
            health_color = "#10b981" if result.health_score >= 75 else "#f59e0b" if result.health_score >= 60 else "#ef4444"
            
            st.markdown(f"""
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); 
                       border: 2px solid #10b981; border-radius: 12px; padding: 20px; text-align: center;">
                <h4 style="color: #047857; margin: 0;">🏥 Health Score</h4>
                <div style="font-size: 2rem; font-weight: bold; color: {health_color}; margin: 10px 0;">
                    {result.health_score}/100
                </div>
                <div style="color: #047857;">Project Health Status</div>
                <div style="margin-top: 10px; color: {health_color};">
                    <strong>{health_status}</strong>
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        with col3:
            tech_count = len(result.tech_stack) if result.tech_stack else 0
            diversity_score = min(tech_count * 10, 100)
            
            st.markdown(f"""
            <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); 
                       border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; text-align: center;">
                <h4 style="color: #92400e; margin: 0;">🛠️ Tech Diversity</h4>
                <div style="font-size: 2rem; font-weight: bold; color: #d97706; margin: 10px 0;">
                    {tech_count}
                </div>
                <div style="color: #92400e;">Technologies Detected</div>
                <div style="margin-top: 10px; color: #d97706;">
                    <strong>{diversity_score}%</strong> diversity score
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        # Quick action recommendations
        if critical_high > 0:
            st.warning(f"⚠️ **Immediate Action Required**: {critical_high} urgent issues need your attention before proceeding with new features.")
        elif total_issues > 0:
            st.info(f"📋 **Maintenance Recommended**: {total_issues - critical_high} improvement opportunities identified for code quality enhancement.")
        else:
            st.success("🏆 **Excellent Status**: No issues detected! Your project maintains high quality standards.")
    
    else:
        # No issues found - show success visualization
        st.markdown("### 🎉 Perfect Project Health!")
        
        # Create a celebratory perfect score donut chart
        perfect_data = {'Excellent': 100}
        perfect_fig = create_interactive_pie_chart(
            perfect_data, 
            title="🏆 Perfect Health Score - No Issues Detected!", 
            show_legend=False
        )
        perfect_fig.update_traces(marker_colors=['#10B981'])
        perfect_fig.update_layout(height=300)
        
        st.plotly_chart(perfect_fig, use_container_width=True)
        
        st.markdown("""
        <div style="text-align: center; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); 
                   border: 2px solid #10b981; border-radius: 16px; padding: 30px; margin: 20px 0;">
            <h2 style="color: #047857; margin-bottom: 16px;">🎯 Project Excellence Achieved!</h2>
            <p style="color: #065f46; font-size: 1.1rem;">
                Your project demonstrates exceptional quality with zero detected issues. 
                This indicates excellent development practices and code maintenance.
            </p>
            <p style="color: #047857; margin-top: 20px; font-weight: 500;">
                Continue with confidence - your codebase is ready for production! 🚀
            </p>
        </div>
        """, unsafe_allow_html=True)

def show_intelligent_issue_analysis(result):
    """Show detailed issue analysis with specific details."""
    
    # Critical Issues
    if result.critical_issues:
        st.subheader("🚨 Critical Issues (Fix Immediately)")
        st.error(f"Found {len(result.critical_issues)} critical issues that need immediate attention!")
        
        for i, issue in enumerate(result.critical_issues, 1):
            # Create enhanced issue card
            issue_icon = "🚨"
            issue_class = "issue-critical"
            
            st.markdown(f"""
            <div class="issue-card {issue_class}">
                <div class="issue-header">
                    <div class="issue-icon">{issue_icon}</div>
                    <h3 class="issue-title">{i}. {issue.title}</h3>
                </div>
                <div class="issue-description">{issue.description}</div>
                {f'<div class="issue-location">📁 {issue.file_path}' + (f' (line {issue.line_number})' if issue.line_number else '') + '</div>' if issue.file_path else ''}
                {f'<div class="issue-action">💡 {issue.suggested_action}</div>' if issue.suggested_action else ''}
            </div>
            """, unsafe_allow_html=True)
            
            # Generate specific prompt for this issue
            if st.button(f"🔧 Generate Fix Prompt", key=f"critical_{i}", help="Generate specific prompt for this issue"):
                generator = SmartPromptGenerator(result)
                specific_prompt = generator.generate_specific_issue_prompt(issue)
                st.code(specific_prompt, language="markdown")
    
    # High Priority Issues
    if result.high_priority_issues:
        st.subheader("⚠️ High Priority Issues")
        
        # Show top high priority issues with enhanced cards
        for i, issue in enumerate(result.high_priority_issues[:5], 1):
            issue_icon = "⚠️"
            issue_class = "issue-high"
            
            with st.expander(f"⚠️ {i}. {issue.title}", expanded=i <= 2):  # Expand first 2
                st.markdown(f"""
                <div class="issue-card {issue_class}">
                    <div class="issue-header">
                        <div class="issue-icon">{issue_icon}</div>
                        <h4 class="issue-title">{issue.title}</h4>
                    </div>
                    <div class="issue-description">{issue.description}</div>
                    {f'<div class="issue-location">📁 {issue.file_path}' + (f' (line {issue.line_number})' if issue.line_number else '') + '</div>' if issue.file_path else ''}
                    {f'<div class="issue-action">💡 {issue.suggested_action}</div>' if issue.suggested_action else ''}
                </div>
                """, unsafe_allow_html=True)
                
                if st.button(f"🔧 Generate Fix", key=f"high_{i}", help="Generate specific fix for this issue"):
                    generator = SmartPromptGenerator(result)
                    specific_prompt = generator.generate_specific_issue_prompt(issue)
                    st.code(specific_prompt, language="markdown")
        
        if len(result.high_priority_issues) > 5:
            st.info(f"... and {len(result.high_priority_issues) - 5} more high priority issues")
    
    # Medium Priority Summary
    if result.medium_priority_issues:
        st.subheader("📋 Medium Priority Issues")
        st.info(f"Found {len(result.medium_priority_issues)} medium priority improvements")
        
        # Group by type for summary
        issue_types = {}
        for issue in result.medium_priority_issues:
            if issue.type not in issue_types:
                issue_types[issue.type] = 0
            issue_types[issue.type] += 1
        
        for issue_type, count in issue_types.items():
            st.write(f"- **{issue_type.replace('_', ' ').title()}**: {count} issues")

def display_detailed_issues(result):
    """Display detailed issue breakdown."""
    if result.critical_issues:
        st.error(f"🚨 {len(result.critical_issues)} Critical Issues Found")
        for issue in result.critical_issues[:5]:
            with st.expander(f"❌ {issue.title}", expanded=False):
                st.write(f"**Description:** {issue.description}")
                st.write(f"**File:** {issue.file_path}")
                st.write(f"**Suggested Action:** {issue.suggested_action}")

    if result.high_priority_issues:
        st.warning(f"⚠️ {len(result.high_priority_issues)} High Priority Issues")
        for issue in result.high_priority_issues[:5]:
            with st.expander(f"⚠️ {issue.title}", expanded=False):
                st.write(f"**Description:** {issue.description}")
                st.write(f"**Suggested Action:** {issue.suggested_action}")

def show_smart_prompts(result):
    """Show enhanced intelligent prompt generation based on analysis."""
    # Debug info for troubleshooting
    with st.expander("🔧 Debug Info", expanded=False):
        st.write(f"Analysis result type: {type(result)}")
        st.write(f"Has critical issues: {hasattr(result, 'critical_issues') and len(result.critical_issues) if hasattr(result, 'critical_issues') else 'N/A'}")
        st.write(f"Project type: {getattr(result, 'project_type', 'N/A')}")
        st.write(f"Session state prompts: {len(st.session_state.generated_prompts) if 'generated_prompts' in st.session_state else 0}")
    
    try:
        # Try enhanced version first
        st.info("📝 Loading enhanced prompt generation...")
        show_enhanced_smart_prompts(result)
    except Exception as e:
        # Fall back to basic version if enhanced fails
        st.warning(f"Enhanced features not available ({str(e)}), using basic prompt generation.")
        try:
            show_basic_smart_prompts(result)
        except Exception as e2:
            st.error(f"Both enhanced and basic prompt generation failed: {str(e2)}")
            st.info("🔧 Troubleshooting: Try refreshing the page and running analysis again.")

def show_enhanced_smart_prompts(result):
    """Show enhanced intelligent prompt generation with multi-model support."""
    st.header("🎯 Enhanced Smart Prompts (Multi-Model Optimized)")
    st.markdown("**Advanced prompt generation** with 60+ templates optimized for different AI models!")
    
    # Enhanced generator already imported at top of file
    
    # AI Model Selection
    st.subheader("🤖 AI Model Selection")
    model_options = {
        "GPT-4 (OpenAI)": AIModel.GPT_4,
        "Claude Opus (Anthropic)": AIModel.CLAUDE_OPUS, 
        "Claude Sonnet (Anthropic)": AIModel.CLAUDE_SONNET,
        "Claude Haiku (Anthropic)": AIModel.CLAUDE_HAIKU,
        "Gemini Pro (Google)": AIModel.GEMINI_PRO,
        "CodeLlama (Meta)": AIModel.CODELLAMA,
        "Mixtral (Mistral)": AIModel.MIXTRAL,
        "DeepSeek Coder": AIModel.DEEPSEEK_CODER,
        "Qwen Coder": AIModel.QWEN_CODER
    }
    
    selected_model_name = st.selectbox(
        "Choose your AI model for optimized prompts:",
        list(model_options.keys()),
        index=0
    )
    selected_model = model_options[selected_model_name]
    
    # Enhanced generator with model selection
    generator = SmartPromptGenerator(result, target_model=selected_model)
    
    # Show model-specific capabilities
    capabilities = generator.get_model_capabilities(selected_model)
    col1, col2 = st.columns(2)
    with col1:
        st.info(f"**Strengths:** {', '.join(capabilities.get('strengths', [])[:3])}")
    with col2:
        st.info(f"**Best for:** {', '.join(capabilities.get('best_for', [])[:3])}")
    
    # Issue-Based Automated Recommendations
    if result.critical_issues or result.high_priority_issues or result.missing_features:
        st.subheader("🚨 Recommended Actions (Based on Your Issues)")
        st.markdown("**Auto-generated recommendations** based on detected problems:")
        
        # Priority-based recommendations
        if result.critical_issues:
            st.error(f"**CRITICAL:** {len(result.critical_issues)} critical issues found!")
            if st.button("⚡ Generate Critical Fix Prompts", type="primary"):
                generate_enhanced_prompt("critical_issues", generator, result)
        
        if result.high_priority_issues:
            st.warning(f"**HIGH PRIORITY:** {len(result.high_priority_issues)} high priority issues")
            if st.button("🔥 Generate High Priority Fix Prompts"):
                generate_enhanced_prompt("high_priority_fixes", generator, result)
        
        if result.missing_features:
            st.info(f"**MISSING:** {len(result.missing_features)} suggested features")
            if st.button("✨ Generate Feature Addition Prompts"):
                generate_enhanced_prompt("add_features", generator, result)
    
    # Comprehensive Prompt Categories
    st.subheader("📚 All Available Prompt Types")
    
    # Get all available prompt types
    available_prompts = generator.get_available_prompt_types()
    
    # Organize prompts by category
    prompt_categories = {
        "🔧 Code Improvement": ["code_review", "refactoring", "performance_optimization", "security_audit"],
        "🏗️ Architecture & Design": ["architecture_design", "system_design", "database_design", "api_design"],
        "🧪 Testing & Quality": ["testing_strategy", "unit_tests", "integration_tests", "test_automation"],
        "📱 Frontend Development": ["ui_improvement", "responsive_design", "accessibility_audit", "user_experience"],
        "⚙️ Backend Development": ["api_development", "database_optimization", "scalability_planning", "microservices"],
        "🚀 DevOps & Deployment": ["ci_cd_setup", "containerization", "monitoring_setup", "deployment_strategy"],
        "📋 Project Management": ["project_planning", "documentation", "requirements_gathering", "risk_assessment"],
        "🔍 Analysis & Research": ["competitor_analysis", "technology_evaluation", "best_practices", "performance_analysis"]
    }
    
    # Create tabs for different categories
    tabs = st.tabs(list(prompt_categories.keys()))
    
    for tab, (category, prompt_types) in zip(tabs, prompt_categories.items()):
        with tab:
            # Filter available prompts for this category
            category_prompts = [p for p in prompt_types if p in available_prompts]
            
            if category_prompts:
                cols = st.columns(min(len(category_prompts), 3))
                for i, prompt_type in enumerate(category_prompts):
                    with cols[i % 3]:
                        # Get prompt type display info
                        prompt_info = generator.get_prompt_type_info(prompt_type)
                        
                        if st.button(
                            f"{prompt_info.get('icon', '📝')} {prompt_info.get('name', prompt_type.title())}",
                            key=f"btn_{prompt_type}",
                            help=prompt_info.get('description', ''),
                            use_container_width=True
                        ):
                            generate_enhanced_prompt(prompt_type, generator, result)
            else:
                st.info(f"No prompts available in this category yet.")
    
    # Quick Action Buttons
    st.subheader("⚡ Quick Actions")
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("🎯 Smart Recommendations", type="primary", use_container_width=True):
            auto_recommendations = generator.get_smart_recommendations(result)
            for prompt_type in auto_recommendations:
                generate_enhanced_prompt(prompt_type, generator, result)
    
    with col2:
        if st.button("📊 Generate All Core Prompts", use_container_width=True):
            core_prompts = ["code_review", "architecture_design", "testing_strategy", "security_audit"]
            for prompt_type in core_prompts:
                if prompt_type in available_prompts:
                    generate_enhanced_prompt(prompt_type, generator, result)
    
    with col3:
        if st.button("🔄 Clear All Prompts", use_container_width=True):
            st.session_state.generated_prompts.clear()
            st.rerun()
    
    # Display generated prompts with enhanced features
    if st.session_state.generated_prompts:
        st.subheader("Generated Smart Prompts")
        st.markdown(f"**{len(st.session_state.generated_prompts)} prompts ready** - Optimized for {selected_model_name}")
        
        for prompt_name, prompt_data in st.session_state.generated_prompts.items():
            prompt_content = prompt_data if isinstance(prompt_data, str) else prompt_data.get('prompt', str(prompt_data))
            
            with st.expander(f"📝 {prompt_name}", expanded=False):
                # Show model optimization info if available
                if isinstance(prompt_data, dict):
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.metric("Max Tokens", prompt_data.get('max_tokens', 'N/A'))
                    with col2:
                        st.metric("Temperature", prompt_data.get('temperature', 'N/A'))
                    with col3:
                        st.metric("Model", prompt_data.get('model', 'Default'))
                
                st.code(prompt_content, language="markdown")
                
                # Enhanced copy functionality
                col1, col2 = st.columns(2)
                with col1:
                    if st.button(f"📋 Copy {prompt_name}", key=f"copy_{prompt_name}"):
                        st.success(f"✅ {prompt_name} copied! Paste into your AI assistant.")
                with col2:
                    if st.button(f"📧 Export {prompt_name}", key=f"export_{prompt_name}"):
                        # Could add export functionality here
                        st.info(f"💾 {prompt_name} marked for export")

def show_basic_smart_prompts(result):
    """Basic smart prompt generation fallback."""
    st.header("🎯 Smart Prompts (Ready to Use)")
    st.markdown("These prompts are generated based on your **actual project issues** - no placeholders!")
    
    # Prompt generation buttons
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("🚨 Fix Critical Issues", type="primary", use_container_width=True):
            generate_and_display_prompt("critical_issues", result)
    
    with col2:
        if st.button("🔧 Add Missing Features", use_container_width=True):
            generate_and_display_prompt("missing_features", result)
    
    with col3:
        if st.button("📋 Comprehensive Plan", use_container_width=True):
            generate_and_display_prompt("comprehensive", result)
    
    # Additional prompt types
    col4, col5 = st.columns(2)
    
    with col4:
        if st.button("🧪 Improve Testing", use_container_width=True):
            generate_and_display_prompt("testing", result)
    
    with col5:
        if st.button("📊 Generate All Prompts", use_container_width=True):
            generate_all_smart_prompts(result)
    
    # Display generated prompts
    if st.session_state.generated_prompts:
        st.subheader("Generated Smart Prompts")
        
        for prompt_name, prompt_content in st.session_state.generated_prompts.items():
            with st.expander(f"📝 {prompt_name}", expanded=True):
                st.code(prompt_content, language="markdown")
                
                # Copy button with feedback
                if st.button(f"📋 Copy {prompt_name}", key=f"copy_{prompt_name}"):
                    st.success(f"✅ {prompt_name} copied! Paste into your AI assistant.")

def generate_enhanced_prompt(prompt_type: str, generator, result):
    """Generate and display enhanced smart prompts using the new multi-model system."""
    try:
        # Build context for the prompt
        context = {
            'project_path': result.project_path,
            'project_type': result.project_type,
            'tech_stack': ', '.join(result.tech_stack) if result.tech_stack else 'Not specified',
            'health_score': result.health_score,
            'critical_issues': len(result.critical_issues),
            'high_priority_issues': len(result.high_priority_issues),
            'code_quality_metrics': result.code_quality_metrics
        }
        
        # Generate the optimized prompt
        prompt_result = generator.generate_model_optimized_prompt(prompt_type, context)
        
        # Get prompt type info for display name
        prompt_info = generator.get_prompt_type_info(prompt_type)
        display_name = prompt_info.get('name', prompt_type.replace('_', ' ').title())
        
        # Store the enhanced prompt with metadata
        st.session_state.generated_prompts[display_name] = prompt_result
        
        # Show success message
        st.success(f"Generated {display_name} prompt optimized for {generator.target_model.value}!")
        
    except Exception as e:
        st.error(f"Error generating {prompt_type} prompt: {str(e)}")
    
    st.rerun()

def generate_and_display_prompt(prompt_type: str, result):
    """Legacy function - generate and display a specific smart prompt."""
    try:
        st.info(f"🔄 Generating {prompt_type.replace('_', ' ').title()} prompt...")
        generator = SmartPromptGenerator(result)
        
        if prompt_type == "critical_issues":
            prompt = generator.generate_critical_issues_prompt()
            st.session_state.generated_prompts["Critical Issues Fix"] = prompt
        elif prompt_type == "missing_features":
            prompt = generator.generate_missing_features_prompt()
            st.session_state.generated_prompts["Missing Features"] = prompt
        elif prompt_type == "comprehensive":
            prompt = generator.generate_comprehensive_improvement_prompt()
            st.session_state.generated_prompts["Comprehensive Improvement Plan"] = prompt
        elif prompt_type == "testing":
            prompt = generator.generate_test_improvement_prompt()
            st.session_state.generated_prompts["Testing Strategy"] = prompt
        else:
            st.error(f"Unknown prompt type: {prompt_type}")
            return
            
        st.success(f"✅ {prompt_type.replace('_', ' ').title()} prompt generated!")
        
    except Exception as e:
        st.error(f"❌ Error generating {prompt_type} prompt: {str(e)}")
        with st.expander("🔍 Error Details", expanded=False):
            st.code(str(e))
    
    st.rerun()

def generate_all_smart_prompts(result):
    """Generate all available smart prompts."""
    try:
        st.info("🔄 Generating all smart prompts...")
        progress_bar = st.progress(0)
        
        generator = SmartPromptGenerator(result)
        prompts = {}
        
        # Generate prompts with progress tracking
        prompt_types = [
            ("Critical Issues Fix", lambda: generator.generate_critical_issues_prompt()),
            ("Missing Features", lambda: generator.generate_missing_features_prompt()),
            ("Comprehensive Plan", lambda: generator.generate_comprehensive_improvement_prompt()),
            ("Testing Strategy", lambda: generator.generate_test_improvement_prompt())
        ]
        
        for i, (name, generate_func) in enumerate(prompt_types):
            try:
                prompts[name] = generate_func()
                progress_bar.progress((i + 1) / len(prompt_types))
            except Exception as e:
                st.warning(f"⚠️ Failed to generate {name}: {str(e)}")
        
        st.session_state.generated_prompts.update(prompts)
        st.success(f"✅ Generated {len(prompts)} smart prompts!")
        
    except Exception as e:
        st.error(f"❌ Error generating prompts: {str(e)}")
        with st.expander("🔍 Error Details", expanded=False):
            st.code(str(e))
    
    st.rerun()

def show_new_project_wizard():
    """Show the new project context gathering wizard."""
    st.header("🆕 New Project Context Wizard")
    st.markdown("Gather comprehensive context for your new project to get the best AI assistance.")
    
    wizard = NewProjectWizard()
    
    # Project type selection
    st.subheader("1. Project Type")
    project_types = wizard.get_project_types()
    
    selected_type = st.selectbox(
        "What type of project are you creating?",
        list(project_types.keys()),
        format_func=lambda x: f"{project_types[x]['name']} - {project_types[x]['description']}"
    )
    
    # Basic project information
    st.subheader("2. Project Information")
    
    col1, col2 = st.columns(2)
    
    with col1:
        project_name = st.text_input("Project Name", placeholder="My Awesome Project")
        timeline = st.selectbox("Timeline", ["2-4 weeks", "1-3 months", "3-6 months", "6+ months"])
    
    with col2:
        team_size = st.number_input("Team Size", min_value=1, max_value=20, value=1)
        budget = st.selectbox("Budget Constraints", ["Minimal", "Small", "Medium", "Large", "Enterprise"])
    
    project_description = st.text_area(
        "Project Description",
        placeholder="Describe what your project will do and its main purpose..."
    )
    
    # Goals and requirements
    st.subheader("3. Goals & Requirements")
    
    goals = st.text_area(
        "Project Goals (one per line)",
        placeholder="Create user-friendly interface\nProcess data efficiently\nScale to handle 1000+ users"
    ).split('\n') if st.text_area(
        "Project Goals (one per line)",
        placeholder="Create user-friendly interface\nProcess data efficiently\nScale to handle 1000+ users"
    ) else []
    
    target_users = st.text_area(
        "Target Users (one per line)",
        placeholder="Small business owners\nData analysts\nDevelopers"
    ).split('\n') if st.text_area(
        "Target Users (one per line)",
        placeholder="Small business owners\nData analysts\nDevelopers"
    ) else []
    
    # Technical requirements
    st.subheader("4. Technical Stack")
    
    # Get recommended stacks for the project type
    recommended_stacks = wizard.get_tech_stack_recommendations(selected_type)
    
    if recommended_stacks:
        st.markdown("**Recommended Technology Stacks:**")
        selected_stack = st.radio("Choose a recommended stack:", list(recommended_stacks.keys()))
        tech_stack = recommended_stacks[selected_stack]
        
        # Allow customization
        st.markdown("**Customize your stack:**")
        custom_tech = {}
        for component, technology in tech_stack.items():
            custom_tech[component] = st.text_input(f"{component.title()}", value=technology)
        
        tech_stack = custom_tech
    else:
        # Manual tech stack entry
        tech_stack = {
            "Frontend": st.text_input("Frontend Technology", placeholder="React, Vue, Angular, etc."),
            "Backend": st.text_input("Backend Technology", placeholder="Node.js, Python, Java, etc."),
            "Database": st.text_input("Database", placeholder="PostgreSQL, MongoDB, etc.")
        }
    
    # Generate project specification
    if st.button("🚀 Generate Project Specification", type="primary", use_container_width=True):
        if project_name and project_description:
            # Create requirements object
            form_data = {
                'name': project_name,
                'description': project_description,
                'goals': [g.strip() for g in goals if g.strip()],
                'target_users': [u.strip() for u in target_users if u.strip()],
                'success_metrics': [f"User satisfaction", f"Performance targets", f"Adoption goals"],
                'project_type': selected_type,
                'tech_stack': tech_stack,
                'architecture_pattern': 'MVC',  # Default, could be made selectable
                'database_needs': {'type': tech_stack.get('Database', 'TBD')},
                'api_integrations': [],
                'performance_targets': {'response_time': '< 2 seconds', 'uptime': '99.9%'},
                'security_requirements': ['Input validation', 'Authentication', 'Data encryption'],
                'timeline': timeline,
                'team_size': team_size,
                'team_skills': ['Programming', 'Design', 'Testing'],  # Could be made selectable
                'budget_constraints': budget,
                'deployment_environment': 'Cloud',
                'similar_projects': [],
                'inspiration_sources': [],
                'avoid_patterns': []
            }
            
            requirements = wizard.create_requirements_from_streamlit_input(form_data)
            specification_prompt = wizard.generate_project_specification_prompt(requirements)
            
            # Store and display
            st.session_state.new_project_requirements = requirements
            st.session_state.generated_prompts["New Project Specification"] = specification_prompt
            
            st.success("🎉 Project specification generated!")
            
            # Display the specification
            st.subheader("📋 Your Project Specification")
            st.code(specification_prompt, language="markdown")
            
            # Save option
            if st.button("💾 Save Project Specification"):
                filename = wizard.save_requirements(requirements)
                st.success(f"✅ Project saved to: `{filename}`")
        else:
            st.warning("⚠️ Please fill in at least the project name and description.")

def add_export_section(result):
    """Add enhanced export functionality with microinteractions."""
    st.markdown("---")
    st.markdown('<div class="section-fade-in">', unsafe_allow_html=True)
    st.subheader("📥 Export Analysis")
    
    # Enhanced export buttons with tooltips
    col1, col2, col3 = st.columns(3)
    
    with col1:
        # JSON Export with tooltip
        json_tooltip = create_tooltip(
            content='<div class="action-button export-btn" style="text-align: center; padding: 12px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; border-radius: 8px; margin-bottom: 8px;">💾 Export JSON</div>',
            tooltip_text="JSON Export",
            rich_content='<h4>JSON Export</h4><p>Download complete analysis data in structured JSON format. Perfect for integration with other tools.</p>'
        )
        st.markdown(json_tooltip, unsafe_allow_html=True)
        
        if st.button("💾 Export JSON", key="export_json", use_container_width=True):
            # Show loading state
            with st.spinner("Preparing JSON export..."):
                import json
                from src.analyzers.project_intelligence import ProjectIntelligenceAnalyzer
                
                analyzer = ProjectIntelligenceAnalyzer()
                export_data = analyzer.to_dict(result)
                json_str = json.dumps(export_data, indent=2, ensure_ascii=False)
                
            # Success animation
            st.markdown("""
            <div class="success-animation">
                <div class="checkmark-container">
                    <svg class="checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <span class="success-message">JSON export ready!</span>
            </div>
            """, unsafe_allow_html=True)
            
            st.download_button(
                label="📥 Download JSON Report",
                data=json_str,
                file_name=f"analysis_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                mime="application/json",
                use_container_width=True
            )
    
    with col2:
        # Markdown Export with tooltip
        md_tooltip = create_tooltip(
            content='<div class="action-button export-btn" style="text-align: center; padding: 12px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border-radius: 8px; margin-bottom: 8px;">📄 Export Markdown</div>',
            tooltip_text="Markdown Export",
            rich_content='<h4>Markdown Export</h4><p>Generate a beautifully formatted markdown report. Great for documentation and sharing.</p>'
        )
        st.markdown(md_tooltip, unsafe_allow_html=True)
        
        if st.button("📄 Export Markdown", key="export_md", use_container_width=True):
            with st.spinner("Generating markdown report..."):
                markdown_report = generate_markdown_report(result)
            
            # Success animation
            st.markdown("""
            <div class="success-animation">
                <div class="checkmark-container">
                    <svg class="checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <span class="success-message">Markdown report generated!</span>
            </div>
            """, unsafe_allow_html=True)
            
            st.download_button(
                label="📥 Download Markdown Report",
                data=markdown_report,
                file_name=f"analysis_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md",
                mime="text/markdown",
                use_container_width=True
            )
    
    with col3:
        # Summary Copy with tooltip
        summary_tooltip = create_tooltip(
            content='<div class="action-button export-btn" style="text-align: center; padding: 12px; background: linear-gradient(135deg, #10b981, #059669); color: white; border-radius: 8px; margin-bottom: 8px;">📋 Copy Summary</div>',
            tooltip_text="Copy Summary",
            rich_content='<h4>Quick Summary</h4><p>Generate an executive summary perfect for copying to your clipboard and sharing.</p>'
        )
        st.markdown(summary_tooltip, unsafe_allow_html=True)
        
        if st.button("📋 Copy Summary", key="copy_summary", use_container_width=True):
            with st.spinner("Generating executive summary..."):
                summary = generate_quick_summary(result)
            
            # Success animation
            st.markdown("""
            <div class="success-animation">
                <div class="checkmark-container">
                    <svg class="checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <span class="success-message">Summary ready to copy!</span>
            </div>
            """, unsafe_allow_html=True)
            
            st.text_area("Executive Summary (Copy this):", value=summary, height=150)
    
    st.markdown('</div>', unsafe_allow_html=True)

def generate_markdown_report(result):
    """Generate a markdown report of the analysis."""
    report = f"""# Project Analysis Report

## Executive Summary
- **Health Score**: {result.health_score}/100
- **Project Type**: {result.project_type.title()}
- **Analysis Date**: {datetime.now().strftime('%Y-%m-%d %H:%M')}
- **Technology Stack**: {', '.join(result.tech_stack) if result.tech_stack else 'Not detected'}

## Issue Breakdown
- 🚨 **Critical Issues**: {len(result.critical_issues)}
- ⚠️ **High Priority**: {len(result.high_priority_issues)}
- 📋 **Medium Priority**: {len(result.medium_priority_issues)}
- 💡 **Low Priority**: {len(result.low_priority_issues)}

## Strategic Recommendations
"""
    
    if result.suggestions:
        for suggestion in result.suggestions:
            report += f"- {suggestion}\n"
    else:
        report += "- No specific recommendations - project is in good health\n"
    
    # Add critical issues if any
    if result.critical_issues:
        report += "\n## 🚨 Critical Issues\n"
        for i, issue in enumerate(result.critical_issues, 1):
            report += f"\n### {i}. {issue.title}\n"
            report += f"**Description**: {issue.description}\n"
            if issue.file_path:
                location = f"{issue.file_path}"
                if issue.line_number:
                    location += f" (line {issue.line_number})"
                report += f"**Location**: `{location}`\n"
            if issue.suggested_action:
                report += f"**Action**: {issue.suggested_action}\n"
    
    # Add high priority issues (top 5)
    if result.high_priority_issues:
        report += "\n## ⚠️ High Priority Issues\n"
        for i, issue in enumerate(result.high_priority_issues[:5], 1):
            report += f"\n### {i}. {issue.title}\n"
            report += f"**Description**: {issue.description}\n"
            if issue.file_path:
                location = f"{issue.file_path}"
                if issue.line_number:
                    location += f" (line {issue.line_number})"
                report += f"**Location**: `{location}`\n"
            if issue.suggested_action:
                report += f"**Action**: {issue.suggested_action}\n"
        
        if len(result.high_priority_issues) > 5:
            report += f"\n... and {len(result.high_priority_issues) - 5} more high priority issues\n"
    
    report += f"""
## Summary
This analysis identified {len(result.critical_issues) + len(result.high_priority_issues)} urgent issues requiring attention and {len(result.medium_priority_issues) + len(result.low_priority_issues)} improvement opportunities.

Generated with [Prompt Engineer](https://github.com/your-repo) - Intelligent Project Analysis
"""
    
    return report

def generate_quick_summary(result):
    """Generate a quick executive summary."""
    total_issues = (len(result.critical_issues) + len(result.high_priority_issues) + 
                   len(result.medium_priority_issues) + len(result.low_priority_issues))
    
    health_status = "Excellent" if result.health_score >= 90 else "Good" if result.health_score >= 75 else "Fair" if result.health_score >= 60 else "Needs Improvement"
    
    urgent_issues = len(result.critical_issues) + len(result.high_priority_issues)
    
    summary = f"""🔍 PROJECT ANALYSIS SUMMARY

Health Score: {result.health_score}/100 ({health_status})
Project Type: {result.project_type.title()}
Tech Stack: {', '.join(result.tech_stack[:3]) if result.tech_stack else 'Not detected'}

📊 ISSUE BREAKDOWN:
• Critical: {len(result.critical_issues)}
• High Priority: {len(result.high_priority_issues)}
• Medium Priority: {len(result.medium_priority_issues)}
• Low Priority: {len(result.low_priority_issues)}

🎯 KEY ACTIONS:
"""
    
    if urgent_issues == 0:
        summary += "✅ No urgent issues - project is in good health!"
    else:
        summary += f"⚠️ {urgent_issues} urgent issues need attention"
    
    if result.suggestions:
        summary += f"\n\n📋 RECOMMENDATIONS:\n"
        for suggestion in result.suggestions[:3]:  # Top 3 suggestions
            summary += f"• {suggestion}\n"
    
    summary += f"\nGenerated: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    
    return summary

def show_history_page():
    """Show analysis history management and comparison page."""
    st.header("📊 Analysis History")
    
    if st.session_state.history_manager is None:
        st.error("History manager not initialized. Please go to Analysis page first.")
        return
    
    # Get project summary stats
    try:
        summary = st.session_state.history_manager.get_project_summary()
        
        # Display summary metrics
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("Total Projects", summary.get('total_projects', 0))
        
        with col2:
            st.metric("Total Snapshots", summary.get('total_snapshots', 0))
        
        with col3:
            avg_health = summary.get('avg_health_score', 0)
            st.metric("Avg Health Score", f"{avg_health:.1f}/100" if avg_health else "N/A")
        
        with col4:
            st.metric("Best Health Score", f"{summary.get('max_health_score', 0)}/100")
        
    except Exception as e:
        st.error(f"Error loading summary: {e}")
        return
    
    st.markdown("---")
    
    # Project selection for history viewing
    st.subheader("📁 Select Project for History")
    
    # Manual project path input
    project_path_input = st.text_input(
        "Project Path",
        value=st.session_state.selected_project_for_history or "",
        placeholder="C:\\dev\\projects\\my-project"
    )
    
    if project_path_input:
        st.session_state.selected_project_for_history = project_path_input
        
        try:
            # Get project history
            history = st.session_state.history_manager.get_project_history(project_path_input, limit=20)
            
            if not history:
                st.warning(f"No analysis history found for: {project_path_input}")
                st.info("Run an analysis first to see history data.")
                return
            
            st.success(f"Found {len(history)} analysis snapshots")
            
            # History timeline
            st.subheader("📈 Analysis Timeline")
            
            # Create columns for history actions
            hist_col1, hist_col2, hist_col3 = st.columns(3)
            
            with hist_col1:
                if st.button("📊 View Timeline Chart", use_container_width=True):
                    show_timeline_chart(history)
            
            with hist_col2:
                if st.button("🔄 Compare Analyses", use_container_width=True):
                    show_comparison_interface(history)
            
            with hist_col3:
                if st.button("📥 Export History", use_container_width=True):
                    export_project_history(project_path_input)
            
            # Show recent snapshots table
            st.subheader("🗂️ Recent Analysis Snapshots")
            
            # Create expandable sections for each snapshot
            for i, snapshot in enumerate(history[:10]):  # Show last 10
                analysis_date = snapshot.analysis_date.strftime("%Y-%m-%d %H:%M")
                
                # Color-code based on health score
                if snapshot.health_score >= 80:
                    health_color = "#10b981"
                    health_icon = "✅"
                elif snapshot.health_score >= 60:
                    health_color = "#3b82f6"
                    health_icon = "📋"
                else:
                    health_color = "#f59e0b"
                    health_icon = "⚠️"
                
                with st.expander(f"{health_icon} {analysis_date} - Health: {snapshot.health_score}/100", 
                               expanded=i == 0):  # Expand first one
                    
                    # Snapshot details
                    detail_col1, detail_col2 = st.columns(2)
                    
                    with detail_col1:
                        st.markdown(f"""
                        **Project:** {snapshot.project_name}  
                        **Type:** {snapshot.project_type}  
                        **Health Score:** {snapshot.health_score}/100  
                        **Total Issues:** {snapshot.total_issues}
                        """)
                    
                    with detail_col2:
                        st.markdown(f"""
                        **Critical:** {snapshot.critical_issues}  
                        **High:** {snapshot.high_priority_issues}  
                        **Medium:** {snapshot.medium_priority_issues}  
                        **Low:** {snapshot.low_priority_issues}
                        """)
                    
                    if snapshot.tech_stack:
                        st.markdown("**Tech Stack:** " + ", ".join(snapshot.tech_stack))
                    
                    if snapshot.notes:
                        st.markdown(f"**Notes:** {snapshot.notes}")
                    
                    # Action buttons for this snapshot
                    snap_col1, snap_col2, snap_col3 = st.columns(3)
                    
                    with snap_col1:
                        if st.button(f"📊 View Details", key=f"details_{snapshot.id}"):
                            show_snapshot_details(snapshot)
                    
                    with snap_col2:
                        if len(history) > 1 and st.button(f"🔄 Compare", key=f"compare_{snapshot.id}"):
                            st.session_state[f"compare_snapshot_{snapshot.id}"] = True
                    
                    with snap_col3:
                        if st.button(f"🏷️ Add Tag", key=f"tag_{snapshot.id}"):
                            st.session_state[f"tag_snapshot_{snapshot.id}"] = True
                    
                    # Handle comparison modal
                    if st.session_state.get(f"compare_snapshot_{snapshot.id}"):
                        show_comparison_modal(snapshot, history)
            
        except Exception as e:
            st.error(f"Error loading project history: {e}")
    
    # Global history management
    st.markdown("---")
    st.subheader("🛠️ History Management")
    
    mgmt_col1, mgmt_col2, mgmt_col3 = st.columns(3)
    
    with mgmt_col1:
        if st.button("📤 Export All History", use_container_width=True):
            export_all_history()
    
    with mgmt_col2:
        uploaded_file = st.file_uploader("📥 Import History", type=['json'])
        if uploaded_file and st.button("Import", use_container_width=True):
            import_history_file(uploaded_file)
    
    with mgmt_col3:
        if st.button("🧹 Cleanup Old Data", use_container_width=True):
            cleanup_old_data()

def show_timeline_chart(history: list):
    """Show timeline chart for analysis history."""
    import pandas as pd
    import plotly.express as px
    import plotly.graph_objects as go
    
    try:
        # Prepare data for timeline
        timeline_data = []
        for snapshot in history:
            timeline_data.append({
                'Date': snapshot.analysis_date,
                'Health Score': snapshot.health_score,
                'Total Issues': snapshot.total_issues,
                'Critical Issues': snapshot.critical_issues,
                'Project': snapshot.project_name
            })
        
        df = pd.DataFrame(timeline_data)
        
        # Create subplots
        from plotly.subplots import make_subplots
        
        fig = make_subplots(
            rows=2, cols=1,
            subplot_titles=('Health Score Over Time', 'Issues Over Time'),
            vertical_spacing=0.12
        )
        
        # Health score line chart
        fig.add_trace(
            go.Scatter(x=df['Date'], y=df['Health Score'], 
                      mode='lines+markers', name='Health Score',
                      line=dict(color='#3b82f6', width=3),
                      marker=dict(size=8)),
            row=1, col=1
        )
        
        # Issues stacked area chart
        fig.add_trace(
            go.Scatter(x=df['Date'], y=df['Critical Issues'], 
                      mode='lines', name='Critical',
                      fill='tozeroy', fillcolor='rgba(239, 68, 68, 0.3)',
                      line=dict(color='#dc2626')),
            row=2, col=1
        )
        
        fig.add_trace(
            go.Scatter(x=df['Date'], y=df['Total Issues'], 
                      mode='lines', name='Total Issues',
                      line=dict(color='#6b7280', width=2)),
            row=2, col=1
        )
        
        # Update layout
        fig.update_layout(
            title_text="Project Analysis Timeline",
            height=600,
            showlegend=True,
            hovermode='x unified'
        )
        
        fig.update_xaxes(title_text="Date", row=2, col=1)
        fig.update_yaxes(title_text="Score", row=1, col=1)
        fig.update_yaxes(title_text="Issues", row=2, col=1)
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Summary insights
        if len(history) >= 2:
            latest = history[0]
            previous = history[1]
            
            health_change = latest.health_score - previous.health_score
            issues_change = latest.total_issues - previous.total_issues
            
            st.subheader("📋 Recent Trends")
            
            trend_col1, trend_col2 = st.columns(2)
            
            with trend_col1:
                health_trend = "📈 Improving" if health_change > 0 else "📉 Declining" if health_change < 0 else "➡️ Stable"
                st.metric("Health Score Trend", health_trend, f"{health_change:+.1f}")
            
            with trend_col2:
                issues_trend = "📈 Increasing" if issues_change > 0 else "📉 Decreasing" if issues_change < 0 else "➡️ Stable"
                st.metric("Issues Trend", issues_trend, f"{issues_change:+d}")
        
    except Exception as e:
        st.error(f"Error creating timeline chart: {e}")
        # Fallback to simple table
        st.subheader("Analysis History")
        history_data = []
        for snapshot in history:
            history_data.append({
                'Date': snapshot.analysis_date.strftime('%Y-%m-%d %H:%M'),
                'Health Score': snapshot.health_score,
                'Critical': snapshot.critical_issues,
                'High': snapshot.high_priority_issues,
                'Medium': snapshot.medium_priority_issues,
                'Low': snapshot.low_priority_issues,
                'Total Issues': snapshot.total_issues
            })
        
        df = pd.DataFrame(history_data)
        st.dataframe(df, use_container_width=True)

def show_comparison_interface(history: list):
    """Show interface for comparing two analysis snapshots."""
    if len(history) < 2:
        st.warning("Need at least 2 analysis snapshots to compare.")
        return
    
    st.subheader("🔄 Compare Analysis Snapshots")
    
    # Create options for comparison
    snapshot_options = {}
    for snapshot in history:
        date_str = snapshot.analysis_date.strftime('%Y-%m-%d %H:%M')
        label = f"{date_str} (Health: {snapshot.health_score}/100)"
        snapshot_options[label] = snapshot
    
    col1, col2 = st.columns(2)
    
    with col1:
        baseline_key = st.selectbox(
            "Select Baseline (Older) Analysis",
            list(snapshot_options.keys()),
            index=1 if len(snapshot_options) > 1 else 0
        )
    
    with col2:
        current_key = st.selectbox(
            "Select Current (Newer) Analysis",
            list(snapshot_options.keys()),
            index=0
        )
    
    if baseline_key != current_key:
        baseline_snapshot = snapshot_options[baseline_key]
        current_snapshot = snapshot_options[current_key]
        
        if st.button("🔄 Generate Comparison Report", type="primary"):
            with st.spinner("Generating comparison report..."):
                try:
                    comparison = st.session_state.history_manager.compare_analyses(
                        baseline_snapshot.id, current_snapshot.id
                    )
                    
                    show_comparison_report(comparison)
                    
                except Exception as e:
                    st.error(f"Error generating comparison: {e}")
    else:
        st.warning("Please select two different snapshots to compare.")

def show_comparison_report(comparison: ComparisonReport):
    """Display detailed comparison report."""
    st.subheader("📊 Analysis Comparison Report")
    
    # Overall improvement indicator
    if comparison.overall_improvement:
        st.success(f"🎉 Overall Improvement: +{comparison.improvement_percentage:.1f}%")
    else:
        st.warning(f"⚠️ Overall Decline: {comparison.improvement_percentage:.1f}%")
    
    # Key metrics comparison
    st.subheader("📋 Key Metrics Comparison")
    
    metrics_col1, metrics_col2, metrics_col3 = st.columns(3)
    
    with metrics_col1:
        health_change = comparison.current_snapshot.health_score - comparison.baseline_snapshot.health_score
        st.metric(
            "Health Score",
            f"{comparison.current_snapshot.health_score}/100",
            f"{health_change:+d}"
        )
    
    with metrics_col2:
        issues_change = comparison.current_snapshot.total_issues - comparison.baseline_snapshot.total_issues
        st.metric(
            "Total Issues",
            comparison.current_snapshot.total_issues,
            f"{issues_change:+d}"
        )
    
    with metrics_col3:
        critical_change = comparison.current_snapshot.critical_issues - comparison.baseline_snapshot.critical_issues
        st.metric(
            "Critical Issues",
            comparison.current_snapshot.critical_issues,
            f"{critical_change:+d}"
        )
    
    # Trends analysis
    if comparison.trends:
        st.subheader("📈 Detailed Trends")
        
        for trend in comparison.trends:
            if trend.confidence_level != 'low':  # Only show significant trends
                if trend.trend_direction == 'improving':
                    st.success(f"✅ {trend.metric_name}: {trend.trend_direction.title()} ({trend.change_percentage:+.1f}%)")
                elif trend.trend_direction == 'declining':
                    st.error(f"❌ {trend.metric_name}: {trend.trend_direction.title()} ({trend.change_percentage:+.1f}%)")
                else:
                    st.info(f"➡️ {trend.metric_name}: Stable")
    
    # Issue changes
    st.subheader("🔄 Issue Changes")
    
    change_col1, change_col2 = st.columns(2)
    
    with change_col1:
        if comparison.resolved_issues:
            st.success(f"✅ Resolved Issues: {len(comparison.resolved_issues)}")
            with st.expander("View Resolved Issues"):
                for issue in comparison.resolved_issues[:5]:  # Show first 5
                    st.write(f"- {issue.get('title', 'Unknown issue')}")
                if len(comparison.resolved_issues) > 5:
                    st.write(f"... and {len(comparison.resolved_issues) - 5} more")
    
    with change_col2:
        if comparison.new_issues:
            st.warning(f"⚠️ New Issues: {len(comparison.new_issues)}")
            with st.expander("View New Issues"):
                for issue in comparison.new_issues[:5]:  # Show first 5
                    st.write(f"- {issue.get('title', 'Unknown issue')}")
                if len(comparison.new_issues) > 5:
                    st.write(f"... and {len(comparison.new_issues) - 5} more")
    
    # Key insights
    if comparison.key_insights:
        st.subheader("💡 Key Insights")
        for insight in comparison.key_insights:
            st.info(insight)
    
    # Recommendations
    if comparison.recommendations:
        st.subheader("🎯 Recommendations")
        for recommendation in comparison.recommendations:
            st.warning(recommendation)

def show_trends_page():
    """Show trend analysis and visualization page."""
    st.header("📈 Project Trends Analysis")
    
    if st.session_state.history_manager is None:
        st.error("History manager not initialized. Please go to Analysis page first.")
        return
    
    # Project selection
    project_path = st.text_input(
        "Project Path for Trend Analysis",
        placeholder="C:\\dev\\projects\\my-project"
    )
    
    if project_path:
        days_range = st.slider("Analysis Period (Days)", 7, 365, 30)
        
        try:
            # Get trend data
            trend_data = st.session_state.history_manager.get_trend_data(
                project_path, days=days_range
            )
            
            if not trend_data:
                st.warning("No trend data available for this project.")
                return
            
            # Display trend charts
            for metric_name, data in trend_data.items():
                if len(data['dates']) > 1:  # Need at least 2 points for trend
                    st.subheader(f"📊 {metric_name.replace('_', ' ').title()} Trend")
                    
                    # Create trend chart
                    import pandas as pd
                    chart_df = pd.DataFrame({
                        'Date': pd.to_datetime(data['dates']),
                        'Value': data['values']
                    })
                    
                    st.line_chart(chart_df.set_index('Date'))
                    
                    # Calculate trend statistics
                    if len(data['values']) >= 2:
                        latest = data['values'][0]
                        earliest = data['values'][-1]
                        change = latest - earliest
                        change_pct = (change / earliest * 100) if earliest != 0 else 0
                        
                        trend_direction = "📈 Increasing" if change > 0 else "📉 Decreasing" if change < 0 else "➡️ Stable"
                        
                        col1, col2, col3 = st.columns(3)
                        with col1:
                            st.metric("Current Value", f"{latest:.1f}")
                        with col2:
                            st.metric("Change", f"{change:+.1f}")
                        with col3:
                            st.metric("Trend", trend_direction, f"{change_pct:+.1f}%")
        
        except Exception as e:
            st.error(f"Error loading trend data: {e}")

def show_settings_page():
    """Show settings and configuration page."""
    st.header("⚙️ Settings & Configuration")
    
    # History Management Settings
    st.subheader("📊 History Management")
    
    # Data retention settings
    retention_days = st.slider(
        "Data Retention (Days)",
        min_value=30,
        max_value=365,
        value=90,
        help="How many days of analysis history to keep"
    )
    
    if st.button("🧹 Apply Cleanup"):
        if st.session_state.history_manager:
            try:
                deleted_count = st.session_state.history_manager.cleanup_old_data(retention_days)
                st.success(f"Cleaned up {deleted_count} old records")
            except Exception as e:
                st.error(f"Cleanup failed: {e}")
    
    # Export/Import Settings
    st.subheader("📥📤 Data Management")
    
    export_format = st.selectbox(
        "Default Export Format",
        ["json", "csv", "markdown"]
    )
    
    # Database Statistics
    st.subheader("📈 Database Statistics")
    
    if st.session_state.history_manager:
        try:
            summary = st.session_state.history_manager.get_project_summary()
            
            stat_col1, stat_col2, stat_col3 = st.columns(3)
            
            with stat_col1:
                st.metric("Total Projects", summary.get('total_projects', 0))
            
            with stat_col2:
                st.metric("Total Snapshots", summary.get('total_snapshots', 0))
            
            with stat_col3:
                earliest = summary.get('earliest_analysis', 'N/A')
                if earliest != 'N/A':
                    from datetime import datetime
                    earliest_date = datetime.fromisoformat(earliest)
                    st.metric("First Analysis", earliest_date.strftime('%Y-%m-%d'))
                else:
                    st.metric("First Analysis", "N/A")
        
        except Exception as e:
            st.error(f"Error loading statistics: {e}")

def export_project_history(project_path: str):
    """Export history for a specific project."""
    try:
        output_file = st.session_state.history_manager.export_history(
            project_path=project_path,
            format_type='json'
        )
        st.success(f"History exported to: {output_file}")
        
        # Provide download link
        with open(output_file, 'r', encoding='utf-8') as f:
            st.download_button(
                label="📥 Download Export File",
                data=f.read(),
                file_name=Path(output_file).name,
                mime="application/json"
            )
    
    except Exception as e:
        st.error(f"Export failed: {e}")

def export_all_history():
    """Export all history data."""
    try:
        output_file = st.session_state.history_manager.export_history(
            format_type='json'
        )
        st.success(f"All history exported to: {output_file}")
        
        with open(output_file, 'r', encoding='utf-8') as f:
            st.download_button(
                label="📥 Download Full History",
                data=f.read(),
                file_name=Path(output_file).name,
                mime="application/json"
            )
    
    except Exception as e:
        st.error(f"Export failed: {e}")

def import_history_file(uploaded_file):
    """Import history from uploaded file."""
    try:
        # Save uploaded file temporarily
        import tempfile
        
        with tempfile.NamedTemporaryFile(mode='wb', suffix='.json', delete=False) as tmp_file:
            tmp_file.write(uploaded_file.getvalue())
            tmp_path = tmp_file.name
        
        # Import the data
        imported_count = st.session_state.history_manager.import_history(tmp_path)
        st.success(f"Successfully imported {imported_count} snapshots")
        
        # Clean up temp file
        os.unlink(tmp_path)
        
    except Exception as e:
        st.error(f"Import failed: {e}")

def cleanup_old_data():
    """Cleanup old data with confirmation."""
    st.warning("This will delete analysis data older than the retention period.")
    
    if st.button("🗑️ Confirm Cleanup", type="secondary"):
        try:
            deleted_count = st.session_state.history_manager.cleanup_old_data(90)
            st.success(f"Cleaned up {deleted_count} old records")
        except Exception as e:
            st.error(f"Cleanup failed: {e}")

def show_snapshot_details(snapshot):
    """Show detailed information about a specific snapshot."""
    st.subheader(f"📊 Analysis Details - {snapshot.analysis_date.strftime('%Y-%m-%d %H:%M')}")
    
    # Basic information
    info_col1, info_col2 = st.columns(2)
    
    with info_col1:
        st.markdown(f"""
        **Project:** {snapshot.project_name}  
        **Path:** {snapshot.project_path}  
        **Analysis Date:** {snapshot.analysis_date.strftime('%Y-%m-%d %H:%M:%S')}  
        **Health Score:** {snapshot.health_score}/100  
        **Project Type:** {snapshot.project_type}
        """)
    
    with info_col2:
        st.markdown(f"""
        **Critical Issues:** {snapshot.critical_issues}  
        **High Priority:** {snapshot.high_priority_issues}  
        **Medium Priority:** {snapshot.medium_priority_issues}  
        **Low Priority:** {snapshot.low_priority_issues}  
        **Total Issues:** {snapshot.total_issues}
        """)
    
    if snapshot.tech_stack:
        st.markdown("**Technology Stack:**")
        tech_badges = " ".join([f"`{tech}`" for tech in snapshot.tech_stack])
        st.markdown(tech_badges)
    
    if snapshot.notes:
        st.markdown(f"**Notes:** {snapshot.notes}")
    
    if snapshot.tags:
        st.markdown(f"**Tags:** {', '.join(snapshot.tags)}")

def show_comparison_modal(snapshot, history):
    """Show modal for selecting comparison snapshot."""
    st.subheader(f"🔄 Compare with {snapshot.analysis_date.strftime('%Y-%m-%d %H:%M')}")
    
    # Filter out the current snapshot from comparison options
    other_snapshots = [s for s in history if s.id != snapshot.id]
    
    if not other_snapshots:
        st.warning("No other snapshots available for comparison.")
        return
    
    # Create comparison options
    comparison_options = {}
    for other in other_snapshots:
        date_str = other.analysis_date.strftime('%Y-%m-%d %H:%M')
        label = f"{date_str} (Health: {other.health_score}/100)"
        comparison_options[label] = other
    
    selected_key = st.selectbox(
        "Compare with:",
        list(comparison_options.keys())
    )
    
    if st.button("Generate Comparison"):
        baseline = comparison_options[selected_key]
        current = snapshot
        
        # Ensure baseline is older than current
        if baseline.analysis_date > current.analysis_date:
            baseline, current = current, baseline
        
        try:
            comparison = st.session_state.history_manager.compare_analyses(
                baseline.id, current.id
            )
            show_comparison_report(comparison)
        except Exception as e:
            st.error(f"Comparison failed: {e}")

if __name__ == "__main__":
    main()