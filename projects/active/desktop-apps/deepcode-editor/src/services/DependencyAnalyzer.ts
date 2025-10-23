/**
 * DependencyAnalyzer - Analyze file dependencies
 * Enhanced for multi-file editing with deep import/export analysis
 */

import { DependencyNode, DependencyGraph } from '../types/multifile';

export class DependencyAnalyzer {
  private circularDeps: Set<string> = new Set();

  /**
   * Build dependency graph for files
   */
  async analyzeFiles(files: Map<string, string>): Promise<DependencyGraph> {
    const nodes = new Map<string, DependencyNode>();

    // Parse each file
    for (const [path, content] of files.entries()) {
      const node = this.parseFile(path, content);
      nodes.set(path, node);
    }

    // Build dependents (reverse dependencies)
    for (const [path, node] of nodes.entries()) {
      for (const importPath of node.imports) {
        const imported = nodes.get(importPath);
        if (imported && !imported.dependents.includes(path)) {
          imported.dependents.push(path);
        }
      }
    }

    // Detect circular dependencies
    this.detectCircularDependencies(nodes);

    return { nodes, affectedFiles: [] };
  }

  /**
   * Find files affected by changing target files
   */
  findAffectedFiles(graph: DependencyGraph, changedFiles: string[]): string[] {
    const affected = new Set<string>(changedFiles);
    const queue = [...changedFiles];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = graph.nodes.get(current);

      if (node) {
        for (const dependent of node.dependents) {
          if (!affected.has(dependent)) {
            affected.add(dependent);
            queue.push(dependent);
          }
        }
      }
    }

    return Array.from(affected);
  }

  private parseFile(path: string, content: string): DependencyNode {
    const imports: string[] = [];
    const exports: string[] = [];

    // Parse ES6 imports: import ... from '...'
    const importRegex = /import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(this.resolveImport(path, match[1]));
    }

    // Parse require: require('...')
    const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(this.resolveImport(path, match[1]));
    }

    // Parse exports
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return { path, imports, exports, dependents: [] };
  }

  private resolveImport(fromPath: string, importPath: string): string {
    // Handle relative imports
    if (importPath.startsWith('.')) {
      const parts = fromPath.split('/');
      parts.pop(); // Remove filename

      const importParts = importPath.split('/');
      for (const part of importParts) {
        if (part === '..') parts.pop();
        else if (part !== '.') parts.push(part);
      }

      let resolved = parts.join('/');

      // Add extension if missing
      if (!resolved.match(/\.(ts|tsx|js|jsx)$/)) {
        if (resolved.includes('component') || resolved.includes('Component')) {
          resolved += '.tsx';
        } else {
          resolved += '.ts';
        }
      }

      return resolved;
    }

    // Return as-is for node_modules
    return importPath;
  }

  /**
   * Detect circular dependencies in the graph
   */
  private detectCircularDependencies(nodes: Map<string, DependencyNode>): void {
    this.circularDeps.clear();
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (path: string): boolean => {
      if (recursionStack.has(path)) {
        this.circularDeps.add(path);
        return true;
      }

      if (visited.has(path)) {
        return false;
      }

      visited.add(path);
      recursionStack.add(path);

      const node = nodes.get(path);
      if (node) {
        for (const importPath of node.imports) {
          if (detectCycle(importPath)) {
            this.circularDeps.add(path);
          }
        }
      }

      recursionStack.delete(path);
      return false;
    };

    for (const path of nodes.keys()) {
      detectCycle(path);
    }
  }

  /**
   * Get circular dependency information
   */
  getCircularDependencies(): string[] {
    return Array.from(this.circularDeps);
  }

  /**
   * Get detailed impact analysis for a file change
   */
  getImpactAnalysis(
    graph: DependencyGraph,
    filePath: string
  ): {
    directImpact: string[];
    transitiveImpact: string[];
    totalImpact: number;
  } {
    const node = graph.nodes.get(filePath);
    if (!node) {
      return { directImpact: [], transitiveImpact: [], totalImpact: 0 };
    }

    const directImpact = [...node.dependents];
    const allAffected = this.findAffectedFiles(graph, [filePath]);
    const transitiveImpact = allAffected.filter(
      (f) => f !== filePath && !directImpact.includes(f)
    );

    return {
      directImpact,
      transitiveImpact,
      totalImpact: allAffected.length - 1, // Exclude the file itself
    };
  }

  /**
   * Export graph to DOT format for visualization
   */
  exportToDot(graph: DependencyGraph): string {
    let dot = 'digraph Dependencies {\n';
    dot += '  rankdir=LR;\n';
    dot += '  node [shape=box];\n\n';

    for (const [path, node] of graph.nodes.entries()) {
      const label = path.split('/').pop() || path;
      const color = this.circularDeps.has(path) ? 'red' : 'black';

      dot += `  "${label}" [color=${color}];\n`;

      for (const importPath of node.imports) {
        const importLabel = importPath.split('/').pop() || importPath;
        dot += `  "${label}" -> "${importLabel}";\n`;
      }
    }

    dot += '}\n';
    return dot;
  }
}
