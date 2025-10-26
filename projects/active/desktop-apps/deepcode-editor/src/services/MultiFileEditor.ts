/**
 * MultiFileEditor - Coordinate changes across multiple files
 */
import { logger } from '../services/Logger';
import {
  FileChange,
  MultiFileEditPlan,
  MultiFileEditResult,
} from '@vibetech/types/multifile';

import { UnifiedAIService } from './ai/UnifiedAIService';
import { DependencyAnalyzer } from './DependencyAnalyzer';
import { FileSystemService } from './FileSystemService';

export class MultiFileEditor {
  private aiService: UnifiedAIService;
  private fsService: FileSystemService;
  private dependencyAnalyzer: DependencyAnalyzer;
  private backupMap: Map<string, string> = new Map();

  constructor(aiService: UnifiedAIService, fsService: FileSystemService) {
    this.aiService = aiService;
    this.fsService = fsService;
    this.dependencyAnalyzer = new DependencyAnalyzer();
  }

  /**
   * Create edit plan for a task
   */
  async createEditPlan(
    taskDescription: string,
    workspaceFiles: string[],
    currentFile?: string
  ): Promise<MultiFileEditPlan> {
    const prompt = `Analyze this refactoring task and determine which files need changes.

Task: ${taskDescription}

Available files:
${workspaceFiles.slice(0, 30).join('\n')}

${currentFile ? `Current file: ${currentFile}` : ''}

Respond in JSON format:
{
  "description": "Brief summary",
  "files": [
    {"path": "/path/to/file.ts", "reason": "Why it needs changes"}
  ]
}`;

    const response = await this.aiService.sendContextualMessage({
      userQuery: prompt,
      workspaceContext: {
        rootPath: '',
        totalFiles: 0,
        languages: [],
        testFiles: 0,
        projectStructure: {},
        dependencies: {},
        exports: {},
        symbols: {},
        lastIndexed: new Date(),
        summary: 'Multi-file edit operation',
      },
      currentFile: undefined,
      relatedFiles: [],
      conversationHistory: [],
    });
    const plan = this.parseAIPlan(response.content);

    // Estimate impact
    plan.estimatedImpact =
      plan.files.length <= 2 ? 'low' : plan.files.length <= 5 ? 'medium' : 'high';

    return plan;
  }

  /**
   * Generate file changes for the plan
   */
  async generateChanges(plan: MultiFileEditPlan): Promise<FileChange[]> {
    const changes: FileChange[] = [];

    for (const fileInfo of plan.files) {
      try {
        const originalContent = await this.fsService.readFile(fileInfo.path);

        const prompt = `Modify this file to accomplish the task. Return ONLY the complete modified file content.

File: ${fileInfo.path}

Current content:
\`\`\`
${originalContent}
\`\`\`

Task: ${plan.description}
Reason: ${fileInfo.reason || 'Part of multi-file refactoring'}

Modified content:`;

        const response = await this.aiService.sendContextualMessage({
          userQuery: prompt,
          workspaceContext: {
            rootPath: '',
            totalFiles: 0,
            languages: [],
            testFiles: 0,
            projectStructure: {},
            dependencies: {},
            exports: {},
            symbols: {},
            lastIndexed: new Date(),
            summary: 'File modification operation',
          },
          currentFile: undefined,
          relatedFiles: [],
          conversationHistory: [],
        });
        const newContent = this.extractCode(response.content);

        changes.push({
          path: fileInfo.path,
          originalContent,
          newContent,
          diff: this.generateDiff(originalContent, newContent),
          changeType: 'modify',
          reason: fileInfo.reason,
        });
      } catch (error) {
        logger.error(`Failed to generate changes for ${fileInfo.path}:`, error);
      }
    }

    return changes;
  }

  /**
   * Apply all changes atomically
   */
  async applyChanges(changes: FileChange[]): Promise<MultiFileEditResult> {
    const appliedFiles: string[] = [];
    const failedFiles: { path: string; error: string }[] = [];

    try {
      // Create backups
      this.backupMap.clear();
      for (const change of changes) {
        if (change.changeType === 'modify') {
          this.backupMap.set(change.path, change.originalContent);
        }
      }

      // Apply changes
      for (const change of changes) {
        try {
          await this.fsService.writeFile(change.path, change.newContent);
          appliedFiles.push(change.path);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          failedFiles.push({ path: change.path, error: errorMsg });
          throw error;
        }
      }

      this.backupMap.clear();

      return {
        success: true,
        appliedFiles,
        failedFiles: [],
        rollbackAvailable: false,
      };
    } catch (error) {
      // Rollback on failure
      await this.rollback();

      return {
        success: false,
        appliedFiles,
        failedFiles,
        error: error instanceof Error ? error.message : 'Unknown error',
        rollbackAvailable: false,
      };
    }
  }

  /**
   * Rollback all changes
   */
  async rollback(): Promise<void> {
    for (const [path, originalContent] of this.backupMap.entries()) {
      try {
        await this.fsService.writeFile(path, originalContent);
      } catch (error) {
        logger.error(`Failed to rollback ${path}:`, error);
      }
    }
    this.backupMap.clear();
  }

  private parseAIPlan(aiResponse: string): MultiFileEditPlan {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          id: Date.now().toString(),
          description: parsed.description || 'Multi-file edit',
          files: parsed.files || [],
          dependencies: [],
          estimatedImpact: 'medium',
          createdAt: new Date(),
        };
      }
    } catch (error) {
      logger.error('Failed to parse AI plan:', error);
    }

    return {
      id: Date.now().toString(),
      description: 'Multi-file edit',
      files: [],
      dependencies: [],
      estimatedImpact: 'low',
      createdAt: new Date(),
    };
  }

  private extractCode(response: string): string {
    const match = response.match(/```(?:typescript|javascript|tsx|jsx)?\n?([\s\S]*?)\n?```/);
    return match?.[1]?.trim() || response.trim();
  }

  private generateDiff(original: string, modified: string): string {
    const origLines = original.split('\n');
    const modLines = modified.split('\n');
    let diff = '';

    const maxLen = Math.max(origLines.length, modLines.length);
    for (let i = 0; i < maxLen; i++) {
      const o = origLines[i] || '';
      const m = modLines[i] || '';
      if (o !== m) {
        if (o) {diff += `- ${o}\n`;}
        if (m) {diff += `+ ${m}\n`;}
      }
    }

    return diff;
  }
}
