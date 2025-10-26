/**
 * ExecutionEngine Service
 *
 * Executes agent task steps with approval gates, error handling, and rollback support.
 * Implements 2025 best practices for agentic AI workflows.
 */
import { logger } from '../../services/Logger';
import {
  ActionType,
  AgentStep,
  AgentTask,
  ApprovalRequest,
  RollbackResult,
  StepAction,
  StepResult,
} from '../../types';
import { CodeQualityAnalyzer } from '../CodeQualityAnalyzer';
import { FileSystemService } from '../FileSystemService';
// Import GitService conditionally - it uses Node.js child_process
// In browser mode, a mock GitService will be passed from App.tsx
import type { GitService } from '../GitService';
import { LiveEditorStream } from '../LiveEditorStream'; // PHASE 7: Live editor streaming
import { WorkspaceService } from '../WorkspaceService';

import { MetacognitiveLayer, StuckPattern } from './MetacognitiveLayer'; // PHASE 3: Help-seeking when stuck
import { ReActExecutor } from './ReActExecutor'; // PHASE 4: Reason-Act-Observe-Reflect pattern
import { StrategyMemory } from './StrategyMemory'; // PHASE 5: Learning across tasks
import { TaskPersistence } from './TaskPersistence';
import { UnifiedAIService } from './UnifiedAIService';

/**
 * Custom error for non-retryable failures (e.g., file not found)
 * These errors should skip the step instead of retrying
 */
export class NonRetryableError extends Error {
  constructor(message: string, public readonly reason: string = 'non-retryable') {
    super(message);
    this.name = 'NonRetryableError';
  }
}

export interface ExecutionCallbacks {
  onStepStart?: (step: AgentStep) => void;
  onStepComplete?: (step: AgentStep, result: StepResult) => void;
  onStepError?: (step: AgentStep, error: Error) => void;
  onStepApprovalRequired?: (step: AgentStep, request: ApprovalRequest) => Promise<boolean>;
  onTaskProgress?: (completedSteps: number, totalSteps: number) => void;
  onTaskComplete?: (task: AgentTask) => void;
  onTaskError?: (task: AgentTask, error: Error) => void;
  onFileChanged?: (filePath: string, action: 'created' | 'modified' | 'deleted') => void;
}

export class ExecutionEngine {
  private executionHistory: Map<string, StepResult[]> = new Map();
  private isPaused: boolean = false;
  private taskPersistence: TaskPersistence;
  private codeQualityAnalyzer: CodeQualityAnalyzer;
  private metacognitiveLayer: MetacognitiveLayer; // PHASE 3: Self-awareness and help-seeking
  private reactExecutor: ReActExecutor; // PHASE 4: Thought-Action-Observation-Reflection
  private strategyMemory: StrategyMemory; // PHASE 5: Learning across tasks
  private liveStream?: LiveEditorStream; // PHASE 7: Live editor streaming
  private enableReAct: boolean = true; // Feature flag for ReAct pattern
  private enableMemory: boolean = true; // Feature flag for Strategy Memory
  private currentCallbacks?: ExecutionCallbacks;
  private currentTaskState: {
    task: AgentTask | null;
    userRequest: string;
    workspaceRoot: string;
  } = { task: null, userRequest: '', workspaceRoot: '' };

  constructor(
    private fileSystemService: FileSystemService,
    private aiService: UnifiedAIService,
    private workspaceService: WorkspaceService,
    private gitService: GitService
  ) {
    this.taskPersistence = new TaskPersistence(fileSystemService);
    this.codeQualityAnalyzer = new CodeQualityAnalyzer(fileSystemService);
    this.metacognitiveLayer = new MetacognitiveLayer(aiService); // PHASE 3: Initialize metacognitive monitoring
    this.reactExecutor = new ReActExecutor(aiService); // PHASE 4: Initialize ReAct pattern executor
    this.strategyMemory = new StrategyMemory(); // PHASE 5: Initialize strategy memory

    // Use deepseek-reasoner for agentic tasks (Cursor-style model selection)
    // Reasoning model provides chain-of-thought for complex multi-step operations
    this.aiService.setModel('deepseek-reasoner').catch((error) => {
      logger.warn('[ExecutionEngine] Failed to set reasoning model, falling back to default:', error);
    });
  }

  /**
   * Resolves a file path against workspace root
   * Handles both relative and absolute paths
   */
  private resolveFilePath(path: string): string {
    // If no workspace root, return as-is
    if (!this.currentTaskState.workspaceRoot) {
      logger.warn('[ExecutionEngine] No workspace root set, using path as-is:', path);
      return path;
    }

    // Use FileSystemService's existing resolution logic
    const resolvedPath = this.fileSystemService.resolveWorkspacePath(path, this.currentTaskState.workspaceRoot);

    logger.debug(`[ExecutionEngine] Path resolution: "${path}" → "${resolvedPath}"`);
    return resolvedPath;
  }

  /**
   * Sets task context for persistence
   */
  setTaskContext(userRequest: string, workspaceRoot: string): void {
    this.currentTaskState.userRequest = userRequest;
    this.currentTaskState.workspaceRoot = workspaceRoot;
  }

  /**
   * Sets live editor stream instance for Phase 7 live streaming
   */
  setLiveStream(liveStream: LiveEditorStream): void {
    this.liveStream = liveStream;
  }

  /**
   * Resumes a previously persisted task
   */
  async resumeTask(taskId: string, callbacks?: ExecutionCallbacks): Promise<AgentTask | null> {
    const persistedTask = await this.taskPersistence.getPersistedTask(taskId);
    if (!persistedTask) {
      logger.warn(`[ExecutionEngine] No persisted task found with ID: ${taskId}`);
      return null;
    }

    logger.debug(`[ExecutionEngine] Resuming task: ${persistedTask.originalTask.title} from step ${persistedTask.currentStepIndex + 1}`);
    
    // Set up task context
    this.currentTaskState.task = persistedTask.originalTask;
    this.currentTaskState.userRequest = persistedTask.metadata.userRequest;
    this.currentTaskState.workspaceRoot = persistedTask.metadata.workspaceRoot;

    // Resume from the next step
    const resumedTask = { ...persistedTask.originalTask };
    resumedTask.status = 'in_progress';
    
    return await this.executeTaskFromStep(resumedTask, persistedTask.currentStepIndex + 1, callbacks);
  }

  /**
   * Gets list of resumable tasks
   */
  async getResumableTasks(): Promise<Array<{ id: string; title: string; progress: string; timestamp: Date }>> {
    const persistedTasks = await this.taskPersistence.getPersistedTasks();
    return persistedTasks.map(task => ({
      id: task.id,
      title: task.originalTask.title,
      progress: `${task.metadata.completedStepsCount}/${task.metadata.totalSteps} steps completed`,
      timestamp: new Date(task.timestamp),
    }));
  }

  /**
   * Executes a complete task with all its steps
   * Implements sequential orchestration pattern from 2025 best practices
   */
  async executeTask(task: AgentTask, callbacks?: ExecutionCallbacks): Promise<AgentTask> {
    this.currentTaskState.task = task;
    return await this.executeTaskFromStep(task, 0, callbacks);
  }

  /**
   * Executes a task starting from a specific step (used for resumption)
   */
  private async executeTaskFromStep(task: AgentTask, startStepIndex: number, callbacks?: ExecutionCallbacks): Promise<AgentTask> {
    const startTime = Date.now();
    task.status = 'in_progress';
    task.startedAt = new Date();

    // PHASE 3, 4 & 5: Reset AI layers for new task execution
    if (startStepIndex === 0) {
      this.metacognitiveLayer.resetForNewTask();
      this.reactExecutor.resetAllHistory();
      logger.debug('[ExecutionEngine] 🧠 Metacognitive monitoring active');
      logger.debug('[ExecutionEngine] 🔄 ReAct pattern enabled:', this.enableReAct);
      logger.debug('[ExecutionEngine] 💾 Strategy memory enabled:', this.enableMemory);

      // Log memory stats
      if (this.enableMemory) {
        const stats = this.strategyMemory.getStats();
        logger.debug(`[ExecutionEngine] 📊 Memory has ${stats.totalPatterns} pattern(s), ${stats.averageSuccessRate.toFixed(1)}% avg success rate`);
      }
    }

    // Store callbacks for use in action execution methods
    this.currentCallbacks = callbacks;

    try {
      // Sequential execution with context preservation, starting from specified step
      for (let i = startStepIndex; i < task.steps.length; i++) {
        if (this.isPaused) {
          task.status = 'paused';
          // Save current progress
          if (this.currentTaskState.userRequest && this.currentTaskState.workspaceRoot) {
            await this.taskPersistence.saveTaskState(task, i, this.currentTaskState.userRequest, this.currentTaskState.workspaceRoot);
          }
          break;
        }

        const step = task.steps[i];
        if (!step) {continue;} // Safety check

        // Check if approval is required (human-in-the-loop pattern)
        if (step.requiresApproval && !step.approved) {
          step.status = 'awaiting_approval';

          if (callbacks?.onStepApprovalRequired) {
            const approvalRequest = this.buildApprovalRequest(task, step);
            const approved = await callbacks.onStepApprovalRequired(step, approvalRequest);

            if (!approved) {
              step.status = 'rejected';
              task.status = 'cancelled';
              return task;
            }

            step.approved = true;
            step.status = 'approved';
          } else {
            // No callback provided - auto-approve for testing
            step.approved = true;
            step.status = 'approved';
          }
        }

        // PHASE 6: Execute step with fallback support (includes retry logic)
        const result = await this.executeStepWithFallbacks(step, callbacks);

        // Store result for potential rollback
        this.storeStepResult(task.id, step, result);

        // Save progress after each step completion
        if (result.success && this.currentTaskState.userRequest && this.currentTaskState.workspaceRoot) {
          await this.taskPersistence.saveTaskState(task, i, this.currentTaskState.userRequest, this.currentTaskState.workspaceRoot);
        }

        // Update progress
        if (callbacks?.onTaskProgress) {
          callbacks.onTaskProgress(i + 1, task.steps.length);
        }

        // If step failed and no retries left, rollback and fail task
        if (!result.success && step.retryCount >= step.maxRetries) {
          task.error = `Step ${step.order} failed: ${result.message}`;
          task.status = 'failed';

          // Attempt rollback
          await this.rollbackTask(task);

          if (callbacks?.onTaskError) {
            callbacks.onTaskError(task, new Error(task.error));
          }

          return task;
        }
      }

      // Task completed successfully
      if (!this.isPaused) {
        // Auto-generate synthesis if multiple files were analyzed
        const synthesisStep = await this.generateAutoSynthesis(task);
        if (synthesisStep) {
          task.steps.push(synthesisStep); // Add synthesis as final step
          logger.debug('[ExecutionEngine] Added auto-synthesis step to task');

          // Notify UI that synthesis step was added
          if (callbacks?.onStepComplete) {
            callbacks.onStepComplete(synthesisStep, synthesisStep.result!);
          }
        }

        // CRITICAL: Mark task as completed AFTER synthesis
        task.status = 'completed';
        task.completedAt = new Date();
        task.metadata = {
          ...task.metadata,
          executionTimeMs: Date.now() - startTime,
        };

        logger.debug('[ExecutionEngine] ✅ TASK COMPLETED - Status:', task.status);
        logger.debug('[ExecutionEngine] Calling onTaskComplete callback...');

        if (callbacks?.onTaskComplete) {
          callbacks.onTaskComplete(task);
          logger.debug('[ExecutionEngine] ✅ onTaskComplete callback fired');
        } else {
          logger.warn('[ExecutionEngine] ⚠️ No onTaskComplete callback provided!');
        }
      }

      return task;
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';

      // Attempt rollback on catastrophic failure
      await this.rollbackTask(task);

      if (callbacks?.onTaskError) {
        callbacks.onTaskError(task, error as Error);
      }

      return task;
    }
  }

  /**
   * 2025 ENHANCEMENT: Self-Correction with Alternative Strategies
   * Analyzes errors and generates different approaches instead of blind retries
   */
  private async generateAlternativeStrategy(
    step: AgentStep,
    error: Error,
    attemptNumber: number
  ): Promise<StepAction | null> {
    try {
      logger.debug(`[ExecutionEngine] 🤔 Self-Correction: Analyzing failure for "${step.title}"`);
      logger.debug(`[ExecutionEngine] Error: ${error.message}`);
      logger.debug(`[ExecutionEngine] Original action: ${step.action.type}`);

      const prompt = `I'm an AI coding agent that just failed a task step. Help me find an alternative approach.

**Failed Step:**
- Title: ${step.title}
- Description: ${step.description}
- Original Action: ${step.action.type}
- Original Params: ${JSON.stringify(step.action.params)}
- Error: ${error.message}
- Attempt: ${attemptNumber} of ${step.maxRetries}

**Context:**
- User Request: ${this.currentTaskState.userRequest}
- Workspace: ${this.currentTaskState.workspaceRoot}

**Your Task:**
Analyze why this failed and suggest a DIFFERENT strategy (not just retry same action).

**Common Patterns:**
- File not found → Search project, or create with default template, or skip gracefully
- API timeout → Use cached data, or try simpler request, or ask user
- Parse error → Try different format, or extract partial data, or use fallback
- Permission denied → Try alternative path, or create in temp folder, or skip

**Response Format (JSON only):**
{
  "analysis": "Why did this fail? What's the root cause?",
  "strategy": "What different approach should I try?",
  "action": "read_file | write_file | search_code | generate_code | custom",
  "params": { /* action-specific params */ },
  "confidence": 0.8,
  "fallback": "skip | fail | ask_user"
}

Generate ONE alternative strategy that's DIFFERENT from the original approach.`;

      const response = await this.aiService.sendContextualMessage({
        userQuery: prompt,
        workspaceContext: await this.workspaceService.getWorkspaceContext(),
        currentFile: undefined,
        relatedFiles: [],
        conversationHistory: [],
      });

      // Parse AI response (handle JSON in text)
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('[ExecutionEngine] ⚠️  AI did not return valid JSON strategy');
        return null;
      }

      const strategy = JSON.parse(jsonMatch[0]);
      logger.debug(`[ExecutionEngine] ✨ Alternative Strategy: ${strategy.strategy}`);
      logger.debug(`[ExecutionEngine] Confidence: ${Math.round(strategy.confidence * 100)}%`);

      return {
        type: strategy.action as ActionType,
        params: strategy.params,
      };
    } catch (err) {
      logger.error('[ExecutionEngine] ❌ Self-correction failed:', err);
      return null;
    }
  }

  /**
   * PHASE 6: Execute step with fallback plans if primary approach fails
   */
  private async executeStepWithFallbacks(
    step: AgentStep,
    callbacks?: ExecutionCallbacks
  ): Promise<StepResult> {
    // Try primary approach first
    const result = await this.executeStepWithRetry(step, callbacks);

    // If failed and fallbacks exist, try each fallback
    const enhancedStep = step as any; // EnhancedAgentStep type
    if (!result.success && enhancedStep.fallbackPlans && enhancedStep.fallbackPlans.length > 0) {
      logger.debug(`[ExecutionEngine] ❌ Primary approach failed, trying fallbacks...`);

      for (const fallback of enhancedStep.fallbackPlans) {
        logger.debug(`[ExecutionEngine] 📋 Fallback: ${fallback.reasoning}`);

        // Create temporary step with fallback action
        const fallbackStep: AgentStep = {
          ...step,
          action: fallback.alternativeAction,
        };

        const fallbackResult = await this.executeStepWithRetry(fallbackStep, callbacks);

        if (fallbackResult.success) {
          logger.debug(`[ExecutionEngine] ✅ Fallback succeeded!`);
          return {
            ...fallbackResult,
            data: {
              ...(typeof fallbackResult.data === 'object' && fallbackResult.data !== null
                ? (fallbackResult.data as Record<string, unknown>)
                : {}),
              usedFallback: true,
              fallbackId: fallback.id,
            },
          };
        }
      }

      logger.debug(`[ExecutionEngine] ❌ All fallbacks exhausted`);
    }

    return result;
  }

  /**
   * Executes a single step with retry logic and error handling
   * 2025 ENHANCEMENT: Uses ReAct pattern (Phase 4) + self-correction (Phase 2) + metacognition (Phase 3)
   */
  private async executeStepWithRetry(
    step: AgentStep,
    callbacks?: ExecutionCallbacks
  ): Promise<StepResult> {
    // 2025 ENHANCEMENT: Monitor step for stuck patterns
    if (this.currentTaskState.task) {
      this.metacognitiveLayer.monitorStepStart(step, this.currentTaskState.task);
    }

    while (step.retryCount <= step.maxRetries) {
      try {
        step.status = 'in_progress';
        step.startedAt = new Date();

        if (callbacks?.onStepStart) {
          callbacks.onStepStart(step);
        }

        // PHASE 5: Query strategy memory for relevant patterns BEFORE execution
        let relevantPatterns: any[] = [];
        if (this.enableMemory) {
          relevantPatterns = await this.strategyMemory.queryPatterns({
            problemDescription: step.description,
            actionType: step.action.type,
            context: {
              taskType: step.action.type,
            },
            maxResults: 3,
          });
        }

        // PHASE 4: Execute with ReAct pattern (Thought-Action-Observation-Reflection)
        let result: StepResult;
        let reActCycleData: any = null;

        if (this.enableReAct && this.currentTaskState.task) {
          logger.debug('[ExecutionEngine] 🔄 Using ReAct pattern for step execution');

          // Execute the full ReAct cycle
          const reActCycle = await this.reactExecutor.executeReActCycle(
            step,
            this.currentTaskState.task,
            // Action executor function
            async (action) => {
              return await this.executeAction(action.type, action.params);
            }
          );

          reActCycleData = reActCycle;

          // Use the result from the ReAct cycle
          result = {
            success: reActCycle.observation.success,
            message: reActCycle.observation.actualOutcome,
            data: {
              reActCycle, // Include full cycle for UI display
              thought: reActCycle.thought,
              reflection: reActCycle.reflection,
              relevantPatterns, // Include memory patterns that were consulted
            }
          };

          // PHASE 5: Store successful pattern to memory
          if (reActCycle.observation.success && this.enableMemory) {
            await this.strategyMemory.storeSuccessfulPattern(
              step,
              reActCycle,
              {
                taskType: step.action.type,
              }
            );
          }

          // If ReAct reflection suggests retry with changes, apply those changes
          if (!reActCycle.observation.success && reActCycle.reflection.shouldRetry) {
            logger.debug(`[ExecutionEngine] 🔄 ReAct suggests retry with changes:`, reActCycle.reflection.suggestedChanges);
          }
        } else {
          // Fallback: Execute action directly without ReAct pattern
          result = await this.executeAction(step.action.type, step.action.params);
        }

        // Check if step was skipped (e.g., optional file not found)
        if (result.skipped) {
          step.status = 'skipped';
          step.completedAt = new Date();
          step.result = result;

          if (callbacks?.onStepComplete) {
            callbacks.onStepComplete(step, result);
          }

          return result;
        }

        step.status = 'completed';
        step.completedAt = new Date();
        step.result = result;

        if (callbacks?.onStepComplete) {
          callbacks.onStepComplete(step, result);
        }

        return result;
      } catch (error) {
        step.retryCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        logger.error(`[ExecutionEngine] ❌ Step ${step.order} failed (attempt ${step.retryCount}/${step.maxRetries}):`, errorMessage);

        // 2025 ENHANCEMENT Phase 3: Check if agent is stuck before final failure
        const stuckAnalysis = this.currentTaskState.task
          ? await this.metacognitiveLayer.analyzeStuckPattern(
              step,
              this.currentTaskState.task,
              error as Error
            )
          : { isStuck: false, recommendation: '', confidence: 0 };

        if (stuckAnalysis.isStuck && 'shouldSeekHelp' in stuckAnalysis && stuckAnalysis.shouldSeekHelp && this.currentTaskState.task) {
          logger.debug('[ExecutionEngine] 🤔 Agent appears stuck, seeking help from AI...');
          try {
            const helpResponse = await this.metacognitiveLayer.seekHelp(
              step,
              this.currentTaskState.task,
              ('pattern' in stuckAnalysis && stuckAnalysis.pattern ? stuckAnalysis.pattern : 'unknown') as StuckPattern
            );

            if (helpResponse.shouldContinue) {
              logger.debug(`[ExecutionEngine] 💡 AI guidance: ${helpResponse.suggestedApproach}`);
              // Try the AI's suggested approach as an alternative strategy
              step.action = {
                type: 'custom' as ActionType,
                params: {
                  approach: helpResponse.suggestedApproach,
                  reasoning: helpResponse.reasoning
                }
              };
            } else {
              logger.debug(`[ExecutionEngine] 🛑 AI recommends stopping: ${helpResponse.reasoning}`);
              step.status = 'failed';
              step.error = `Stopped on AI recommendation: ${helpResponse.reasoning}`;
              step.completedAt = new Date();

              return {
                success: false,
                message: `AI analysis suggests stopping: ${helpResponse.reasoning}`,
              };
            }
          } catch (helpError) {
            logger.error('[ExecutionEngine] ⚠️ Failed to get help:', helpError);
            // Continue with normal retry logic if help-seeking fails
          }
        }

        if (step.retryCount >= step.maxRetries) {
          // Final failure
          step.status = 'failed';
          step.error = errorMessage;
          step.completedAt = new Date();

          const result: StepResult = {
            success: false,
            message: `Failed after ${step.maxRetries} retries: ${errorMessage}`,
          };

          if (callbacks?.onStepError) {
            callbacks.onStepError(step, error as Error);
          }

          return result;
        }

        // 2025 ENHANCEMENT: Self-Correction - Try different strategy instead of same retry
        logger.debug(`[ExecutionEngine] 🔄 Attempting self-correction...`);
        const alternativeStrategy = await this.generateAlternativeStrategy(
          step,
          error as Error,
          step.retryCount
        );

        if (alternativeStrategy) {
          // Update step action to use alternative strategy
          logger.debug(`[ExecutionEngine] ✅ Using alternative: ${alternativeStrategy.type}`);
          step.action = alternativeStrategy;
          // Continue loop to try new strategy
        } else {
          // No alternative found, use exponential backoff before retry
          logger.debug(`[ExecutionEngine] ⚠️  No alternative found, retrying original action...`);
          const backoffMs = Math.min(1000 * Math.pow(2, step.retryCount - 1), 10000);
          await this.sleep(backoffMs);
        }
      }
    }

    // Should never reach here, but TypeScript needs it
    return {
      success: false,
      message: 'Max retries exceeded',
    };
  }

  /**
   * Executes a specific action type
   * Action handler routing pattern
   */
  private async executeAction(type: ActionType, params: any): Promise<StepResult> {
    switch (type) {
      case 'read_file':
        return await this.executeReadFile(params);

      case 'write_file':
        return await this.executeWriteFile(params);

      case 'edit_file':
        return await this.executeEditFile(params);

      case 'delete_file':
        return await this.executeDeleteFile(params);

      case 'create_directory':
        return await this.executeCreateDirectory(params);

      case 'run_command':
        return await this.executeRunCommand(params);

      case 'search_codebase':
        return await this.executeSearchCodebase(params);

      case 'analyze_code':
        return await this.executeAnalyzeCode(params);

      case 'refactor_code':
        return await this.executeRefactorCode(params);

      case 'generate_code':
        return await this.executeGenerateCode(params);

      case 'run_tests':
        return await this.executeRunTests(params);

      case 'git_commit':
        return await this.executeGitCommit(params);

      case 'review_project':
        return await this.executeReviewProject(params);

      case 'custom':
        return await this.executeCustomAction(params);

      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  // ==================== Action Handlers ====================

  private async executeReadFile(params: any): Promise<StepResult> {
    try {
      if (!params.filePath) {
        throw new Error('Missing required parameter: filePath');
      }

      // Resolve path against workspace root
      let resolvedPath = this.resolveFilePath(params.filePath);

      // Try to find file in alternate locations if it doesn't exist at exact path
      try {
        await this.fileSystemService.getFileStats(resolvedPath);
        // File exists at exact path, continue to read it
      } catch (statError) {
        // File doesn't exist at exact path - try common alternate locations
        logger.debug(`[ExecutionEngine] File not found at exact path: ${resolvedPath}, searching alternate locations...`);
        const foundPath = await this.findFileInCommonLocations(resolvedPath);

        if (foundPath) {
          logger.debug(`[ExecutionEngine] ✓ Found file at alternate location: ${foundPath} (requested: ${resolvedPath})`);
          resolvedPath = foundPath; // Use the found path instead
        } else {
          // File doesn't exist anywhere - AUTO-CREATE IT (like Cursor does!)
          logger.debug(`[ExecutionEngine] 🔧 File not found, auto-creating: ${resolvedPath}`);

          // Generate appropriate content for this file type
          const generatedContent = await this.generateMissingFileContent(resolvedPath);

          // Create the file with generated content
          await this.fileSystemService.writeFile(resolvedPath, generatedContent);

          // Notify UI that file was auto-created
          if (this.currentCallbacks?.onFileChanged) {
            this.currentCallbacks.onFileChanged(resolvedPath, 'created');
          }

          logger.debug(`[ExecutionEngine] ✓ Auto-created file: ${resolvedPath} (${generatedContent.length} bytes)`);

          // Now read the newly created file and return it
          const content = await this.fileSystemService.readFile(resolvedPath);
          return {
            success: true,
            data: { content, filePath: resolvedPath, autoCreated: true },
            message: `Auto-created and read file: ${resolvedPath}`,
          };
        }
      }

      const content = await this.fileSystemService.readFile(resolvedPath);
      return {
        success: true,
        data: { content, filePath: resolvedPath },
        message: `Read file: ${resolvedPath}`,
      };
    } catch (error) {
      // Other errors (permissions, I/O issues) should still fail
      throw new Error(`Failed to read file: ${error}`);
    }
  }

  /**
   * Finds a file by checking common alternate locations
   * Returns the actual path if found, null otherwise
   */
  private async findFileInCommonLocations(requestedPath: string): Promise<string | null> {
    // Extract filename from path
    const pathParts = requestedPath.split(/[/\\]/);
    const fileName = pathParts[pathParts.length - 1];
    const {workspaceRoot} = this.currentTaskState;

    if (!workspaceRoot) {
      return null;
    }

    // Common locations to check (in order of likelihood)
    const locationsToTry = [
      requestedPath,                                                          // Exact path requested
      this.fileSystemService.joinPath(workspaceRoot, 'src', fileName),        // src/
      this.fileSystemService.joinPath(workspaceRoot, 'app', fileName),        // app/ (React Native/Expo)
      this.fileSystemService.joinPath(workspaceRoot, 'lib', fileName),        // lib/
      this.fileSystemService.joinPath(workspaceRoot, fileName),               // root
      this.fileSystemService.joinPath(workspaceRoot, 'components', fileName), // components/
      this.fileSystemService.joinPath(workspaceRoot, 'src', 'components', fileName), // src/components/
      this.fileSystemService.joinPath(workspaceRoot, 'app', '(tabs)', fileName), // app/(tabs)/ for Expo
    ];

    logger.debug(`[ExecutionEngine] Searching for file: ${fileName}`);
    logger.debug(`[ExecutionEngine] Trying locations:`, locationsToTry);

    for (const location of locationsToTry) {
      try {
        await this.fileSystemService.getFileStats(location);
        logger.debug(`[ExecutionEngine] ✓ Found file at: ${location}`);
        return location; // File exists at this location
      } catch {
        // File doesn't exist here, try next location
        continue;
      }
    }

    logger.debug(`[ExecutionEngine] ✗ File not found in any common location`);
    return null; // File not found in any location
  }

  /**
   * Suggests alternative file paths when a file is not found
   * Now actually checks if alternate files exist
   */
  private async suggestAlternativeFiles(missingPath: string): Promise<string> {
    try {
      // Try to find the file in common locations
      const foundPath = await this.findFileInCommonLocations(missingPath);

      if (foundPath && foundPath !== missingPath) {
        return `Found similar file at: ${foundPath}`;
      }

      // Extract directory and filename from the missing path
      const pathParts = missingPath.split(/[/\\]/);
      const fileName = pathParts[pathParts.length - 1];
      const directory = pathParts.slice(0, -1).join('/');

      // For common missing files, provide specific suggestions
      if (fileName === 'index.tsx') {
        return 'Common locations: src/index.tsx, app/index.tsx, or app/(tabs)/index.tsx';
      }

      if (fileName === 'App.tsx') {
        return 'Common locations: src/App.tsx, app/App.tsx, or App.tsx at root';
      }

      if (fileName === '_layout.tsx') {
        return 'Common locations: app/_layout.tsx or app/(tabs)/_layout.tsx';
      }

      // Generic suggestion
      return `File not found in ${directory}. Common locations: src/, app/, lib/, or root directory`;
    } catch (error) {
      return 'Could not suggest alternatives.';
    }
  }

  /**
   * Generates appropriate content for a missing file using AI
   * This makes agent mode work like Cursor - automatically creates files when needed
   */
  private async generateMissingFileContent(filePath: string): Promise<string> {
    try {
      // Extract filename and extension
      const fileName = filePath.split(/[/\\]/).pop() || 'file';
      const extension = fileName.split('.').pop()?.toLowerCase() || '';

      // Build AI prompt based on file type and context
      const workspaceRoot = this.currentTaskState.workspaceRoot || '';
      const userRequest = this.currentTaskState.userRequest || '';

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

      logger.debug('[ExecutionEngine] Generating content for missing file with AI...');

      const response = await this.aiService.sendContextualMessage({
        userQuery: prompt,
        workspaceContext: await this.workspaceService.getWorkspaceContext(),
        currentFile: undefined,
        relatedFiles: [],
        conversationHistory: [],
      });

      const content = response.content.trim();

      // Fallback to basic template if AI returns nothing useful
      if (!content || content.length < 50) {
        return this.getFallbackTemplate(fileName, extension);
      }

      return content;
    } catch (error) {
      logger.error('[ExecutionEngine] AI generation failed, using fallback template:', error);
      // Fall back to basic templates
      const fileName = filePath.split(/[/\\]/).pop() || 'file';
      const extension = fileName.split('.').pop()?.toLowerCase() || '';
      return this.getFallbackTemplate(fileName, extension);
    }
  }

  /**
   * Provides fallback templates when AI generation fails
   */
  private getFallbackTemplate(fileName: string, extension: string): string {
    // Documentation files
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

    // TypeScript/JavaScript files
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

    // JSON files
    if (extension === 'json') {
      return `{
  "name": "${fileName.replace('.json', '')}",
  "description": "Auto-generated configuration",
  "version": "1.0.0"
}
`;
    }

    // Generic text file
    return `# ${fileName}

This file was auto-generated by Agent Mode.
Please update with actual content.
`;
  }

  private async executeWriteFile(params: any): Promise<StepResult> {
    try {
      if (!params.filePath) {
        throw new Error('Missing required parameter: filePath');
      }
      if (!params.content) {
        throw new Error('Missing required parameter: content');
      }

      // Resolve path against workspace root
      const resolvedPath = this.resolveFilePath(params.filePath);

      // PHASE 7: Stream content to editor before writing file
      if (this.liveStream) {
        await this.liveStream.streamToEditor(resolvedPath, params.content);
      }

      await this.fileSystemService.writeFile(resolvedPath, params.content);

      // Notify UI that file was created
      if (this.currentCallbacks?.onFileChanged) {
        this.currentCallbacks.onFileChanged(resolvedPath, 'created');
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

  private async executeEditFile(params: any): Promise<StepResult> {
    try {
      // Resolve path against workspace root
      const resolvedPath = this.resolveFilePath(params.filePath);

      // Read existing content
      const oldContent = await this.fileSystemService.readFile(resolvedPath);

      // Apply edit (replace oldContent with newContent)
      const newContent = oldContent.replace(params.oldContent, params.newContent);

      // PHASE 7: Show diff and request approval before applying
      if (this.liveStream) {
        const changes = this.liveStream.showDiffPreview(resolvedPath, oldContent, newContent);
        const approved = await this.liveStream.requestApproval(resolvedPath, changes);

        if (!approved) {
          this.liveStream.clearDecorations();
          return {
            success: false,
            message: `Edit rejected by user: ${resolvedPath}`,
          };
        }

        this.liveStream.clearDecorations();
      }

      // Write updated content
      await this.fileSystemService.writeFile(resolvedPath, newContent);

      // Notify UI that file was modified
      if (this.currentCallbacks?.onFileChanged) {
        this.currentCallbacks.onFileChanged(resolvedPath, 'modified');
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

  private async executeDeleteFile(params: any): Promise<StepResult> {
    try {
      // Resolve path against workspace root
      const resolvedPath = this.resolveFilePath(params.filePath);

      await this.fileSystemService.deleteFile(resolvedPath);

      // Notify UI that file was deleted
      if (this.currentCallbacks?.onFileChanged) {
        this.currentCallbacks.onFileChanged(resolvedPath, 'deleted');
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

  private async executeCreateDirectory(params: any): Promise<StepResult> {
    try {
      // Resolve path against workspace root
      const resolvedPath = this.resolveFilePath(params.path);

      await this.fileSystemService.createDirectory(resolvedPath);
      return {
        success: true,
        message: `Created directory: ${resolvedPath}`,
      };
    } catch (error) {
      throw new Error(`Failed to create directory: ${error}`);
    }
  }

  private async executeRunCommand(params: any): Promise<StepResult> {
    try {
      if (!params.command) {
        throw new Error('Missing required parameter: command');
      }

      // Command execution not yet implemented for Electron
      // TODO: Implement shell command execution via Electron IPC
      logger.warn('[ExecutionEngine] Command execution not yet implemented');
      return {
        success: false,
        message: 'Command execution not yet implemented',
      };
    } catch (error) {
      throw new Error(`Failed to run command: ${error}`);
    }
  }

  private async executeSearchCodebase(params: any): Promise<StepResult> {
    try {
      logger.debug('[ExecutionEngine] executeSearchCodebase called with params:', JSON.stringify(params, null, 2));

      if (!params.searchQuery) {
        logger.error('[ExecutionEngine] Missing searchQuery parameter. Received params:', params);
        throw new Error(`Missing required parameter: searchQuery. Received params: ${JSON.stringify(params)}`);
      }

      // Handle array of search terms - join with OR operator
      let searchQuery: string;
      if (Array.isArray(params.searchQuery)) {
        searchQuery = params.searchQuery.join('|');
        logger.debug(`[ExecutionEngine] Converted array to search pattern: ${searchQuery}`);
      } else if (typeof params.searchQuery === 'string') {
        searchQuery = params.searchQuery;
      } else {
        throw new Error(`Invalid searchQuery type: expected string or string[], got ${typeof params.searchQuery}`);
      }

      const results = await this.workspaceService.searchFiles(searchQuery);
      return {
        success: true,
        data: { results },
        message: `Found ${results.length} matches for: ${searchQuery}`,
      };
    } catch (error) {
      throw new Error(`Failed to search codebase: ${error}`);
    }
  }

  private async executeAnalyzeCode(params: any): Promise<StepResult> {
    try {
      if (!params.filePath) {
        throw new Error('Missing required parameter: filePath (analyze_code requires a specific file path, not a directory)');
      }

      // Resolve path against workspace root
      const resolvedPath = this.resolveFilePath(params.filePath);

      const fileContent = await this.fileSystemService.readFile(resolvedPath);

      // Get AI analysis of the code (like Cursor/Copilot do)
      logger.debug(`[ExecutionEngine] Requesting AI analysis for: ${resolvedPath}`);

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
        const aiResponse = await this.aiService.sendContextualMessage({
          userQuery: aiAnalysisPrompt,
          workspaceContext: {
            rootPath: this.currentTaskState.workspaceRoot || '',
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
          aiReview: aiResponse.content, // AI's actual review
        };

        return {
          success: true,
          data: { analysis, generatedCode: aiResponse.content }, // generatedCode triggers the purple UI display
          message: `✅ AI analyzed: ${resolvedPath}`,
        };
      } catch (aiError) {
        logger.error('[ExecutionEngine] AI analysis failed, returning basic stats:', aiError);

        // Fallback to basic analysis if AI fails
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

  private async executeRefactorCode(params: any): Promise<StepResult> {
    try {
      // Use AI to refactor code
      const prompt = `Refactor this code:\n\n${params.codeSnippet}\n\nRequirements: ${params.requirements || 'Improve readability and maintainability'}`;

      const response = await this.aiService.sendContextualMessage({
        userQuery: prompt,
        workspaceContext: {
          rootPath: this.currentTaskState.workspaceRoot || '',
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

  private async executeGenerateCode(params: any): Promise<StepResult> {
    try {
      if (!params.description) {
        throw new Error('Missing required parameter: description');
      }

      // Enhanced code generation with chunking support and better context
      const prompt = this.buildCodeGenerationPrompt(params);

      // Check if this is a large code generation task that should be chunked
      const shouldChunk = params.chunked === true || params.description.length > 2000;
      
      if (shouldChunk && params.chunks) {
        return await this.executeChunkedCodeGeneration(params, prompt);
      } else {
        return await this.executeSingleCodeGeneration(params, prompt);
      }
    } catch (error) {
      throw new Error(`Failed to generate code: ${error}`);
    }
  }

  private buildCodeGenerationPrompt(params: any): string {
    const language = params.targetLanguage || 'TypeScript';
    const fileType = params.fileType || 'source code';
    
    let prompt = `Generate ${language} ${fileType}:\n\n${params.description}`;
    
    if (params.context) {
      prompt += `\n\nContext: ${params.context}`;
    }
    
    if (params.requirements) {
      prompt += `\n\nRequirements:\n${params.requirements.map((req: string) => `- ${req}`).join('\n')}`;
    }
    
    if (params.existingCode) {
      prompt += `\n\nExisting code to reference:\n\`\`\`${language}\n${params.existingCode}\n\`\`\``;
    }
    
    prompt += `\n\nProvide complete, working ${language} code with proper imports, error handling, and documentation.`;
    
    return prompt;
  }

  private async executeSingleCodeGeneration(params: any, prompt: string): Promise<StepResult> {
    try {
      // Get workspace context for better code generation
      const workspaceContext = await this.workspaceService.getWorkspaceContext();

      const response = await this.aiService.sendContextualMessage({
        userQuery: prompt,
        workspaceContext,
        currentFile: params.currentFile,
        relatedFiles: [],
        conversationHistory: [],
      });

      // Extract code from response if it's wrapped in markdown
      const generatedCode = this.extractCodeFromResponse(response.content, params.targetLanguage);

      // PHASE 7: Stream generated code to editor (if filePath provided for preview)
      if (this.liveStream && params.filePath) {
        await this.liveStream.streamToEditor(params.filePath, generatedCode);
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

  private async executeChunkedCodeGeneration(params: any, basePrompt: string): Promise<StepResult> {
    try {
      const chunks = params.chunks || [];
      const generatedChunks: string[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkPrompt = `${basePrompt}\n\nGenerate part ${i + 1}/${chunks.length}: ${chunk.description}`;
        
        const chunkResult = await this.executeSingleCodeGeneration({
          ...params,
          description: chunkPrompt,
        }, chunkPrompt);
        
        if (!chunkResult.success) {
          throw new Error(`Chunk ${i + 1} generation failed: ${chunkResult.message}`);
        }
        
        generatedChunks.push((chunkResult.data as any)?.generatedCode || chunkResult.data || '');
        
        // Add delay between chunks to respect rate limits
        if (i < chunks.length - 1) {
          await this.sleep(1000);
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

  private extractCodeFromResponse(response: string, _targetLanguage?: string): string {
    // Extract code blocks from markdown-formatted response
    const codeBlockRegex = /```(?:\w+)?\n?([\s\S]*?)```/g;
    const matches = Array.from(response.matchAll(codeBlockRegex));
    
    if (matches.length > 0) {
      // Return the largest code block (likely the main one)
      const codeBlocks = matches.map(match => match[1]?.trim() || '').filter(Boolean);
      return codeBlocks.reduce((longest, current) => 
        current.length > longest.length ? current : longest
      );
    }
    
    // If no code blocks found, return the full response (might be plain code)
    return response.trim();
  }

  private async executeRunTests(params: any): Promise<StepResult> {
    try {
      // Test execution not available in browser mode
      logger.warn('[ExecutionEngine] Test execution not yet available in browser mode');
      return {
        success: false,
        message: 'Test execution is only available in desktop mode',
      };
    } catch (error) {
      throw new Error(`Failed to run tests: ${error}`);
    }
  }

  /**
   * Detects the appropriate test command based on package.json
   */
  private async detectTestCommand(): Promise<string> {
    // Check if project uses pnpm, yarn, or npm
    try {
      const {workspaceRoot} = this.currentTaskState;
      if (!workspaceRoot) {return 'npm test';}

      // Check for pnpm-lock.yaml (pnpm)
      try {
        await this.fileSystemService.getFileStats(`${workspaceRoot}/pnpm-lock.yaml`);
        logger.debug('[ExecutionEngine] Detected pnpm project');
        return 'pnpm test';
      } catch {
        // Not pnpm
      }

      // Check for yarn.lock (yarn)
      try {
        await this.fileSystemService.getFileStats(`${workspaceRoot}/yarn.lock`);
        logger.debug('[ExecutionEngine] Detected yarn project');
        return 'yarn test';
      } catch {
        // Not yarn
      }

      // Default to npm
      logger.debug('[ExecutionEngine] Defaulting to npm');
      return 'npm test';
    } catch (error) {
      logger.error('[ExecutionEngine] Error detecting package manager:', error);
      return 'npm test';
    }
  }

  private async executeGitCommit(params: any): Promise<StepResult> {
    try {
      await this.gitService.commit(params.message);
      return {
        success: true,
        message: `Created git commit: ${params.message}`,
      };
    } catch (error) {
      throw new Error(`Failed to create git commit: ${error}`);
    }
  }

  private async executeReviewProject(params: any): Promise<StepResult> {
    try {
      if (!params.workspaceRoot) {
        throw new Error('Missing required parameter: workspaceRoot');
      }

      logger.debug(`[ExecutionEngine] Analyzing project quality for: ${params.workspaceRoot}`);
      const report = await this.codeQualityAnalyzer.analyzeProject(params.workspaceRoot);

      // Format summary for agent
      const summary = `
Project Quality Report:
- Total Files: ${report.totalFiles}
- Total Lines of Code: ${report.totalLinesOfCode.toLocaleString()}
- Average Quality Score: ${Math.round(report.averageQuality)}/100
- Average Complexity: ${report.averageComplexity.toFixed(1)}
- Files with Issues: ${report.filesWithIssues}

${report.filesWithIssues > 0 ? `
Top 5 Files Needing Attention:
${report.fileReports
  .filter(f => f.issues.length > 0)
  .sort((a, b) => a.quality - b.quality)
  .slice(0, 5)
  .map((f, i) => `${i + 1}. ${f.filePath} (Quality: ${Math.round(f.quality)}, Issues: ${f.issues.length})`)
  .join('\n')}
` : '✓ No quality issues found!'}
      `.trim();

      return {
        success: true,
        data: { report, summary },
        message: `Analyzed ${report.totalFiles} files. Average quality: ${Math.round(report.averageQuality)}/100`,
      };
    } catch (error) {
      throw new Error(`Failed to review project: ${error}`);
    }
  }

  /**
   * Automatically generate synthesis when multiple files analyzed
   * This matches Cursor/Windsurf/VS Code behavior of providing final summaries
   */
  private async generateAutoSynthesis(task: AgentTask): Promise<AgentStep | null> {
    try {
      logger.debug('[ExecutionEngine] 🔍 Checking if auto-synthesis needed...');

      // Collect all steps with AI-generated content (reviews, analyses)
      const stepsWithAIContent = task.steps.filter(step =>
        step.status === 'completed' &&
        step.result?.success &&
        (step.result.data as any)?.generatedCode
      );

      // Only synthesize if we have 2+ AI-analyzed files
      if (stepsWithAIContent.length < 2) {
        logger.debug(`[ExecutionEngine] Skipping auto-synthesis (only ${stepsWithAIContent.length} AI-analyzed steps)`);
        return null;
      }

      logger.debug(`[ExecutionEngine] ✨ Auto-synthesizing results from ${stepsWithAIContent.length} analyzed files...`);

      // Collect file paths and reviews
      const fileAnalyses = stepsWithAIContent.map(step => {
        const data = step.result!.data as any;
        const filePath = data?.filePath || data?.analysis?.filePath || 'unknown';
        const review = data?.generatedCode || data?.analysis?.aiReview || '';
        return `\n### ${filePath}\n${review}`;
      }).join('\n\n---\n');

      // Generate synthesis prompt
      const synthesisPrompt = `You are reviewing a codebase. You've analyzed ${stepsWithAIContent.length} files individually. Now provide a COMPREHENSIVE SYNTHESIS of your findings.

## Individual File Analyses:
${fileAnalyses}

## Your Task:
Synthesize the above analyses into a cohesive, actionable code review report. Include:

1. **Overall Assessment** - High-level code quality summary
2. **Common Patterns** - Repeated issues or good practices across files
3. **Priority Improvements** - Top 3-5 most important changes needed
4. **Architecture Insights** - How the files work together, design patterns observed
5. **Positive Highlights** - What's done well

Be detailed, specific, and actionable. Reference specific files when making points.`;

      // Call AI for synthesis
      const response = await this.aiService.sendContextualMessage({
        userQuery: synthesisPrompt,
        workspaceContext: {
          rootPath: this.currentTaskState.workspaceRoot || '',
          totalFiles: stepsWithAIContent.length,
          languages: [],
          testFiles: 0,
          projectStructure: {},
          dependencies: {},
          exports: {},
          symbols: {},
          lastIndexed: new Date(),
          summary: 'Code review synthesis',
        },
        currentFile: undefined,
        relatedFiles: [],
        conversationHistory: [],
      });

      // Create virtual synthesis step
      const synthesisStep: AgentStep = {
        id: `synthesis-${Date.now()}`,
        taskId: task.id,
        order: task.steps.length + 1,
        title: '📊 Comprehensive Review Summary',
        description: `Synthesis of ${stepsWithAIContent.length} file analyses`,
        action: {
          type: 'generate_code',
          params: {
            description: 'Final synthesis',
          },
        },
        status: 'completed',
        requiresApproval: false,
        maxRetries: 0,
        retryCount: 0,
        result: {
          success: true,
          data: {
            generatedCode: response.content,
            isSynthesis: true, // Flag for UI to style differently
          },
          message: `✅ Synthesized findings from ${stepsWithAIContent.length} files`,
        },
      };

      logger.debug('[ExecutionEngine] ✅ Auto-synthesis complete!');
      return synthesisStep;

    } catch (error) {
      logger.error('[ExecutionEngine] ❌ Auto-synthesis failed:', error);
      return null; // Fail gracefully - synthesis is a bonus feature
    }
  }

  private async executeCustomAction(params: any): Promise<StepResult> {
    // Custom actions handled by user-provided handlers
    return {
      success: true,
      data: params,
      message: 'Custom action executed',
    };
  }

  // ==================== Rollback Support ====================

  /**
   * Rolls back a task by reversing completed steps
   * Implements transaction-like rollback pattern
   */
  async rollbackTask(task: AgentTask): Promise<RollbackResult> {
    const rolledBackSteps: string[] = [];
    const restoredFiles: string[] = [];

    try {
      // Get execution history for this task
      const stepResults = this.executionHistory.get(task.id) || [];

      // Reverse the steps
      for (let i = stepResults.length - 1; i >= 0; i--) {
        const result = stepResults[i];
        if (!result) {continue;}

        // Attempt to reverse the action
        if (result.filesCreated) {
          for (const file of result.filesCreated) {
            try {
              await this.fileSystemService.deleteFile(file);
              restoredFiles.push(file);
            } catch (error) {
              logger.error(`Failed to delete created file during rollback: ${file}`, error);
            }
          }
        }

        if (result.filesModified) {
          // For modified files, we would need backup copies
          // This is a limitation - we can't fully restore without backups
          logger.warn(`Cannot restore modified files without backup: ${result.filesModified.join(', ')}`);
        }

        if (result.filesDeleted) {
          // Cannot restore deleted files without backup
          logger.warn(`Cannot restore deleted files: ${result.filesDeleted.join(', ')}`);
        }

        rolledBackSteps.push(`Step ${i + 1}`);
      }

      // Clear execution history for this task
      this.executionHistory.delete(task.id);

      return {
        success: true,
        stepsRolledBack: rolledBackSteps,
        filesRestored: restoredFiles,
      };
    } catch (error) {
      return {
        success: false,
        stepsRolledBack: rolledBackSteps,
        filesRestored: restoredFiles,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ==================== Helper Methods ====================

  private buildApprovalRequest(task: AgentTask, step: AgentStep): ApprovalRequest {
    // Determine risk level based on action type
    const destructiveActions = ['delete_file', 'write_file', 'git_commit'];
    const riskLevel = destructiveActions.includes(step.action.type) ? 'high' : 'low';

    // Determine reversibility
    const reversible = !['delete_file'].includes(step.action.type);

    // Get affected files
    const filesAffected: string[] = [];
    if (step.action.params.filePath) {
      filesAffected.push(step.action.params.filePath);
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

  private storeStepResult(taskId: string, _step: AgentStep, result: StepResult): void {
    if (!this.executionHistory.has(taskId)) {
      this.executionHistory.set(taskId, []);
    }
    this.executionHistory.get(taskId)!.push(result);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ==================== Control Methods ====================

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  isPausedState(): boolean {
    return this.isPaused;
  }

  clearHistory(taskId: string): void {
    this.executionHistory.delete(taskId);
  }
}
