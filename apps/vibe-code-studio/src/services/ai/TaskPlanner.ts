/**
 * TaskPlanner Service
 *
 * Responsible for breaking down user requests into executable steps using AI.
 * This is the core of Agent Mode's intelligence.
 */
import { logger } from '../../services/Logger';
import {
  ActionType,
  AgentStep,
  AgentTask,
  ConfidenceFactor,
  EnhancedAgentStep,
  FallbackPlan,
  PlanningInsights,
  StepAction,
  StepConfidence,
  TaskPlanRequest,
  TaskPlanResponse,
  WorkspaceContext,
} from '../../types';
// import { PromptBuilder } from './PromptBuilder'; // Reserved for future prompt optimization
import { ProjectStructureDetector } from '../../utils/ProjectStructureDetector';
import { FileSystemService } from '../FileSystemService';

import { StrategyMemory } from './StrategyMemory';
import { UnifiedAIService } from './UnifiedAIService';

export class TaskPlanner {
  private structureDetector: ProjectStructureDetector | null = null;
  private strategyMemory: StrategyMemory;
  private pendingTaskChunks: Map<string, AgentStep[][]> = new Map();
  private readonly MAX_STEPS_PER_CHUNK = Number(import.meta.env.VITE_MAX_STEPS_PER_TASK) || 5;
  private readonly ENABLE_CHUNKING = import.meta.env.VITE_ENABLE_TASK_CHUNKING === 'true';

  constructor(
    private aiService: UnifiedAIService,
    private fileSystemService?: FileSystemService
  ) {
    if (fileSystemService) {
      this.structureDetector = new ProjectStructureDetector(fileSystemService);
    }
    // PHASE 6: Initialize strategy memory for confidence-based planning
    this.strategyMemory = new StrategyMemory();
  }

  /**
   * Plans a task by breaking down the user request into executable steps
   */
  async planTask(request: TaskPlanRequest): Promise<TaskPlanResponse> {
    const { userRequest, context, currentFileObject, options } = request;

    // PHASE 1: Analyze project BEFORE planning (like Cursor/Copilot)
    logger.debug('[TaskPlanner] 🔍 Phase 1: Analyzing project before planning...');
    const projectAnalysis = await this.analyzeProjectBeforePlanning(context.workspaceRoot);

    // Detect project structure to provide better context
    let projectStructure = null;
    if (this.structureDetector && context.workspaceRoot) {
      try {
        projectStructure = await this.structureDetector.detectStructure(context.workspaceRoot);
        logger.debug('[TaskPlanner] Detected project structure:', ProjectStructureDetector.formatSummary(projectStructure));
      } catch (error) {
        const isWebMode = !window.electron?.isElectron;
        if (isWebMode) {
          logger.warn('[TaskPlanner] Project structure detection failed in web mode. Using default structure.');
          logger.warn('[TaskPlanner] For full filesystem access, use the Electron desktop application.');
        } else {
          logger.error('[TaskPlanner] Failed to detect project structure:', error);
        }
      }
    }

    // Build planning prompt with full project analysis
    const planningPrompt = this.buildPlanningPrompt(userRequest, context, options, projectStructure, projectAnalysis);

    // Get AI response with full file content
    const aiContextRequest = {
      userQuery: planningPrompt,
      workspaceContext: {
        rootPath: context.workspaceRoot,
        totalFiles: 0,
        languages: ['TypeScript', 'JavaScript'],
        testFiles: 0,
        projectStructure: {},
        dependencies: {},
        exports: {},
        symbols: {},
        lastIndexed: new Date(),
        summary: 'DeepCode Editor workspace',
      },
      // Use actual file object if provided, otherwise create basic structure
      currentFile: currentFileObject || (context.currentFile ? {
        path: context.currentFile,
        language: 'typescript',
        content: '',
      } : undefined),
      // Include explicit file content for Agent Mode (like regular chat)
      fileContent: currentFileObject?.content,
      // Required properties for AIContextRequest
      relatedFiles: [],
      conversationHistory: [],
    };

    logger.debug('[TaskPlanner] Calling aiService.sendContextualMessage()');
    const aiResponse = await this.aiService.sendContextualMessage(aiContextRequest);

    logger.debug('[TaskPlanner] Received aiResponse:', aiResponse);
    logger.debug('[TaskPlanner] aiResponse.content:', aiResponse?.content);
    logger.debug('[TaskPlanner] Type of aiResponse.content:', typeof aiResponse?.content);

    // Parse AI response into structured task
    const task = this.parseTaskPlan(aiResponse.content, userRequest, options);

    // Extract reasoning and warnings
    const reasoning = this.extractReasoning(aiResponse.content);
    const warnings = this.extractWarnings(aiResponse.content, task);

    // Apply task chunking if enabled and needed
    const { currentChunk, hasMore } = this.chunkTask(task);

    if (hasMore) {
      warnings.push(
        `Task is large and has been split into ${currentChunk.metadata?.totalChunks || 'multiple'} chunks. ` +
        'Each chunk will be executed progressively to prevent timeouts.'
      );
      logger.info(
        `[TaskPlanner] Task chunked: ${task.steps.length} total steps, ` +
        `returning chunk 1 with ${currentChunk.steps.length} steps`
      );
    }

    return {
      task: currentChunk,
      reasoning,
      estimatedTime: this.estimateTime(currentChunk.steps.length),
      warnings,
      hasMore,
      metadata: {
        isChunked: hasMore,
        totalSteps: task.steps.length,
        currentChunkSteps: currentChunk.steps.length,
      },
    };
  }

  /**
   * Chunks a task into smaller manageable pieces for progressive execution
   * This prevents API timeouts and enables better progress tracking
   * Uses smart chunking to group related steps together
   */
  private chunkTask(task: AgentTask): { currentChunk: AgentTask; hasMore: boolean } {
    if (!this.ENABLE_CHUNKING || task.steps.length <= this.MAX_STEPS_PER_CHUNK) {
      // No chunking needed
      return { currentChunk: task, hasMore: false };
    }

    logger.debug(`[TaskPlanner] Smart chunking task with ${task.steps.length} steps`);

    // Use smart chunking algorithm
    const chunks = this.smartChunkSteps(task.steps);

    // Store remaining chunks for later
    if (chunks.length > 1) {
      this.pendingTaskChunks.set(task.id, chunks.slice(1));
    }

    // Create first chunk task
    const firstChunkTask: AgentTask = {
      ...task,
      title: `${task.title} (Part 1/${chunks.length})`,
      steps: chunks[0],
      metadata: {
        ...task.metadata,
        isChunked: true,
        chunkIndex: 0,
        totalChunks: chunks.length,
        originalStepCount: task.steps.length,
      },
    };

    logger.info(`[TaskPlanner] Created chunk 1/${chunks.length} with ${chunks[0].length} steps (smart grouped)`);

    return {
      currentChunk: firstChunkTask,
      hasMore: chunks.length > 1,
    };
  }

  /**
   * Smart chunking algorithm that groups related steps together
   * Respects logical boundaries and dependencies between steps
   */
  private smartChunkSteps(steps: AgentStep[]): AgentStep[][] {
    const chunks: AgentStep[][] = [];
    let currentChunk: AgentStep[] = [];

    // Group types that should stay together
    const cohesiveGroups = {
      file_operations: ['read_file', 'write_file', 'edit_file', 'delete_file'],
      analysis: ['analyze_code', 'review_project', 'search_codebase'],
      generation: ['generate_code', 'refactor_code'],
      execution: ['run_command', 'run_tests'],
      git: ['git_commit', 'git_push', 'git_pull'],
    };

    // Function to get group for an action type
    const getActionGroup = (actionType: string): string | null => {
      for (const [group, types] of Object.entries(cohesiveGroups)) {
        if (types.includes(actionType)) {
          return group;
        }
      }
      return null;
    };

    let lastGroup: string | null = null;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const currentGroup = getActionGroup(step.action.type);

      // Decide whether to start a new chunk
      let shouldStartNewChunk = false;

      if (currentChunk.length >= this.MAX_STEPS_PER_CHUNK) {
        // Chunk is at max size
        shouldStartNewChunk = true;
      } else if (currentChunk.length > 0 && currentChunk.length >= Math.floor(this.MAX_STEPS_PER_CHUNK * 0.7)) {
        // Chunk is near max size, check if we should break
        if (currentGroup !== lastGroup) {
          // Different group type, good place to break
          shouldStartNewChunk = true;
        }
      }

      // Special cases for logical boundaries
      if (step.action.type === 'generate_code' && step.description.toLowerCase().includes('synthesis')) {
        // Synthesis steps should start their own chunk
        if (currentChunk.length > 0) {
          chunks.push(currentChunk);
          currentChunk = [];
        }
      }

      if (shouldStartNewChunk && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = [];
        lastGroup = null;
      }

      currentChunk.push(step);
      lastGroup = currentGroup;

      // Check for natural boundaries
      if (step.action.type === 'run_tests' || step.action.type === 'git_commit') {
        // These actions often mark the end of a logical unit
        if (currentChunk.length >= 2) {
          chunks.push(currentChunk);
          currentChunk = [];
          lastGroup = null;
        }
      }
    }

    // Add remaining steps
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    // Log chunking decisions
    logger.debug('[TaskPlanner] Smart chunking results:');
    chunks.forEach((chunk, index) => {
      const types = chunk.map(s => s.action.type).join(', ');
      logger.debug(`  Chunk ${index + 1}: ${chunk.length} steps [${types}]`);
    });

    return chunks;
  }

  /**
   * Gets the next chunk for a previously chunked task
   */
  async getNextTaskChunk(taskId: string): Promise<AgentTask | null> {
    const remainingChunks = this.pendingTaskChunks.get(taskId);

    if (!remainingChunks || remainingChunks.length === 0) {
      this.pendingTaskChunks.delete(taskId);
      return null;
    }

    const nextChunk = remainingChunks.shift()!;
    const chunkIndex = (this.pendingTaskChunks.get(taskId)?.length || 0) === 0
      ? this.pendingTaskChunks.size
      : this.pendingTaskChunks.size - remainingChunks.length;

    const totalChunks = chunkIndex + remainingChunks.length + 1;

    // Update stored chunks
    if (remainingChunks.length === 0) {
      this.pendingTaskChunks.delete(taskId);
    }

    const nextTask: AgentTask = {
      id: `${taskId}_chunk_${chunkIndex + 1}`,
      title: `Continuing task (Part ${chunkIndex + 2}/${totalChunks})`,
      description: 'Continuing execution of chunked task',
      userRequest: '',
      steps: nextChunk,
      status: 'awaiting_approval',
      createdAt: new Date(),
      metadata: {
        isChunked: true,
        chunkIndex: chunkIndex + 1,
        totalChunks,
        parentTaskId: taskId,
      },
    };

    logger.info(`[TaskPlanner] Retrieved chunk ${chunkIndex + 2}/${totalChunks} with ${nextChunk.length} steps`);

    return nextTask;
  }

  /**
   * Checks if a task has pending chunks
   */
  hasRemainingChunks(taskId: string): boolean {
    return this.pendingTaskChunks.has(taskId) &&
           (this.pendingTaskChunks.get(taskId)?.length || 0) > 0;
  }

  /**
   * Analyzes the project BEFORE planning (like Cursor/Copilot do)
   * This solves the "understand full project before making changes" requirement
   */
  private async analyzeProjectBeforePlanning(workspaceRoot: string): Promise<string> {
    logger.debug(`[TaskPlanner] 📊 Analyzing project at: ${workspaceRoot}`);

    const analysis: string[] = [];
    analysis.push('=== PROJECT ANALYSIS ===\n');

    try {
      // 1. Read package.json for dependencies and scripts
      if (this.fileSystemService) {
        try {
          const packageJsonPath = `${workspaceRoot}/package.json`;
          const packageJson = await this.fileSystemService.readFile(packageJsonPath);
          const pkg = JSON.parse(packageJson);

          analysis.push('**Package Info:**');
          analysis.push(`- Name: ${pkg.name || 'Unknown'}`);
          analysis.push(`- Version: ${pkg.version || 'Unknown'}`);

          if (pkg.scripts) {
            analysis.push(`- Available Scripts: ${Object.keys(pkg.scripts).join(', ')}`);
          }

          if (pkg.dependencies || pkg.devDependencies) {
            const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
            const frameworks = [];
            if (allDeps['react']) {frameworks.push('React');}
            if (allDeps['react-native']) {frameworks.push('React Native');}
            if (allDeps['expo']) {frameworks.push('Expo');}
            if (allDeps['vue']) {frameworks.push('Vue');}
            if (allDeps['next']) {frameworks.push('Next.js');}
            if (allDeps['@tauri-apps/api']) {frameworks.push('Tauri');}
            if (allDeps['electron']) {frameworks.push('Electron');}

            if (frameworks.length > 0) {
              analysis.push(`- Frameworks Detected: ${frameworks.join(', ')}`);
            }
          }
          analysis.push('');
        } catch (error) {
          logger.debug('[TaskPlanner] No package.json found or error reading it');
        }

        // 2. Read README for project context
        try {
          const readmePath = `${workspaceRoot}/README.md`;
          const readme = await this.fileSystemService.readFile(readmePath);
          const firstLines = readme.split('\n').slice(0, 10).join('\n');
          analysis.push('**Project Description (from README):**');
          analysis.push(firstLines);
          analysis.push('');
        } catch (error) {
          logger.debug('[TaskPlanner] No README.md found');
        }

        // 3. Scan workspace for ALL source files (like Cursor does)
        try {
          const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.py', '.java', '.rs'];
          const allFiles: string[] = [];

          // Scan common directories
          const scanDirs = ['src', 'app', 'lib', 'components', 'pages', 'api'];

          for (const dir of scanDirs) {
            try {
              const dirPath = `${workspaceRoot}/${dir}`;
              const files = await this.fileSystemService.listDirectory(dirPath);

              for (const file of files) {
                if (sourceExtensions.some(ext => file.name.endsWith(ext))) {
                  allFiles.push(`${dir}/${file.name}`);
                }
              }
            } catch {
              // Directory doesn't exist, continue
            }
          }

          // Also check root level
          try {
            const rootFiles = await this.fileSystemService.listDirectory(workspaceRoot);
            for (const file of rootFiles) {
              if (sourceExtensions.some(ext => file.name.endsWith(ext))) {
                allFiles.push(file.name);
              }
            }
          } catch {
            // Ignore errors
          }

          if (allFiles.length > 0) {
            analysis.push('**All Source Files in Project:**');
            const displayFiles = allFiles.slice(0, 20); // Show first 20
            displayFiles.forEach(f => analysis.push(`  - ${f}`));
            if (allFiles.length > 20) {
              analysis.push(`  ... and ${allFiles.length - 20} more files`);
            }
            analysis.push('');
            analysis.push(`💡 **When user says "review 3 files", pick the 3 most relevant from this list**\n`);
          }
        } catch (error) {
          logger.debug('[TaskPlanner] Error scanning workspace files:', error);
        }

        // 4. Detect actual entry point file locations
        try {
          const commonPaths = [
            'src/App.tsx', 'src/App.ts', 'src/App.jsx', 'src/App.js',
            'app/index.tsx', 'app/_layout.tsx',
            'src/index.tsx', 'src/index.ts', 'src/index.js',
            'src/main.tsx', 'src/main.ts',
            'index.js', 'index.ts',
          ];

          const foundFiles: string[] = [];
          for (const path of commonPaths) {
            try {
              await this.fileSystemService.getFileStats(`${workspaceRoot}/${path}`);
              foundFiles.push(path);
            } catch {
              // File doesn't exist, continue
            }
          }

          if (foundFiles.length > 0) {
            analysis.push('**Entry Points Found:**');
            foundFiles.forEach(f => analysis.push(`  - ${f}`));
            analysis.push('');
          }
        } catch (error) {
          logger.debug('[TaskPlanner] Error detecting file locations:', error);
        }

        // 5. Check for tests
        try {
          const testPatterns = ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '__tests__/**'];
          analysis.push('**Testing:**');
          analysis.push(`- Test patterns to look for: ${testPatterns.join(', ')}`);
          analysis.push('');
        } catch (error) {
          logger.debug('[TaskPlanner] Error checking tests');
        }
      }

      analysis.push('=== END ANALYSIS ===\n');
      const result = analysis.join('\n');
      logger.debug('[TaskPlanner] ✅ Project analysis complete');
      logger.debug(result);
      return result;

    } catch (error) {
      logger.error('[TaskPlanner] Error during project analysis:', error);
      return 'Project analysis failed. Proceeding with minimal context.';
    }
  }

  /**
   * Identifies if a task should use chunked code generation for large outputs
   * Reserved for future chunked generation optimization
   */
   
  private _shouldUseChunkedGeneration(userRequest: string): boolean {
    const largeCodingKeywords = [
      'comprehensive test suite',
      'complete test infrastructure', 
      'full api tests',
      'integration tests',
      'unit tests for all',
      'test all components',
      'create tests for',
      'generate all tests',
      'testing framework',
      'test coverage'
    ];
    
    const lowerRequest = userRequest.toLowerCase();
    return largeCodingKeywords.some(keyword => lowerRequest.includes(keyword));
  }

  /**
   * Creates chunked tasks for large code generation
   * Reserved for future chunked generation implementation
   */
   
  private _createChunkedCodeGenerationSteps(_userRequest: string, _context: WorkspaceContext): AgentStep[] {
    const chunks = [
      {
        title: 'Setup Test Configuration',
        description: 'Create Jest/testing configuration files and test utilities',
        order: 1,
      },
      {
        title: 'Create Test Mocks and Utilities',
        description: 'Generate mock implementations and helper functions for testing',
        order: 2,
      },
      {
        title: 'Generate Unit Tests',
        description: 'Create unit tests for individual components and functions',
        order: 3,
      },
      {
        title: 'Generate Integration Tests',
        description: 'Create integration tests for workflows and API endpoints',
        order: 4,
      },
      {
        title: 'Create Test Documentation',
        description: 'Generate documentation for test suite and coverage',
        order: 5,
      }
    ];

    return chunks.map((chunk, index) => ({
      id: `chunk_${index + 1}`,
      taskId: 'task_chunked_generation',
      title: chunk.title,
      description: `${chunk.description}\n\nContext: ${_userRequest}`,
      order: chunk.order,
      action: {
        type: 'generate_code' as const,
        params: {
          description: chunk.description,
          context: `User request: ${_userRequest}`,
          targetLanguage: 'TypeScript',
          fileType: 'test file',
          chunked: true,
          chunkIndex: index,
          totalChunks: chunks.length,
        },
      },
      requiresApproval: false,
      maxRetries: 2,
      retryCount: 0,
      status: 'pending' as const,
    }));
  }

  /**
   * Builds the prompt for task planning
   */
  private buildPlanningPrompt(
    userRequest: string,
    context: TaskPlanRequest['context'],
    options?: TaskPlanRequest['options'],
    projectStructure?: any,
    projectAnalysis?: string
  ): string {
    const maxSteps = this.ENABLE_CHUNKING ? this.MAX_STEPS_PER_CHUNK * 3 : (options?.maxSteps || 10);
    const allowDestructive = options?.allowDestructiveActions ?? true;

    // Build project structure section
    let structureSection = '';
    if (projectStructure) {
      structureSection = `\nPROJECT STRUCTURE DETECTED:
- Type: ${projectStructure.type}${projectStructure.detectedFramework ? ` (${projectStructure.detectedFramework})` : ''}
- Entry Points: ${projectStructure.entryPoints.slice(0, 3).map((p: string) => p.split('/').pop()).join(', ') || 'Not detected'}
- Config Files: ${projectStructure.configFiles.map((p: string) => p.split('/').pop()).join(', ') || 'None'}

⚠️ IMPORTANT: Use the detected entry points above, NOT generic paths like "src/index.ts".
For Expo projects, use "app/index.tsx" or "app/_layout.tsx".
For backend projects, use "server.ts" or "backend/hono.ts".
`;
    }

    // Add project analysis section (Phase 1 fix)
    let analysisSection = '';
    if (projectAnalysis) {
      analysisSection = `\n${projectAnalysis}\n⚠️ CRITICAL: Use the ACTUAL file paths found in the analysis above. Do NOT guess paths!`;
    }

    return `You are an AUTONOMOUS software engineering agent (like Cursor, Windsurf, Copilot) planning a task for an AI-powered code editor.

🤖 AGENT MODE: You have FULL file system access. You can read ANY file, search the codebase, run commands, and make changes autonomously.

USER REQUEST: ${userRequest}

WORKSPACE CONTEXT:
- Root: ${context.workspaceRoot}
- Open Files: ${context.openFiles?.join(', ') || 'None'}
- Current File: ${context.currentFile || 'None'}
- Recent Files: ${context.recentFiles?.join(', ') || 'None'}${structureSection}${analysisSection}

⚡ AUTONOMOUS BEHAVIOR RULES:
1. **Never ask the user to provide file contents** - You can read files yourself using read_file action
2. **Be proactive** - If user says "review 3 files", search/identify the files and read them automatically
3. **Use search_codebase** - To find files matching patterns or recently modified files
4. **Chain actions** - Multiple steps can accomplish complex tasks autonomously
5. **Infer context** - Use workspace analysis and file locations to make intelligent decisions

🔴 MANDATORY SYNTHESIS REQUIREMENTS (CRITICAL - DO NOT SKIP):

For ANY task involving multiple files/analyses, you MUST include a FINAL synthesis step:

✅ CORRECT Pattern for "review 3 files":
Step 1: read_file (App.tsx)
Step 2: read_file (main.tsx)
Step 3: read_file (App.test.tsx)
Step 4-6: analyze_code for each file (optional - individual analysis)
Step 7: generate_code with description="Synthesize comprehensive review of all 3 files analyzed above. Provide: 1) Overall code quality assessment, 2) Common patterns/issues across files, 3) Priority improvements, 4) Architecture insights. Be detailed and actionable."

❌ WRONG - Missing synthesis (will fail):
Step 1-3: read files
Step 4-6: analyze files
(NO FINAL SYNTHESIS - USER SEES NOTHING!)

The final generate_code step is what displays results to the user. Without it, all work is invisible!

Example synthesis descriptions:
- "Comprehensive review summary of the 3 React components analyzed above"
- "Synthesize findings from all analyzed files into actionable recommendations"
- "Provide detailed project review report combining all file analyses"
- "Generate executive summary of code quality across reviewed files"

CONSTRAINTS:
- Maximum steps: ${maxSteps}${this.ENABLE_CHUNKING ? ' (Tasks will be automatically chunked if larger)' : ''}
- Destructive actions (delete, overwrite): ${allowDestructive ? 'Allowed' : 'Not allowed'}${this.ENABLE_CHUNKING ? `
- Task Chunking: ENABLED - Large tasks will be split into chunks of ${this.MAX_STEPS_PER_CHUNK} steps for progressive execution` : ''}

AVAILABLE ACTIONS (with required parameter schemas):

1. read_file - Read a specific file's contents
   Required params: { filePath: string }
   Example: { "type": "read_file", "params": { "filePath": "C:\\\\path\\\\to\\\\file.ts" } }

2. write_file - Create new file or overwrite existing
   Required params: { filePath: string, content: string }
   Example: { "type": "write_file", "params": { "filePath": "output.md", "content": "# Report" } }

3. edit_file - Edit specific parts of a file
   Required params: { filePath: string, oldContent: string, newContent: string }
   Example: { "type": "edit_file", "params": { "filePath": "app.ts", "oldContent": "const x = 1", "newContent": "const x = 2" } }

4. delete_file - Delete a file
   Required params: { filePath: string }
   Example: { "type": "delete_file", "params": { "filePath": "temp.txt" } }

5. create_directory - Create a directory
   Required params: { path: string }
   Example: { "type": "create_directory", "params": { "path": "C:\\\\new\\\\folder" } }

6. run_command - Run terminal command
   Required params: { command: string }
   Optional params: { workingDirectory: string }
   Example: { "type": "run_command", "params": { "command": "npm install", "workingDirectory": "C:\\\\project" } }

7. search_codebase - Search for code patterns
   Required params: { searchQuery: string | string[] }
   Examples:
   - Single term: { "type": "search_codebase", "params": { "searchQuery": "TODO" } }
   - Multiple terms: { "type": "search_codebase", "params": { "searchQuery": ["asset", "image", "file"] } }

8. analyze_code - Analyze a specific file (NOT directories)
   Required params: { filePath: string }
   Example: { "type": "analyze_code", "params": { "filePath": "src/main.ts" } }

9. refactor_code - Refactor code with AI assistance
   Required params: { codeSnippet: string }
   Optional params: { requirements: string }
   Example: { "type": "refactor_code", "params": { "codeSnippet": "function foo() {...}", "requirements": "Use async/await" } }

10. generate_code - Generate new code from description
    Required params: { description: string }
    Optional params: { targetLanguage: string }
    Example: { "type": "generate_code", "params": { "description": "Create a user authentication class", "targetLanguage": "TypeScript" } }

11. run_tests - Execute tests
    Optional params: { testPattern: string, rootPath: string }
    Example: { "type": "run_tests", "params": { "testPattern": "*.test.ts", "rootPath": "C:\\\\project" } }

12. git_commit - Create git commit
    Required params: { message: string }
    Example: { "type": "git_commit", "params": { "message": "feat: add new feature" } }

13. review_project - Analyze entire workspace/project for code quality
    Required params: { workspaceRoot: string }
    Example: { "type": "review_project", "params": { "workspaceRoot": "C:\\\\workspace" } }
    Returns: Complete quality report with metrics, issues, and file-by-file analysis
    Use this for: "review my code", "check code quality", "analyze the project"

IMPORTANT: Use ONLY the parameter names specified above. Do NOT invent new parameters like "directory", "analysisType", "patterns", etc.

YOUR TASK:
Break down the user request into a sequence of executable steps. Each step should:
1. Be atomic and independently executable
2. Have clear success criteria
3. Specify the exact action type and parameters
4. Indicate if it requires user approval (destructive/critical actions)
5. Be ordered logically with dependencies considered

🎯 SYNTHESIS REQUIREMENT:
If your plan includes reading/analyzing multiple files (2+), you MUST add a FINAL step using generate_code to synthesize results.
This is not optional - plans without synthesis will fail validation!

OUTPUT FORMAT (JSON):
{
  "title": "Short task title",
  "description": "Detailed task description",
  "reasoning": "Why these steps accomplish the goal",
  "steps": [
    {
      "order": 1,
      "title": "Step title",
      "description": "What this step does",
      "action": {
        "type": "action_type",
        "params": {
          "filePath": "/path/to/file",
          "content": "...",
          ...other params
        }
      },
      "requiresApproval": true/false,
      "maxRetries": 3
    }
  ],
  "warnings": ["warning1", "warning2"] // Optional warnings about risks
}

Generate the task plan now:`;
  }

  /**
   * Parses AI response into structured AgentTask
   */
  private parseTaskPlan(
    aiResponse: string,
    userRequest: string,
    options?: TaskPlanRequest['options']
  ): AgentTask {
    try {
      // Validate aiResponse exists
      if (!aiResponse || typeof aiResponse !== 'string') {
        logger.error('Invalid AI response:', aiResponse);
        throw new Error('AI response is empty or invalid');
      }

      logger.debug('[TaskPlanner] Raw AI response (first 500 chars):', aiResponse.substring(0, 500));

      // Extract JSON from various formats (like Cursor does)
      let jsonStr = aiResponse;

      // Try 1: Extract from markdown code blocks
      const codeBlockMatch = aiResponse.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
      if (codeBlockMatch) {
        logger.debug('[TaskPlanner] Found JSON in markdown code block');
        jsonStr = codeBlockMatch[1];
      } else {
        // Try 2: Find JSON object between { and } (handle conversational text)
        const jsonObjectMatch = aiResponse.match(/\{[\s\S]*"taskId"[\s\S]*\}/);
        if (jsonObjectMatch) {
          logger.debug('[TaskPlanner] Found JSON object in text');
          jsonStr = jsonObjectMatch[0];
        } else {
          // Try 3: Look for any valid JSON structure
          const startIndex = aiResponse.indexOf('{');
          const endIndex = aiResponse.lastIndexOf('}');
          if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            logger.debug('[TaskPlanner] Extracting JSON by brace positions');
            jsonStr = aiResponse.substring(startIndex, endIndex + 1);
          }
        }
      }

      // Clean up common issues
      jsonStr = jsonStr.trim();

      if (!jsonStr || (!jsonStr.startsWith('{') && !jsonStr.startsWith('['))) {
        logger.error('[TaskPlanner] Could not extract valid JSON from response');
        logger.error('[TaskPlanner] Cleaned string:', jsonStr.substring(0, 200));
        throw new Error('Could not extract JSON from AI response');
      }

      logger.debug('[TaskPlanner] Attempting to parse JSON (first 300 chars):', jsonStr.substring(0, 300));
      const parsed = JSON.parse(jsonStr);
      logger.debug('[TaskPlanner] Successfully parsed JSON');

      // Create task ID
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Build steps
      const steps: AgentStep[] = parsed.steps.map((step: any, index: number) => ({
        id: `${taskId}_step_${index + 1}`,
        taskId,
        order: step.order || index + 1,
        title: step.title,
        description: step.description,
        action: this.validateAction(step.action),
        status: 'pending' as const,
        requiresApproval: step.requiresApproval ?? this.shouldRequireApproval(step.action, options),
        retryCount: 0,
        maxRetries: step.maxRetries || 3,
      }));

      // Create task
      const task: AgentTask = {
        id: taskId,
        title: parsed.title || this.generateTitle(userRequest),
        description: parsed.description || userRequest,
        userRequest,
        steps,
        status: 'awaiting_approval',
        createdAt: new Date(),
      };

      return task;
    } catch (error) {
      logger.error('Failed to parse task plan:', error);

      // Fallback: create a simple single-step task
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: taskId,
        title: 'Manual Task',
        description: userRequest,
        userRequest,
        steps: [
          {
            id: `${taskId}_step_1`,
            taskId,
            order: 1,
            title: 'Execute Request',
            description: userRequest,
            action: {
              type: 'custom',
              params: { userRequest },
            },
            status: 'pending',
            requiresApproval: true,
            retryCount: 0,
            maxRetries: 3,
          },
        ],
        status: 'awaiting_approval',
        createdAt: new Date(),
      };
    }
  }

  /**
   * Validates and sanitizes action parameters
   */
  private validateAction(action: any): StepAction {
    const validTypes: ActionType[] = [
      'read_file',
      'write_file',
      'edit_file',
      'delete_file',
      'create_directory',
      'run_command',
      'search_codebase',
      'analyze_code',
      'refactor_code',
      'generate_code',
      'run_tests',
      'git_commit',
      'review_project',
      'custom',
    ];

    if (!validTypes.includes(action.type)) {
      throw new Error(`Invalid action type: ${action.type}`);
    }

    return {
      type: action.type as ActionType,
      params: action.params || {},
    };
  }

  /**
   * Determines if an action should require approval
   */
  private shouldRequireApproval(action: StepAction, options?: TaskPlanRequest['options']): boolean {
    // Always require approval for destructive actions
    const destructiveActions: ActionType[] = ['delete_file', 'write_file', 'git_commit'];
    if (destructiveActions.includes(action.type)) {
      return true;
    }

    // Require approval for commands that could be dangerous
    if (action.type === 'run_command') {
      const command = (action.params.command as string) || '';
      const dangerousCommands = ['rm', 'del', 'format', 'shutdown', 'reboot'];
      if (dangerousCommands.some((cmd) => command.toLowerCase().includes(cmd))) {
        return true;
      }
    }

    // If option requires approval for all, return true
    if (options?.requireApprovalForAll) {
      return true;
    }

    return false;
  }

  /**
   * Extracts reasoning from AI response
   */
  private extractReasoning(aiResponse: string): string {
    try {
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
      
      if (!jsonStr) {
        return 'Task decomposed into executable steps';
      }
      
      const parsed = JSON.parse(jsonStr);
      return parsed.reasoning || 'No reasoning provided';
    } catch {
      // Extract reasoning from text if JSON parsing fails
      const reasoningMatch = aiResponse.match(/reasoning[":]+\s*([^,\n}]+)/i);
      return reasoningMatch?.[1]?.trim() || 'Task decomposed into executable steps';
    }
  }

  /**
   * Extracts warnings from AI response and validates task safety
   */
  private extractWarnings(aiResponse: string, task: AgentTask): string[] {
    const warnings: string[] = [];

    try {
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
      
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if (parsed.warnings && Array.isArray(parsed.warnings)) {
          warnings.push(...parsed.warnings);
        }
      }
    } catch {
      // Ignore parsing errors
    }

    // Add automatic warnings based on actions
    const hasDeleteActions = task.steps.some((step) => step.action.type === 'delete_file');
    if (hasDeleteActions) {
      warnings.push('This task includes file deletions - changes may not be reversible');
    }

    const hasGitCommit = task.steps.some((step) => step.action.type === 'git_commit');
    if (hasGitCommit) {
      warnings.push('This task will create git commits');
    }

    const hasCommands = task.steps.some((step) => step.action.type === 'run_command');
    if (hasCommands) {
      warnings.push('This task will execute terminal commands');
    }

    if (task.steps.length > 8) {
      warnings.push(`This is a complex task with ${task.steps.length} steps - it may take several minutes`);
    }

    return warnings;
  }

  /**
   * Generates a title from user request
   */
  private generateTitle(userRequest: string): string {
    // Simple title generation - take first sentence or first 50 chars
    const firstSentence = userRequest.split(/[.!?]/)[0];
    if (!firstSentence) {return userRequest.substring(0, 50);}
    return firstSentence.length > 50 ? `${firstSentence.substring(0, 47)  }...` : firstSentence;
  }

  /**
   * Estimates execution time based on step count
   */
  private estimateTime(stepCount: number): string {
    if (stepCount <= 2) {return '< 1 minute';}
    if (stepCount <= 5) {return '1-3 minutes';}
    if (stepCount <= 10) {return '3-5 minutes';}
    return '5+ minutes';
  }

  /**
   * Validates task before execution
   */
  /**
   * PHASE 6: Calculate confidence score for a step based on memory and context
   *
   * Analyzes a step to determine confidence in successful execution by considering:
   * - Memory-backed patterns from past successes
   * - File existence likelihood (for file operations)
   * - Action complexity (code generation is riskier)
   *
   * Scoring Algorithm:
   * - Baseline: 50 points
   * - Memory match: +40 points (weighted by success rate)
   * - File exists: +20 points
   * - Complex action: -15 points
   *
   * Risk Levels:
   * - Low (70-100): High confidence, no fallbacks needed
   * - Medium (40-69): Moderate confidence, generate fallbacks
   * - High (0-39): Low confidence, multiple fallbacks required
   *
   * @param step - The agent step to evaluate
   * @param memory - Strategy memory for querying past patterns
   * @returns StepConfidence with score, factors, memory backing, and risk level
   *
   * @example
   * ```typescript
   * const confidence = await planner.calculateStepConfidence(step, memory);
   * if (confidence.riskLevel === 'high') {
   *   logger.debug('Step has low confidence, generating fallbacks...');
   * }
   * ```
   */
  async calculateStepConfidence(
    step: AgentStep,
    memory: StrategyMemory
  ): Promise<StepConfidence> {
    let score = 50; // Baseline
    const factors: ConfidenceFactor[] = [];

    // Factor 1: Strategy Memory (40 points potential)
    const patterns = await memory.queryPatterns({
      problemDescription: step.description,
      actionType: step.action.type,
      maxResults: 1,
    });

    if (patterns.length > 0 && patterns[0].relevanceScore > 70) {
      const boost = (patterns[0].pattern.successRate / 100) * 40;
      score += boost;
      factors.push({
        name: 'Memory Match',
        impact: boost,
        description: `Found similar past success (${patterns[0].pattern.successRate}% success rate)`,
      });
    }

    // Factor 2: File Existence (20 points)
    if (step.action.type === 'read_file' || step.action.type === 'write_file') {
      const {filePath} = step.action.params;
      if (filePath && typeof filePath === 'string') {
        const exists = await this.estimateFileExistence(filePath);
        if (exists) {
          score += 20;
          factors.push({
            name: 'File Likely Exists',
            impact: 20,
            description: 'File path follows common patterns',
          });
        } else {
          score -= 10;
          factors.push({
            name: 'File May Not Exist',
            impact: -10,
            description: 'Unusual file path',
          });
        }
      }
    }

    // Factor 3: Action Complexity (variance)
    if (['generate_code', 'refactor_code'].includes(step.action.type)) {
      score -= 15; // Complex actions are riskier
      factors.push({
        name: 'Complex Action',
        impact: -15,
        description: 'Code generation has inherent uncertainty',
      });
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (score >= 70) {riskLevel = 'low';}
    else if (score >= 40) {riskLevel = 'medium';}
    else {riskLevel = 'high';}

    return {
      score: Math.min(100, Math.max(0, score)),
      factors,
      memoryBacked: patterns.length > 0,
      riskLevel,
    };
  }

  /**
   * PHASE 6: Generate fallback plans for risky steps
   *
   * Creates alternative execution strategies for steps with medium/high risk levels.
   * Fallbacks are attempted sequentially if the primary approach fails.
   *
   * Fallback Strategies by Action Type:
   * - read_file: Search workspace first, then create default template
   * - Config files: Create with default JSON ({})
   * - High risk: Request user assistance as last resort
   *
   * Fallback Confidence:
   * - Search strategy: 75% (usually finds the file)
   * - Create default: 60% (may not match expected format)
   * - User assistance: 90% (human can always help)
   *
   * @param step - The agent step to create fallbacks for
   * @param confidence - The calculated confidence for this step
   * @returns Array of fallback plans (empty for low-risk steps)
   *
   * @example
   * ```typescript
   * const fallbacks = await planner.generateFallbackPlans(step, confidence);
   * logger.debug(`Generated ${fallbacks.length} fallback plans`);
   * // Fallback 1: Search workspace
   * // Fallback 2: Create default
   * // Fallback 3: Ask user
   * ```
   */
  async generateFallbackPlans(
    step: AgentStep,
    confidence: StepConfidence
  ): Promise<FallbackPlan[]> {
    const fallbacks: FallbackPlan[] = [];

    // Only generate fallbacks for medium/high risk steps
    if (confidence.riskLevel === 'low') {
      return fallbacks;
    }

    // Fallback 1: Search before read
    if (step.action.type === 'read_file') {
      const filePath = step.action.params.filePath as string;
      if (filePath) {
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || filePath;
        fallbacks.push({
          id: `fallback_${step.id}_1`,
          stepId: step.id,
          trigger: 'If file not found',
          alternativeAction: {
            type: 'search_codebase',
            params: {
              searchQuery: `*${fileName}`,
            },
          },
          confidence: 75,
          reasoning: 'Search workspace for file instead of direct read',
        });
      }
    }

    // Fallback 2: Create with default template
    if (step.action.type === 'read_file' && step.description.toLowerCase().includes('config')) {
      fallbacks.push({
        id: `fallback_${step.id}_2`,
        stepId: step.id,
        trigger: 'If file not found after search',
        alternativeAction: {
          type: 'write_file',
          params: {
            filePath: step.action.params.filePath,
            content: '{}', // Default empty config
          },
        },
        confidence: 60,
        reasoning: 'Create default config if none exists',
      });
    }

    // Fallback 3: Ask user (last resort)
    if (confidence.riskLevel === 'high') {
      fallbacks.push({
        id: `fallback_${step.id}_ask`,
        stepId: step.id,
        trigger: 'If all attempts fail',
        alternativeAction: {
          type: 'custom',
          params: {
            action: 'request_user_input',
            prompt: `Unable to complete: ${step.description}. Please provide guidance.`,
          },
        },
        confidence: 90, // User input is highly reliable
        reasoning: 'Request user assistance as final fallback',
      });
    }

    return fallbacks;
  }

  /**
   * PHASE 6: Estimate if a file exists based on patterns
   */
  private async estimateFileExistence(filePath: string): Promise<boolean> {
    // Common file patterns that likely exist
    const commonPatterns = [
      'package.json',
      'tsconfig.json',
      'vite.config',
      'README.md',
      '.gitignore',
      'index.',
      'main.',
      'App.',
    ];

    return commonPatterns.some((pattern) => filePath.includes(pattern));
  }

  /**
   * PHASE 6: Plan task with confidence scores and fallbacks
   *
   * Enhanced planning that analyzes each step's success probability and generates
   * fallback strategies for risky steps. This is the core Phase 6 implementation.
   *
   * Process:
   * 1. Generate base plan (using existing planTask logic)
   * 2. Calculate confidence for each step
   * 3. Generate fallbacks for medium/high-risk steps
   * 4. Calculate overall planning insights
   *
   * Planning Insights Include:
   * - Overall confidence (average across all steps)
   * - High-risk step count
   * - Memory-backed step count
   * - Total fallbacks generated
   * - Estimated success rate
   *
   * @param request - Task planning request with user intent and context
   * @param memory - Strategy memory for querying successful patterns
   * @returns Enhanced task plan response with insights and confidence data
   *
   * @example
   * ```typescript
   * const result = await planner.planTaskWithConfidence(request, memory);
   * logger.debug(`Overall confidence: ${result.insights.overallConfidence}%`);
   * logger.debug(`Success rate estimate: ${result.insights.estimatedSuccessRate}%`);
   * logger.debug(`Generated ${result.insights.fallbacksGenerated} fallback plans`);
   * ```
   */
  async planTaskWithConfidence(
    request: TaskPlanRequest,
    memory: StrategyMemory
  ): Promise<TaskPlanResponse & { insights: PlanningInsights }> {
    // Generate base plan (existing logic)
    const basePlan = await this.planTask(request);

    // Enhance each step with confidence
    let totalConfidence = 0;
    let highRiskCount = 0;
    let memoryBackedCount = 0;
    let fallbackCount = 0;

    for (const step of basePlan.task.steps) {
      // Calculate confidence
      const confidence = await this.calculateStepConfidence(step, memory);
      (step as EnhancedAgentStep).confidence = confidence;
      totalConfidence += confidence.score;

      if (confidence.riskLevel === 'high') {highRiskCount++;}
      if (confidence.memoryBacked) {memoryBackedCount++;}

      // Generate fallbacks for risky steps
      const fallbacks = await this.generateFallbackPlans(step, confidence);
      if (fallbacks.length > 0) {
        (step as EnhancedAgentStep).fallbackPlans = fallbacks;
        fallbackCount += fallbacks.length;
      }
    }

    const insights: PlanningInsights = {
      overallConfidence: totalConfidence / basePlan.task.steps.length,
      highRiskSteps: highRiskCount,
      memoryBackedSteps: memoryBackedCount,
      fallbacksGenerated: fallbackCount,
      estimatedSuccessRate: this.estimateSuccessRate(
        totalConfidence / basePlan.task.steps.length,
        memoryBackedCount / basePlan.task.steps.length
      ),
    };

    return {
      ...basePlan,
      insights,
    };
  }

  /**
   * PHASE 6: Plan task with enhanced confidence (convenience wrapper)
   *
   * Simplified interface for UI components that uses the internal StrategyMemory instance.
   * This is the recommended method for Agent Mode UI and other high-level consumers.
   *
   * Benefits:
   * - No need to manage StrategyMemory instance
   * - Automatic confidence scoring
   * - Automatic fallback generation
   * - Planning insights included
   *
   * Use Cases:
   * - Agent Mode V2 UI
   * - Autonomous task execution
   * - Background agent system
   * - Any component needing confidence-aware planning
   *
   * @param request - Task planning request with user intent and context
   * @returns Enhanced task plan response with insights and confidence data
   *
   * @example
   * ```typescript
   * // Simple usage - no memory management needed
   * const result = await taskPlanner.planTaskEnhanced({
   *   userRequest: 'Create a new React component',
   *   context: { workspaceRoot: '/project', openFiles: [] }
   * });
   *
   * // Check insights before execution
   * if (result.insights.highRiskSteps > 0) {
   *   logger.warn('Task has high-risk steps, proceed with caution');
   * }
   * ```
   */
  async planTaskEnhanced(request: TaskPlanRequest): Promise<TaskPlanResponse & { insights: PlanningInsights }> {
    logger.debug('[TaskPlanner] 🎯 Using Phase 6 enhanced planning with confidence scores...');
    return this.planTaskWithConfidence(request, this.strategyMemory);
  }

  /**
   * PHASE 6: Estimate overall success rate based on confidence and memory
   */
  private estimateSuccessRate(avgConfidence: number, memoryRatio: number): number {
    // Base success rate from confidence
    let successRate = avgConfidence;

    // Bonus from memory-backed steps
    successRate += memoryRatio * 15;

    // Cap at 95% (never 100% certain)
    return Math.min(95, successRate);
  }

  validateTask(task: AgentTask): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!task.steps || task.steps.length === 0) {
      errors.push('Task has no steps');
    }

    task.steps.forEach((step, index) => {
      if (!step.action || !step.action.type) {
        errors.push(`Step ${index + 1} has no action type`);
      }

      if (!step.title) {
        errors.push(`Step ${index + 1} has no title`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
