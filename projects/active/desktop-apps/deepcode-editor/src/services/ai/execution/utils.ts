/**
 * Execution Utilities
 *
 * Helper functions for the ExecutionEngine
 */
import { logger } from '../../../services/Logger';
import type { AgentStep, AgentTask, ApprovalRequest, StepResult } from './types';
import type { FileSystemService } from '../../FileSystemService';

/**
 * Resolves a file path against workspace root
 * Handles both relative and absolute paths
 */
export function resolveFilePath(
    path: string,
    workspaceRoot: string,
    fileSystemService: FileSystemService
): string {
    if (!workspaceRoot) {
        logger.warn('[ExecutionUtils] No workspace root set, using path as-is:', path);
        return path;
    }

    const resolvedPath = fileSystemService.resolveWorkspacePath(path, workspaceRoot);
    logger.debug(`[ExecutionUtils] Path resolution: "${path}" → "${resolvedPath}"`);
    return resolvedPath;
}

/**
 * Finds a file by checking common alternate locations
 * Returns the actual path if found, null otherwise
 */
export async function findFileInCommonLocations(
    requestedPath: string,
    workspaceRoot: string,
    fileSystemService: FileSystemService
): Promise<string | null> {
    const pathParts = requestedPath.split(/[/\\]/);
    const fileName = pathParts[pathParts.length - 1];

    if (!workspaceRoot) {
        return null;
    }

    // Common locations to check (in order of likelihood)
    const locationsToTry = [
        requestedPath,
        fileSystemService.joinPath(workspaceRoot, 'src', fileName),
        fileSystemService.joinPath(workspaceRoot, 'app', fileName),
        fileSystemService.joinPath(workspaceRoot, 'lib', fileName),
        fileSystemService.joinPath(workspaceRoot, fileName),
        fileSystemService.joinPath(workspaceRoot, 'components', fileName),
        fileSystemService.joinPath(workspaceRoot, 'src', 'components', fileName),
        fileSystemService.joinPath(workspaceRoot, 'app', '(tabs)', fileName),
    ];

    logger.debug(`[ExecutionUtils] Searching for file: ${fileName}`);
    logger.debug(`[ExecutionUtils] Trying locations:`, locationsToTry);

    for (const location of locationsToTry) {
        try {
            await fileSystemService.getFileStats(location);
            logger.debug(`[ExecutionUtils] ✓ Found file at: ${location}`);
            return location;
        } catch {
            continue;
        }
    }

    logger.debug(`[ExecutionUtils] ✗ File not found in any common location`);
    return null;
}

/**
 * Builds an approval request for human-in-the-loop pattern
 */
export function buildApprovalRequest(task: AgentTask, step: AgentStep): ApprovalRequest {
    const destructiveActions = ['delete_file', 'write_file', 'git_commit'];
    const riskLevel = destructiveActions.includes(step.action.type) ? 'high' : 'low';
    const reversible = !['delete_file'].includes(step.action.type);

    const filesAffected: string[] = [];
    if (step.action.params.filePath) {
        filesAffected.push(step.action.params.filePath as string);
    }

    return {
        taskId: task.id,
        stepId: step.id,
        action: step.action,
        reasoning: step.description,
        impact: {
            filesAffected,
            reversible,
            riskLevel: riskLevel as 'low' | 'medium' | 'high',
        },
    };
}

/**
 * Stores step result for potential rollback
 */
export function storeStepResult(
    executionHistory: Map<string, StepResult[]>,
    taskId: string,
    result: StepResult
): void {
    if (!executionHistory.has(taskId)) {
        executionHistory.set(taskId, []);
    }
    executionHistory.get(taskId)!.push(result);
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extracts code from markdown-formatted AI response
 */
export function extractCodeFromResponse(response: string, _targetLanguage?: string): string {
    const codeBlockRegex = /```(?:\w+)?\n?([\s\S]*?)```/g;
    const matches = Array.from(response.matchAll(codeBlockRegex));

    if (matches.length > 0) {
        const codeBlocks = matches.map(match => match[1]?.trim() || '').filter(Boolean);
        return codeBlocks.reduce((longest, current) =>
            current.length > longest.length ? current : longest
        );
    }

    return response.trim();
}

/**
 * Provides fallback templates when AI generation fails
 */
export function getFallbackTemplate(fileName: string, extension: string): string {
    if (extension === 'md') {
        const title = fileName.replace('.md', '').replace(/[-_]/g, ' ');
        return `# ${title}

## Overview

This document was auto-generated. Please update with actual content.

## Getting Started

Add your content here.

---

*Last updated: ${new Date().toISOString().split('T')[0]}*
`;
    }

    if (extension === 'ts' || extension === 'tsx') {
        return `/**
 * ${fileName}
 *
 * Auto-generated file. Update with actual implementation.
 */

export default function ${fileName.replace(/[.-]/g, '_').replace(/\..+$/, '')}() {
  // TODO: Implement
  return null;
}
`;
    }

    if (extension === 'json') {
        return `{
  "name": "${fileName.replace('.json', '')}",
  "description": "Auto-generated configuration",
  "version": "1.0.0"
}
`;
    }

    return `# ${fileName}

This file was auto-generated by Agent Mode.
Please update with actual content.
`;
}

/**
 * Suggests alternative file paths when a file is not found
 */
export function suggestAlternativeFiles(missingPath: string): string {
    const pathParts = missingPath.split(/[/\\]/);
    const fileName = pathParts[pathParts.length - 1];
    const directory = pathParts.slice(0, -1).join('/');

    if (fileName === 'index.tsx') {
        return 'Common locations: src/index.tsx, app/index.tsx, or app/(tabs)/index.tsx';
    }

    if (fileName === 'App.tsx') {
        return 'Common locations: src/App.tsx, app/App.tsx, or App.tsx at root';
    }

    if (fileName === '_layout.tsx') {
        return 'Common locations: app/_layout.tsx or app/(tabs)/_layout.tsx';
    }

    return `File not found in ${directory}. Common locations: src/, app/, lib/, or root directory`;
}
