/**
 * DependencyGraphService
 * Builds and analyzes dependency graphs for visual codebase maps
 */

import type { InternalDependency } from './CodebaseAnalyzer';

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  degree: number;
  importance: number;
  cluster?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'import' | 'require' | 'reference';
  usage: 'function' | 'class' | 'variable' | 'type' | 'module';
}

export interface DependencyGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface Cluster {
  name: string;
  nodes: string[];
  size: number;
}

export class DependencyGraphService {
  private graph: DependencyGraph = { nodes: [], links: [] };
  private adjacencyList: Map<string, Set<string>> = new Map();
  private reverseAdjacencyList: Map<string, Set<string>> = new Map();

  /**
   * Build graph from dependency data
   */
  buildGraph(dependencies: InternalDependency[]): void {
    this.graph = { nodes: [], links: [] };
    this.adjacencyList.clear();
    this.reverseAdjacencyList.clear();

    // Collect all unique files
    const files = new Set<string>();
    dependencies.forEach(dep => {
      files.add(dep.from);
      files.add(dep.to);
    });

    // Build adjacency lists
    dependencies.forEach(dep => {
      if (!this.adjacencyList.has(dep.from)) {
        this.adjacencyList.set(dep.from, new Set());
      }
      this.adjacencyList.get(dep.from)!.add(dep.to);

      if (!this.reverseAdjacencyList.has(dep.to)) {
        this.reverseAdjacencyList.set(dep.to, new Set());
      }
      this.reverseAdjacencyList.get(dep.to)!.add(dep.from);
    });

    // Calculate node degrees
    const nodeDegrees = new Map<string, number>();
    files.forEach(file => {
      const outDegree = this.adjacencyList.get(file)?.size || 0;
      const inDegree = this.reverseAdjacencyList.get(file)?.size || 0;
      nodeDegrees.set(file, outDegree + inDegree);
    });

    // Calculate max degree for normalization
    const maxDegree = Math.max(...Array.from(nodeDegrees.values()), 1);

    // Create nodes
    files.forEach(file => {
      const degree = nodeDegrees.get(file) || 0;
      const inDegree = this.reverseAdjacencyList.get(file)?.size || 0;

      this.graph.nodes.push({
        id: file,
        label: this.getFileName(file),
        type: this.getFileType(file),
        degree,
        importance: inDegree / maxDegree,
        cluster: this.getDirectoryName(file)
      });
    });

    // Create links
    dependencies.forEach(dep => {
      this.graph.links.push({
        source: dep.from,
        target: dep.to,
        type: dep.type,
        usage: dep.usage
      });
    });
  }

  /**
   * Get current graph
   */
  getGraph(): DependencyGraph {
    return this.graph;
  }

  /**
   * Get hub nodes (highly connected)
   */
  getHubNodes(minDegree: number = 3): GraphNode[] {
    return this.graph.nodes
      .filter(node => node.degree >= minDegree)
      .sort((a, b) => b.degree - a.degree);
  }

  /**
   * Get isolated nodes (no connections)
   */
  getIsolatedNodes(): GraphNode[] {
    return this.graph.nodes.filter(node => node.degree === 0);
  }

  /**
   * Calculate graph density (0-1)
   */
  getGraphDensity(): number {
    const n = this.graph.nodes.length;
    if (n <= 1) return 0;

    const maxEdges = n * (n - 1);
    const actualEdges = this.graph.links.length;

    return actualEdges / maxEdges;
  }

  /**
   * Group nodes by directory
   */
  getClusters(): Cluster[] {
    const clusters = new Map<string, Set<string>>();

    this.graph.nodes.forEach(node => {
      const dir = node.cluster || 'root';
      if (!clusters.has(dir)) {
        clusters.set(dir, new Set());
      }
      clusters.get(dir)!.add(node.id);
    });

    return Array.from(clusters.entries()).map(([name, nodes]) => ({
      name,
      nodes: Array.from(nodes),
      size: nodes.size
    }));
  }

  /**
   * Filter graph by file type
   */
  filterByFileType(types: string[]): DependencyGraph {
    const typeSet = new Set(types);
    const filteredNodes = this.graph.nodes.filter(node => typeSet.has(node.type));
    const nodeIds = new Set(filteredNodes.map(n => n.id));

    const filteredLinks = this.graph.links.filter(link =>
      nodeIds.has(link.source) && nodeIds.has(link.target)
    );

    return {
      nodes: filteredNodes,
      links: filteredLinks
    };
  }

  /**
   * Filter graph by directory
   */
  filterByDirectory(directory: string): DependencyGraph {
    const filteredNodes = this.graph.nodes.filter(node =>
      node.id.startsWith(directory)
    );
    const nodeIds = new Set(filteredNodes.map(n => n.id));

    const filteredLinks = this.graph.links.filter(link =>
      nodeIds.has(link.source) && nodeIds.has(link.target)
    );

    return {
      nodes: filteredNodes,
      links: filteredLinks
    };
  }

  /**
   * Filter graph by minimum degree
   */
  filterByMinDegree(minDegree: number): DependencyGraph {
    const filteredNodes = this.graph.nodes.filter(node => node.degree >= minDegree);
    const nodeIds = new Set(filteredNodes.map(n => n.id));

    const filteredLinks = this.graph.links.filter(link =>
      nodeIds.has(link.source) && nodeIds.has(link.target)
    );

    return {
      nodes: filteredNodes,
      links: filteredLinks
    };
  }

  /**
   * Find shortest path between two nodes using BFS
   */
  findPath(from: string, to: string): string[] | null {
    if (from === to) return [from];

    const queue: [string, string[]][] = [[from, [from]]];
    const visited = new Set<string>([from]);

    while (queue.length > 0) {
      const [current, path] = queue.shift()!;

      const neighbors = this.adjacencyList.get(current) || new Set();
      for (const neighbor of neighbors) {
        if (neighbor === to) {
          return [...path, neighbor];
        }

        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([neighbor, [...path, neighbor]]);
        }
      }
    }

    return null;
  }

  /**
   * Get all direct dependencies of a node
   */
  getNodeDependencies(nodeId: string): string[] {
    return Array.from(this.adjacencyList.get(nodeId) || new Set());
  }

  /**
   * Get all nodes that depend on this node
   */
  getNodeDependents(nodeId: string): string[] {
    return Array.from(this.reverseAdjacencyList.get(nodeId) || new Set());
  }

  /**
   * Get file name from path
   */
  private getFileName(path: string): string {
    return path.split('/').pop() || path;
  }

  /**
   * Get file type/extension
   */
  private getFileType(path: string): string {
    const ext = path.split('.').pop() || '';
    return ext.toLowerCase();
  }

  /**
   * Get directory name from path
   */
  private getDirectoryName(path: string): string {
    const parts = path.split('/');
    parts.pop(); // Remove file name
    return parts.join('/') || 'root';
  }
}
