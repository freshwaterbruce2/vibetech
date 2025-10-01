"""
Data quality and pipeline visualization module using Matplotlib.
"""

import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import seaborn as sns
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime


class QualityVisualizer:
    """Visualize data quality and pipeline performance metrics."""

    def __init__(self):
        """Initialize visualizer with default settings."""
        self.logger = logging.getLogger(self.__class__.__name__)

        # Set style
        try:
            sns.set_style("whitegrid")
            plt.rcParams['figure.figsize'] = (12, 8)
            plt.rcParams['font.size'] = 10
        except:
            pass

    def plot_validation_results(self, validation_results: Dict[str, Any]):
        """
        Create validation results visualization.

        Args:
            validation_results: Results from validation
        """
        try:
            fig = plt.figure(figsize=(15, 10))
            gs = gridspec.GridSpec(3, 2, figure=fig, hspace=0.3)

            # Overall status
            ax1 = fig.add_subplot(gs[0, :])
            self._plot_overall_status(ax1, validation_results)

            # Schema validation
            ax2 = fig.add_subplot(gs[1, 0])
            self._plot_schema_status(ax2, validation_results.get('schema', {}))

            # Quality checks
            ax3 = fig.add_subplot(gs[1, 1])
            self._plot_quality_checks(ax3, validation_results.get('quality', {}))

            # Data statistics
            ax4 = fig.add_subplot(gs[2, :])
            self._plot_data_statistics(ax4, validation_results.get('quality', {}).get('statistics', {}))

            plt.suptitle('Data Validation Report', fontsize=16, fontweight='bold')
            plt.tight_layout()
            plt.show()

            self.logger.info("Validation visualization created")
        except Exception as e:
            self.logger.warning(f"Could not create validation visualization: {e}")

    def plot_pipeline_summary(self, report: Dict[str, Any]):
        """
        Create pipeline execution summary visualization.

        Args:
            report: Pipeline execution report
        """
        try:
            fig = plt.figure(figsize=(15, 10))
            gs = gridspec.GridSpec(3, 3, figure=fig, hspace=0.3, wspace=0.3)

            # Stage durations
            ax1 = fig.add_subplot(gs[0, :])
            self._plot_stage_durations(ax1, report.get('monitoring_metrics', {}).get('stages', {}))

            # Memory usage
            ax2 = fig.add_subplot(gs[1, 0])
            self._plot_memory_usage(ax2, report.get('monitoring_metrics', {}).get('system_metrics', []))

            # CPU usage
            ax3 = fig.add_subplot(gs[1, 1])
            self._plot_cpu_usage(ax3, report.get('monitoring_metrics', {}).get('system_metrics', []))

            # Error/Warning summary
            ax4 = fig.add_subplot(gs[1, 2])
            self._plot_issues_summary(ax4, report.get('monitoring_metrics', {}))

            # Processing history
            ax5 = fig.add_subplot(gs[2, :])
            self._plot_processing_timeline(ax5, report.get('processing_history', []))

            plt.suptitle(f"Pipeline Execution Summary - {report.get('pipeline_name', 'Unknown')}",
                        fontsize=16, fontweight='bold')
            plt.tight_layout()
            plt.show()

            self.logger.info("Pipeline summary visualization created")
        except Exception as e:
            self.logger.warning(f"Could not create pipeline visualization: {e}")

    def plot_data_profiling(self, df: pd.DataFrame, max_cols: int = 20):
        """
        Create comprehensive data profiling visualization.

        Args:
            df: DataFrame to profile
            max_cols: Maximum number of columns to visualize
        """
        try:
            # Select columns to visualize
            numeric_cols = df.select_dtypes(include=[np.number]).columns[:max_cols//2]
            categorical_cols = df.select_dtypes(include=['object', 'category']).columns[:max_cols//2]

            n_plots = len(numeric_cols) + len(categorical_cols)
            if n_plots == 0:
                return

            # Calculate grid dimensions
            n_rows = int(np.ceil(np.sqrt(n_plots)))
            n_cols = int(np.ceil(n_plots / n_rows))

            fig, axes = plt.subplots(n_rows, n_cols, figsize=(15, 10))
            axes = axes.flatten() if n_plots > 1 else [axes]

            plot_idx = 0

            # Plot numeric columns
            for col in numeric_cols:
                if plot_idx < len(axes):
                    ax = axes[plot_idx]
                    df[col].hist(ax=ax, bins=30, edgecolor='black', alpha=0.7)
                    ax.set_title(f'{col} Distribution')
                    ax.set_xlabel(col)
                    ax.set_ylabel('Frequency')
                    plot_idx += 1

            # Plot categorical columns
            for col in categorical_cols:
                if plot_idx < len(axes):
                    ax = axes[plot_idx]
                    value_counts = df[col].value_counts()[:10]  # Top 10 values
                    value_counts.plot(kind='bar', ax=ax)
                    ax.set_title(f'{col} Value Counts')
                    ax.set_xlabel(col)
                    ax.set_ylabel('Count')
                    ax.tick_params(axis='x', rotation=45)
                    plot_idx += 1

            # Hide unused subplots
            for idx in range(plot_idx, len(axes)):
                axes[idx].set_visible(False)

            plt.suptitle('Data Profiling Report', fontsize=16, fontweight='bold')
            plt.tight_layout()
            plt.show()

            self.logger.info("Data profiling visualization created")
        except Exception as e:
            self.logger.warning(f"Could not create data profiling visualization: {e}")

    def plot_correlation_matrix(self, df: pd.DataFrame, max_features: int = 20):
        """
        Plot correlation matrix for numeric features.

        Args:
            df: DataFrame with features
            max_features: Maximum number of features to include
        """
        try:
            numeric_cols = df.select_dtypes(include=[np.number]).columns[:max_features]

            if len(numeric_cols) < 2:
                return

            correlation_matrix = df[numeric_cols].corr()

            plt.figure(figsize=(12, 10))
            sns.heatmap(correlation_matrix, annot=True, fmt='.2f', cmap='coolwarm',
                       center=0, square=True, linewidths=1)
            plt.title('Feature Correlation Matrix', fontsize=16, fontweight='bold')
            plt.tight_layout()
            plt.show()

            self.logger.info("Correlation matrix visualization created")
        except Exception as e:
            self.logger.warning(f"Could not create correlation matrix: {e}")

    def _plot_overall_status(self, ax, validation_results):
        """Plot overall validation status."""
        status_text = "PASSED" if validation_results.get('valid', False) else "FAILED"
        color = 'green' if validation_results.get('valid', False) else 'red'

        ax.text(0.5, 0.5, status_text, fontsize=30, fontweight='bold',
                ha='center', va='center', color=color)

        # Add summary statistics
        n_errors = len(validation_results.get('errors', []))
        n_warnings = len(validation_results.get('warnings', []))
        summary = f"Errors: {n_errors} | Warnings: {n_warnings}"
        ax.text(0.5, 0.2, summary, fontsize=12, ha='center', va='center')

        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        ax.axis('off')
        ax.set_title('Validation Status', fontsize=14, fontweight='bold')

    def _plot_schema_status(self, ax, schema_results):
        """Plot schema validation status."""
        if not schema_results:
            ax.text(0.5, 0.5, 'No schema validation performed',
                   ha='center', va='center')
            ax.axis('off')
            return

        column_analysis = schema_results.get('column_analysis', {})
        if column_analysis:
            valid_cols = sum(1 for v in column_analysis.values() if v.get('type_valid', False))
            total_cols = len(column_analysis)

            # Pie chart
            sizes = [valid_cols, total_cols - valid_cols]
            labels = ['Valid', 'Invalid']
            colors = ['green', 'red']

            ax.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%',
                  startangle=90)
            ax.set_title('Schema Validation', fontsize=12, fontweight='bold')

    def _plot_quality_checks(self, ax, quality_results):
        """Plot quality check results."""
        if not quality_results:
            ax.text(0.5, 0.5, 'No quality checks performed',
                   ha='center', va='center')
            ax.axis('off')
            return

        checks = quality_results.get('checks_performed', [])
        if checks:
            issues_by_check = {}
            for check in checks:
                issues = len([i for i in quality_results.get('issues', [])
                            if check in i.get('type', '')])
                issues_by_check[check] = issues

            # Bar chart
            ax.bar(range(len(issues_by_check)), list(issues_by_check.values()))
            ax.set_xticks(range(len(issues_by_check)))
            ax.set_xticklabels(list(issues_by_check.keys()), rotation=45)
            ax.set_ylabel('Issues Count')
            ax.set_title('Quality Check Results', fontsize=12, fontweight='bold')

    def _plot_data_statistics(self, ax, statistics):
        """Plot data statistics summary."""
        if not statistics:
            ax.text(0.5, 0.5, 'No statistics available',
                   ha='center', va='center')
            ax.axis('off')
            return

        # Create summary table
        summary_data = []

        if 'completeness' in statistics:
            comp = statistics['completeness']
            summary_data.append(['Completeness', f"{comp.get('completeness_score', 0):.1f}%"])

        if 'missing_values' in statistics:
            miss = statistics['missing_values']
            summary_data.append(['Missing Values', f"{miss.get('total_missing', 0):,}"])

        if 'duplicates' in statistics:
            dup = statistics['duplicates']
            summary_data.append(['Duplicate Rows', f"{dup.get('duplicate_rows', 0):,}"])

        if 'outliers' in statistics:
            out = statistics['outliers']
            summary_data.append(['Columns with Outliers', f"{len(out)}"])

        if summary_data:
            table = ax.table(cellText=summary_data, colLabels=['Metric', 'Value'],
                           cellLoc='center', loc='center')
            table.auto_set_font_size(False)
            table.set_fontsize(10)
            table.scale(1, 2)

        ax.axis('off')
        ax.set_title('Data Statistics Summary', fontsize=12, fontweight='bold')

    def _plot_stage_durations(self, ax, stages):
        """Plot pipeline stage durations."""
        if not stages:
            ax.text(0.5, 0.5, 'No stage data available',
                   ha='center', va='center')
            ax.axis('off')
            return

        stage_names = list(stages.keys())
        durations = [stages[s].get('duration', 0) for s in stage_names]

        ax.barh(range(len(stage_names)), durations)
        ax.set_yticks(range(len(stage_names)))
        ax.set_yticklabels(stage_names)
        ax.set_xlabel('Duration (seconds)')
        ax.set_title('Stage Execution Times', fontsize=12, fontweight='bold')

    def _plot_memory_usage(self, ax, system_metrics):
        """Plot memory usage over time."""
        if not system_metrics:
            ax.text(0.5, 0.5, 'No memory data available',
                   ha='center', va='center')
            ax.axis('off')
            return

        memory_values = [m.get('memory_mb', 0) for m in system_metrics]
        ax.plot(memory_values, marker='o')
        ax.set_xlabel('Checkpoint')
        ax.set_ylabel('Memory (MB)')
        ax.set_title('Memory Usage', fontsize=12, fontweight='bold')
        ax.grid(True, alpha=0.3)

    def _plot_cpu_usage(self, ax, system_metrics):
        """Plot CPU usage over time."""
        if not system_metrics:
            ax.text(0.5, 0.5, 'No CPU data available',
                   ha='center', va='center')
            ax.axis('off')
            return

        cpu_values = [m.get('cpu_percent', 0) for m in system_metrics]
        ax.plot(cpu_values, marker='o', color='orange')
        ax.set_xlabel('Checkpoint')
        ax.set_ylabel('CPU %')
        ax.set_title('CPU Usage', fontsize=12, fontweight='bold')
        ax.grid(True, alpha=0.3)

    def _plot_issues_summary(self, ax, metrics):
        """Plot issues summary."""
        n_errors = len(metrics.get('errors', []))
        n_warnings = len(metrics.get('warnings', []))

        categories = ['Errors', 'Warnings']
        values = [n_errors, n_warnings]
        colors = ['red', 'orange']

        ax.bar(categories, values, color=colors)
        ax.set_ylabel('Count')
        ax.set_title('Issues Summary', fontsize=12, fontweight='bold')

    def _plot_processing_timeline(self, ax, history):
        """Plot processing timeline."""
        if not history:
            ax.text(0.5, 0.5, 'No processing history available',
                   ha='center', va='center')
            ax.axis('off')
            return

        steps = [h.get('step', 'unknown') for h in history]
        ax.barh(range(len(steps)), [1] * len(steps))
        ax.set_yticks(range(len(steps)))
        ax.set_yticklabels(steps)
        ax.set_xlabel('Processing Order')
        ax.set_title('Processing Timeline', fontsize=12, fontweight='bold')
        ax.set_xlim(0, 1.2)