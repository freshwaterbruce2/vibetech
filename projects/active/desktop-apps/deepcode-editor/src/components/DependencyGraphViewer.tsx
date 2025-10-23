import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Network, AlertCircle, Filter, Maximize2 } from 'lucide-react';
import styled from 'styled-components';
import { ForceGraph2D } from 'react-force-graph';

import { DependencyGraph } from '../types/multifile';
import { vibeTheme } from '../styles/theme';

interface GraphNode {
  id: string;
  name: string;
  degree: number;
  isCircular: boolean;
  isHub: boolean;
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface DependencyGraphViewerProps {
  graph: DependencyGraph;
  circularDeps: string[];
  onNodeSelect?: (nodeId: string) => void;
  selectedNode?: string;
}

export const DependencyGraphViewer: React.FC<DependencyGraphViewerProps> = ({
  graph,
  circularDeps,
  onNodeSelect,
  selectedNode,
}) => {
  const graphRef = useRef<any>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [showHubsOnly, setShowHubsOnly] = useState(false);
  const [showCircularOnly, setShowCircularOnly] = useState(false);
  const [highlightNodes, setHighlightNodes] = useState(new Set<string>());
  const [highlightLinks, setHighlightLinks] = useState(new Set<string>());

  // Build graph data
  useEffect(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Map<string, GraphNode>();

    // Create nodes
    for (const [path, node] of graph.nodes.entries()) {
      const degree = node.imports.length + node.dependents.length;
      const isCircular = circularDeps.includes(path);
      const isHub = degree >= 3;

      let color = '#60a5fa'; // Blue for normal
      if (isCircular) color = '#ef4444'; // Red for circular
      else if (isHub) color = '#8b5cf6'; // Purple for hubs

      const graphNode: GraphNode = {
        id: path,
        name: path.split('/').pop() || path,
        degree,
        isCircular,
        isHub,
        color,
      };

      nodeMap.set(path, graphNode);
      nodes.push(graphNode);

      // Create links
      node.imports.forEach((importPath) => {
        if (graph.nodes.has(importPath)) {
          links.push({ source: path, target: importPath });
        }
      });
    }

    setGraphData({ nodes, links });
  }, [graph, circularDeps]);

  // Filter nodes
  const filteredData = {
    nodes: graphData.nodes.filter((node) => {
      if (showHubsOnly && !node.isHub) return false;
      if (showCircularOnly && !node.isCircular) return false;
      return true;
    }),
    links: graphData.links.filter((link) => {
      const sourceExists = graphData.nodes.some(
        (n) => n.id === link.source && (!showHubsOnly || n.isHub) && (!showCircularOnly || n.isCircular)
      );
      const targetExists = graphData.nodes.some(
        (n) => n.id === link.target && (!showHubsOnly || n.isHub) && (!showCircularOnly || n.isCircular)
      );
      return sourceExists && targetExists;
    }),
  };

  const handleNodeClick = (node: any) => {
    if (onNodeSelect) {
      onNodeSelect(node.id);
    }

    // Highlight connected nodes
    const connectedNodes = new Set<string>([node.id]);
    const connectedLinks = new Set<string>();

    graphData.links.forEach((link) => {
      if (link.source === node.id) {
        connectedNodes.add(link.target);
        connectedLinks.add(`${link.source}-${link.target}`);
      }
      if (link.target === node.id) {
        connectedNodes.add(link.source);
        connectedLinks.add(`${link.source}-${link.target}`);
      }
    });

    setHighlightNodes(connectedNodes);
    setHighlightLinks(connectedLinks);
  };

  const handleBackgroundClick = () => {
    setHighlightNodes(new Set());
    setHighlightLinks(new Set());
  };

  const handleReset = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  };

  const hubCount = graphData.nodes.filter((n) => n.isHub).length;
  const circularCount = graphData.nodes.filter((n) => n.isCircular).length;

  return (
    <Container
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Header>
        <Title>
          <Network size={20} />
          Dependency Graph ({graphData.nodes.length} files, {graphData.links.length}{' '}
          dependencies)
        </Title>
        <Controls>
          <FilterButton
            onClick={() => setShowHubsOnly(!showHubsOnly)}
            $active={showHubsOnly}
          >
            <Filter size={16} />
            Hubs ({hubCount})
          </FilterButton>
          <FilterButton
            onClick={() => setShowCircularOnly(!showCircularOnly)}
            $active={showCircularOnly}
          >
            <AlertCircle size={16} />
            Circular ({circularCount})
          </FilterButton>
          <IconButton onClick={handleReset} title="Reset View">
            <Maximize2 size={18} />
          </IconButton>
        </Controls>
      </Header>

      <GraphContainer>
        <ForceGraph2D
          ref={graphRef}
          graphData={filteredData}
          nodeLabel="name"
          nodeColor={(node: any) => node.color}
          nodeRelSize={6}
          nodeVal={(node: any) => (node.isHub ? 15 : 8)}
          linkColor={(link: any) =>
            highlightLinks.has(`${link.source}-${link.target}`)
              ? 'rgba(139, 92, 246, 0.8)'
              : 'rgba(139, 92, 246, 0.3)'
          }
          linkWidth={(link: any) =>
            highlightLinks.has(`${link.source}-${link.target}`) ? 2 : 1
          }
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

            // Draw node
            const nodeRadius = node.isHub ? 6 : 4;
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color;
            ctx.fill();

            // Highlight selected
            if (selectedNode === node.id || highlightNodes.has(node.id)) {
              ctx.strokeStyle = '#fff';
              ctx.lineWidth = 2 / globalScale;
              ctx.stroke();
            }

            // Draw label
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#e5e7eb';
            ctx.fillText(label, node.x, node.y - nodeRadius - 8 / globalScale);
          }}
          onNodeClick={handleNodeClick}
          onBackgroundClick={handleBackgroundClick}
          backgroundColor="rgba(0, 0, 0, 0)"
          cooldownTicks={100}
          d3VelocityDecay={0.3}
        />
      </GraphContainer>

      <Legend>
        <LegendItem>
          <Circle $color="#60a5fa" />
          <span>
            Normal ({graphData.nodes.filter((n) => !n.isHub && !n.isCircular).length})
          </span>
        </LegendItem>
        <LegendItem>
          <Circle $color="#8b5cf6" />
          <span>Hub Nodes ({hubCount})</span>
        </LegendItem>
        <LegendItem>
          <Circle $color="#ef4444" />
          <span>Circular Deps ({circularCount})</span>
        </LegendItem>
      </Legend>

      {selectedNode && (
        <InfoPanel>
          <strong>{selectedNode.split('/').pop()}</strong>
          <InfoText>
            Degree: {graphData.nodes.find((n) => n.id === selectedNode)?.degree || 0}
          </InfoText>
          <InfoText>
            Connected: {highlightNodes.size - 1} nodes
          </InfoText>
        </InfoPanel>
      )}
    </Container>
  );
};

// Styled components
const Container = styled(motion.div)`
  background: ${vibeTheme.colors.secondary};
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  height: 700px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${vibeTheme.colors.text};
  font-size: 16px;
  font-weight: 600;
`;

const Controls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const IconButton = styled.button`
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.4);
  color: ${vibeTheme.colors.text};
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 0.3);
    transform: translateY(-1px);
  }
`;

const FilterButton = styled.button<{ $active: boolean }>`
  background: ${(props) =>
    props.$active ? 'rgba(139, 92, 246, 0.4)' : 'rgba(139, 92, 246, 0.2)'};
  border: 1px solid
    ${(props) =>
      props.$active ? 'rgba(139, 92, 246, 0.6)' : 'rgba(139, 92, 246, 0.4)'};
  color: ${vibeTheme.colors.text};
  padding: 8px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 0.3);
    transform: translateY(-1px);
  }
`;

const GraphContainer = styled.div`
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
`;

const Legend = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 12px;
  padding: 12px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 8px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${vibeTheme.colors.textSecondary};
  font-size: 13px;
`;

const Circle = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${(props) => props.$color};
`;

const InfoPanel = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  color: ${vibeTheme.colors.text};
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoText = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 12px;
`;
