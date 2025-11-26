/**
 * File Action Executors
 *
 * Handles file system operations: read, write, edit, delete, create directory
 */
import { logger } from '../../../../services/Logger';
import type { ActionContext, StepResult } from '../types';
import {
    resolveFilePath,
    findFileInCommonLocations,
    getFallbackTemplate,
} from '../utils';

/**
 * Generates appropriate content for a missing file using AI
 */
async function generateMissingFileContent(
    filePath: string,
    context: ActionContext
): Promise<string> {
    try {
        const fileName = filePath.split(/[/\\]/).pop() || 'file';
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        const { workspaceRoot, userRequest } = context.taskState;

        const prompt = `Generate appropriate initial content for this file:

File path: ${filePath}
File name: ${fileName}
Extension: ${extension}
Project context: ${workspaceRoot}
User's original request: ${userRequest}

Requirements:
1. Generate complete, production-ready content
2. Follow best practices for ${extension} files
3. Include proper structure, imports, and documentation
4. Make it relevant to the project context
5. Use modern patterns (2025 best practices)

For documentation files (.md), include:
- Clear title and overview
- Relevant sections based on filename
- Actionable content

For code files, include:
- Proper imports and dependencies
- TypeScript types if applicable
- Error handling
- JSDoc/comments

Generate ONLY the file content, no explanations.`;

        logger.debug('[FileActions] Generating content for missing file with AI...');

        const response = await context.aiService.sendContextualMessage({
            userQuery: prompt,
            workspaceContext: await context.workspaceService.getWorkspaceContext(),
            currentFile: undefined,
            relatedFiles: [],
            conversationHistory: [],
        });

        const content = response.content.trim();

        if (!content || content.length < 50) {
            return getFallbackTemplate(fileName, extension);
        }

        return content;
    } catch (error) {
        logger.error('[FileActions] AI generation failed, using fallback template:', error);
        const fileName = filePath.split(/[/\\]/).pop() || 'file';
        const extension = fileName.split('.').pop()?.toLowerCase() || '';
        return getFallbackTemplate(fileName, extension);
    }
}

/**
 * Read file action executor
 */
export async function executeReadFile(
    params: Record<string, unknown>,
    context: ActionContext
): Promise<StepResult> {
    try {
        if (!params.filePath) {
            throw new Error('Missing required parameter: filePath');
        }

        const { fileSystemService, taskState, callbacks } = context;
        let resolvedPath = resolveFilePath(
            params.filePath as string,
            taskState.workspaceRoot,
            fileSystemService
        );

        // Try to find file in alternate locations if it doesn't exist at exact path
        try {
            await fileSystemService.getFileStats(resolvedPath);
        } catch {
            logger.debug(`[FileActions] File not found at exact path: ${resolvedPath}, searching alternate locations...`);
            const foundPath = await findFileInCommonLocations(
                resolvedPath,
                taskState.workspaceRoot,
                fileSystemService
            );

            if (foundPath) {
                logger.debug(`[FileActions] ✓ Found file at alternate location: ${foundPath}`);
                resolvedPath = foundPath;
            } else {
                // Auto-create file (like Cursor does)
                logger.debug(`[FileActions] 🔧 File not found, auto-creating: ${resolvedPath}`);
                const generatedContent = await generateMissingFileContent(resolvedPath, context);
                await fileSystemService.writeFile(resolvedPath, generatedContent);

                if (callbacks?.onFileChanged) {
                    callbacks.onFileChanged(resolvedPath, 'created');
                }

                logger.debug(`[FileActions] ✓ Auto-created file: ${resolvedPath} (${generatedContent.length} bytes)`);

                const content = await fileSystemService.readFile(resolvedPath);
                return {
                    success: true,
                    data: { content, filePath: resolvedPath, autoCreated: true },
                    message: `Auto-created and read file: ${resolvedPath}`,
                };
            }
        }

        const content = await fileSystemService.readFile(resolvedPath);
        return {
            success: true,
            data: { content, filePath: resolvedPath },
            message: `Read file: ${resolvedPath}`,
        };
    } catch (error) {
        throw new Error(`Failed to read file: ${error}`);
    }
}

/**
 * Write file action executor
 */
export async function executeWriteFile(
    params: Record<string, unknown>,
    context: ActionContext
): Promise<StepResult> {
    try {
        if (!params.filePath) {
            throw new Error('Missing required parameter: filePath');
        }
        if (!params.content) {
            throw new Error('Missing required parameter: content');
        }

        const { fileSystemService, taskState, liveStream, callbacks } = context;
        const resolvedPath = resolveFilePath(
            params.filePath as string,
            taskState.workspaceRoot,
            fileSystemService
        );

        // PHASE 7: Stream content to editor before writing file
        if (liveStream) {
            await liveStream.streamToEditor(resolvedPath, params.content as string);
        }

        await fileSystemService.writeFile(resolvedPath, params.content as string);

        if (callbacks?.onFileChanged) {
            callbacks.onFileChanged(resolvedPath, 'created');
        }

        return {
            success: true,
            filesCreated: [resolvedPath],
            message: `Created file: ${resolvedPath}`,
        };
    } catch (error) {
        throw new Error(`Failed to write file: ${error}`);
    }
}

/**
 * Edit file action executor
 */
export async function executeEditFile(
    params: Record<string, unknown>,
    context: ActionContext
): Promise<StepResult> {
    try {
        const { fileSystemService, taskState, liveStream, callbacks } = context;
        const resolvedPath = resolveFilePath(
            params.filePath as string,
            taskState.workspaceRoot,
            fileSystemService
        );

        const oldContent = await fileSystemService.readFile(resolvedPath);
        const newContent = oldContent.replace(
            params.oldContent as string,
            params.newContent as string
        );

        // PHASE 7: Show diff and request approval before applying
        if (liveStream) {
            const changes = liveStream.showDiffPreview(resolvedPath, oldContent, newContent);
            const approved = await liveStream.requestApproval(resolvedPath, changes);

            if (!approved) {
                liveStream.clearDecorations();
                return {
                    success: false,
                    message: `Edit rejected by user: ${resolvedPath}`,
                };
            }

            liveStream.clearDecorations();
        }

        await fileSystemService.writeFile(resolvedPath, newContent);

        if (callbacks?.onFileChanged) {
            callbacks.onFileChanged(resolvedPath, 'modified');
        }

        return {
            success: true,
            filesModified: [resolvedPath],
            message: `Edited file: ${resolvedPath}`,
        };
    } catch (error) {
        throw new Error(`Failed to edit file: ${error}`);
    }
}

/**
 * Delete file action executor
 */
export async function executeDeleteFile(
    params: Record<string, unknown>,
    context: ActionContext
): Promise<StepResult> {
    try {
        const { fileSystemService, taskState, callbacks } = context;
        const resolvedPath = resolveFilePath(
            params.filePath as string,
            taskState.workspaceRoot,
            fileSystemService
        );

        await fileSystemService.deleteFile(resolvedPath);

        if (callbacks?.onFileChanged) {
            callbacks.onFileChanged(resolvedPath, 'deleted');
        }

        return {
            success: true,
            filesDeleted: [resolvedPath],
            message: `Deleted file: ${resolvedPath}`,
        };
    } catch (error) {
        throw new Error(`Failed to delete file: ${error}`);
    }
}

/**
 * Create directory action executor
 */
export async function executeCreateDirectory(
    params: Record<string, unknown>,
    context: ActionContext
): Promise<StepResult> {
    try {
        const { fileSystemService, taskState } = context;
        const resolvedPath = resolveFilePath(
            params.path as string,
            taskState.workspaceRoot,
            fileSystemService
        );

        await fileSystemService.createDirectory(resolvedPath);
        return {
            success: true,
            message: `Created directory: ${resolvedPath}`,
        };
    } catch (error) {
        throw new Error(`Failed to create directory: ${error}`);
    }
}
