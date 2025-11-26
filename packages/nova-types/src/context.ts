/**
 * Context Understanding Types
 * Types for workspace context, dependency graphs, and semantic indexing
 */

export interface DependencyNode {
  path: string;
  type: 'file' | 'package' | 'module';
  language: 'typescript' | 'javascript' | 'rust' | 'python' | 'other';
  dependencies: string[];
  dependents: string[];
  exports: string[];
  imports: string[];
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  lastUpdated: number;
}

export interface SemanticEmbedding {
  filePath: string;
  content: string;
  embedding: number[];
  language: string;
  lastUpdated: number;
}

export interface CodePattern {
  id?: number;
  pattern: string;
  description: string;
  files: string[];
  frequency: number;
  category: 'auth' | 'api-call' | 'error-handling' | 'config' | 'other';
}

export interface ProjectContext {
  name: string;
  path: string;
  type: 'web-app' | 'desktop-app' | 'mobile-app' | 'backend' | 'library' | 'other';
  frameworks: string[];
  lastActive: number;
  fileCount: number;
  dependencyGraph?: DependencyGraph;
}

export interface WorkspaceContext {
  projects: ProjectContext[];
  sharedPatterns: CodePattern[];
  crossProjectDependencies: {
    from: string;
    to: string;
    type: 'similar-code' | 'shared-config' | 'api-contract';
  }[];
}
