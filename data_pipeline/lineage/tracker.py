"""
Data Lineage Tracking System for Pipeline
Tracks data flow, transformations, and dependencies
"""

import json
import hashlib
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Set
from dataclasses import dataclass, field, asdict
import networkx as nx
import sqlite3


@dataclass
class DataAsset:
    """Represents a data asset in the lineage system."""
    id: str
    name: str
    type: str  # table, file, api, stream
    location: str
    schema: Dict[str, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    checksum: Optional[str] = None
    row_count: Optional[int] = None
    size_bytes: Optional[int] = None


@dataclass
class Transformation:
    """Represents a transformation applied to data."""
    id: str
    name: str
    type: str  # filter, aggregate, join, clean, engineer
    description: str
    input_columns: List[str] = field(default_factory=list)
    output_columns: List[str] = field(default_factory=list)
    parameters: Dict[str, Any] = field(default_factory=dict)
    sql_query: Optional[str] = None
    code_snippet: Optional[str] = None


@dataclass
class LineageEdge:
    """Represents a relationship between data assets."""
    id: str
    source_id: str
    target_id: str
    transformation_id: Optional[str] = None
    pipeline_id: str = ""
    execution_id: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)


class DataLineageTracker:
    """Tracks data lineage throughout pipeline execution."""

    def __init__(self, db_path: str = "lineage.db"):
        self.db_path = db_path
        self.graph = nx.DiGraph()
        self.current_execution_id = None
        self.current_pipeline_id = None
        self._init_database()

    def _init_database(self):
        """Initialize SQLite database for lineage storage."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Create tables
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS data_assets (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                location TEXT NOT NULL,
                schema TEXT,
                metadata TEXT,
                created_at TIMESTAMP,
                updated_at TIMESTAMP,
                checksum TEXT,
                row_count INTEGER,
                size_bytes INTEGER
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS transformations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT,
                input_columns TEXT,
                output_columns TEXT,
                parameters TEXT,
                sql_query TEXT,
                code_snippet TEXT
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS lineage_edges (
                id TEXT PRIMARY KEY,
                source_id TEXT NOT NULL,
                target_id TEXT NOT NULL,
                transformation_id TEXT,
                pipeline_id TEXT,
                execution_id TEXT,
                created_at TIMESTAMP,
                metadata TEXT,
                FOREIGN KEY (source_id) REFERENCES data_assets(id),
                FOREIGN KEY (target_id) REFERENCES data_assets(id),
                FOREIGN KEY (transformation_id) REFERENCES transformations(id)
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS pipeline_executions (
                execution_id TEXT PRIMARY KEY,
                pipeline_id TEXT NOT NULL,
                pipeline_name TEXT,
                start_time TIMESTAMP,
                end_time TIMESTAMP,
                status TEXT,
                input_assets TEXT,
                output_assets TEXT,
                metrics TEXT,
                errors TEXT
            )
        ''')

        # Create indexes
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_edges_source ON lineage_edges(source_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_edges_target ON lineage_edges(target_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_edges_pipeline ON lineage_edges(pipeline_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_edges_execution ON lineage_edges(execution_id)')

        conn.commit()
        conn.close()

    def start_execution(self, pipeline_id: str, pipeline_name: str) -> str:
        """Start tracking a new pipeline execution."""
        self.current_execution_id = str(uuid.uuid4())
        self.current_pipeline_id = pipeline_id

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO pipeline_executions
            (execution_id, pipeline_id, pipeline_name, start_time, status)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            self.current_execution_id,
            pipeline_id,
            pipeline_name,
            datetime.now(),
            'running'
        ))

        conn.commit()
        conn.close()

        return self.current_execution_id

    def end_execution(self, status: str = 'success', metrics: Dict[str, Any] = None, errors: List[str] = None):
        """End tracking for current pipeline execution."""
        if not self.current_execution_id:
            return

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Get input and output assets for this execution
        cursor.execute('''
            SELECT DISTINCT source_id FROM lineage_edges
            WHERE execution_id = ?
            AND source_id NOT IN (
                SELECT target_id FROM lineage_edges WHERE execution_id = ?
            )
        ''', (self.current_execution_id, self.current_execution_id))
        input_assets = [row[0] for row in cursor.fetchall()]

        cursor.execute('''
            SELECT DISTINCT target_id FROM lineage_edges
            WHERE execution_id = ?
            AND target_id NOT IN (
                SELECT source_id FROM lineage_edges WHERE execution_id = ?
            )
        ''', (self.current_execution_id, self.current_execution_id))
        output_assets = [row[0] for row in cursor.fetchall()]

        # Update execution record
        cursor.execute('''
            UPDATE pipeline_executions
            SET end_time = ?, status = ?, input_assets = ?, output_assets = ?, metrics = ?, errors = ?
            WHERE execution_id = ?
        ''', (
            datetime.now(),
            status,
            json.dumps(input_assets),
            json.dumps(output_assets),
            json.dumps(metrics) if metrics else None,
            json.dumps(errors) if errors else None,
            self.current_execution_id
        ))

        conn.commit()
        conn.close()

        self.current_execution_id = None
        self.current_pipeline_id = None

    def register_data_asset(self, asset: DataAsset) -> str:
        """Register a data asset in the lineage system."""
        # Calculate checksum if not provided
        if not asset.checksum and asset.location:
            asset.checksum = self._calculate_checksum(asset)

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT OR REPLACE INTO data_assets
            (id, name, type, location, schema, metadata, created_at, updated_at, checksum, row_count, size_bytes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            asset.id,
            asset.name,
            asset.type,
            asset.location,
            json.dumps(asset.schema),
            json.dumps(asset.metadata),
            asset.created_at,
            asset.updated_at,
            asset.checksum,
            asset.row_count,
            asset.size_bytes
        ))

        conn.commit()
        conn.close()

        # Add to graph
        self.graph.add_node(asset.id, **asdict(asset))

        return asset.id

    def register_transformation(self, transformation: Transformation) -> str:
        """Register a transformation in the lineage system."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT OR REPLACE INTO transformations
            (id, name, type, description, input_columns, output_columns, parameters, sql_query, code_snippet)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            transformation.id,
            transformation.name,
            transformation.type,
            transformation.description,
            json.dumps(transformation.input_columns),
            json.dumps(transformation.output_columns),
            json.dumps(transformation.parameters),
            transformation.sql_query,
            transformation.code_snippet
        ))

        conn.commit()
        conn.close()

        return transformation.id

    def add_lineage(
        self,
        source_asset: DataAsset,
        target_asset: DataAsset,
        transformation: Optional[Transformation] = None
    ) -> str:
        """Add a lineage relationship between assets."""
        # Register assets if not already registered
        self.register_data_asset(source_asset)
        self.register_data_asset(target_asset)

        # Register transformation if provided
        transformation_id = None
        if transformation:
            transformation_id = self.register_transformation(transformation)

        # Create edge
        edge = LineageEdge(
            id=str(uuid.uuid4()),
            source_id=source_asset.id,
            target_id=target_asset.id,
            transformation_id=transformation_id,
            pipeline_id=self.current_pipeline_id or "",
            execution_id=self.current_execution_id or "",
            created_at=datetime.now()
        )

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO lineage_edges
            (id, source_id, target_id, transformation_id, pipeline_id, execution_id, created_at, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            edge.id,
            edge.source_id,
            edge.target_id,
            edge.transformation_id,
            edge.pipeline_id,
            edge.execution_id,
            edge.created_at,
            json.dumps(edge.metadata)
        ))

        conn.commit()
        conn.close()

        # Add to graph
        self.graph.add_edge(
            source_asset.id,
            target_asset.id,
            transformation_id=transformation_id,
            edge_id=edge.id
        )

        return edge.id

    def get_upstream_lineage(self, asset_id: str, max_depth: int = -1) -> Dict[str, Any]:
        """Get all upstream dependencies of an asset."""
        if asset_id not in self.graph:
            self._load_asset_lineage(asset_id)

        upstream = {}
        if max_depth == -1:
            ancestors = nx.ancestors(self.graph, asset_id)
        else:
            ancestors = set()
            current_level = {asset_id}
            for _ in range(max_depth):
                next_level = set()
                for node in current_level:
                    predecessors = self.graph.predecessors(node)
                    next_level.update(predecessors)
                    ancestors.update(predecessors)
                current_level = next_level
                if not current_level:
                    break

        for ancestor in ancestors:
            upstream[ancestor] = self.graph.nodes[ancestor]

        return upstream

    def get_downstream_lineage(self, asset_id: str, max_depth: int = -1) -> Dict[str, Any]:
        """Get all downstream dependencies of an asset."""
        if asset_id not in self.graph:
            self._load_asset_lineage(asset_id)

        downstream = {}
        if max_depth == -1:
            descendants = nx.descendants(self.graph, asset_id)
        else:
            descendants = set()
            current_level = {asset_id}
            for _ in range(max_depth):
                next_level = set()
                for node in current_level:
                    successors = self.graph.successors(node)
                    next_level.update(successors)
                    descendants.update(successors)
                current_level = next_level
                if not current_level:
                    break

        for descendant in descendants:
            downstream[descendant] = self.graph.nodes[descendant]

        return downstream

    def get_impact_analysis(self, asset_id: str) -> Dict[str, Any]:
        """Analyze the impact of changes to an asset."""
        downstream = self.get_downstream_lineage(asset_id)

        impact = {
            'asset_id': asset_id,
            'directly_affected': list(self.graph.successors(asset_id)),
            'total_affected': len(downstream),
            'affected_pipelines': set(),
            'affected_assets_by_type': {}
        }

        # Analyze affected assets
        for descendant_id, descendant_data in downstream.items():
            asset_type = descendant_data.get('type', 'unknown')
            if asset_type not in impact['affected_assets_by_type']:
                impact['affected_assets_by_type'][asset_type] = []
            impact['affected_assets_by_type'][asset_type].append(descendant_id)

        # Get affected pipelines
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            SELECT DISTINCT pipeline_id FROM lineage_edges
            WHERE source_id = ? OR target_id IN (
                WITH RECURSIVE descendants(id) AS (
                    SELECT target_id FROM lineage_edges WHERE source_id = ?
                    UNION ALL
                    SELECT e.target_id
                    FROM lineage_edges e
                    JOIN descendants d ON e.source_id = d.id
                )
                SELECT id FROM descendants
            )
        ''', (asset_id, asset_id))

        impact['affected_pipelines'] = [row[0] for row in cursor.fetchall()]
        conn.close()

        return impact

    def get_data_provenance(self, asset_id: str) -> Dict[str, Any]:
        """Get complete provenance information for a data asset."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Get asset details
        cursor.execute('SELECT * FROM data_assets WHERE id = ?', (asset_id,))
        asset_row = cursor.fetchone()

        if not asset_row:
            return {}

        # Get all transformations applied
        cursor.execute('''
            SELECT t.* FROM transformations t
            JOIN lineage_edges e ON t.id = e.transformation_id
            WHERE e.target_id = ?
            ORDER BY e.created_at
        ''', (asset_id,))

        transformations = []
        for row in cursor.fetchall():
            transformations.append({
                'id': row[0],
                'name': row[1],
                'type': row[2],
                'description': row[3],
                'input_columns': json.loads(row[4]) if row[4] else [],
                'output_columns': json.loads(row[5]) if row[5] else [],
                'parameters': json.loads(row[6]) if row[6] else {}
            })

        # Get execution history
        cursor.execute('''
            SELECT DISTINCT execution_id, created_at
            FROM lineage_edges
            WHERE target_id = ?
            ORDER BY created_at DESC
            LIMIT 10
        ''', (asset_id,))

        executions = [{'execution_id': row[0], 'created_at': row[1]} for row in cursor.fetchall()]

        conn.close()

        provenance = {
            'asset': {
                'id': asset_row[0],
                'name': asset_row[1],
                'type': asset_row[2],
                'location': asset_row[3],
                'schema': json.loads(asset_row[4]) if asset_row[4] else {},
                'metadata': json.loads(asset_row[5]) if asset_row[5] else {},
                'created_at': asset_row[6],
                'updated_at': asset_row[7],
                'checksum': asset_row[8],
                'row_count': asset_row[9],
                'size_bytes': asset_row[10]
            },
            'transformations': transformations,
            'executions': executions,
            'upstream_count': len(self.get_upstream_lineage(asset_id)),
            'downstream_count': len(self.get_downstream_lineage(asset_id))
        }

        return provenance

    def _calculate_checksum(self, asset: DataAsset) -> str:
        """Calculate checksum for a data asset."""
        # Create a hash of key asset properties
        hash_input = f"{asset.name}:{asset.type}:{asset.location}:{json.dumps(asset.schema, sort_keys=True)}"
        return hashlib.sha256(hash_input.encode()).hexdigest()

    def _load_asset_lineage(self, asset_id: str):
        """Load lineage for an asset from database to graph."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Load asset
        cursor.execute('SELECT * FROM data_assets WHERE id = ?', (asset_id,))
        asset_row = cursor.fetchone()

        if asset_row:
            self.graph.add_node(asset_id, **{
                'id': asset_row[0],
                'name': asset_row[1],
                'type': asset_row[2],
                'location': asset_row[3]
            })

        # Load edges
        cursor.execute('''
            SELECT source_id, target_id, transformation_id, id
            FROM lineage_edges
            WHERE source_id = ? OR target_id = ?
        ''', (asset_id, asset_id))

        for row in cursor.fetchall():
            self.graph.add_edge(
                row[0], row[1],
                transformation_id=row[2],
                edge_id=row[3]
            )

        conn.close()

    def export_lineage_graph(self, format: str = 'json') -> str:
        """Export lineage graph in various formats."""
        if format == 'json':
            return json.dumps(nx.node_link_data(self.graph), indent=2, default=str)
        elif format == 'graphml':
            from io import StringIO
            output = StringIO()
            nx.write_graphml(self.graph, output)
            return output.getvalue()
        elif format == 'dot':
            return nx.drawing.nx_pydot.to_pydot(self.graph).to_string()
        else:
            raise ValueError(f"Unsupported format: {format}")

    def visualize_lineage(self, asset_id: Optional[str] = None, output_file: str = "lineage.html"):
        """Create an interactive HTML visualization of the lineage graph."""
        import json

        # Prepare data for visualization
        if asset_id:
            # Get subgraph for specific asset
            upstream = self.get_upstream_lineage(asset_id)
            downstream = self.get_downstream_lineage(asset_id)
            nodes = list(upstream.keys()) + [asset_id] + list(downstream.keys())
            subgraph = self.graph.subgraph(nodes)
        else:
            subgraph = self.graph

        # Convert to JSON for D3.js
        graph_data = nx.node_link_data(subgraph)

        # HTML template with D3.js visualization
        html_template = '''
<!DOCTYPE html>
<html>
<head>
    <title>Data Lineage Visualization</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body {{ margin: 0; padding: 20px; font-family: Arial, sans-serif; }}
        #graph {{ border: 1px solid #ccc; }}
        .node {{ stroke: #fff; stroke-width: 2px; cursor: pointer; }}
        .link {{ stroke: #999; stroke-opacity: 0.6; marker-end: url(#arrowhead); }}
        .node-label {{ font-size: 12px; pointer-events: none; }}
        .tooltip {{ position: absolute; padding: 10px; background: rgba(0,0,0,0.8);
                  color: white; border-radius: 5px; font-size: 12px; }}
    </style>
</head>
<body>
    <h1>Data Lineage Visualization</h1>
    <svg id="graph" width="1200" height="800"></svg>
    <script>
        const graphData = {graph_data};

        // D3.js visualization code
        const svg = d3.select("#graph");
        const width = +svg.attr("width");
        const height = +svg.attr("height");

        // Add arrow marker
        svg.append("defs").append("marker")
            .attr("id", "arrowhead")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 20)
            .attr("refY", 0)
            .attr("markerWidth", 10)
            .attr("markerHeight", 10)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5")
            .attr("fill", "#999");

        const simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2));

        const link = svg.append("g")
            .selectAll("line")
            .data(graphData.links)
            .enter().append("line")
            .attr("class", "link");

        const node = svg.append("g")
            .selectAll("circle")
            .data(graphData.nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", 10)
            .attr("fill", d => d.type === "table" ? "#4CAF50" :
                              d.type === "file" ? "#2196F3" :
                              d.type === "api" ? "#FF9800" : "#9C27B0")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        const labels = svg.append("g")
            .selectAll("text")
            .data(graphData.nodes)
            .enter().append("text")
            .attr("class", "node-label")
            .attr("dx", 12)
            .attr("dy", 4)
            .text(d => d.name || d.id);

        simulation.nodes(graphData.nodes).on("tick", ticked);
        simulation.force("link").links(graphData.links);

        function ticked() {{
            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("cx", d => d.x)
                .attr("cy", d => d.y);

            labels.attr("x", d => d.x)
                  .attr("y", d => d.y);
        }}

        function dragstarted(event, d) {{
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }}

        function dragged(event, d) {{
            d.fx = event.x;
            d.fy = event.y;
        }}

        function dragended(event, d) {{
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }}
    </script>
</body>
</html>
        '''

        html_content = html_template.format(graph_data=json.dumps(graph_data))

        with open(output_file, 'w') as f:
            f.write(html_content)

        return output_file