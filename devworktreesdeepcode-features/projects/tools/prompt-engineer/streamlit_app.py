#!/usr/bin/env python3
"""
Prompt Engineer - Streamlined Dashboard
Focus: Analyze projects → Generate AI prompts → Show useful dashboard
"""

import streamlit as st
import sys
from pathlib import Path
import json
from datetime import datetime

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

# Core imports
try:
    from src.analyzers.project_intelligence import ProjectIntelligenceAnalyzer
    from src.generators.smart_prompts import SmartPromptGenerator
    from src.wizards.new_project_wizard import NewProjectWizard
except ImportError:
    # Fallback imports if running from different location
    from analyzers.project_intelligence import ProjectIntelligenceAnalyzer
    from generators.smart_prompts import SmartPromptGenerator
    from wizards.new_project_wizard import NewProjectWizard

# Page config
st.set_page_config(
    page_title="Prompt Engineer",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize session state
if 'analysis_result' not in st.session_state:
    st.session_state.analysis_result = None
if 'generated_prompts' not in st.session_state:
    st.session_state.generated_prompts = {}

def main():
    """Main dashboard with clear focus on prompt generation."""

    # Header
    st.markdown("""
    <h1 style='text-align: center; color: #2563eb;'>
        🤖 Prompt Engineer
    </h1>
    <p style='text-align: center; color: #64748b; font-size: 1.2rem;'>
        Generate AI-Optimized Prompts From Your Projects
    </p>
    """, unsafe_allow_html=True)

    # Main tabs
    tab1, tab2, tab3 = st.tabs(["📁 Analyze Project", "✨ New Project", "📊 Dashboard"])

    with tab1:
        analyze_existing_project()

    with tab2:
        start_new_project()

    with tab3:
        if st.session_state.analysis_result:
            show_dashboard()
        else:
            st.info("👈 Analyze a project first to see the dashboard")

def analyze_existing_project():
    """Analyze existing project and generate prompts."""

    st.header("Analyze Existing Project")

    # Project selection
    col1, col2 = st.columns([3, 1])

    with col1:
        project_path = st.text_input(
            "Project Path",
            value=".",
            help="Enter the path to your project"
        )

    with col2:
        max_files = st.number_input(
            "Max Files",
            min_value=10,
            max_value=1000,
            value=100,
            step=50
        )

    # Analyze button
    if st.button("🔍 Analyze Project", type="primary", use_container_width=True):
        analyze_and_generate(project_path, max_files)

    # Show results if we have them
    if st.session_state.analysis_result:
        display_results()

def analyze_and_generate(project_path: str, max_files: int):
    """Run analysis and generate prompts."""

    with st.spinner("🔍 Analyzing project..."):
        try:
            # Run analysis
            analyzer = ProjectIntelligenceAnalyzer()
            result = analyzer.analyze_project(
                project_path=project_path,
                max_files=max_files
            )

            st.session_state.analysis_result = result

            # Auto-generate prompts
            generator = SmartPromptGenerator(result)

            prompts = {
                "Fix Critical Issues": generator.generate_critical_issues_prompt(),
                "Add Missing Features": generator.generate_missing_features_prompt(),
                "Refactor Code": generator.generate_refactor_prompt(),
                "Improve Testing": generator.generate_test_improvement_prompt(),
                "Architecture Review": generator.generate_architecture_prompt()
            }

            st.session_state.generated_prompts = prompts
            st.success("✅ Analysis complete! Prompts generated.")

        except Exception as e:
            st.error(f"Analysis failed: {e}")

def display_results():
    """Display the main results - PROMPTS FIRST!"""

    result = st.session_state.analysis_result

    # Quick stats at top
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("Health Score", f"{result.health_score}%",
                  delta="Good" if result.health_score > 70 else "Needs Work")

    with col2:
        critical_count = len(result.critical_issues) if result.critical_issues else 0
        st.metric("Critical Issues", critical_count,
                  delta_color="inverse")

    with col3:
        high_count = len(result.high_priority_issues) if result.high_priority_issues else 0
        st.metric("High Priority", high_count,
                  delta_color="inverse")

    with col4:
        st.metric("Project Type", result.project_type.upper())

    st.markdown("---")

    # PROMPTS SECTION - PRIMARY OUTPUT
    st.header("🎯 Generated Prompts - Ready to Copy!")
    st.success("Copy these prompts and paste into Claude, ChatGPT, or any AI assistant")

    # Display prompts in expandable sections
    for prompt_name, prompt_content in st.session_state.generated_prompts.items():
        with st.expander(f"📝 {prompt_name}", expanded=True if "Critical" in prompt_name else False):
            # Copy button and content
            col1, col2 = st.columns([1, 5])
            with col1:
                if st.button("📋 Copy", key=f"copy_{prompt_name}"):
                    st.toast(f"✅ Copied {prompt_name}!")

            with col2:
                st.code(prompt_content, language="markdown")

    # Issues details (collapsed by default)
    with st.expander("🔍 View Detailed Issues", expanded=False):
        show_detailed_issues(result)

def show_detailed_issues(result):
    """Show detailed issue breakdown."""

    # Critical issues
    if result.critical_issues:
        st.error(f"🚨 {len(result.critical_issues)} Critical Issues")
        for i, issue in enumerate(result.critical_issues[:5], 1):
            st.write(f"{i}. **{issue.title}**")
            st.write(f"   📁 {issue.file_path}")
            st.write(f"   💡 {issue.suggested_action}")

    # High priority issues
    if result.high_priority_issues:
        st.warning(f"⚠️ {len(result.high_priority_issues)} High Priority Issues")
        for i, issue in enumerate(result.high_priority_issues[:5], 1):
            st.write(f"{i}. **{issue.title}**")
            st.write(f"   💡 {issue.suggested_action}")

    # Summary of other issues
    if result.medium_priority_issues:
        st.info(f"📋 {len(result.medium_priority_issues)} Medium Priority Issues")

    if result.low_priority_issues:
        st.success(f"💚 {len(result.low_priority_issues)} Low Priority Issues")

def start_new_project():
    """New project wizard."""

    st.header("Start New Project")

    wizard = NewProjectWizard()

    # Project type selection
    project_types = wizard.get_project_types()

    col1, col2 = st.columns(2)

    with col1:
        project_name = st.text_input("Project Name", placeholder="My Awesome App")

        project_type = st.selectbox(
            "Project Type",
            options=list(project_types.keys()),
            format_func=lambda x: project_types[x]['name']
        )

        description = st.text_area(
            "Project Description",
            placeholder="Describe what your project will do..."
        )

    with col2:
        # Tech stack recommendations
        st.subheader("Recommended Tech Stacks")
        stacks = wizard.get_tech_stack_recommendations(project_type)

        selected_stack = st.radio(
            "Choose a stack:",
            options=list(stacks.keys())
        )

        if selected_stack:
            st.info(f"**{selected_stack}**")
            for key, value in stacks[selected_stack].items():
                st.write(f"• {key}: {value}")

    # Goals and requirements
    st.subheader("Project Goals")
    goals = st.text_area(
        "What are your main goals? (one per line)",
        placeholder="- Build user authentication\n- Create dashboard\n- Add payment processing"
    ).split('\n') if st.text_area else []

    col1, col2, col3 = st.columns(3)

    with col1:
        timeline = st.selectbox(
            "Timeline",
            ["1-2 weeks", "3-4 weeks", "1-2 months", "3-6 months", "6+ months"]
        )

    with col2:
        team_size = st.number_input("Team Size", 1, 10, 1)

    with col3:
        deployment = st.selectbox(
            "Deployment",
            ["Cloud (AWS/GCP/Azure)", "VPS", "Serverless", "On-premise", "Mobile Stores"]
        )

    # Generate button
    if st.button("🚀 Generate Project Specification", type="primary", use_container_width=True):
        if project_name and description:
            generate_new_project_spec(wizard, {
                'name': project_name,
                'description': description,
                'project_type': project_type,
                'tech_stack': stacks.get(selected_stack, {}),
                'goals': [g.strip() for g in goals if g.strip()],
                'timeline': timeline,
                'team_size': team_size,
                'deployment_environment': deployment,
                'architecture_pattern': 'MVC',
                'target_users': [],
                'success_metrics': [],
                'database_needs': {},
                'api_integrations': [],
                'performance_targets': {},
                'security_requirements': [],
                'team_skills': [],
                'budget_constraints': 'Flexible',
                'similar_projects': [],
                'inspiration_sources': [],
                'avoid_patterns': []
            })
        else:
            st.error("Please fill in project name and description")

def generate_new_project_spec(wizard, form_data):
    """Generate new project specification."""

    with st.spinner("✨ Generating project specification..."):
        try:
            requirements = wizard.create_requirements_from_streamlit_input(form_data)
            specification = wizard.generate_project_specification_prompt(requirements)

            st.success("✅ Project specification generated!")
            st.code(specification, language="markdown")

            # Copy button
            if st.button("📋 Copy Specification"):
                st.toast("✅ Specification copied!")

        except Exception as e:
            st.error(f"Failed to generate specification: {e}")

def show_dashboard():
    """Show analysis dashboard."""

    result = st.session_state.analysis_result

    st.header("📊 Project Dashboard")

    # Health overview
    col1, col2 = st.columns([1, 2])

    with col1:
        # Health gauge (simple version)
        health = result.health_score
        color = "#10b981" if health > 70 else "#f59e0b" if health > 40 else "#ef4444"

        st.markdown(f"""
        <div style='text-align: center; padding: 2rem;'>
            <div style='font-size: 4rem; color: {color};'>{health}%</div>
            <div style='font-size: 1.2rem; color: #64748b;'>Health Score</div>
        </div>
        """, unsafe_allow_html=True)

        # Issue breakdown
        st.write("**Issue Breakdown:**")
        if result.critical_issues:
            st.write(f"🔴 Critical: {len(result.critical_issues)}")
        if result.high_priority_issues:
            st.write(f"🟡 High: {len(result.high_priority_issues)}")
        if result.medium_priority_issues:
            st.write(f"🟢 Medium: {len(result.medium_priority_issues)}")

    with col2:
        # Tech stack
        st.subheader("Tech Stack Detected")
        if result.tech_stack:
            cols = st.columns(4)
            for i, tech in enumerate(result.tech_stack[:8]):
                cols[i % 4].write(f"• {tech}")

        # Missing features
        if result.missing_features:
            st.subheader("Missing Features")
            for feature in result.missing_features[:5]:
                st.write(f"• {feature}")

        # Suggestions
        if result.suggestions:
            st.subheader("Top Suggestions")
            for suggestion in result.suggestions[:3]:
                st.info(suggestion)

    # Code quality metrics
    if result.code_quality_metrics:
        st.subheader("Code Metrics")
        cols = st.columns(4)

        metrics = result.code_quality_metrics
        if 'total_files' in metrics:
            cols[0].metric("Files", metrics['total_files'])
        if 'total_lines' in metrics:
            cols[1].metric("Lines", f"{metrics['total_lines']:,}")
        if 'issue_density' in metrics:
            cols[2].metric("Issue Density", f"{metrics['issue_density']:.2f}")
        if 'analysis_time' in metrics:
            cols[3].metric("Analysis Time", f"{metrics['analysis_time']:.1f}s")

if __name__ == "__main__":
    main()