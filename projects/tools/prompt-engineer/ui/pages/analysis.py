#!/usr/bin/env python3
"""
Analysis Page Component

Handles the main project analysis interface with modular components.
"""

import streamlit as st
import asyncio
from pathlib import Path
from typing import Optional, Any

# Import async analyzer and config
try:
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'src'))
    from analyzers.async_project_analyzer import AsyncProjectAnalyzer
    from utils.config_manager import get_config_manager
    ASYNC_AVAILABLE = True
except ImportError as e:
    print(f"Async analyzer not available: {e}")
    ASYNC_AVAILABLE = False

class AnalysisPage:
    """Analysis page with modular component integration."""
    
    def __init__(self, theme_manager=None, charts=None, animations=None, widgets=None, progress=None):
        """Initialize with component dependencies."""
        self.theme_manager = theme_manager
        self.charts = charts
        self.animations = animations
        self.widgets = widgets
        self.progress = progress
        self.config_manager = get_config_manager() if ASYNC_AVAILABLE else None
        self.async_analyzer = None
    
    def render(self):
        """Render the analysis page."""
        st.markdown("# 📊 Project Analysis")
        st.markdown("*Powered by modular UI components*")
        
        # Test basic functionality
        self._render_project_selector()
        self._render_analysis_options()
        self._render_analysis_button()
        
        # Display results if available
        if st.session_state.get('analysis_result'):
            self._render_analysis_results()
    
    def _render_project_selector(self):
        """Render project path selector."""
        st.markdown("## 📁 Select Project")
        
        project_path = st.text_input(
            "Project Path",
            value=st.session_state.get('project_path', ''),
            placeholder="Enter path to your project directory"
        )
        
        if project_path != st.session_state.get('project_path', ''):
            st.session_state.project_path = project_path
        
        # Show path validation
        if project_path:
            path_obj = Path(project_path)
            if path_obj.exists():
                st.success(f"✅ Valid project path: {project_path}")
            else:
                st.error(f"❌ Path does not exist: {project_path}")
    
    def _render_analysis_options(self):
        """Render analysis configuration options."""
        st.markdown("## ⚙️ Analysis Options")
        
        col1, col2, col3 = st.columns(3)
        
        # Get default values from config
        default_max_files = 1000
        if self.config_manager:
            default_max_files = self.config_manager.analysis.max_files_default
        
        with col1:
            max_files = st.number_input(
                "Maximum Files", 
                min_value=10, 
                max_value=10000, 
                value=st.session_state.get('max_files', default_max_files),
                help="Maximum number of files to analyze"
            )
            st.session_state.max_files = max_files
        
        with col2:
            use_async = st.checkbox(
                "Async Analysis", 
                value=st.session_state.get('use_async', ASYNC_AVAILABLE),
                help="Use high-performance async analyzer",
                disabled=not ASYNC_AVAILABLE
            )
            st.session_state.use_async = use_async
        
        with col3:
            use_cache = st.checkbox(
                "Use Cache", 
                value=st.session_state.get('use_cache', True),
                help="Cache results for faster subsequent analysis"
            )
            st.session_state.use_cache = use_cache
        
        # Advanced options in expander
        with st.expander("Advanced Options", expanded=False):
            col_a, col_b = st.columns(2)
            
            with col_a:
                incremental = st.checkbox(
                    "Incremental Analysis", 
                    value=st.session_state.get('incremental', True),
                    help="Only analyze changed files when possible"
                )
                st.session_state.incremental = incremental
            
            with col_b:
                include_tests = st.checkbox(
                    "Include Test Execution", 
                    value=st.session_state.get('include_tests', False),
                    help="Execute tests during analysis (when possible)"
                )
                st.session_state.include_tests = include_tests
    
    def _render_analysis_button(self):
        """Render the main analysis button."""
        st.markdown("## 🚀 Start Analysis")
        
        if st.button("🔍 Analyze Project", type="primary", use_container_width=True):
            self._run_analysis()
    
    def _run_analysis(self):
        """Execute the project analysis with async support."""
        project_path = st.session_state.get('project_path', '')
        
        if not project_path:
            st.error("Please enter a project path")
            return
        
        if not Path(project_path).exists():
            st.error("Project path does not exist")
            return
        
        use_async = st.session_state.get('use_async', False) and ASYNC_AVAILABLE
        max_files = st.session_state.get('max_files', 1000)
        use_cache = st.session_state.get('use_cache', True)
        incremental = st.session_state.get('incremental', True)
        
        if use_async:
            self._run_async_analysis(project_path, max_files, use_cache, incremental)
        else:
            self._run_sync_analysis(project_path, max_files)
    
    def _run_async_analysis(self, project_path: str, max_files: int, use_cache: bool, incremental: bool):
        """Run async analysis with progress tracking."""
        # Use advanced progress components if available
        if self.progress:
            progress_tracker = self.progress.create_async_progress_tracker("async_analysis")
            progress_callback = progress_tracker['update']
        else:
            # Fallback to simple progress indicators
            progress_bar = st.progress(0)
            progress_text = st.empty()
            
            def progress_callback(message: str, progress: int):
                """Update progress in Streamlit."""
                progress_bar.progress(progress / 100)
                progress_text.text(message)
        
        # Show loading animation if available
        if self.animations:
            self.animations.show_loading_skeleton("analysis")
        
        try:
            # Run async analysis in event loop
            result = asyncio.run(self._async_analyze_wrapper(
                project_path, max_files, use_cache, incremental, progress_callback
            ))
            
            if result:
                # Store result
                st.session_state.analysis_result = result
                
                # Clear progress indicators if using fallback
                if not self.progress:
                    progress_bar.empty()
                    progress_text.empty()
                elif 'complete' in locals():
                    progress_tracker['complete']()
                
                # Show success animation if available
                if self.animations:
                    self.animations.show_success_animation("Analysis completed!")
                else:
                    st.success("✅ Async analysis completed!")
                
                # Show performance metrics using progress components if available
                if self.progress:
                    self.progress.show_performance_metrics(result.code_quality_metrics)
                else:
                    # Fallback metrics display
                    analysis_time = result.code_quality_metrics.get('analysis_time', 0)
                    files_analyzed = result.code_quality_metrics.get('files_analyzed', 0)
                    cache_used = result.code_quality_metrics.get('cache_used', False)
                    
                    st.info(f"⚡ Analysis completed in {analysis_time:.2f}s ({files_analyzed} files)" + 
                           (" [cached]" if cache_used else ""))
                
                # Rerun to display results
                st.rerun()
        
        except Exception as e:
            progress_bar.empty()
            progress_text.empty()
            st.error(f"Async analysis failed: {str(e)}")
            if st.checkbox("Show detailed error", key="async_error_detail"):
                st.exception(e)
    
    async def _async_analyze_wrapper(self, project_path: str, max_files: int, 
                                    use_cache: bool, incremental: bool, 
                                    progress_callback) -> Any:
        """Wrapper for async analysis."""
        if not self.async_analyzer:
            cache_dir = ".prompt_engineer_cache"
            if self.config_manager:
                cache_dir = self.config_manager.performance.cache_directory
            self.async_analyzer = AsyncProjectAnalyzer(cache_dir=cache_dir)
        
        return await self.async_analyzer.analyze_project_async(
            project_path=project_path,
            max_files=max_files,
            use_cache=use_cache,
            incremental=incremental,
            progress_callback=progress_callback
        )
    
    def _run_sync_analysis(self, project_path: str, max_files: int):
        """Run traditional synchronous analysis."""
        # Show loading animation if animations component is available
        if self.animations:
            self.animations.show_loading_skeleton("analysis")
        
        with st.spinner("Analyzing project..."):
            try:
                # Import the analyzer
                import sys
                from pathlib import Path
                sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'src'))
                
                from analyzers.project_intelligence import ProjectIntelligenceAnalyzer
                
                # Run analysis
                analyzer = ProjectIntelligenceAnalyzer()
                result = analyzer.analyze_project(project_path, max_files)
                
                # Store result
                st.session_state.analysis_result = result
                
                # Show success animation if available
                if self.animations:
                    self.animations.show_success_animation("Analysis completed!")
                else:
                    st.success("✅ Analysis completed!")
                
                # Rerun to display results
                st.rerun()
                
            except Exception as e:
                st.error(f"Analysis failed: {str(e)}")
                if st.checkbox("Show detailed error", key="sync_error_detail"):
                    st.exception(e)
    
    def _render_analysis_results(self):
        """Render the analysis results."""
        result = st.session_state.analysis_result
        if not result:
            return
        
        st.markdown("---")
        st.markdown("## 📋 Analysis Results")
        
        # Render metrics using widgets if available
        if self.widgets:
            self._render_results_with_widgets(result)
        else:
            self._render_basic_results(result)
        
        # Render charts if available
        if self.charts:
            self._render_results_charts(result)
    
    def _render_results_with_widgets(self, result):
        """Render results using widget components."""
        # Create metric cards
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            self.widgets.create_metric_card("Health Score", f"{result.health_score}/100", "🏥")
        
        with col2:
            critical_count = len(result.critical_issues) if hasattr(result, 'critical_issues') else 0
            self.widgets.create_metric_card("Critical Issues", str(critical_count), "🚨")
        
        with col3:
            high_count = len(result.high_priority_issues) if hasattr(result, 'high_priority_issues') else 0
            self.widgets.create_metric_card("High Priority", str(high_count), "⚠️")
        
        with col4:
            total_issues = (
                len(getattr(result, 'critical_issues', [])) +
                len(getattr(result, 'high_priority_issues', [])) +
                len(getattr(result, 'medium_priority_issues', [])) +
                len(getattr(result, 'low_priority_issues', []))
            )
            self.widgets.create_metric_card("Total Issues", str(total_issues), "📊")
    
    def _render_basic_results(self, result):
        """Render basic results without widgets."""
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("Health Score", f"{result.health_score}/100")
        
        with col2:
            critical_count = len(result.critical_issues) if hasattr(result, 'critical_issues') else 0
            st.metric("Critical Issues", critical_count)
        
        with col3:
            high_count = len(result.high_priority_issues) if hasattr(result, 'high_priority_issues') else 0
            st.metric("High Priority", high_count)
        
        with col4:
            total_issues = (
                len(getattr(result, 'critical_issues', [])) +
                len(getattr(result, 'high_priority_issues', [])) +
                len(getattr(result, 'medium_priority_issues', [])) +
                len(getattr(result, 'low_priority_issues', []))
            )
            st.metric("Total Issues", total_issues)
    
    def _render_results_charts(self, result):
        """Render results using chart components."""
        st.markdown("### 📈 Visual Analysis")
        
        # Create issue distribution chart
        try:
            issue_data = {
                'Critical': len(getattr(result, 'critical_issues', [])),
                'High Priority': len(getattr(result, 'high_priority_issues', [])),
                'Medium Priority': len(getattr(result, 'medium_priority_issues', [])),
                'Low Priority': len(getattr(result, 'low_priority_issues', []))
            }
            
            # Remove zero values
            issue_data = {k: v for k, v in issue_data.items() if v > 0}
            
            if issue_data:
                fig = self.charts.create_interactive_pie_chart(issue_data, "Issue Distribution")
                st.plotly_chart(fig, use_container_width=True)
        except Exception as e:
            st.error(f"Chart rendering error: {e}")