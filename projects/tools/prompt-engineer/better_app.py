#!/usr/bin/env python3
"""
Better Prompt Engineer - Enhanced analysis with deeper insights
"""

import streamlit as st
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from src.analyzers.enhanced_analyzer import EnhancedAnalyzer

st.set_page_config(page_title="Better Prompt Engineer", page_icon="🚀", layout="wide")

def main():
    st.title("🚀 Better Prompt Engineer")
    st.write("Enhanced analysis with security, performance, and code quality checks")

    # Input
    project_path = st.text_input("Project Path", value=".", help="Path to analyze")

    if st.button("🔍 Deep Analysis", type="primary"):
        with st.spinner("Running deep analysis..."):
            analyzer = EnhancedAnalyzer()
            results = analyzer.analyze_project(project_path)

            # Display results
            st.success("✅ Deep analysis complete!")

            # Overview metrics
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Health Score", f"{results['health_score']}%")
            with col2:
                st.metric("Security Score", f"{results['stats']['security_score']}%")
            with col3:
                st.metric("Performance Score", f"{results['stats']['performance_score']}%")
            with col4:
                st.metric("Quality Score", f"{results['stats']['quality_score']}%")

            # Critical issues alert
            critical_issues = [i for i in results['issues'] if i.severity == 'critical']
            if critical_issues:
                st.error(f"🚨 {len(critical_issues)} CRITICAL SECURITY ISSUES FOUND!")

            # Generate prompts based on findings
            st.header("🎯 AI Prompts Based on Analysis")

            tab1, tab2, tab3, tab4, tab5 = st.tabs([
                "🔒 Security Fixes",
                "⚡ Performance",
                "🧹 Code Quality",
                "📦 Missing Features",
                "📋 Full Report"
            ])

            with tab1:
                security_issues = [i for i in results['issues'] if i.category == 'security']
                security_prompt = generate_security_prompt(security_issues, results['stats'])
                st.code(security_prompt, language="markdown")

            with tab2:
                perf_issues = [i for i in results['issues'] if i.category == 'performance']
                perf_prompt = generate_performance_prompt(perf_issues, results['stats'])
                st.code(perf_prompt, language="markdown")

            with tab3:
                quality_issues = [i for i in results['issues'] if i.category == 'quality']
                quality_prompt = generate_quality_prompt(quality_issues, results['stats'])
                st.code(quality_prompt, language="markdown")

            with tab4:
                features_prompt = generate_features_prompt(results['missing_features'], results['stats'])
                st.code(features_prompt, language="markdown")

            with tab5:
                full_prompt = generate_full_report_prompt(results)
                st.code(full_prompt, language="markdown")

            # Detailed issues breakdown
            with st.expander("🔍 All Issues Found", expanded=False):
                display_issues_by_severity(results['issues'])

            # Framework and tech stack info
            with st.expander("📊 Project Analysis", expanded=False):
                col1, col2 = st.columns(2)
                with col1:
                    st.write("**Languages Detected:**")
                    for lang, count in results['stats']['languages'].items():
                        st.write(f"• {lang}: {count} files")

                    if results['stats']['framework_detected']:
                        st.write(f"**Framework:** {results['stats']['framework_detected']}")

                with col2:
                    st.write("**Project Structure:**")
                    st.write(f"• Total Files: {results['stats']['total_files']}")
                    st.write(f"• Total Lines: {results['stats']['total_lines']:,}")
                    st.write(f"• Has Tests: {'✅' if results['stats']['has_tests'] else '❌'}")
                    st.write(f"• Has CI/CD: {'✅' if results['stats']['has_ci_cd'] else '❌'}")
                    st.write(f"• Has Docker: {'✅' if results['stats']['has_docker'] else '❌'}")

def generate_security_prompt(issues, stats):
    """Generate security-focused prompt."""
    if not issues:
        return "No security issues found! Good job on security."

    critical = [i for i in issues if i.severity == 'critical']
    high = [i for i in issues if i.severity == 'high']

    prompt = f"""Fix these CRITICAL security vulnerabilities in my project:

**Security Score: {stats['security_score']}%**

**CRITICAL ISSUES ({len(critical)}):**"""

    for issue in critical[:5]:
        prompt += f"""
- **{issue.title}** in {issue.file_path}
  Line: {issue.line_number or 'N/A'}
  Code: {issue.code_snippet or 'N/A'}
  Fix: {issue.suggested_action}"""

    if high:
        prompt += f"\n\n**HIGH PRIORITY ({len(high)}):**"
        for issue in high[:5]:
            prompt += f"\n- {issue.title}: {issue.suggested_action}"

    prompt += """

For each issue:
1. Provide the secure code replacement
2. Explain the vulnerability
3. Show how to prevent it globally
4. Add security best practices

IMPORTANT: Fix the critical issues immediately as they pose security risks."""

    return prompt

def generate_performance_prompt(issues, stats):
    """Generate performance optimization prompt."""
    if not issues:
        return "No performance issues detected."

    prompt = f"""Optimize performance issues in my {stats.get('framework_detected', 'project')}:

**Performance Score: {stats['performance_score']}%**

**Performance Issues Found ({len(issues)}):**"""

    for issue in issues[:10]:
        prompt += f"""
- **{issue.title}** in {Path(issue.file_path).name}
  Line: {issue.line_number or 'N/A'}
  Impact: {issue.description}"""

    prompt += """

For each issue:
1. Provide optimized code
2. Explain the performance impact
3. Show benchmark improvements
4. Suggest caching strategies if applicable

Focus on the most impactful optimizations first."""

    return prompt

def generate_quality_prompt(issues, stats):
    """Generate code quality improvement prompt."""
    todos = [i for i in issues if i.type == 'todo']
    smells = [i for i in issues if i.type == 'code_smell']

    prompt = f"""Improve code quality in my project:

**Quality Score: {stats['quality_score']}%**

**Code Quality Issues:**"""

    if smells:
        prompt += f"\n\n**Code Smells ({len(smells)}):**"
        for issue in smells[:5]:
            prompt += f"\n- {issue.title}: {issue.suggested_action}"

    if todos:
        prompt += f"\n\n**TODO Items ({len(todos)}):**"
        for issue in todos[:5]:
            prompt += f"\n- {issue.description} in {Path(issue.file_path).name}"

    prompt += """

Please:
1. Refactor code smells with clean code principles
2. Complete TODO items with proper implementation
3. Add missing error handling
4. Improve code documentation
5. Apply SOLID principles where needed"""

    return prompt

def generate_features_prompt(missing_features, stats):
    """Generate prompt for missing features."""
    if not missing_features:
        return "All essential features detected!"

    framework = stats.get('framework_detected', 'the project')

    prompt = f"""Implement these missing essential features for {framework}:

**Missing Features ({len(missing_features)}):**"""

    for feature in missing_features:
        prompt += f"\n• {feature}"

    prompt += f"""

**Project Context:**
- Framework: {framework}
- Languages: {', '.join(stats['languages'].keys())}
- Current Files: {stats['total_files']}

For each missing feature:
1. Provide complete implementation
2. Show integration points
3. Include configuration files
4. Add necessary dependencies
5. Provide usage examples

Start with the most critical features for production readiness."""

    return prompt

def generate_full_report_prompt(results):
    """Generate comprehensive report prompt."""
    critical_count = len([i for i in results['issues'] if i.severity == 'critical'])
    high_count = len([i for i in results['issues'] if i.severity == 'high'])

    prompt = f"""Complete project improvement plan based on deep analysis:

**PROJECT HEALTH: {results['health_score']}%**

**SCORES:**
- Security: {results['stats']['security_score']}%
- Performance: {results['stats']['performance_score']}%
- Code Quality: {results['stats']['quality_score']}%

**CRITICAL FINDINGS:**
- Critical Issues: {critical_count}
- High Priority: {high_count}
- Missing Features: {len(results['missing_features'])}

**IMMEDIATE ACTIONS (TODAY):**
1. Fix {critical_count} critical security vulnerabilities
2. Address {high_count} high priority issues
3. Implement error handling where missing

**SHORT TERM (THIS WEEK):**
1. Add missing features: {', '.join(results['missing_features'][:3]) if results['missing_features'] else 'None'}
2. Optimize performance bottlenecks
3. Set up testing framework

**MEDIUM TERM (THIS MONTH):**
1. Refactor code quality issues
2. Complete all TODO items
3. Add comprehensive documentation
4. Implement monitoring and logging

**TECHNICAL DEBT:**
- Files needing refactoring: {len([i for i in results['issues'] if 'too long' in i.title.lower()])}
- Missing tests: {'Yes' if not results['stats']['has_tests'] else 'No'}
- Deployment ready: {'No' if not results['stats']['has_docker'] else 'Yes'}

Provide specific implementation for each action item with code examples."""

    return prompt

def display_issues_by_severity(issues):
    """Display issues grouped by severity."""
    if not issues:
        st.success("No issues found!")
        return

    severities = {'critical': '🔴', 'high': '🟡', 'medium': '🟠', 'low': '🟢'}

    for severity, icon in severities.items():
        severity_issues = [i for i in issues if i.severity == severity]
        if severity_issues:
            st.subheader(f"{icon} {severity.upper()} ({len(severity_issues)})")
            for issue in severity_issues[:5]:
                with st.container():
                    st.write(f"**{issue.title}**")
                    st.write(f"📁 {issue.file_path}")
                    if issue.line_number:
                        st.write(f"📍 Line {issue.line_number}")
                    st.write(f"💡 {issue.suggested_action}")
                    st.divider()

if __name__ == "__main__":
    main()