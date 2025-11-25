#!/usr/bin/env python3
"""
Context Collector - Simple tool to collect context and generate next steps
Works for both new and existing projects
"""

import streamlit as st
import sys
from pathlib import Path
import json

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from src.collectors.code_scanner import CodeScanner
from src.collectors.git_analyzer import GitAnalyzer

st.set_page_config(page_title="Context Collector", page_icon="📋", layout="wide")

def main():
    st.title("📋 Context Collector")
    st.write("Collect context from new or existing projects and get next steps")

    # Tabs for new vs existing
    tab1, tab2 = st.tabs(["📁 Existing Project", "✨ New Project"])

    with tab1:
        collect_existing_context()

    with tab2:
        collect_new_context()

def collect_existing_context():
    """Collect context from existing project."""

    st.header("Analyze Existing Project")

    project_path = st.text_input("Project Path", value=".")

    if st.button("📊 Collect Context", type="primary"):
        with st.spinner("Collecting context..."):
            try:
                # Scan code
                scanner = CodeScanner()
                code_results = scanner.scan_directory(project_path, recursive=True, max_files=100)

                # Try git analysis
                git_info = None
                try:
                    git_analyzer = GitAnalyzer()
                    git_info = git_analyzer.analyze_repository(project_path)
                except:
                    pass  # Git not available or not a repo

                # Build context
                context = build_existing_context(code_results, git_info)

                # Show prompt
                st.success("✅ Context collected!")
                st.header("📝 Copy This Context to Your AI:")

                prompt = f"""
I have an existing project that needs work. Here's the context:

**PROJECT OVERVIEW:**
- Total Files: {code_results['summary']['total_files']}
- Lines of Code: {code_results['summary']['total_lines']}
- Languages: {', '.join(code_results['summary']['languages'].keys())}

**CODE STRUCTURE:**
{format_code_structure(code_results)}

**CURRENT STATUS:**
{format_git_status(git_info)}

**WHAT I NEED:**
1. Review the current code structure
2. Identify what's missing or incomplete
3. Suggest next steps to improve the project
4. Provide specific implementation guidance

Please analyze this and tell me:
- What features are missing?
- What needs to be fixed?
- What should I implement next?
- How to improve the code quality?
"""

                st.code(prompt, language="markdown")

                # Show summary
                with st.expander("📊 Project Summary"):
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.metric("Files", code_results['summary']['total_files'])
                    with col2:
                        st.metric("Lines", code_results['summary']['total_lines'])
                    with col3:
                        st.metric("Languages", len(code_results['summary']['languages']))

                    if git_info:
                        st.write("**Recent Activity:**")
                        st.write(f"- Last commit: {git_info.get('last_commit', 'Unknown')}")
                        st.write(f"- Total commits: {git_info.get('total_commits', 0)}")
                        st.write(f"- Contributors: {len(git_info.get('contributors', []))}")

            except Exception as e:
                st.error(f"Error: {e}")

def collect_new_context():
    """Collect context for new project."""

    st.header("Plan New Project")

    # Simple form
    project_name = st.text_input("Project Name")
    project_type = st.selectbox(
        "Project Type",
        ["Web App", "Mobile App", "API", "CLI Tool", "Library", "Desktop App"]
    )
    description = st.text_area("What will this project do?")

    # Key requirements
    st.subheader("Requirements")
    col1, col2 = st.columns(2)

    with col1:
        features = st.text_area(
            "Main Features (one per line)",
            placeholder="User authentication\nDashboard\nPayments"
        )
        tech_stack = st.text_input("Preferred Tech Stack", placeholder="React, Node.js, PostgreSQL")

    with col2:
        timeline = st.selectbox("Timeline", ["1 week", "2 weeks", "1 month", "2-3 months", "3-6 months"])
        complexity = st.selectbox("Complexity", ["Simple", "Medium", "Complex"])

    if st.button("🚀 Generate Plan", type="primary"):
        if project_name and description:
            # Build context
            context = {
                'name': project_name,
                'type': project_type,
                'description': description,
                'features': [f.strip() for f in features.split('\n') if f.strip()],
                'tech_stack': tech_stack,
                'timeline': timeline,
                'complexity': complexity
            }

            # Generate prompt
            st.success("✅ Project context ready!")
            st.header("📝 Copy This to Your AI:")

            prompt = f"""
I need to create a new {project_type.lower()} project. Here's what I need:

**PROJECT: {project_name}**

**Description:**
{description}

**Key Features:**
{chr(10).join('- ' + f for f in context['features'])}

**Technical Requirements:**
- Type: {project_type}
- Tech Stack: {tech_stack or 'Please recommend'}
- Timeline: {timeline}
- Complexity: {complexity}

**WHAT I NEED FROM YOU:**
1. Create a complete project structure
2. Set up the initial codebase
3. Implement the core features listed above
4. Provide step-by-step implementation guide
5. Include all necessary configuration files

Please provide:
- Folder structure
- Initial code for each feature
- Setup instructions
- Implementation order
- Best practices for this type of project
"""

            st.code(prompt, language="markdown")

            # Show summary
            with st.expander("📋 Project Plan Summary"):
                st.json(context)

        else:
            st.error("Please fill in project name and description")

def build_existing_context(code_results, git_info):
    """Build context from scan results."""
    return {
        'code': code_results['summary'],
        'git': git_info if git_info else {},
        'files': len(code_results.get('files', [])),
        'languages': list(code_results['summary']['languages'].keys())
    }

def format_code_structure(code_results):
    """Format code structure for prompt."""
    lines = []

    # Show main languages
    for lang, count in code_results['summary']['languages'].items():
        lines.append(f"- {lang}: {count} files")

    # Show key files
    if code_results.get('files'):
        lines.append("\nKey Files:")
        for file in code_results['files'][:10]:
            lines.append(f"- {file.path}")

    return '\n'.join(lines)

def format_git_status(git_info):
    """Format git status for prompt."""
    if not git_info:
        return "- Not a git repository or git not available"

    lines = []
    if 'last_commit' in git_info:
        lines.append(f"- Last updated: {git_info['last_commit']}")
    if 'total_commits' in git_info:
        lines.append(f"- Total commits: {git_info['total_commits']}")
    if 'branch' in git_info:
        lines.append(f"- Current branch: {git_info['branch']}")

    return '\n'.join(lines) if lines else "- No git history"

if __name__ == "__main__":
    main()