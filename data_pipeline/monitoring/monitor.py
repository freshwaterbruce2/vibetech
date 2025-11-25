"""
Pipeline monitoring and performance tracking module.
"""

import time
import psutil
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
import json
from pathlib import Path


class PipelineMonitor:
    """Monitor pipeline execution and track performance metrics."""

    def __init__(self, config: Any):
        """
        Initialize pipeline monitor.

        Args:
            config: Monitoring configuration
        """
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)

        # Metrics storage
        self.metrics = {
            'stages': {},
            'errors': [],
            'warnings': [],
            'system_metrics': [],
            'checkpoints': []
        }

        # Timing
        self.stage_timers = {}
        self.pipeline_start_time = None

        # System monitoring
        self.process = psutil.Process()
        self.initial_memory = self.process.memory_info().rss / 1024 / 1024  # MB

    def start_pipeline(self):
        """Mark the start of pipeline execution."""
        self.pipeline_start_time = time.time()
        self.metrics['pipeline_start'] = datetime.now().isoformat()
        self.logger.info("Pipeline monitoring started")

    def end_pipeline(self):
        """Mark the end of pipeline execution."""
        if self.pipeline_start_time:
            elapsed = time.time() - self.pipeline_start_time
            self.metrics['pipeline_duration'] = elapsed
            self.metrics['pipeline_end'] = datetime.now().isoformat()
            self.logger.info(f"Pipeline completed in {elapsed:.2f} seconds")

    def start_stage(self, stage_name: str):
        """
        Start monitoring a pipeline stage.

        Args:
            stage_name: Name of the stage
        """
        self.stage_timers[stage_name] = {
            'start': time.time(),
            'memory_before': self._get_memory_usage()
        }
        self.logger.debug(f"Started monitoring stage: {stage_name}")

    def end_stage(self, stage_name: str, **kwargs):
        """
        End monitoring a pipeline stage.

        Args:
            stage_name: Name of the stage
            **kwargs: Additional metrics to record
        """
        if stage_name not in self.stage_timers:
            return

        start_info = self.stage_timers[stage_name]
        duration = time.time() - start_info['start']
        memory_after = self._get_memory_usage()
        memory_delta = memory_after - start_info['memory_before']

        self.metrics['stages'][stage_name] = {
            'duration': duration,
            'memory_delta_mb': memory_delta,
            'memory_after_mb': memory_after,
            'timestamp': datetime.now().isoformat(),
            **kwargs
        }

        self.logger.info(
            f"Stage '{stage_name}' completed: "
            f"{duration:.2f}s, Memory Δ: {memory_delta:.1f}MB"
        )

        # Check memory limit
        if self.config.enable_profiling:
            self._check_resource_limits(stage_name, memory_after)

    def record_error(self, stage: str, error: str, severity: str = "ERROR"):
        """
        Record an error during pipeline execution.

        Args:
            stage: Stage where error occurred
            error: Error message
            severity: Error severity
        """
        error_record = {
            'stage': stage,
            'error': str(error),
            'severity': severity,
            'timestamp': datetime.now().isoformat()
        }

        if severity == "WARNING":
            self.metrics['warnings'].append(error_record)
            self.logger.warning(f"[{stage}] {error}")
        else:
            self.metrics['errors'].append(error_record)
            self.logger.error(f"[{stage}] {error}")

    def checkpoint(self, name: str, data_stats: Optional[Dict[str, Any]] = None):
        """
        Create a checkpoint with current pipeline state.

        Args:
            name: Checkpoint name
            data_stats: Optional statistics about data at this point
        """
        checkpoint = {
            'name': name,
            'timestamp': datetime.now().isoformat(),
            'memory_usage_mb': self._get_memory_usage(),
            'cpu_percent': self.process.cpu_percent(),
            'data_stats': data_stats or {}
        }

        self.metrics['checkpoints'].append(checkpoint)

        if self.config.enable_profiling:
            self.logger.info(
                f"Checkpoint '{name}': "
                f"Memory: {checkpoint['memory_usage_mb']:.1f}MB, "
                f"CPU: {checkpoint['cpu_percent']:.1f}%"
            )

    def _get_memory_usage(self) -> float:
        """Get current memory usage in MB."""
        return self.process.memory_info().rss / 1024 / 1024

    def _check_resource_limits(self, stage: str, memory_mb: float):
        """Check if resource limits are exceeded."""
        # Check memory limit
        memory_limit = getattr(self.config, 'memory_limit_mb', 1024)
        if memory_mb > memory_limit:
            self.record_error(
                stage,
                f"Memory usage ({memory_mb:.1f}MB) exceeds limit ({memory_limit}MB)",
                "WARNING"
            )

        # Track system metrics
        self.metrics['system_metrics'].append({
            'stage': stage,
            'timestamp': datetime.now().isoformat(),
            'memory_mb': memory_mb,
            'cpu_percent': self.process.cpu_percent(),
            'threads': self.process.num_threads()
        })

    def get_metrics(self) -> Dict[str, Any]:
        """
        Get all collected metrics.

        Returns:
            Dictionary of metrics
        """
        # Calculate summary statistics
        summary = {
            'total_stages': len(self.metrics['stages']),
            'total_errors': len(self.metrics['errors']),
            'total_warnings': len(self.metrics['warnings']),
            'peak_memory_mb': max(
                [m['memory_mb'] for m in self.metrics['system_metrics']],
                default=0
            ),
            'average_cpu_percent': np.mean(
                [m['cpu_percent'] for m in self.metrics['system_metrics']],
                default=0
            ) if self.metrics['system_metrics'] else 0
        }

        return {
            **self.metrics,
            'summary': summary
        }

    def save_metrics(self, filepath: Optional[str] = None):
        """
        Save metrics to file.

        Args:
            filepath: Path to save metrics (uses default if not provided)
        """
        if not filepath:
            filepath = f"pipeline_metrics_{datetime.now():%Y%m%d_%H%M%S}.json"

        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)

        with open(filepath, 'w') as f:
            json.dump(self.get_metrics(), f, indent=2, default=str)

        self.logger.info(f"Metrics saved to {filepath}")

    def generate_performance_report(self) -> str:
        """
        Generate a human-readable performance report.

        Returns:
            Formatted report string
        """
        metrics = self.get_metrics()
        report = []

        report.append("=" * 60)
        report.append("PIPELINE PERFORMANCE REPORT")
        report.append("=" * 60)

        # Pipeline summary
        if 'pipeline_duration' in metrics:
            report.append(f"\nTotal Duration: {metrics['pipeline_duration']:.2f} seconds")

        # Stage performance
        if metrics['stages']:
            report.append("\nStage Performance:")
            for stage, stats in metrics['stages'].items():
                report.append(f"  {stage}:")
                report.append(f"    Duration: {stats['duration']:.2f}s")
                report.append(f"    Memory Δ: {stats.get('memory_delta_mb', 0):.1f}MB")
                for key, value in stats.items():
                    if key not in ['duration', 'memory_delta_mb', 'memory_after_mb', 'timestamp']:
                        report.append(f"    {key}: {value}")

        # Resource usage
        summary = metrics.get('summary', {})
        if summary:
            report.append("\nResource Usage:")
            report.append(f"  Peak Memory: {summary.get('peak_memory_mb', 0):.1f}MB")
            report.append(f"  Avg CPU: {summary.get('average_cpu_percent', 0):.1f}%")

        # Issues
        if metrics['errors']:
            report.append(f"\nErrors ({len(metrics['errors'])}):")
            for error in metrics['errors'][:5]:  # Limit to 5
                report.append(f"  [{error['stage']}] {error['error']}")

        if metrics['warnings']:
            report.append(f"\nWarnings ({len(metrics['warnings'])}):")
            for warning in metrics['warnings'][:5]:  # Limit to 5
                report.append(f"  [{warning['stage']}] {warning['error']}")

        report.append("\n" + "=" * 60)
        return "\n".join(report)


class MetricsAggregator:
    """Aggregate metrics from multiple pipeline runs."""

    def __init__(self):
        """Initialize metrics aggregator."""
        self.runs = []

    def add_run(self, metrics: Dict[str, Any]):
        """Add metrics from a pipeline run."""
        self.runs.append(metrics)

    def get_aggregate_stats(self) -> Dict[str, Any]:
        """
        Get aggregate statistics across all runs.

        Returns:
            Aggregate statistics dictionary
        """
        if not self.runs:
            return {}

        import numpy as np

        # Collect duration statistics
        durations = [
            run.get('pipeline_duration', 0)
            for run in self.runs
            if 'pipeline_duration' in run
        ]

        # Collect error counts
        error_counts = [
            len(run.get('errors', []))
            for run in self.runs
        ]

        # Collect memory usage
        peak_memories = [
            run.get('summary', {}).get('peak_memory_mb', 0)
            for run in self.runs
        ]

        return {
            'total_runs': len(self.runs),
            'duration_stats': {
                'mean': np.mean(durations) if durations else 0,
                'std': np.std(durations) if durations else 0,
                'min': np.min(durations) if durations else 0,
                'max': np.max(durations) if durations else 0
            },
            'error_stats': {
                'mean': np.mean(error_counts),
                'total': sum(error_counts)
            },
            'memory_stats': {
                'mean': np.mean(peak_memories) if peak_memories else 0,
                'max': np.max(peak_memories) if peak_memories else 0
            }
        }

    def save_aggregate_report(self, filepath: str):
        """Save aggregate report to file."""
        stats = self.get_aggregate_stats()

        report = {
            'aggregate_stats': stats,
            'runs': self.runs
        }

        with open(filepath, 'w') as f:
            json.dump(report, f, indent=2, default=str)


# Import numpy only if needed
try:
    import numpy as np
except ImportError:
    np = None