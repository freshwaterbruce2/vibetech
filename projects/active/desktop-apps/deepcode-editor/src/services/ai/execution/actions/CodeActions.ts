/**
 * Code Action Executors
 *
 * Handles code operations: analyze, refactor, generate, search
 */
import { logger } from '../../../../services/Logger';
import type { ActionContext, StepResult } from '../types';
import { resolveFilePath, extractCodeFromResponse, sleep } from '../utils';

/**
 * Search codebase action executor
 */
export async function executeSearchCodebase(
    params: Record<string, unknown>,
    context: ActionContext
): Promise<StepResult> {
    try {
        logger.debug('[CodeActions] executeSearchCodebase called with params:', JSON.stringify(params, null, 2));

        if (!params.searchQuery) {
            logger.error('[CodeActions] Missing searchQuery parameter. Received params:', params);
            throw new Error(`Missing required parameter: searchQuery. Received params: ${JSON.stringify(params)}`);
        }

        let searchQuery: string;
        if (Array.isArray(params.searchQuery)) {
            searchQuery = params.searchQuery.join('|');
            logger.debug(`[CodeActions] Converted array to search pattern: ${searchQuery}`);
        } else if (typeof params.searchQuery === 'string') {
            searchQuery = params.searchQuery;
        } else {
            throw new Error(`Invalid searchQuery type: expected string or string[], got ${typeof params.searchQuery}`);
        }

        const results = await context.workspaceService.searchFiles(searchQuery);
        return {
            success: true,
            data: { results },
            message: `Found ${results.length} matches for: ${searchQuery}`,
        };
    } catch (error) {
        throw new Error(`Failed to search codebase: ${error}`);
    }
}

/**
 * Analyze code action executor
 */
export async function executeAnalyzeCode(
    params: Record<string, unknown>,
    context: ActionContext
): Promise<StepResult> {
    try {
        if (!params.filePath) {
            throw new Error('Missing required parameter: filePath (analyze_code requires a specific file path, not a directory)');
        }

        const { fileSystemService, aiService, taskState } = context;
        const resolvedPath = resolveFilePath(
            params.filePath as string,
            taskState.workspaceRoot,
            fileSystemService
        );

        const fileContent = await fileSystemService.readFile(resolvedPath);

        logger.debug(`[CodeActions] Requesting AI analysis for: ${resolvedPath}`);

        const aiAnalysisPrompt = `Analyze this code file and provide a concise review:

File: ${resolvedPath}
Lines: ${fileContent.split('\n').length}
Size: ${fileContent.length} bytes

\`\`\`
${fileContent.slice(0, 10000)}
${fileContent.length > 10000 ? '\n... (file truncated for analysis)' : ''}
\`\`\`

Provide a brief analysis covering:
1. Purpose and functionality
2. Code quality (clean code, patterns used)
3. Potential issues or improvements
4. Notable dependencies or patterns

Keep it concise (3-5 bullet points).`;

        try {
            const aiResponse = await aiService.sendContextualMessage({
                userQuery: aiAnalysisPrompt,
                workspaceContext: {
                    rootPath: taskState.workspaceRoot || '',
                    totalFiles: 0,
                    languages: [],
                    testFiles: 0,
                    projectStructure: {},
                    dependencies: {},
                    exports: {},
                    symbols: {},
                    lastIndexed: new Date(),
                    summary: 'Code analysis',
                },
                currentFile: undefined,
                relatedFiles: [],
                conversationHistory: [],
            });

            const analysis = {
                filePath: resolvedPath,
                content: fileContent,
                size: fileContent.length,
                lines: fileContent.split('\n').length,
                aiReview: aiResponse.content,
            };

            return {
                success: true,
                data: { analysis, generatedCode: aiResponse.content },
                message: `✅ AI analyzed: ${resolvedPath}`,
            };
        } catch (aiError) {
            logger.error('[CodeActions] AI analysis failed, returning basic stats:', aiError);

            const analysis = {
                filePath: resolvedPath,
                content: fileContent,
                size: fileContent.length,
                lines: fileContent.split('\n').length,
            };
            return {
                success: true,
                data: { analysis },
                message: `Analyzed file (basic stats only): ${resolvedPath}`,
            };
        }
    } catch (error) {
        throw new Error(`Failed to analyze code: ${error}`);
    }
}

/**
 * Refactor code action executor
 */
export async function executeRefactorCode(
    params: Record<string, unknown>,
    context: ActionContext
): Promise<StepResult> {
    try {
        const { aiService, taskState } = context;
        const prompt = `Refactor this code:\n\n${params.codeSnippet}\n\nRequirements: ${params.requirements || 'Improve readability and maintainability'}`;

        const response = await aiService.sendContextualMessage({
            userQuery: prompt,
            workspaceContext: {
                rootPath: taskState.workspaceRoot || '',
                totalFiles: 0,
                languages: [],
                testFiles: 0,
                projectStructure: {},
                dependencies: {},
                exports: {},
                symbols: {},
                lastIndexed: new Date(),
                summary: 'Code refactoring task',
            },
            currentFile: undefined,
            relatedFiles: [],
            conversationHistory: [],
        });

        return {
            success: true,
            data: { refactoredCode: response.content },
            message: 'Code refactored',
        };
    } catch (error) {
        throw new Error(`Failed to refactor code: ${error}`);
    }
}

/**
 * Generate code action executor
 */
export async function executeGenerateCode(
    params: Record<string, unknown>,
    context: ActionContext
): Promise<StepResult> {
    try {
        if (!params.description) {
            throw new Error('Missing required parameter: description');
        }

        const prompt = buildCodeGenerationPrompt(params);
        const shouldChunk = params.chunked === true || (params.description as string).length > 2000;

        if (shouldChunk && params.chunks) {
            return await executeChunkedCodeGeneration(params, prompt, context);
        } else {
            return await executeSingleCodeGeneration(params, prompt, context);
        }
    } catch (error) {
        throw new Error(`Failed to generate code: ${error}`);
    }
}

function buildCodeGenerationPrompt(params: Record<string, unknown>): string {
    const language = (params.targetLanguage as string) || 'TypeScript';
    const fileType = (params.fileType as string) || 'source code';

    let prompt = `Generate ${language} ${fileType}:\n\n${params.description}`;

    if (params.context) {
        prompt += `\n\nContext: ${params.context}`;
    }

    if (params.requirements && Array.isArray(params.requirements)) {
        prompt += `\n\nRequirements:\n${params.requirements.map((req: string) => `- ${req}`).join('\n')}`;
    }

    if (params.existingCode) {
        prompt += `\n\nExisting code to reference:\n\`\`\`${language}\n${params.existingCode}\n\`\`\``;
    }

    prompt += `\n\nProvide complete, working ${language} code with proper imports, error handling, and documentation.`;

    return prompt;
}

async function executeSingleCodeGeneration(
    params: Record<string, unknown>,
    prompt: string,
    context: ActionContext
): Promise<StepResult> {
    try {
        const { aiService, workspaceService, liveStream } = context;
        const workspaceContext = await workspaceService.getWorkspaceContext();

        const response = await aiService.sendContextualMessage({
            userQuery: prompt,
            workspaceContext,
            currentFile: params.currentFile as string | undefined,
            relatedFiles: [],
            conversationHistory: [],
        });

        const generatedCode = extractCodeFromResponse(response.content, params.targetLanguage as string);

        // PHASE 7: Stream generated code to editor
        if (liveStream && params.filePath) {
            await liveStream.streamToEditor(params.filePath as string, generatedCode);
        }

        return {
            success: true,
            data: {
                generatedCode,
                fullResponse: response.content
            },
            message: 'Code generated successfully',
        };
    } catch (error) {
        throw new Error(`Single code generation failed: ${error}`);
    }
}

async function executeChunkedCodeGeneration(
    params: Record<string, unknown>,
    basePrompt: string,
    context: ActionContext
): Promise<StepResult> {
    try {
        const chunks = (params.chunks as Array<{ description: string }>) || [];
        const generatedChunks: string[] = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const chunkPrompt = `${basePrompt}\n\nGenerate part ${i + 1}/${chunks.length}: ${chunk.description}`;

            const chunkResult = await executeSingleCodeGeneration(
                { ...params, description: chunkPrompt },
                chunkPrompt,
                context
            );

            if (!chunkResult.success) {
                throw new Error(`Chunk ${i + 1} generation failed: ${chunkResult.message}`);
            }

            generatedChunks.push((chunkResult.data as any)?.generatedCode || chunkResult.data || '');

            if (i < chunks.length - 1) {
                await sleep(1000);
            }
        }

        const combinedCode = generatedChunks.join('\n\n');

        return {
            success: true,
            data: {
                generatedCode: combinedCode,
                chunks: generatedChunks
            },
            message: `Chunked code generation completed (${chunks.length} parts)`,
        };
    } catch (error) {
        throw new Error(`Chunked code generation failed: ${error}`);
    }
}
