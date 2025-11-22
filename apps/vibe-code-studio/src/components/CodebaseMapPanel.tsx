import React, { useCallback,useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  Filter,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Sliders,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import styled from 'styled-components';

import type { InternalDependency } from '../services/CodebaseAnalyzer';
import type { DependencyGraph, GraphLink,GraphNode } from '../services/DependencyGraphService';
import { DependencyGraphService } from '../services/DependencyGraphService';
import { vibeTheme } from '../styles/theme';

const PanelContainer = styled.div<{ fullscreen?: boolean }>`
  display: flex;
  flex-direction: column;
  height: ${props => props.fullscreen ? '100vh' : '100%'};
  width: ${props => props.fullscreen ? '100vw' : '100%'};
  background: ${vibeTheme.colors.primary};
  color: ${vibeTheme.colors.text};
  position: ${props => props.fullscreen ? 'fixed' : 'relative'};
  top: ${props => props.fullscreen ? '0' : 'auto'};
  left: ${props => props.fullscreen ? '0' : 'auto'};
  z-index: ${props => props.fullscreen ? '9999' : 'auto'};
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  background: ${vibeTheme.colors.secondary};
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
`;

const Title = styled.h3`
  margin: 0;
  font-size: ${vibeTheme.typography.fontSize.base};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.xs};
`;

const Actions = styled.div`
  display: flex;
  gap: ${vibeTheme.spacing.xs};
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  color: ${vibeTheme.colors.textSecondary};
  cursor: pointer;
  padding: ${vibeTheme.spacing.xs};
  border-radius: ${vibeTheme.borderRadius.small};
  transition: all ${vibeTheme.animation.duration.fast} ease;

  &:hover {
    background: rgba(139, 92, 246, 0.1);
    color: ${vibeTheme.colors.text};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.md};
  padding: ${vibeTheme.spacing.md};
  background: ${vibeTheme.colors.secondary};
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};
`;

const FilterLabel = styled.label`
  font-size: ${vibeTheme.typography.fontSize.sm};
  color: ${vibeTheme.colors.textSecondary};
`;

const FilterSelect = styled.select`
  background: ${vibeTheme.colors.primary};
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: ${vibeTheme.borderRadius.small};
  color: ${vibeTheme.colors.text};
  padding: 4px 8px;
  font-size: ${vibeTheme.typography.fontSize.sm};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${vibeTheme.colors.purple};
  }
`;

const SearchInput = styled.input`
  background: ${vibeTheme.colors.primary};
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: ${vibeTheme.borderRadius.small};
  color: ${vibeTheme.colors.text};
  padding: 4px 8px;
  font-size: ${vibeTheme.typography.fontSize.sm};
  flex: 1;
  max-width: 300px;

  &:focus {
    outline: none;
    border-color: ${vibeTheme.colors.purple};
  }

  &::placeholder {
    color: ${vibeTheme.colors.textSecondary};
  }
`;

const GraphContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const SVGCanvas = styled.svg`
  width: 100%;
  height: 100%;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

const Stats = styled.div`
  position: absolute;
  bottom: ${vibeTheme.spacing.md};
  right: ${vibeTheme.spacing.md};
  background: rgba(30, 30, 30, 0.9);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: ${vibeTheme.borderRadius.medium};
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  font-size: ${vibeTheme.typography.fontSize.xs};
  color: ${vibeTheme.colors.textSecondary};
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${vibeTheme.spacing.md};
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const StatLabel = styled.span`
  color: ${vibeTheme.colors.textSecondary};
`;

const StatValue = styled.span`
  color: ${vibeTheme.colors.text};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
`;

interface CodebaseMapPanelProps {
  dependencies: InternalDependency[];
  onNodeClick?: (nodeId: string) => void;
  onClose?: () => void;
}

export const CodebaseMapPanel: React.FC<CodebaseMapPanelProps> = ({
  dependencies,
  onNodeClick,
  onClose
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphService] = useState(() => new DependencyGraphService());
  const [filteredGraph, setFilteredGraph] = useState<DependencyGraph>({ nodes: [], links: [] });
  const [fullscreen, setFullscreen] = useState(false);
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [minDegreeFilter, setMinDegreeFilter] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Build initial graph
  useEffect(() => {
    graphService.buildGraph(dependencies);
    setFilteredGraph(graphService.getGraph());
  }, [dependencies, graphService]);

  // Apply filters
  useEffect(() => {
    let graph = graphService.getGraph();

    // File type filter
    if (fileTypeFilter !== 'all') {
      graph = graphService.filterByFileType([fileTypeFilter]);
    }

    // Minimum degree filter
    if (minDegreeFilter > 0) {
      graph = graphService.filterByMinDegree(minDegreeFilter);
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const filteredNodes = graph.nodes.filter(node =>
        node.id.toLowerCase().includes(searchLower) ||
        node.label.toLowerCase().includes(searchLower)
      );
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      const filteredLinks = graph.links.filter(link =>
        nodeIds.has(link.source) && nodeIds.has(link.target)
      );
      graph = { nodes: filteredNodes, links: filteredLinks };
    }

    setFilteredGraph(graph);
  }, [fileTypeFilter, minDegreeFilter, searchTerm, graphService]);

  // D3 visualization
  useEffect(() => {
    if (!svgRef.current || filteredGraph.nodes.length === 0) {return;}

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous
    svg.selectAll('*').remove();

    // Create container for zoom
    const g = svg.append('g');

    // Color scale by file type
    const colorScale = d3.scaleOrdinal<string>()
      .domain(['tsx', 'ts', 'jsx', 'js', 'css', 'json'])
      .range(['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6b7280']);

    // Node size scale by importance
    const sizeScale = d3.scaleLinear()
      .domain([0, 1])
      .range([4, 12]);

    // Force simulation
    const simulation = d3.forceSimulation(filteredGraph.nodes as any)
      .force('link', d3.forceLink(filteredGraph.links)
        .id((d: any) => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(20));

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(filteredGraph.links)
      .join('line')
      .attr('stroke', 'rgba(139, 92, 246, 0.3)')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6);

    // Nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(filteredGraph.nodes)
      .join('circle')
      .attr('r', d => sizeScale(d.importance))
      .attr('fill', d => colorScale(d.type))
      .attr('stroke', d => selectedNode === d.id ? '#fff' : 'none')
      .attr('stroke-width', 3)
      .style('cursor', 'pointer')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Labels
    const label = g.append('g')
      .selectAll('text')
      .data(filteredGraph.nodes)
      .join('text')
      .text(d => d.label)
      .attr('font-size', 10)
      .attr('dx', 15)
      .attr('dy', 4)
      .attr('fill', vibeTheme.colors.textSecondary)
      .style('pointer-events', 'none');

    // Node click
    node.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNode(d.id);
      onNodeClick?.(d.id);

      // Highlight connected nodes
      const connectedNodes = new Set([
        d.id,
        ...graphService.getNodeDependencies(d.id),
        ...graphService.getNodeDependents(d.id)
      ]);

      node.attr('opacity', n => connectedNodes.has(n.id) ? 1 : 0.3);
      link.attr('opacity', l =>
        (l.source as any).id === d.id || (l.target as any).id === d.id ? 1 : 0.1
      );
      label.attr('opacity', n => connectedNodes.has(n.id) ? 1 : 0.3);
    });

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) {simulation.alphaTarget(0.3).restart();}
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) {simulation.alphaTarget(0);}
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [filteredGraph, selectedNode, graphService, onNodeClick]);

  // Get unique file types for filter
  const fileTypes = Array.from(new Set(graphService.getGraph().nodes.map(n => n.type)));

  // Calculate stats
  const stats = {
    nodes: filteredGraph.nodes.length,
    links: filteredGraph.links.length,
    density: (graphService.getGraphDensity() * 100).toFixed(1),
    hubs: graphService.getHubNodes(3).length
  };

  return (
    <PanelContainer fullscreen={fullscreen}>
      <PanelHeader>
        <Title>
          <Sliders size={18} />
          Codebase Map
        </Title>
        <Actions>
          <ActionButton onClick={() => setFullscreen(!fullscreen)} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            {fullscreen ? <Minimize2 /> : <Maximize2 />}
          </ActionButton>
          <ActionButton onClick={() => setSelectedNode(null)} title="Reset view">
            <RefreshCw />
          </ActionButton>
          {onClose && (
            <ActionButton onClick={onClose} title="Close">
              <X />
            </ActionButton>
          )}
        </Actions>
      </PanelHeader>

      <Controls>
        <FilterGroup>
          <Filter size={14} />
          <FilterLabel>Type:</FilterLabel>
          <FilterSelect value={fileTypeFilter} onChange={(e) => setFileTypeFilter(e.target.value)}>
            <option value="all">All</option>
            {fileTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </FilterSelect>
        </FilterGroup>

        <FilterGroup>
          <FilterLabel>Min Connections:</FilterLabel>
          <FilterSelect value={minDegreeFilter} onChange={(e) => setMinDegreeFilter(Number(e.target.value))}>
            <option value="0">All</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="5">5+</option>
          </FilterSelect>
        </FilterGroup>

        <FilterGroup style={{ flex: 1 }}>
          <Search size={14} />
          <SearchInput
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </FilterGroup>
      </Controls>

      <GraphContainer>
        <SVGCanvas ref={svgRef} />

        <Stats>
          <StatRow>
            <StatLabel>Files:</StatLabel>
            <StatValue>{stats.nodes}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Dependencies:</StatLabel>
            <StatValue>{stats.links}</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Density:</StatLabel>
            <StatValue>{stats.density}%</StatValue>
          </StatRow>
          <StatRow>
            <StatLabel>Hub Files:</StatLabel>
            <StatValue>{stats.hubs}</StatValue>
          </StatRow>
        </Stats>
      </GraphContainer>
    </PanelContainer>
  );
};
