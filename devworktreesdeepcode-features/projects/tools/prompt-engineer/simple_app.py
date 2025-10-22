#!/usr/bin/env python3
"""
Simple Prompt Engineer - Just analyze and tell me what to do next
"""

import streamlit as st
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from src.analyzers.project_intelligence import ProjectIntelligenceAnalyzer

st.set_page_config(page_title="Prompt Engineer", page_icon="🤖", layout="wide")

def main():
    st.title("🤖 Prompt Engineer")
    st.write("Analyze your project and get AI prompts for what to do next")

    # Simple input
    project_path = st.text_input("Project Path", value=".", help="Path to your project")

    if st.button("🔍 Analyze", type="primary"):
        with st.spinner("Analyzing..."):
            try:
                # Run analysis
                analyzer = ProjectIntelligenceAnalyzer()
                result = analyzer.analyze_project(project_path, max_files=100)

                # Show what needs to be done
                st.success("✅ Analysis complete! Here's what you need to do:")

                # Generate multiple prompts
                st.header("🎯 Generated Prompts - Copy & Use in AI")

                # Create tabs for different prompt types
                prompt_tab1, prompt_tab2, prompt_tab3, prompt_tab4 = st.tabs([
                    "🔧 Fix Issues",
                    "✨ Add Features",
                    "📊 Comprehensive Plan",
                    "🧪 Testing Strategy"
                ])

                with prompt_tab1:
                    fix_prompt = f"""
I need to fix issues in my {result.project_type} project.

**Critical Issues to Fix ({len(result.critical_issues or [])} found):**
{format_issues(result.critical_issues)}

**High Priority Issues ({len(result.high_priority_issues or [])} found):**
{format_issues(result.high_priority_issues)}

For each issue above:
1. Provide the exact code fix
2. Explain why this issue occurred
3. Show how to prevent it in the future
4. Include any necessary refactoring

Start with the critical issues first.
"""
                    st.code(fix_prompt, language="markdown")

                with prompt_tab2:
                    features_prompt = f"""
I need to add missing features to my {result.project_type} project.

**Current Tech Stack:** {', '.join(result.tech_stack) if result.tech_stack else 'Standard ' + result.project_type}

**Missing Features to Implement:**
{format_list(result.missing_features)}

**Current Project Health:** {result.health_score}%

For each missing feature:
1. Provide complete implementation code
2. Show integration with existing code
3. Include necessary UI components
4. Add required database changes
5. Include error handling

Please implement these features in order of importance.
"""
                    st.code(features_prompt, language="markdown")

                with prompt_tab3:
                    comprehensive_prompt = f"""
I need a comprehensive improvement plan for my {result.project_type} project.

**Project Overview:**
- Type: {result.project_type}
- Health Score: {result.health_score}%
- Critical Issues: {len(result.critical_issues or [])}
- Missing Features: {len(result.missing_features or [])}

**All Issues Found:**
{format_all_issues(result)}

**Missing Components:**
{format_list(result.missing_features)}

**Create a Complete Plan That Includes:**

1. **Immediate Fixes (Today)**
   - Fix all critical issues
   - Security vulnerabilities
   - Breaking bugs

2. **Short Term (This Week)**
   - High priority improvements
   - Core feature implementations
   - Performance optimizations

3. **Medium Term (This Month)**
   - New feature development
   - Refactoring needs
   - Documentation updates

4. **Architecture Improvements**
   - Better structure recommendations
   - Design pattern implementations
   - Scalability enhancements

Provide specific code examples for each item.
"""
                    st.code(comprehensive_prompt, language="markdown")

                with prompt_tab4:
                    testing_prompt = f"""
I need a complete testing strategy for my {result.project_type} project.

**Project Details:**
- Type: {result.project_type}
- Current Health: {result.health_score}%
- Tech Stack: {', '.join(result.tech_stack) if result.tech_stack else 'Standard'}

**Known Issues That Need Test Coverage:**
{format_issues(result.critical_issues)}
{format_issues(result.high_priority_issues)}

**Create a Testing Plan That Includes:**

1. **Unit Tests**
   - Test files for each module
   - Coverage for critical functions
   - Edge case handling

2. **Integration Tests**
   - API endpoint testing
   - Database operations
   - Service interactions

3. **End-to-End Tests**
   - User workflow tests
   - Critical path validation
   - Cross-browser testing (if web)

4. **Performance Tests**
   - Load testing scenarios
   - Stress test configurations
   - Performance benchmarks

For each test category, provide:
- Complete test file code
- Test data/fixtures
- Setup instructions
- Expected coverage targets

Use the appropriate testing framework for {result.project_type}.
"""
                    st.code(testing_prompt, language="markdown")

                # Quick stats
                st.header("📊 Quick Overview")
                col1, col2, col3 = st.columns(3)

                with col1:
                    st.metric("Health Score", f"{result.health_score}%")

                with col2:
                    total_issues = len(result.critical_issues or []) + len(result.high_priority_issues or [])
                    st.metric("Issues to Fix", total_issues)

                with col3:
                    st.metric("Missing Features", len(result.missing_features or []))

                # Detailed breakdown
                with st.expander("🔍 See All Issues"):
                    if result.critical_issues:
                        st.error(f"**Critical Issues:**")
                        for issue in result.critical_issues:
                            st.write(f"- {issue.title}: {issue.suggested_action}")

                    if result.high_priority_issues:
                        st.warning(f"**High Priority:**")
                        for issue in result.high_priority_issues:
                            st.write(f"- {issue.title}: {issue.suggested_action}")

                    if result.medium_priority_issues:
                        st.info(f"**Medium Priority:**")
                        st.write(f"Found {len(result.medium_priority_issues)} medium priority issues")

            except Exception as e:
                st.error(f"Error: {e}")

def format_issues(issues):
    if not issues:
        return "None found - good job!"

    formatted = []
    for i, issue in enumerate(issues[:5], 1):
        formatted.append(f"{i}. {issue.title}")
        formatted.append(f"   File: {issue.file_path}")
        formatted.append(f"   Fix: {issue.suggested_action}")

    return "\n".join(formatted)

def format_list(items):
    if not items:
        return "None detected"

    return "\n".join(f"- {item}" for item in items[:10])

def format_all_issues(result):
    """Format all issues for comprehensive view."""
    lines = []

    if result.critical_issues:
        lines.append(f"**Critical ({len(result.critical_issues)}):**")
        for issue in result.critical_issues[:3]:
            lines.append(f"- {issue.title}")

    if result.high_priority_issues:
        lines.append(f"\n**High Priority ({len(result.high_priority_issues)}):**")
        for issue in result.high_priority_issues[:3]:
            lines.append(f"- {issue.title}")

    if result.medium_priority_issues:
        lines.append(f"\n**Medium Priority ({len(result.medium_priority_issues)}):**")
        lines.append(f"- {len(result.medium_priority_issues)} issues to review")

    return "\n".join(lines) if lines else "No issues found"

if __name__ == "__main__":
    main()