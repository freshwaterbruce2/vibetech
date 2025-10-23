#!/usr/bin/env python3
"""
Progress Components

Advanced progress indicators for async operations with real-time updates.
"""

import streamlit as st
import time
from typing import Optional, Callable, Dict, Any, List
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class ProgressStage:
    """Represents a stage in a multi-step process."""
    name: str
    description: str
    weight: float = 1.0  # Relative weight for progress calculation
    status: str = 'pending'  # pending, active, completed, failed
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    substeps: List[str] = None
    
    def __post_init__(self):
        if self.substeps is None:
            self.substeps = []

class ProgressComponents:
    """Enhanced progress indicators for complex async operations."""
    
    def __init__(self, theme_manager=None):
        """Initialize with optional theme manager."""
        self.theme_manager = theme_manager
        self._active_progress = {}
    
    def create_async_progress_tracker(self, operation_id: str, 
                                    stages: List[ProgressStage] = None) -> Dict[str, Any]:
        """
        Create a comprehensive async progress tracker.
        Returns dict with control elements for real-time updates.
        """
        if stages is None:
            stages = [
                ProgressStage("Initialize", "Setting up analysis environment"),
                ProgressStage("Discover", "Finding files to analyze", weight=1.5),
                ProgressStage("Analyze", "Processing code files", weight=5.0),
                ProgressStage("Merge", "Combining results", weight=1.0),
                ProgressStage("Cache", "Saving results", weight=0.5),
                ProgressStage("Complete", "Finalizing analysis")
            ]
        
        # Create containers
        main_container = st.container()
        
        with main_container:
            st.markdown("### 📊 Analysis Progress")
            
            # Overall progress bar
            overall_progress = st.progress(0)
            overall_status = st.empty()
            
            # Detailed progress container
            with st.expander("📋 Detailed Progress", expanded=True):
                stage_container = st.container()
                
            # Performance metrics container  
            metrics_container = st.empty()
            
            # Time estimates
            time_container = st.empty()
        
        # Store progress state
        progress_state = {
            'stages': stages,
            'current_stage_index': 0,
            'overall_progress': 0,
            'start_time': datetime.now(),
            'containers': {
                'overall_progress': overall_progress,
                'overall_status': overall_status,
                'stage_container': stage_container,
                'metrics_container': metrics_container,
                'time_container': time_container
            }
        }
        
        self._active_progress[operation_id] = progress_state
        
        # Initial render
        self._render_progress_stages(operation_id)
        
        return {
            'update': lambda msg, pct: self.update_progress(operation_id, msg, pct),
            'next_stage': lambda: self.advance_stage(operation_id),
            'complete': lambda: self.complete_progress(operation_id),
            'fail': lambda error: self.fail_progress(operation_id, error)
        }
    
    def update_progress(self, operation_id: str, message: str, progress_percent: int):
        """Update progress for async operation."""
        if operation_id not in self._active_progress:
            return
        
        state = self._active_progress[operation_id]
        state['overall_progress'] = progress_percent
        
        # Update current stage
        current_stage = state['stages'][state['current_stage_index']]
        if current_stage.status == 'pending':
            current_stage.status = 'active'
            current_stage.start_time = datetime.now()
        
        current_stage.description = message
        
        # Update UI elements
        containers = state['containers']
        containers['overall_progress'].progress(progress_percent / 100)
        containers['overall_status'].text(f"{message} ({progress_percent}%)")
        
        # Update detailed progress
        self._render_progress_stages(operation_id)
        self._render_time_estimates(operation_id)
        
    def advance_stage(self, operation_id: str) -> bool:
        """Advance to next stage in progress."""
        if operation_id not in self._active_progress:
            return False
        
        state = self._active_progress[operation_id]
        current_index = state['current_stage_index']
        
        # Complete current stage
        if current_index < len(state['stages']):
            current_stage = state['stages'][current_index]
            current_stage.status = 'completed'
            current_stage.end_time = datetime.now()
        
        # Advance to next stage
        if current_index + 1 < len(state['stages']):
            state['current_stage_index'] += 1
            next_stage = state['stages'][state['current_stage_index']]
            next_stage.status = 'active'
            next_stage.start_time = datetime.now()
            return True
        
        return False
    
    def complete_progress(self, operation_id: str):
        """Mark progress as completed."""
        if operation_id not in self._active_progress:
            return
        
        state = self._active_progress[operation_id]
        
        # Mark all remaining stages as completed
        for stage in state['stages'][state['current_stage_index']:]:
            if stage.status != 'completed':
                stage.status = 'completed'
                stage.end_time = datetime.now()
        
        # Update progress to 100%
        state['overall_progress'] = 100
        
        containers = state['containers']
        containers['overall_progress'].progress(1.0)
        containers['overall_status'].success("✅ Analysis completed successfully!")
        
        # Show final metrics
        self._render_completion_metrics(operation_id)
    
    def fail_progress(self, operation_id: str, error: str):
        """Mark progress as failed."""
        if operation_id not in self._active_progress:
            return
        
        state = self._active_progress[operation_id]
        
        # Mark current stage as failed
        if state['current_stage_index'] < len(state['stages']):
            current_stage = state['stages'][state['current_stage_index']]
            current_stage.status = 'failed'
            current_stage.end_time = datetime.now()
            current_stage.description = f"Failed: {error}"
        
        containers = state['containers']
        containers['overall_status'].error(f"❌ Analysis failed: {error}")
        
        self._render_progress_stages(operation_id)
    
    def _render_progress_stages(self, operation_id: str):
        """Render detailed progress stages."""
        if operation_id not in self._active_progress:
            return
        
        state = self._active_progress[operation_id]
        container = state['containers']['stage_container']
        
        with container.container():
            for i, stage in enumerate(state['stages']):
                status_icon = self._get_stage_icon(stage.status)
                
                # Create stage display
                col1, col2, col3 = st.columns([1, 6, 2])
                
                with col1:
                    st.markdown(f"**{status_icon}**")
                
                with col2:
                    if stage.status == 'active':
                        st.markdown(f"**{stage.name}**: *{stage.description}*")
                    else:
                        st.markdown(f"{stage.name}: {stage.description}")
                
                with col3:
                    if stage.start_time:
                        if stage.end_time:
                            duration = stage.end_time - stage.start_time
                            st.text(f"{duration.total_seconds():.1f}s")
                        else:
                            elapsed = datetime.now() - stage.start_time
                            st.text(f"{elapsed.total_seconds():.1f}s")
                
                # Add substeps if any
                if stage.substeps and stage.status in ['active', 'completed']:
                    for substep in stage.substeps:
                        st.text(f"  → {substep}")
    
    def _render_time_estimates(self, operation_id: str):
        """Render time estimates and performance metrics."""
        if operation_id not in self._active_progress:
            return
        
        state = self._active_progress[operation_id]
        container = state['containers']['time_container']
        
        # Calculate time metrics
        elapsed_time = datetime.now() - state['start_time']
        progress_pct = max(1, state['overall_progress'])  # Avoid division by zero
        estimated_total = elapsed_time.total_seconds() * (100 / progress_pct)
        remaining_time = max(0, estimated_total - elapsed_time.total_seconds())
        
        with container.container():
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric(
                    "Elapsed Time", 
                    f"{elapsed_time.total_seconds():.1f}s"
                )
            
            with col2:
                st.metric(
                    "Estimated Remaining", 
                    f"{remaining_time:.1f}s"
                )
            
            with col3:
                st.metric(
                    "Progress", 
                    f"{state['overall_progress']}%"
                )
    
    def _render_completion_metrics(self, operation_id: str):
        """Render final completion metrics."""
        if operation_id not in self._active_progress:
            return
        
        state = self._active_progress[operation_id]
        container = state['containers']['metrics_container']
        
        total_time = datetime.now() - state['start_time']
        
        with container.container():
            st.success(f"🎉 Analysis completed in {total_time.total_seconds():.2f} seconds")
            
            # Stage breakdown
            with st.expander("📊 Stage Performance", expanded=False):
                for stage in state['stages']:
                    if stage.start_time and stage.end_time:
                        duration = stage.end_time - stage.start_time
                        st.text(f"{stage.name}: {duration.total_seconds():.2f}s")
    
    def _get_stage_icon(self, status: str) -> str:
        """Get icon for stage status."""
        icons = {
            'pending': '⏳',
            'active': '🔄',
            'completed': '✅',
            'failed': '❌'
        }
        return icons.get(status, '⚪')
    
    def _get_stage_color(self, status: str) -> str:
        """Get color for stage status."""
        colors = {
            'pending': 'gray',
            'active': 'blue', 
            'completed': 'green',
            'failed': 'red'
        }
        return colors.get(status, 'gray')
    
    def create_simple_progress_bar(self, label: str = "Progress") -> Callable:
        """Create a simple progress bar with update function."""
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        def update_progress(progress: int, message: str = None):
            progress_bar.progress(progress / 100)
            if message:
                status_text.text(f"{label}: {message} ({progress}%)")
            else:
                status_text.text(f"{label}: {progress}%")
        
        return update_progress
    
    def create_loading_skeleton(self, elements: List[str] = None) -> None:
        """Create animated loading skeleton."""
        if elements is None:
            elements = ["Header", "Content", "Chart", "Summary"]
        
        st.markdown("### 🔄 Loading Analysis...")
        
        for element in elements:
            with st.container():
                st.markdown(f"**{element}**")
                # Create placeholder boxes
                cols = st.columns([3, 1])
                with cols[0]:
                    st.text("█" * 40)  # Loading placeholder
                with cols[1]:
                    st.text("█" * 10)
                st.markdown("---")
    
    def show_performance_metrics(self, metrics: Dict[str, Any]):
        """Display performance metrics in an organized way."""
        st.markdown("### ⚡ Performance Metrics")
        
        cols = st.columns(4)
        
        with cols[0]:
            st.metric(
                "Analysis Time",
                f"{metrics.get('analysis_time', 0):.2f}s"
            )
        
        with cols[1]:
            st.metric(
                "Files Processed",
                f"{metrics.get('files_analyzed', 0):,}"
            )
        
        with cols[2]:
            st.metric(
                "Lines Analyzed", 
                f"{metrics.get('total_lines', 0):,}"
            )
        
        with cols[3]:
            cache_status = "Yes" if metrics.get('cache_used', False) else "No"
            st.metric(
                "Cache Used",
                cache_status
            )
        
        # Additional metrics in expander
        if any(key in metrics for key in ['file_types', 'issue_density', 'memory_usage']):
            with st.expander("📊 Detailed Metrics", expanded=False):
                
                if 'file_types' in metrics:
                    st.markdown("**File Types:**")
                    file_types = metrics['file_types']
                    for ext, count in sorted(file_types.items(), key=lambda x: x[1], reverse=True):
                        if ext:  # Skip empty extensions
                            st.text(f"{ext}: {count} files")
                
                if 'issue_density' in metrics:
                    st.metric(
                        "Issue Density", 
                        f"{metrics['issue_density']:.3f} issues/file"
                    )
                
                if 'memory_usage' in metrics:
                    st.metric(
                        "Peak Memory", 
                        f"{metrics['memory_usage']:.1f} MB"
                    )

# Factory function for easy import
def create_progress_components(theme_manager=None) -> ProgressComponents:
    """Create progress components instance."""
    return ProgressComponents(theme_manager=theme_manager)