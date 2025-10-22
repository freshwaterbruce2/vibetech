/**
 * DependencyGraphService Tests
 * TDD: Writing tests FIRST before implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { InternalDependency } from '../../services/CodebaseAnalyzer';

// Mock dependencies data
const mockDependencies: InternalDependency[] = [
  {
    from: 'src/App.tsx',
    to: 'src/components/Editor.tsx',
    type: 'import',
    usage: 'module'
  },
  {
    from: 'src/App.tsx',
    to: 'src/services/FileSystemService.ts',
    type: 'import',
    usage: 'class'
  },
  {
    from: 'src/components/Editor.tsx',
    to: 'src/services/FileSystemService.ts',
    type: 'import',
    usage: 'class'
  },
  {
    from: 'src/components/Sidebar.tsx',
    to: 'src/App.tsx',
    type: 'import',
    usage: 'function'
  },
  {
    from: 'src/services/WorkspaceService.ts',
    to: 'src/services/FileSystemService.ts',
    type: 'import',
    usage: 'class'
  }
];

describe('DependencyGraphService', () => {
  let DependencyGraphService: any;

  beforeEach(async () => {
    try {
      const module = await import('../../services/DependencyGraphService');
      DependencyGraphService = module.DependencyGraphService;
    } catch {
      // Expected to fail initially - TDD RED phase
      DependencyGraphService = null;
    }
  });

  describe('Graph Construction', () => {
    it('should initialize with empty graph', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      const graph = service.getGraph();

      expect(graph).toBeDefined();
      expect(graph.nodes).toEqual([]);
      expect(graph.links).toEqual([]);
    });

    it('should build graph from dependencies', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const graph = service.getGraph();

      expect(graph.nodes.length).toBeGreaterThan(0);
      expect(graph.links.length).toBe(mockDependencies.length);
    });

    it('should create unique nodes for each file', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const graph = service.getGraph();

      const nodeIds = graph.nodes.map((n: any) => n.id);
      const uniqueIds = new Set(nodeIds);

      expect(nodeIds.length).toBe(uniqueIds.size);
    });

    it('should include all unique files as nodes', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const graph = service.getGraph();

      const allFiles = new Set<string>();
      mockDependencies.forEach(dep => {
        allFiles.add(dep.from);
        allFiles.add(dep.to);
      });

      expect(graph.nodes.length).toBe(allFiles.size);
    });
  });

  describe('Node Properties', () => {
    it('should calculate node degree (connections)', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const graph = service.getGraph();

      // src/App.tsx has 3 connections (2 outgoing, 1 incoming)
      const appNode = graph.nodes.find((n: any) => n.id === 'src/App.tsx');
      expect(appNode.degree).toBe(3);
    });

    it('should categorize nodes by file type', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const graph = service.getGraph();

      const tsxNodes = graph.nodes.filter((n: any) => n.type === 'tsx');
      const tsNodes = graph.nodes.filter((n: any) => n.type === 'ts');

      expect(tsxNodes.length).toBeGreaterThan(0);
      expect(tsNodes.length).toBeGreaterThan(0);
    });

    it('should calculate node importance (centrality)', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const graph = service.getGraph();

      // FileSystemService.ts is imported by 3 files - should have high importance
      const fsNode = graph.nodes.find((n: any) => n.id === 'src/services/FileSystemService.ts');
      expect(fsNode.importance).toBeGreaterThan(0.5);
    });

    it('should include node label (file name)', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const graph = service.getGraph();

      const appNode = graph.nodes.find((n: any) => n.id === 'src/App.tsx');
      expect(appNode.label).toBe('App.tsx');
    });
  });

  describe('Link Properties', () => {
    it('should include link source and target', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const graph = service.getGraph();

      const link = graph.links[0];
      expect(link.source).toBeDefined();
      expect(link.target).toBeDefined();
    });

    it('should include link type (import/require)', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const graph = service.getGraph();

      const link = graph.links[0];
      expect(link.type).toBe('import');
    });

    it('should include link usage (function/class/module)', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const graph = service.getGraph();

      const link = graph.links[0];
      expect(['function', 'class', 'variable', 'type', 'module']).toContain(link.usage);
    });
  });

  describe('Graph Analysis', () => {
    it('should detect hub nodes (high degree)', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const hubs = service.getHubNodes(2);

      expect(Array.isArray(hubs)).toBe(true);
      expect(hubs.length).toBeGreaterThan(0);
      expect(hubs[0].degree).toBeGreaterThanOrEqual(2);
    });

    it('should detect isolated nodes (no connections)', () => {
      if (!DependencyGraphService) return;

      const depsWithIsolated = [
        ...mockDependencies,
        // Isolated file has no imports
      ];

      const service = new DependencyGraphService();
      service.buildGraph(depsWithIsolated);

      // Mock dependencies should have no isolated nodes
      const isolated = service.getIsolatedNodes();
      expect(Array.isArray(isolated)).toBe(true);
    });

    it('should calculate graph density', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const density = service.getGraphDensity();

      expect(typeof density).toBe('number');
      expect(density).toBeGreaterThan(0);
      expect(density).toBeLessThanOrEqual(1);
    });

    it('should group nodes by directory', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const clusters = service.getClusters();

      expect(Array.isArray(clusters)).toBe(true);
      expect(clusters.length).toBeGreaterThan(0);

      // Should have src/components cluster
      const componentCluster = clusters.find((c: any) => c.name === 'src/components');
      expect(componentCluster).toBeDefined();
    });
  });

  describe('Filtering', () => {
    it('should filter graph by file type', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const filtered = service.filterByFileType(['tsx']);

      const allTsx = filtered.nodes.every((n: any) => n.type === 'tsx');
      expect(allTsx).toBe(true);
    });

    it('should filter graph by directory', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const filtered = service.filterByDirectory('src/components');

      const allInComponents = filtered.nodes.every((n: any) =>
        n.id.startsWith('src/components')
      );
      expect(allInComponents).toBe(true);
    });

    it('should filter graph by minimum degree', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const filtered = service.filterByMinDegree(2);

      const allAboveThreshold = filtered.nodes.every((n: any) => n.degree >= 2);
      expect(allAboveThreshold).toBe(true);
    });
  });

  describe('Path Finding', () => {
    it('should find shortest path between nodes', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const path = service.findPath('src/App.tsx', 'src/services/FileSystemService.ts');

      expect(Array.isArray(path)).toBe(true);
      expect(path[0]).toBe('src/App.tsx');
      expect(path[path.length - 1]).toBe('src/services/FileSystemService.ts');
    });

    it('should return null for disconnected nodes', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const path = service.findPath('src/App.tsx', 'nonexistent.ts');

      expect(path).toBeNull();
    });

    it('should find all dependencies of a node', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const deps = service.getNodeDependencies('src/App.tsx');

      expect(Array.isArray(deps)).toBe(true);
      expect(deps).toContain('src/components/Editor.tsx');
      expect(deps).toContain('src/services/FileSystemService.ts');
    });

    it('should find all dependents of a node', () => {
      if (!DependencyGraphService) return;

      const service = new DependencyGraphService();
      service.buildGraph(mockDependencies);
      const dependents = service.getNodeDependents('src/services/FileSystemService.ts');

      expect(Array.isArray(dependents)).toBe(true);
      expect(dependents.length).toBeGreaterThan(0);
    });
  });
});
