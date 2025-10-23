# Widget Components Documentation

## Overview

The `WidgetComponents` class provides a comprehensive collection of reusable UI widget components extracted from the main Streamlit application. These components are designed to create consistent, interactive, and visually appealing user interfaces.

## Installation & Import

```python
from ui.components.widgets import WidgetComponents
```

## Component Categories

### 🎨 Visual Components

#### Color Palette
```python
colors = WidgetComponents.create_custom_color_palette()
# Returns: {'critical': '#DC2626', 'high': '#F59E0B', 'medium': '#3B82F6', 'low': '#10B981', ...}
```

#### Tooltips
```python
tooltip_html = WidgetComponents.create_tooltip(
    content='<button>Hover me</button>',
    tooltip_text="Simple tooltip",
    rich_content='<h4>Rich Content</h4><p>Advanced tooltip with HTML</p>'
)
st.markdown(tooltip_html, unsafe_allow_html=True)
```

### 📊 Metric & Display Components

#### Metric Cards
```python
# Enhanced metric card
WidgetComponents.create_metric_card(
    label="Total Issues",
    value=42,
    delta="+5",
    help_text="Issues found in analysis",
    enhanced=True
)

# Standard metric card
WidgetComponents.create_metric_card("Health Score", 85.3, delta="+2.1")
```

#### Health Score Display
```python
WidgetComponents.create_health_score_display(
    score=78.5,
    max_score=100,
    show_details=True
)
```

#### Progress Gauge
```python
gauge_fig = WidgetComponents.create_progress_gauge(
    value=78.5,
    max_value=100,
    title="Project Health",
    color_scheme="health",  # 'default', 'health', 'warning', 'danger'
    show_percentage=True
)
st.plotly_chart(gauge_fig, use_container_width=True)
```

### 🚨 Status & Indicator Components

#### Status Indicators
```python
status_html = WidgetComponents.create_status_indicator(
    status="Critical Error Found",
    color="#DC2626",  # Optional custom color
    icon="🚨",        # Optional icon
    animated=True     # Optional pulsing animation
)
st.markdown(status_html, unsafe_allow_html=True)
```

#### Issue Cards
```python
WidgetComponents.create_issue_card(
    issue_title="Missing Error Handling",
    issue_description="Function does not handle potential exceptions",
    severity="high",           # 'critical', 'high', 'medium', 'low'
    category="Error Handling",
    file_location="src/utils/helper.py",
    line_number=45,
    fix_suggestion="Add try-catch block",
    card_key="unique_issue_key"
)
```

### 🎛️ Interactive Components

#### Navigation Buttons
```python
pages = {
    "analysis": "🔍 Analysis",
    "history": "📊 History",
    "trends": "📈 Trends",
    "settings": "⚙️ Settings"
}

WidgetComponents.create_navigation_buttons(
    current_page=st.session_state.current_page,
    pages=pages,
    button_columns=4
)
```

#### Theme Toggle Widget
```python
# Creates theme toggle in sidebar
WidgetComponents.create_theme_toggle_widget()
```

#### Export Buttons
```python
# For Plotly figures
WidgetComponents.create_export_buttons(
    fig=plotly_figure,
    chart_name="health_analysis",
    key_suffix="main",
    export_formats=["png", "pdf", "html"]
)
```

### 📁 Form & Input Components

#### File Selector Widget
```python
selected_path = WidgetComponents.create_file_selector_widget(
    label="Select Project Path:",
    path_key="project_path",
    recent_projects=["C:\\dev\\project1", "C:\\dev\\project2"],
    placeholder="Enter project path..."
)
```

#### Analysis Options Sidebar
```python
options = WidgetComponents.create_analysis_options_sidebar()
# Returns configuration dictionary with:
# - max_files: int
# - save_analysis: bool
# - include_tests: bool
# - deep_analysis: bool
# - export_format: str
```

### ⏳ Loading & Animation Components

#### Loading Skeletons
```python
# Analysis skeleton
WidgetComponents.show_loading_skeleton("analysis", count=3)

# Metrics skeleton
WidgetComponents.show_loading_skeleton("metrics", count=1)

# Health gauge skeleton
WidgetComponents.show_loading_skeleton("health_gauge", count=1)
```

#### Enhanced Loading State
```python
loading_container = WidgetComponents.show_enhanced_loading_state(
    stage="processing",
    progress=45,
    message="Analyzing code structure..."
)
# Returns st.empty container for updates
```

#### Success Animation
```python
WidgetComponents.show_success_animation(
    message="Analysis completed successfully!",
    duration=3
)
```

#### Floating Help Button
```python
WidgetComponents.create_floating_help_button()
```

## Usage Examples

### Complete Dashboard Setup
```python
import streamlit as st
from ui.components.widgets import WidgetComponents

def create_dashboard():
    st.title("📊 Project Analysis Dashboard")
    
    # Color palette
    colors = WidgetComponents.create_custom_color_palette()
    
    # Metric cards row
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        WidgetComponents.create_metric_card("Issues", 23, "+3")
    with col2:
        WidgetComponents.create_metric_card("Health", 85.2, "+1.2")
    with col3:
        WidgetComponents.create_metric_card("Files", 156)
    with col4:
        WidgetComponents.create_metric_card("Quality", "Good")
    
    # Health score display
    WidgetComponents.create_health_score_display(85.2, show_details=True)
    
    # Navigation
    pages = {
        "analysis": "🔍 Analysis",
        "history": "📊 History"
    }
    if 'current_page' not in st.session_state:
        st.session_state.current_page = 'analysis'
    
    WidgetComponents.create_navigation_buttons(
        st.session_state.current_page, pages
    )
```

### Issue Tracking Interface
```python
def show_issues_interface():
    issues = [
        {
            "title": "Missing Error Handling",
            "description": "No exception handling in critical functions",
            "severity": "critical",
            "category": "Error Handling",
            "file": "src/main.py",
            "line": 42
        }
    ]
    
    for i, issue in enumerate(issues):
        WidgetComponents.create_issue_card(
            issue_title=issue["title"],
            issue_description=issue["description"],
            severity=issue["severity"],
            category=issue["category"],
            file_location=issue["file"],
            line_number=issue["line"],
            card_key=f"issue_{i}"
        )
```

## Styling & Customization

### CSS Classes Used
- `.metric-card-enhanced`: Enhanced metric card styling
- `.status-indicator`: Status indicator container
- `.status-pulse`: Pulsing animation for status indicators
- `.tooltip-container`: Tooltip wrapper
- `.loading-skeleton-grid`: Grid layout for loading skeletons
- `.success-animation`: Success animation container
- `.floating-help`: Floating help button

### Color Scheme Integration
All components use the centralized color palette from `create_custom_color_palette()`:
- **Critical**: Red (#DC2626)
- **High**: Amber (#F59E0B) 
- **Medium**: Blue (#3B82F6)
- **Low**: Green (#10B981)
- **Background**: Light Gray (#F8FAFC)
- **Text**: Dark Gray (#1F2937)
- **Accent**: Indigo (#6366F1)

## Integration Notes

### Session State Requirements
Some components require specific session state variables:
- `current_page`: For navigation components
- `theme_preference`: For theme toggle
- `current_theme`: For theme toggle

### Dependencies
- `streamlit`: Core framework
- `plotly.graph_objects`: For gauge charts
- `plotly.express`: For chart creation
- Standard library modules: `time`, `json`, `datetime`, `pathlib`

## Best Practices

1. **Consistent Key Naming**: Use descriptive, unique keys for interactive elements
2. **Error Handling**: Components include basic error handling for export functionality
3. **Responsive Design**: Components adapt to container widths
4. **Accessibility**: Help text and tooltips provide context
5. **Performance**: Loading skeletons improve perceived performance

## Migration from streamlit_ui.py

To migrate existing code:

1. **Replace function calls**:
   ```python
   # Old
   create_metric_card(label, value, delta)
   
   # New
   WidgetComponents.create_metric_card(label, value, delta)
   ```

2. **Import the class**:
   ```python
   from ui.components.widgets import WidgetComponents
   ```

3. **Update any custom styling** to work with the new CSS classes

4. **Test interactive features** to ensure session state integration works correctly