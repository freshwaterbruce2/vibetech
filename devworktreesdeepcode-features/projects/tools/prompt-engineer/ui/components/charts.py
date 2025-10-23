#!/usr/bin/env python3
"""
Chart Components

Interactive Plotly charts and data visualizations for the Prompt Engineer UI.
Extracted from monolithic streamlit_ui.py for better maintainability.
"""

import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

class ChartComponents:
    """Collection of interactive chart components using Plotly."""
    
    def __init__(self):
        """Initialize chart components with color palette."""
        self.colors = self.create_custom_color_palette()
    
    def create_custom_color_palette(self) -> Dict[str, str]:
        """Create consistent color palette for all charts."""
        return {
            'primary': '#60a5fa',     # Blue
            'secondary': '#a78bfa',   # Purple
            'success': '#34d399',     # Green
            'warning': '#fbbf24',     # Yellow
            'danger': '#f87171',      # Red
            'info': '#60a5fa',        # Blue
            'light': '#f1f5f9',       # Light gray
            'dark': '#1e293b',        # Dark blue
            'critical': '#dc2626',    # Critical red
            'high': '#ea580c',        # High orange
            'medium': '#ca8a04',      # Medium yellow
            'low': '#16a34a',         # Low green
            'accent': '#6366f1',      # Accent indigo
            'text': '#374151',        # Text color
            'background': '#f8fafc'   # Background
        }
    
    def create_interactive_pie_chart(self, issue_data: Dict[str, int], title: str = "Issue Distribution", show_legend: bool = True) -> go.Figure:
        """Create an interactive pie chart with hover details and animations."""
        if not issue_data:
            # Return empty chart placeholder
            fig = go.Figure()
            fig.add_annotation(
                text="No data available",
                x=0.5, y=0.5,
                showarrow=False,
                font=dict(size=16, color=self.colors['text'])
            )
            return fig
        
        # Map issue types to colors
        color_map = {
            'todo': self.colors['warning'],
            'security': self.colors['critical'],
            'empty_file': self.colors['medium'],
            'test_failure': self.colors['high'],
            'missing_feature': self.colors['info'],
            'performance': self.colors['secondary']
        }
        
        labels = list(issue_data.keys())
        values = list(issue_data.values())
        colors_list = [color_map.get(label.lower(), self.colors['primary']) for label in labels]
        
        fig = go.Figure(data=[go.Pie(
            labels=labels,
            values=values,
            hole=0.4,  # Donut chart
            marker=dict(
                colors=colors_list,
                line=dict(color='white', width=2)
            ),
            textinfo='label+percent',
            textposition='outside',
            hovertemplate='<b>%{label}</b><br>Count: %{value}<br>Percentage: %{percent}<extra></extra>',
            pull=[0.1 if v == max(values) else 0 for v in values]  # Pull out largest slice
        )])
        
        fig.update_layout(
            title=dict(
                text=title,
                x=0.5,
                font=dict(size=18, family="Arial", color=self.colors['text'])
            ),
            font=dict(size=12, color=self.colors['text']),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            showlegend=show_legend,
            margin=dict(t=60, b=60, l=60, r=60),
            height=400
        )
        
        return fig
    
    def create_3d_bar_chart(self, issue_severity_by_type: Dict[str, Dict[str, int]]) -> go.Figure:
        """Create a 3D bar chart showing issue severity across different file types."""
        if not issue_severity_by_type:
            return self._empty_chart("No severity data available")
        
        # Prepare data for 3D visualization
        file_types = list(issue_severity_by_type.keys())
        severities = ['critical', 'high', 'medium', 'low']
        
        # Create meshgrid for 3D positioning
        x_pos = np.arange(len(file_types))
        y_pos = np.arange(len(severities))
        
        fig = go.Figure()
        
        for i, severity in enumerate(severities):
            z_values = [issue_severity_by_type.get(ft, {}).get(severity, 0) for ft in file_types]
            
            fig.add_trace(go.Bar(
                name=severity.title(),
                x=file_types,
                y=z_values,
                marker=dict(color=self.colors.get(severity, self.colors['primary'])),
                hovertemplate=f'<b>{severity.title()} Issues</b><br>File Type: %{{x}}<br>Count: %{{y}}<extra></extra>',
                opacity=0.8
            ))
        
        fig.update_layout(
            title=dict(
                text="Issue Severity by File Type",
                x=0.5,
                font=dict(size=18, family="Arial", color=self.colors['text'])
            ),
            xaxis_title="File Types",
            yaxis_title="Issue Count",
            barmode='group',
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            height=500,
            margin=dict(t=60, b=60, l=60, r=60)
        )
        
        return fig
    
    def create_time_series_health_chart(self, project_path: str, current_health_score: int) -> go.Figure:
        """Create time series line chart for project health trends with simulated historical data."""
        # Generate simulated historical data (30 days)
        end_date = datetime.now()
        dates = [end_date - timedelta(days=i) for i in range(30, 0, -1)]
        
        # Simulate health score evolution leading to current score
        np.random.seed(hash(project_path) % 1000)  # Consistent simulation based on project
        base_trend = np.linspace(max(current_health_score - 20, 20), current_health_score, 30)
        noise = np.random.normal(0, 5, 30)
        health_scores = np.clip(base_trend + noise, 0, 100)
        
        # Create the main health trend line
        fig = make_subplots(
            rows=2, cols=1,
            shared_xaxes=True,
            vertical_spacing=0.1,
            subplot_titles=('Project Health Score Trend', 'Issue Detection Rate'),
            row_heights=[0.7, 0.3]
        )
        
        # Health score trend
        fig.add_trace(
            go.Scatter(
                x=dates,
                y=health_scores,
                mode='lines+markers',
                name='Health Score',
                line=dict(color=self.colors['accent'], width=3),
                marker=dict(size=6, color=self.colors['accent']),
                fill='tonexty',
                fillcolor=f"rgba(99, 102, 241, 0.1)",
                hovertemplate='<b>%{y:.1f}</b> Health Score<br>%{x}<extra></extra>'
            ),
            row=1, col=1
        )
        
        # Add health goal line
        fig.add_trace(
            go.Scatter(
                x=dates,
                y=[95] * len(dates),
                mode='lines',
                name='Target (95)',
                line=dict(color=self.colors['low'], width=2, dash='dash'),
                hovertemplate='Target: <b>95</b><extra></extra>'
            ),
            row=1, col=1
        )
        
        # Simulate issue detection rate
        issue_rates = np.random.poisson(3, len(dates))  # Average 3 issues per day
        fig.add_trace(
            go.Bar(
                x=dates,
                y=issue_rates,
                name='Issues Detected',
                marker=dict(color=self.colors['medium'], opacity=0.7),
                hovertemplate='<b>%{y}</b> issues detected<br>%{x}<extra></extra>'
            ),
            row=2, col=1
        )
        
        # Update layout
        fig.update_layout(
            title=dict(
                text="Project Health Analytics Dashboard",
                x=0.5,
                font=dict(size=20, family="Arial", color=self.colors['text'])
            ),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            height=600,
            showlegend=True,
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=-0.15,
                xanchor="center",
                x=0.5
            ),
            margin=dict(t=80, b=80, l=60, r=60),
            hovermode='x unified'
        )
        
        # Update axes
        fig.update_xaxes(
            title_text="Date",
            gridcolor='#E5E7EB',
            row=2, col=1
        )
        fig.update_yaxes(
            title_text="Health Score",
            gridcolor='#E5E7EB',
            range=[0, 100],
            row=1, col=1
        )
        fig.update_yaxes(
            title_text="Issues",
            gridcolor='#E5E7EB',
            row=2, col=1
        )
        
        return fig
    
    def create_network_graph(self, tech_stack: List[str], file_dependencies: Optional[Dict] = None) -> go.Figure:
        """Create network graph showing file dependency relationships."""
        if not tech_stack:
            return self._empty_chart("No technology stack data available")
        
        # Create nodes and edges for tech stack relationships
        nodes = []
        edges = []
        
        # Add tech stack nodes
        for i, tech in enumerate(tech_stack):
            nodes.append({
                'id': tech,
                'label': tech,
                'x': np.cos(2 * np.pi * i / len(tech_stack)),
                'y': np.sin(2 * np.pi * i / len(tech_stack)),
                'size': 20 + len(tech) * 2,
                'color': self.colors['accent']
            })
        
        # Add some sample dependencies between technologies
        tech_dependencies = {
            'React': ['TypeScript', 'JavaScript', 'HTML', 'CSS'],
            'TypeScript': ['JavaScript'],
            'Node.js': ['JavaScript'],
            'Express': ['Node.js'],
            'MongoDB': ['Node.js'],
            'PostgreSQL': ['SQL'],
            'Python': ['SQL'],
            'Flask': ['Python'],
            'Django': ['Python']
        }
        
        # Create edges based on dependencies
        for tech in tech_stack:
            deps = tech_dependencies.get(tech, [])
            for dep in deps:
                if dep in tech_stack:
                    edges.append({'source': tech, 'target': dep})
        
        # Create Plotly network graph
        edge_x = []
        edge_y = []
        edge_info = []
        
        node_dict = {node['id']: node for node in nodes}
        
        for edge in edges:
            source = node_dict.get(edge['source'])
            target = node_dict.get(edge['target'])
            if source and target:
                edge_x.extend([source['x'], target['x'], None])
                edge_y.extend([source['y'], target['y'], None])
                edge_info.append(f"{edge['source']} → {edge['target']}")
        
        # Create edge traces
        edge_trace = go.Scatter(
            x=edge_x, y=edge_y,
            line=dict(width=2, color='#CBD5E1'),
            hoverinfo='none',
            mode='lines'
        )
        
        # Create node traces
        node_x = [node['x'] for node in nodes]
        node_y = [node['y'] for node in nodes]
        node_text = [node['label'] for node in nodes]
        node_sizes = [node['size'] for node in nodes]
        
        node_trace = go.Scatter(
            x=node_x, y=node_y,
            mode='markers+text',
            text=node_text,
            textposition="middle center",
            textfont=dict(color='white', size=10, family='Arial'),
            marker=dict(
                size=node_sizes,
                color=self.colors['accent'],
                line=dict(width=2, color='white'),
                opacity=0.8
            ),
            hovertemplate='<b>%{text}</b><br>Technology Component<extra></extra>'
        )
        
        fig = go.Figure(data=[edge_trace, node_trace])
        
        fig.update_layout(
            title=dict(
                text="Technology Stack Dependencies",
                x=0.5,
                font=dict(size=18, family="Arial", color=self.colors['text'])
            ),
            showlegend=False,
            hovermode='closest',
            margin=dict(b=40, l=40, r=40, t=80),
            annotations=[
                dict(
                    text="Interactive network showing relationships between technologies",
                    showarrow=False,
                    xref="paper", yref="paper",
                    x=0.5, xanchor="center",
                    y=-0.1, yanchor="bottom",
                    font=dict(color=self.colors['text'], size=12)
                )
            ],
            xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            height=500
        )
        
        return fig
    
    def create_animated_donut_chart(self, tech_stack: List[str], title: str = "Technology Stack Distribution") -> go.Figure:
        """Create animated donut chart with smooth transitions for tech stack visualization."""
        if not tech_stack:
            return self._empty_chart("No technology stack data available")
        
        # Create data for tech stack with simulated usage percentages
        np.random.seed(42)
        percentages = np.random.dirichlet(np.ones(len(tech_stack)) * 2) * 100
        
        # Sort by percentage for better visualization
        tech_data = list(zip(tech_stack, percentages))
        tech_data.sort(key=lambda x: x[1], reverse=True)
        tech_stack_sorted, percentages_sorted = zip(*tech_data)
        
        # Create color palette for technologies
        colors_list = []
        for i, tech in enumerate(tech_stack_sorted):
            if i < len(self.colors):
                colors_list.append(list(self.colors.values())[i % len(self.colors)])
            else:
                colors_list.append(f'hsl({(i * 360) // len(tech_stack_sorted)}, 70%, 60%)')
        
        fig = go.Figure(data=[go.Pie(
            labels=tech_stack_sorted,
            values=percentages_sorted,
            hole=0.5,  # Donut chart
            marker=dict(
                colors=colors_list,
                line=dict(color='white', width=3)
            ),
            textinfo='label+percent',
            textposition='outside',
            textfont=dict(size=12, color=self.colors['text']),
            hovertemplate='<b>%{label}</b><br>Usage: %{value:.1f}%<br>Estimated LOC: %{customdata}<extra></extra>',
            customdata=[f'{int(p * 50)}' for p in percentages_sorted],  # Simulated lines of code
            rotation=45  # Start rotation for better layout
        )])
        
        # Add center text
        fig.add_annotation(
            text=f"<b>{len(tech_stack)}</b><br>Technologies",
            x=0.5, y=0.5,
            font=dict(size=16, color=self.colors['text']),
            showarrow=False
        )
        
        fig.update_layout(
            title=dict(
                text=title,
                x=0.5,
                font=dict(size=18, family="Arial", color=self.colors['text'])
            ),
            font=dict(color=self.colors['text']),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            showlegend=True,
            legend=dict(
                orientation="v",
                yanchor="middle",
                y=0.5,
                xanchor="left",
                x=1.01
            ),
            margin=dict(t=60, b=60, l=60, r=120),
            height=500
        )
        
        return fig
    
    def show_timeline_chart(self, history: List[Dict[str, Any]]) -> go.Figure:
        """Show timeline chart for analysis history."""
        if not history:
            return self._empty_chart("No analysis history available")
        
        # Convert to DataFrame for easier manipulation
        df = pd.DataFrame(history)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        
        fig = go.Figure()
        
        # Add health score trend
        fig.add_trace(go.Scatter(
            x=df['timestamp'],
            y=df['health_score'],
            mode='lines+markers',
            name='Health Score',
            line=dict(color=self.colors['primary'], width=3),
            marker=dict(size=8, color=self.colors['primary']),
            hovertemplate='<b>%{y}</b> Health Score<br>%{x}<extra></extra>'
        ))
        
        # Add issue count trend
        fig.add_trace(go.Scatter(
            x=df['timestamp'],
            y=df['total_issues'],
            mode='lines+markers',
            name='Total Issues',
            yaxis='y2',
            line=dict(color=self.colors['warning'], width=3),
            marker=dict(size=8, color=self.colors['warning']),
            hovertemplate='<b>%{y}</b> Total Issues<br>%{x}<extra></extra>'
        ))
        
        fig.update_layout(
            title=dict(
                text="Project Analysis History Timeline",
                x=0.5,
                font=dict(size=18, family="Arial", color=self.colors['text'])
            ),
            xaxis_title="Date",
            yaxis=dict(
                title="Health Score",
                side="left",
                range=[0, 100]
            ),
            yaxis2=dict(
                title="Issue Count",
                side="right",
                overlaying="y"
            ),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            height=400,
            hovermode='x unified',
            margin=dict(t=60, b=60, l=60, r=60)
        )
        
        return fig
    
    def add_chart_export_buttons(self, fig: go.Figure, chart_name: str, key_suffix: str = "") -> None:
        """Add export buttons for charts with download functionality."""
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button(f"📥 PNG", key=f"png_{chart_name}_{key_suffix}"):
                img_bytes = fig.to_image(format="png", width=1200, height=800)
                st.download_button(
                    label="Download PNG",
                    data=img_bytes,
                    file_name=f"{chart_name}.png",
                    mime="image/png"
                )
        
        with col2:
            if st.button(f"📊 SVG", key=f"svg_{chart_name}_{key_suffix}"):
                img_bytes = fig.to_image(format="svg")
                st.download_button(
                    label="Download SVG",
                    data=img_bytes,
                    file_name=f"{chart_name}.svg",
                    mime="image/svg+xml"
                )
        
        with col3:
            if st.button(f"📈 HTML", key=f"html_{chart_name}_{key_suffix}"):
                html_str = fig.to_html(include_plotlyjs='cdn')
                st.download_button(
                    label="Download HTML",
                    data=html_str,
                    file_name=f"{chart_name}.html",
                    mime="text/html"
                )
    
    def _empty_chart(self, message: str) -> go.Figure:
        """Create an empty chart with a message."""
        fig = go.Figure()
        fig.add_annotation(
            text=message,
            x=0.5, y=0.5,
            showarrow=False,
            font=dict(size=16, color=self.colors['text'])
        )
        fig.update_layout(
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            height=300,
            xaxis=dict(visible=False),
            yaxis=dict(visible=False)
        )
        return fig