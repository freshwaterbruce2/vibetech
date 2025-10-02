#!/usr/bin/env python3
"""
Prompt Engineer - Vibe-Tech Themed Dashboard
Enhanced UI with neon glassmorphism design
"""

import json
import sys
import time
from datetime import datetime
from pathlib import Path

import streamlit as st

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

# Core imports
try:
    from src.analyzers.project_intelligence import ProjectIntelligenceAnalyzer
    from src.generators.smart_prompts import SmartPromptGenerator
except ImportError:
    from analyzers.project_intelligence import ProjectIntelligenceAnalyzer
    from generators.smart_prompts import SmartPromptGenerator

# Page config
st.set_page_config(
    page_title="Prompt Engineer | Vibe-Tech",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS with Vibe-Tech neon glassmorphism theme
VIBE_TECH_CSS = """
<style>
    /* Import Vibe-Tech color scheme */
    :root {
        --bg-start: #05050E;
        --bg-mid: #0A0A18;
        --bg-end: #0F0F22;
        --c-cyan: #00FFFF;
        --c-purple: #B933FF;
        --c-pink: #FF00AA;
        --c-teal: #00FFCC;
        --glass-bg: rgba(10, 12, 24, 0.65);
        --c-text: #ffffff;
        --c-text-secondary: #9BA1CC;
    }

    /* Dark futuristic background */
    .stApp {
        background: linear-gradient(135deg, var(--bg-start) 0%, var(--bg-mid) 50%, var(--bg-end) 100%);
        background-attachment: fixed;
    }

    /* Glassmorphism cards */
    .element-container {
        backdrop-filter: blur(12px);
    }

    /* Neon text */
    h1, h2, h3 {
        color: var(--c-cyan) !important;
        text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        font-weight: 700 !important;
    }

    /* Gradient headers */
    .main-header {
        background: linear-gradient(90deg, var(--c-cyan) 0%, var(--c-purple) 50%, var(--c-pink) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-size: 3rem;
        font-weight: 800;
        text-align: center;
        margin-bottom: 0.5rem;
        animation: gradient-shift 5s ease infinite;
        background-size: 200% 200%;
    }

    @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }

    /* Subtitle */
    .subtitle {
        text-align: center;
        color: var(--c-text-secondary);
        font-size: 1.3rem;
        margin-bottom: 2rem;
    }

    /* Metric cards */
    [data-testid="metric-container"] {
        background: var(--glass-bg);
        border: 1px solid rgba(0, 255, 255, 0.3);
        border-radius: 12px;
        padding: 1rem;
        backdrop-filter: blur(16px);
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
        transition: all 0.3s ease;
    }

    [data-testid="metric-container"]:hover {
        border-color: var(--c-cyan);
        box-shadow: 0 0 30px rgba(0, 255, 255, 0.4);
        transform: translateY(-2px);
    }

    [data-testid="stMetricValue"] {
        color: var(--c-cyan) !important;
        font-size: 2.5rem !important;
        font-weight: 700 !important;
        text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
    }

    [data-testid="stMetricLabel"] {
        color: var(--c-text-secondary) !important;
        font-size: 0.9rem !important;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    /* Buttons */
    .stButton > button {
        background: linear-gradient(90deg, var(--c-cyan) 0%, var(--c-purple) 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.75rem 2rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        transition: all 0.3s ease;
    }

    .stButton > button:hover {
        box-shadow: 0 0 30px rgba(0, 255, 255, 0.6);
        transform: translateY(-2px);
    }

    /* Input fields */
    .stTextInput > div > div > input,
    .stNumberInput > div > div > input {
        background: var(--glass-bg) !important;
        border: 1px solid rgba(185, 51, 255, 0.3) !important;
        border-radius: 8px !important;
        color: var(--c-text) !important;
        backdrop-filter: blur(12px);
        padding: 0.75rem !important;
    }

    .stTextInput > div > div > input:focus,
    .stNumberInput > div > div > input:focus {
        border-color: var(--c-purple) !important;
        box-shadow: 0 0 15px rgba(185, 51, 255, 0.3) !important;
    }

    /* Expander */
    .streamlit-expanderHeader {
        background: var(--glass-bg) !important;
        border: 1px solid rgba(255, 0, 170, 0.3) !important;
        border-radius: 8px !important;
        color: var(--c-pink) !important;
        backdrop-filter: blur(12px);
    }

    .streamlit-expanderHeader:hover {
        border-color: var(--c-pink) !important;
        box-shadow: 0 0 15px rgba(255, 0, 170, 0.2);
    }

    /* Code blocks */
    .stCodeBlock {
        background: var(--glass-bg) !important;
        border: 1px solid rgba(0, 255, 204, 0.3) !important;
        border-radius: 8px !important;
        backdrop-filter: blur(12px);
    }

    /* Tabs */
    .stTabs [data-baseweb="tab-list"] {
        background: var(--glass-bg);
        border-radius: 12px;
        padding: 0.5rem;
        backdrop-filter: blur(12px);
        gap: 0.5rem;
    }

    .stTabs [data-baseweb="tab"] {
        background: transparent;
        border: 1px solid rgba(0, 255, 255, 0.2);
        border-radius: 8px;
        color: var(--c-text-secondary);
        padding: 0.75rem 1.5rem;
        transition: all 0.3s ease;
    }

    .stTabs [data-baseweb="tab"]:hover {
        background: rgba(0, 255, 255, 0.1);
        border-color: var(--c-cyan);
    }

    .stTabs [aria-selected="true"] {
        background: linear-gradient(90deg, rgba(0, 255, 255, 0.2), rgba(185, 51, 255, 0.2));
        border-color: var(--c-cyan);
        color: var(--c-cyan) !important;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
    }

    /* Sidebar */
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, var(--bg-start) 0%, var(--bg-mid) 100%);
        border-right: 1px solid rgba(0, 255, 255, 0.2);
    }

    [data-testid="stSidebar"] h1,
    [data-testid="stSidebar"] h2,
    [data-testid="stSidebar"] h3 {
        color: var(--c-purple) !important;
    }

    /* Success/Info boxes */
    .stSuccess {
        background: rgba(0, 255, 102, 0.1) !important;
        border: 1px solid rgba(0, 255, 102, 0.3) !important;
        border-radius: 8px !important;
        color: #00ff66 !important;
    }

    .stInfo {
        background: rgba(0, 255, 255, 0.1) !important;
        border: 1px solid rgba(0, 255, 255, 0.3) !important;
        border-radius: 8px !important;
        color: var(--c-cyan) !important;
    }

    .stWarning {
        background: rgba(255, 123, 0, 0.1) !important;
        border: 1px solid rgba(255, 123, 0, 0.3) !important;
        border-radius: 8px !important;
        color: #ff7b00 !important;
    }

    /* Progress bar */
    .stProgress > div > div > div {
        background: linear-gradient(90deg, var(--c-cyan) 0%, var(--c-purple) 50%, var(--c-pink) 100%);
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
    }

    /* Spinner */
    .stSpinner > div {
        border-top-color: var(--c-cyan) !important;
        border-right-color: var(--c-purple) !important;
        border-bottom-color: var(--c-pink) !important;
    }

    /* Custom card class */
    .vibe-card {
        background: var(--glass-bg);
        border: 1px solid rgba(0, 255, 255, 0.3);
        border-radius: 12px;
        padding: 1.5rem;
        margin: 1rem 0;
        backdrop-filter: blur(16px);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
    }

    .vibe-card:hover {
        border-color: var(--c-cyan);
        box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
        transform: translateY(-2px);
    }

    /* Animated icon */
    .pulse-icon {
        animation: pulse-glow 2s ease-in-out infinite;
    }

    @keyframes pulse-glow {
        0%, 100% {
            opacity: 1;
            text-shadow: 0 0 20px rgba(0, 255, 255, 0.8);
        }
        50% {
            opacity: 0.8;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }
    }
</style>
"""

# Initialize session state
if "analysis_result" not in st.session_state:
    st.session_state.analysis_result = None
if "generated_prompts" not in st.session_state:
    st.session_state.generated_prompts = {}
if "recent_projects" not in st.session_state:
    st.session_state.recent_projects = []


def main():
    """Main Vibe-Tech themed dashboard."""

    # Inject custom CSS
    st.markdown(VIBE_TECH_CSS, unsafe_allow_html=True)

    # Animated header
    st.markdown(
        """
        <div class="main-header pulse-icon">
            ⚡ PROMPT ENGINEER ⚡
        </div>
        <div class="subtitle">
            AI-Powered Context Collection & Prompt Generation
        </div>
    """,
        unsafe_allow_html=True,
    )

    # Sidebar
    with st.sidebar:
        st.markdown("### ⚙️ Configuration")

        # Project path input
        project_path = st.text_input(
            "📁 Project Path", value=".", help="Enter the path to your project"
        )

        # Max files slider
        max_files = st.slider(
            "📊 Max Files to Analyze",
            min_value=10,
            max_value=1000,
            value=100,
            step=50,
            help="Limit the number of files to analyze",
        )

        # Analysis options
        st.markdown("---")
        st.markdown("### 🎯 Analysis Options")

        include_code = st.checkbox("📝 Include Code Analysis", value=True)
        include_git = st.checkbox("🔀 Include Git History", value=True)
        include_docs = st.checkbox("📚 Include Documentation", value=True)

        st.markdown("---")

        # Quick stats if analysis is done
        if st.session_state.analysis_result:
            st.markdown("### 📈 Quick Stats")
            result = st.session_state.analysis_result

            if "project_summary" in result:
                summary = result["project_summary"]
                st.metric("Files", summary.get("total_files", 0))
                st.metric("Lines", f"{summary.get('total_lines', 0):,}")
                st.metric("Languages", len(summary.get("languages", [])))

    # Main content tabs
    tab1, tab2, tab3, tab4 = st.tabs(
        ["🔍 Analyze", "✨ Generate Prompts", "📊 Dashboard", "⚙️ Advanced"]
    )

    with tab1:
        analyze_project_tab(
            project_path, max_files, include_code, include_git, include_docs
        )

    with tab2:
        generate_prompts_tab()

    with tab3:
        dashboard_tab()

    with tab4:
        advanced_tab()


def analyze_project_tab(
    project_path, max_files, include_code, include_git, include_docs
):
    """Project analysis tab."""

    st.markdown("## 🔍 Project Analysis")

    col1, col2 = st.columns([3, 1])

    with col1:
        st.info(f"📂 Analyzing: **{project_path}**")

    with col2:
        analyze_btn = st.button("🚀 ANALYZE", type="primary", use_container_width=True)

    if analyze_btn:
        with st.spinner("🔮 Analyzing project... This may take a moment..."):
            # Progress bar
            progress_bar = st.progress(0)
            status_text = st.empty()

            try:
                # Initialize analyzer
                status_text.text("Initializing analyzer...")
                progress_bar.progress(20)
                time.sleep(0.3)

                analyzer = ProjectIntelligenceAnalyzer(project_path)

                # Analyze
                status_text.text("Scanning project structure...")
                progress_bar.progress(40)
                time.sleep(0.3)

                status_text.text("Analyzing code and dependencies...")
                progress_bar.progress(60)

                result = analyzer.analyze_project(
                    max_files=max_files, include_git=include_git
                )

                status_text.text("Generating insights...")
                progress_bar.progress(80)
                time.sleep(0.3)

                # Store result
                st.session_state.analysis_result = result

                progress_bar.progress(100)
                status_text.text("✅ Analysis complete!")
                time.sleep(0.5)

                st.success("🎉 Project analyzed successfully!")
                st.balloons()

            except Exception as e:
                st.error(f"❌ Analysis failed: {str(e)}")
                return

    # Display results
    if st.session_state.analysis_result:
        display_analysis_results()


def display_analysis_results():
    """Display analysis results with Vibe-Tech styling."""

    result = st.session_state.analysis_result

    st.markdown("---")
    st.markdown("## 📊 Analysis Results")

    # Metrics row
    if "project_summary" in result:
        summary = result["project_summary"]

        col1, col2, col3, col4 = st.columns(4)

        with col1:
            st.metric(
                "📁 Total Files", f"{summary.get('total_files', 0):,}", delta="Analyzed"
            )

        with col2:
            st.metric(
                "📝 Total Lines",
                f"{summary.get('total_lines', 0):,}",
                delta="Code + Docs",
            )

        with col3:
            languages = summary.get("languages", [])
            st.metric(
                "🔤 Languages",
                len(languages),
                delta=languages[0] if languages else "None",
            )

        with col4:
            contributors = summary.get("contributors", 0)
            st.metric(
                "👥 Contributors",
                contributors if contributors else "N/A",
                delta="Git history",
            )

    # Project structure
    st.markdown("### 🌳 Project Structure")

    if "structure_summary" in result:
        structure = result["structure_summary"]

        with st.expander("📂 Directory Breakdown", expanded=True):
            for dir_info in structure.get("directories", [])[:10]:
                dir_name = dir_info.get("name", "Unknown")
                file_count = dir_info.get("files", 0)
                st.markdown(f"**{dir_name}** → {file_count} files")

    # Technologies detected
    if "technologies" in result:
        st.markdown("### 🛠️ Technologies Detected")

        tech = result["technologies"]

        col1, col2 = st.columns(2)

        with col1:
            if tech.get("frameworks"):
                st.markdown("**Frameworks:**")
                for fw in tech["frameworks"][:5]:
                    st.markdown(f"- {fw}")

        with col2:
            if tech.get("libraries"):
                st.markdown("**Libraries:**")
                for lib in tech["libraries"][:5]:
                    st.markdown(f"- {lib}")


def generate_prompts_tab():
    """Generate prompts tab."""

    st.markdown("## ✨ Generate AI Prompts")

    if not st.session_state.analysis_result:
        st.warning("⚠️ Please analyze a project first in the **Analyze** tab")
        return

    st.info("🎯 Select a prompt template to generate AI-ready context")

    # Prompt templates
    templates = {
        "🚀 Add Feature": "feature_addition",
        "🔧 Debug Issue": "debug_issue",
        "♻️ Refactor Code": "refactor_code",
        "🧪 Write Tests": "write_tests",
        "🏗️ Architecture Review": "architecture_review",
        "📝 Documentation": "documentation",
        "🔒 Security Audit": "security_audit",
        "⚡ Performance Optimization": "performance_optimization",
    }

    # Grid layout for template cards
    col1, col2, col3, col4 = st.columns(4)

    for idx, (template_name, template_id) in enumerate(templates.items()):
        col = [col1, col2, col3, col4][idx % 4]

        with col:
            if st.button(template_name, use_container_width=True):
                generate_prompt(template_id, template_name)

    # Generate all button
    st.markdown("---")
    if st.button("📋 Generate All Templates", type="primary", use_container_width=True):
        with st.spinner("Generating all prompts..."):
            for template_name, template_id in templates.items():
                generate_prompt(template_id, template_name, show_success=False)
            st.success("✅ All prompts generated!")

    # Display generated prompts
    if st.session_state.generated_prompts:
        st.markdown("---")
        st.markdown("## 📋 Generated Prompts")

        for prompt_name, prompt_content in st.session_state.generated_prompts.items():
            with st.expander(f"✨ {prompt_name}", expanded=False):
                st.code(prompt_content, language="markdown")

                if st.button(f"📋 Copy {prompt_name}", key=f"copy_{prompt_name}"):
                    st.toast(f"✅ {prompt_name} copied to clipboard!")


def generate_prompt(template_id, template_name, show_success=True):
    """Generate a specific prompt template."""

    try:
        generator = SmartPromptGenerator(st.session_state.analysis_result)
        prompt = generator.generate_prompt(template_id)

        st.session_state.generated_prompts[template_name] = prompt

        if show_success:
            st.success(f"✅ {template_name} generated!")

    except Exception as e:
        st.error(f"❌ Failed to generate {template_name}: {str(e)}")


def dashboard_tab():
    """Dashboard with visualizations."""

    st.markdown("## 📊 Project Dashboard")

    if not st.session_state.analysis_result:
        st.info("👈 Analyze a project first to see the dashboard")
        return

    result = st.session_state.analysis_result

    # Overview section
    st.markdown("### 🎯 Project Overview")

    if "project_type" in result:
        col1, col2, col3 = st.columns(3)

        with col1:
            st.markdown(
                f"""
            <div class="vibe-card">
                <h3>📦 Project Type</h3>
                <p style="font-size: 1.5rem; color: var(--c-cyan);">{result["project_type"]}</p>
            </div>
            """,
                unsafe_allow_html=True,
            )

        with col2:
            complexity = result.get("complexity_score", "Unknown")
            st.markdown(
                f"""
            <div class="vibe-card">
                <h3>🎚️ Complexity</h3>
                <p style="font-size: 1.5rem; color: var(--c-purple);">{complexity}</p>
            </div>
            """,
                unsafe_allow_html=True,
            )

        with col3:
            maturity = result.get("project_maturity", "Unknown")
            st.markdown(
                f"""
            <div class="vibe-card">
                <h3>🌟 Maturity</h3>
                <p style="font-size: 1.5rem; color: var(--c-pink);">{maturity}</p>
            </div>
            """,
                unsafe_allow_html=True,
            )

    # Code quality section
    st.markdown("### 💎 Code Quality Insights")

    if "quality_metrics" in result:
        metrics = result["quality_metrics"]

        col1, col2 = st.columns(2)

        with col1:
            st.markdown("**Documentation Coverage**")
            doc_coverage = metrics.get("documentation_coverage", 0)
            st.progress(doc_coverage / 100)
            st.caption(f"{doc_coverage}% documented")

        with col2:
            st.markdown("**Test Coverage**")
            test_coverage = metrics.get("test_coverage", 0)
            st.progress(test_coverage / 100)
            st.caption(f"{test_coverage}% tested")


def advanced_tab():
    """Advanced settings and export options."""

    st.markdown("## ⚙️ Advanced Settings")

    st.markdown("### 💾 Export Options")

    if st.session_state.analysis_result:
        col1, col2, col3 = st.columns(3)

        with col1:
            if st.button("📄 Export JSON", use_container_width=True):
                export_json()

        with col2:
            if st.button("📝 Export Markdown", use_container_width=True):
                export_markdown()

        with col3:
            if st.button("📊 Export Report", use_container_width=True):
                export_report()
    else:
        st.info("Analyze a project first to enable export options")

    st.markdown("---")
    st.markdown("### 🎨 Theme Settings")

    _ = st.selectbox(
        "Color Scheme",
        ["Vibe-Tech (Default)", "Cyber Purple", "Neon Blue", "Matrix Green"],
    )
    st.caption("Theme customization coming soon!")

    st.markdown("---")
    st.markdown("### 🔧 System Info")

    col1, col2 = st.columns(2)

    with col1:
        st.info(f"**Python Version:** {sys.version.split()[0]}")

    with col2:
        st.info(f"**Streamlit Version:** {st.__version__}")


def export_json():
    """Export analysis as JSON."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"analysis_{timestamp}.json"

    json_data = json.dumps(st.session_state.analysis_result, indent=2)

    st.download_button(
        label="⬇️ Download JSON",
        data=json_data,
        file_name=filename,
        mime="application/json",
    )


def export_markdown():
    """Export analysis as Markdown."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"analysis_{timestamp}.md"

    md_content = "# Project Analysis Report\n\n"
    md_content += f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"

    if "project_summary" in st.session_state.analysis_result:
        summary = st.session_state.analysis_result["project_summary"]
        md_content += "## Summary\n\n"
        md_content += f"- **Total Files:** {summary.get('total_files', 0)}\n"
        md_content += f"- **Total Lines:** {summary.get('total_lines', 0)}\n"
        md_content += f"- **Languages:** {', '.join(summary.get('languages', []))}\n\n"

    st.download_button(
        label="⬇️ Download Markdown",
        data=md_content,
        file_name=filename,
        mime="text/markdown",
    )


def export_report():
    """Export comprehensive report."""
    st.success("📊 Report generation coming soon!")


if __name__ == "__main__":
    main()
