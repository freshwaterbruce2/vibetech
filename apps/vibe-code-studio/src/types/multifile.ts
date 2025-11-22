/**
 * Multi-File Editor Types
 */

export interface FileChange {
  path: string;
  originalContent: string;
  newContent: string;
  diff?: string;
  changeType: 'modify' | 'create' | 'delete';
  reason?: string;
}

export interface MultiFileEditPlan {
  id: string;
  description: string;
  files: FileChange[];
  dependencies: string[];
  estimatedImpact: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export interface MultiFileEditResult {
  success: boolean;
  appliedFiles: string[];
  failedFiles: { path: string; error: string }[];
  error?: string;
  rollbackAvailable: boolean;
}

export interface DependencyNode {
  path: string;
  imports: string[];
  exports: string[];
  dependents: string[];
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  affectedFiles: string[];
}
