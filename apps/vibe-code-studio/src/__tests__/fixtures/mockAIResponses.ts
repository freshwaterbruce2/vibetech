import { AIResponse } from '../../types';

/**
 * Mock AI responses for testing
 * All responses are valid JSON that match the expected schemas
 */

export interface TaskPlan {
  title: string;
  description: string;
  reasoning: string;
  steps: TaskStep[];
  warnings?: string[];
}

export interface TaskStep {
  order: number;
  title: string;
  description: string;
  action: {
    type: string;
    params: Record<string, unknown>;
  };
  requiresApproval: boolean;
  maxRetries: number;
}

export interface ReActThought {
  thought: string;
  action: string;
  parameters: Record<string, unknown>;
  confidence: number;
  reasoning: string;
}

export interface SelfCorrectionStrategy {
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedFix: string;
  autoFixable: boolean;
  steps: string[];
}

export class MockAIResponses {
  /**
   * Valid task plan response for code review
   */
  static getCodeReviewPlan(workspaceRoot: string = '/workspace'): TaskPlan {
    return {
      title: 'Code Review',
      description: 'Comprehensive code review with automated checks',
      reasoning: 'Breaking down code review into systematic steps for thorough analysis',
      steps: [
        {
          order: 1,
          title: 'Scan project structure',
          description: 'Analyze directory structure and file organization',
          action: {
            type: 'search_codebase',
            params: {
              searchQuery: 'project structure analysis',
              workspaceRoot,
              pattern: '**/*.{ts,tsx,js,jsx}',
              includeFiles: true,
              includeDirs: true
            }
          },
          requiresApproval: false,
          maxRetries: 3
        },
        {
          order: 2,
          title: 'Analyze code quality',
          description: 'Check for code smells, complexity, and maintainability',
          action: {
            type: 'analyze_code',
            params: {
              workspaceRoot,
              files: ['src/**/*.ts', 'src/**/*.tsx'],
              checkComplexity: true,
              checkDuplication: true
            }
          },
          requiresApproval: false,
          maxRetries: 3
        },
        {
          order: 3,
          title: 'Generate review report',
          description: 'Create comprehensive code review document',
          action: {
            type: 'write_file',
            params: {
              filePath: `${workspaceRoot}/CODE_REVIEW.md`,
              content: '# Code Review Report\n\n## Summary\n\n*Review findings will appear here*'
            }
          },
          requiresApproval: true,
          maxRetries: 3
        }
      ],
      warnings: []
    };
  }

  /**
   * Valid task plan for bug fix
   */
  static getBugFixPlan(workspaceRoot: string = '/workspace'): TaskPlan {
    return {
      title: 'Fix Bug',
      description: 'Identify and fix reported bug',
      reasoning: 'Systematic approach to bug fixing: locate, analyze, fix, verify',
      steps: [
        {
          order: 1,
          title: 'Search for error patterns',
          description: 'Find TODO, FIXME, and error comments',
          action: {
            type: 'search_codebase',
            params: {
              searchQuery: 'error patterns bugs TODOs',
              workspaceRoot,
              pattern: 'TODO|FIXME|BUG|ERROR|XXX'
            }
          },
          requiresApproval: false,
          maxRetries: 3
        },
        {
          order: 2,
          title: 'Apply fix',
          description: 'Modify identified files to resolve the issue',
          action: {
            type: 'edit_file',
            params: {
              filePath: `${workspaceRoot}/src/buggy-file.tsx`,
              oldText: '// Buggy code',
              newText: '// Fixed code'
            }
          },
          requiresApproval: true,
          maxRetries: 3
        },
        {
          order: 3,
          title: 'Run tests',
          description: 'Verify fix with test suite',
          action: {
            type: 'run_command',
            params: {
              command: 'npm test',
              workspaceRoot
            }
          },
          requiresApproval: false,
          maxRetries: 2
        }
      ],
      warnings: []
    };
  }

  /**
   * Valid ReAct thought for code search
   */
  static getSearchThought(query: string): ReActThought {
    return {
      thought: `I need to search the codebase for "${query}" to understand the implementation`,
      action: 'search_codebase',
      parameters: {
        searchQuery: query,
        pattern: query,
        includeFiles: true
      },
      confidence: 0.9,
      reasoning: 'Searching will provide context for the next steps'
    };
  }

  /**
   * Valid ReAct thought for code analysis
   */
  static getAnalysisThought(files: string[]): ReActThought {
    return {
      thought: 'I should analyze these files to understand their purpose and structure',
      action: 'analyze_code',
      parameters: {
        files,
        checkComplexity: true
      },
      confidence: 0.85,
      reasoning: 'Analysis will reveal code quality and potential issues'
    };
  }

  /**
   * Valid self-correction strategy for missing parameter
   */
  static getMissingParameterCorrection(paramName: string): SelfCorrectionStrategy {
    return {
      issue: `Missing required parameter: ${paramName}`,
      severity: 'high',
      suggestedFix: `Add ${paramName} parameter to the action`,
      autoFixable: true,
      steps: [
        `Identify the action type that requires ${paramName}`,
        `Add ${paramName} parameter with appropriate value`,
        'Validate the updated action parameters',
        'Retry the action execution'
      ]
    };
  }

  /**
   * Valid self-correction for invalid JSON
   */
  static getInvalidJSONCorrection(): SelfCorrectionStrategy {
    return {
      issue: 'Response contains invalid JSON syntax',
      severity: 'critical',
      suggestedFix: 'Parse and re-format the JSON response',
      autoFixable: true,
      steps: [
        'Extract the malformed JSON from response',
        'Identify syntax errors (missing quotes, trailing commas, etc.)',
        'Apply corrections to make valid JSON',
        'Validate with JSON.parse()',
        'Return corrected response'
      ]
    };
  }

  /**
   * Valid self-correction for action failure
   */
  static getActionFailureCorrection(actionType: string, error: string): SelfCorrectionStrategy {
    return {
      issue: `Action "${actionType}" failed: ${error}`,
      severity: 'medium',
      suggestedFix: 'Retry with adjusted parameters or alternative approach',
      autoFixable: false,
      steps: [
        'Analyze the error message for root cause',
        'Determine if retry is appropriate',
        'Adjust action parameters based on error',
        'Consider alternative actions if retry fails',
        'Log failure for user review if unrecoverable'
      ]
    };
  }

  /**
   * Create AIResponse wrapper for task plan
   */
  static createTaskPlanResponse(plan: TaskPlan): AIResponse {
    return {
      content: JSON.stringify(plan, null, 2),
      metadata: {
        model: 'mock-test',
        tokens: 200,
        processing_time: 50
      }
    };
  }

  /**
   * Create AIResponse wrapper for ReAct thought
   */
  static createReActResponse(thought: ReActThought): AIResponse {
    return {
      content: JSON.stringify(thought, null, 2),
      metadata: {
        model: 'mock-test',
        tokens: 100,
        processing_time: 30
      }
    };
  }

  /**
   * Create AIResponse wrapper for self-correction
   */
  static createCorrectionResponse(correction: SelfCorrectionStrategy): AIResponse {
    return {
      content: JSON.stringify(correction, null, 2),
      metadata: {
        model: 'mock-test',
        tokens: 150,
        processing_time: 40
      }
    };
  }
}

/**
 * Validate that a response matches expected schema
 */
export function validateTaskPlan(plan: unknown): plan is TaskPlan {
  if (typeof plan !== 'object' || plan === null) {return false;}

  const p = plan as Record<string, unknown>;

  return (
    typeof p.title === 'string' &&
    typeof p.description === 'string' &&
    typeof p.reasoning === 'string' &&
    Array.isArray(p.steps) &&
    p.steps.every((step: unknown) => validateTaskStep(step))
  );
}

export function validateTaskStep(step: unknown): step is TaskStep {
  if (typeof step !== 'object' || step === null) {return false;}

  const s = step as Record<string, unknown>;

  return (
    typeof s.order === 'number' &&
    typeof s.title === 'string' &&
    typeof s.description === 'string' &&
    typeof s.action === 'object' &&
    s.action !== null &&
    typeof (s.action as Record<string, unknown>).type === 'string' &&
    typeof (s.action as Record<string, unknown>).params === 'object' &&
    typeof s.requiresApproval === 'boolean' &&
    typeof s.maxRetries === 'number'
  );
}

export function validateReActThought(thought: unknown): thought is ReActThought {
  if (typeof thought !== 'object' || thought === null) {return false;}

  const t = thought as Record<string, unknown>;

  return (
    typeof t.thought === 'string' &&
    typeof t.action === 'string' &&
    typeof t.parameters === 'object' &&
    typeof t.confidence === 'number' &&
    typeof t.reasoning === 'string'
  );
}

export function validateSelfCorrection(correction: unknown): correction is SelfCorrectionStrategy {
  if (typeof correction !== 'object' || correction === null) {return false;}

  const c = correction as Record<string, unknown>;

  return (
    typeof c.issue === 'string' &&
    (c.severity === 'low' || c.severity === 'medium' || c.severity === 'high' || c.severity === 'critical') &&
    typeof c.suggestedFix === 'string' &&
    typeof c.autoFixable === 'boolean' &&
    Array.isArray(c.steps) &&
    c.steps.every((step: unknown) => typeof step === 'string')
  );
}
