/**
 * Monorepo Optimizer
 *
 * Optimizes task execution for monorepo structures
 * Specifically designed for C:\dev workspace with pnpm/turbo
 */

import { logger } from '../../Logger';

export interface MonorepoConfig {
  root: string;
  packageManager: 'pnpm' | 'npm' | 'yarn';
  buildTool?: 'turbo' | 'nx' | 'lerna';
  priorityProjects: string[];
  sharedDependencies: string[];
}

export interface ProjectInfo {
  name: string;
  path: string;
  type: 'app' | 'package' | 'service';
  dependencies: string[];
  scripts: Record<string, string>;
  framework?: string;
}

export interface DependencyGraph {
  projects: Map<string, ProjectInfo>;
  edges: Map<string, Set<string>>;
  topologicalOrder: string[];
}

export class MonorepoOptimizer {
  private readonly config: MonorepoConfig;
  private projectCache = new Map<string, ProjectInfo>();
  private dependencyGraph?: DependencyGraph;
  private readonly scanPaths = [
    'apps',
    'packages',
    'services',
    'libs'
  ];

  constructor(config?: Partial<MonorepoConfig>) {
    this.config = {
      root: config?.root || 'C:\\dev',
      packageManager: config?.packageManager || 'pnpm',
      buildTool: config?.buildTool || 'turbo',
      priorityProjects: config?.priorityProjects || [
        'nova-agent',
        'vibe-code-studio',
        'vibe-tech-lovable'
      ],
      sharedDependencies: config?.sharedDependencies || [
        '@nova/types',
        '@vibe/shared'
      ]
    };
  }

  /**
   * Scan monorepo for projects
   */
  async scanMonorepo(fileSystemService?: any): Promise<ProjectInfo[]> {
    const projects: ProjectInfo[] = [];

    for (const scanPath of this.scanPaths) {
      const fullPath = `${this.config.root}\\${scanPath}`;

      try {
        if (fileSystemService) {
          const dirs = await fileSystemService.listDirectory(fullPath);

          for (const dir of dirs) {
            if (dir.type === 'directory') {
              const project = await this.analyzeProject(
                `${fullPath}\\${dir.name}`,
                fileSystemService
              );
              if (project) {
                projects.push(project);
                this.projectCache.set(project.name, project);
              }
            }
          }
        }
      } catch (error) {
        logger.debug(`[MonorepoOptimizer] Could not scan ${scanPath}: ${error}`);
      }
    }

    // Build dependency graph
    this.dependencyGraph = this.buildDependencyGraph(projects);

    logger.info(`[MonorepoOptimizer] Found ${projects.length} projects in monorepo`);
    return projects;
  }

  /**
   * Analyze a single project
   */
  private async analyzeProject(
    projectPath: string,
    fileSystemService?: any
  ): Promise<ProjectInfo | null> {
    try {
      const packageJsonPath = `${projectPath}\\package.json`;

      if (fileSystemService) {
        const packageJson = await fileSystemService.readFile(packageJsonPath);
        const pkg = JSON.parse(packageJson);

        const projectInfo: ProjectInfo = {
          name: pkg.name || projectPath.split('\\').pop() || 'unknown',
          path: projectPath,
          type: this.detectProjectType(projectPath, pkg),
          dependencies: this.extractDependencies(pkg),
          scripts: pkg.scripts || {},
          framework: this.detectFramework(pkg)
        };

        return projectInfo;
      }
    } catch (error) {
      logger.debug(`[MonorepoOptimizer] Could not analyze project at ${projectPath}`);
    }

    return null;
  }

  /**
   * Detect project type
   */
  private detectProjectType(path: string, pkg: any): 'app' | 'package' | 'service' {
    if (path.includes('\\apps\\')) return 'app';
    if (path.includes('\\packages\\')) return 'package';
    if (path.includes('\\services\\')) return 'service';

    // Check package.json for hints
    if (pkg.main || pkg.exports) return 'package';
    if (pkg.scripts?.start || pkg.scripts?.dev) return 'app';

    return 'service';
  }

  /**
   * Extract dependencies from package.json
   */
  private extractDependencies(pkg: any): string[] {
    const deps: string[] = [];

    if (pkg.dependencies) {
      deps.push(...Object.keys(pkg.dependencies));
    }

    if (pkg.devDependencies) {
      deps.push(...Object.keys(pkg.devDependencies));
    }

    return deps;
  }

  /**
   * Detect framework from dependencies
   */
  private detectFramework(pkg: any): string | undefined {
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (allDeps['react']) return 'React';
    if (allDeps['react-native']) return 'React Native';
    if (allDeps['expo']) return 'Expo';
    if (allDeps['next']) return 'Next.js';
    if (allDeps['vue']) return 'Vue';
    if (allDeps['@tauri-apps/api']) return 'Tauri';
    if (allDeps['electron']) return 'Electron';
    if (allDeps['express']) return 'Express';
    if (allDeps['fastify']) return 'Fastify';

    return undefined;
  }

  /**
   * Build dependency graph
   */
  private buildDependencyGraph(projects: ProjectInfo[]): DependencyGraph {
    const graph: DependencyGraph = {
      projects: new Map(),
      edges: new Map(),
      topologicalOrder: []
    };

    // Add all projects to graph
    for (const project of projects) {
      graph.projects.set(project.name, project);
      graph.edges.set(project.name, new Set());
    }

    // Build edges based on dependencies
    for (const project of projects) {
      for (const dep of project.dependencies) {
        if (graph.projects.has(dep)) {
          graph.edges.get(project.name)?.add(dep);
        }
      }
    }

    // Calculate topological order
    graph.topologicalOrder = this.topologicalSort(graph);

    return graph;
  }

  /**
   * Topological sort for dependency order
   */
  private topologicalSort(graph: DependencyGraph): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const visit = (name: string) => {
      if (visited.has(name)) return;
      visited.add(name);

      const deps = graph.edges.get(name);
      if (deps) {
        for (const dep of deps) {
          visit(dep);
        }
      }

      result.push(name);
    };

    for (const name of graph.projects.keys()) {
      visit(name);
    }

    return result;
  }

  /**
   * Optimize task execution order
   */
  optimizeTaskOrder(tasks: any[]): any[] {
    if (!this.dependencyGraph) return tasks;

    // Sort tasks based on dependency order
    return tasks.sort((a, b) => {
      const aIndex = this.dependencyGraph!.topologicalOrder.indexOf(a.project || '');
      const bIndex = this.dependencyGraph!.topologicalOrder.indexOf(b.project || '');

      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }

  /**
   * Get build command for project
   */
  getBuildCommand(projectName: string): string {
    const project = this.projectCache.get(projectName);
    if (!project) return 'pnpm build';

    // Check for custom build script
    if (project.scripts.build) {
      return `${this.config.packageManager} run build`;
    }

    // Use turbo if available
    if (this.config.buildTool === 'turbo') {
      return `turbo run build --filter=${projectName}`;
    }

    return `${this.config.packageManager} build`;
  }

  /**
   * Get affected projects for a change
   */
  getAffectedProjects(changedProject: string): string[] {
    if (!this.dependencyGraph) return [];

    const affected = new Set<string>();
    const queue = [changedProject];

    while (queue.length > 0) {
      const current = queue.shift()!;

      for (const [project, deps] of this.dependencyGraph.edges.entries()) {
        if (deps.has(current) && !affected.has(project)) {
          affected.add(project);
          queue.push(project);
        }
      }
    }

    return Array.from(affected);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalProjects: number;
    projectTypes: Record<string, number>;
    frameworks: Record<string, number>;
  } {
    const stats = {
      totalProjects: this.projectCache.size,
      projectTypes: { app: 0, package: 0, service: 0 },
      frameworks: {} as Record<string, number>
    };

    for (const project of this.projectCache.values()) {
      stats.projectTypes[project.type]++;

      if (project.framework) {
        stats.frameworks[project.framework] =
          (stats.frameworks[project.framework] || 0) + 1;
      }
    }

    return stats;
  }
}
