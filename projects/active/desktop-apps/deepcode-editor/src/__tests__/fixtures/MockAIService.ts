import { AIContextRequest, AIResponse } from '../../types';
import { MockAIResponses, TaskPlan, ReActThought, SelfCorrectionStrategy } from './mockAIResponses';

/**
 * Mock AI Service for testing
 * Provides predictable responses without requiring API keys
 */
export class MockAIService {
  private responseQueue: AIResponse[] = [];
  private responseIndex = 0;
  private callHistory: AIContextRequest[] = [];

  constructor() {
    this.reset();
  }

  /**
   * Queue a specific response to be returned on next call
   */
  queueResponse(response: AIResponse): void {
    this.responseQueue.push(response);
  }

  /**
   * Queue a task plan response
   */
  queueTaskPlan(plan: TaskPlan): void {
    this.queueResponse(MockAIResponses.createTaskPlanResponse(plan));
  }

  /**
   * Queue a ReAct thought response
   */
  queueReActThought(thought: ReActThought): void {
    this.queueResponse(MockAIResponses.createReActResponse(thought));
  }

  /**
   * Queue a self-correction response
   */
  queueCorrection(correction: SelfCorrectionStrategy): void {
    this.queueResponse(MockAIResponses.createCorrectionResponse(correction));
  }

  /**
   * Get next queued response (or default if queue is empty)
   */
  async getResponse(request: AIContextRequest): Promise<AIResponse> {
    this.callHistory.push(request);

    if (this.responseIndex < this.responseQueue.length) {
      const response = this.responseQueue[this.responseIndex];
      this.responseIndex++;
      return response;
    }

    // Default response if no queued responses
    return this.getDefaultResponse(request);
  }

  /**
   * Get a contextual default response based on the request
   */
  private getDefaultResponse(request: AIContextRequest): AIResponse {
    const query = request.userQuery.toLowerCase();

    // Task planning request
    if (query.includes('output format (json)') || query.includes('available actions:')) {
      const plan = MockAIResponses.getCodeReviewPlan();
      return MockAIResponses.createTaskPlanResponse(plan);
    }

    // ReAct thought request
    if (query.includes('thought:') || query.includes('action:')) {
      const thought = MockAIResponses.getSearchThought('default query');
      return MockAIResponses.createReActResponse(thought);
    }

    // Self-correction request
    if (query.includes('error:') || query.includes('fix:')) {
      const correction = MockAIResponses.getMissingParameterCorrection('searchQuery');
      return MockAIResponses.createCorrectionResponse(correction);
    }

    // Generic response
    return {
      content: `Mock response for: ${request.userQuery}`,
      metadata: {
        model: 'mock-test',
        tokens: 50,
        processing_time: 20
      }
    };
  }

  /**
   * Get call history for assertions
   */
  getCallHistory(): AIContextRequest[] {
    return [...this.callHistory];
  }

  /**
   * Get number of calls made
   */
  getCallCount(): number {
    return this.callHistory.length;
  }

  /**
   * Get last call
   */
  getLastCall(): AIContextRequest | undefined {
    return this.callHistory[this.callHistory.length - 1];
  }

  /**
   * Reset the service state
   */
  reset(): void {
    this.responseQueue = [];
    this.responseIndex = 0;
    this.callHistory = [];
  }

  /**
   * Check if all queued responses have been consumed
   */
  hasUnconsumedResponses(): boolean {
    return this.responseIndex < this.responseQueue.length;
  }

  /**
   * Get number of unconsumed responses
   */
  getUnconsumedCount(): number {
    return this.responseQueue.length - this.responseIndex;
  }
}

/**
 * Factory for common test scenarios
 */
export class MockAIScenarios {
  /**
   * Create a service configured for successful code review flow
   */
  static createCodeReviewScenario(): MockAIService {
    const service = new MockAIService();

    // Queue task planning response
    service.queueTaskPlan(MockAIResponses.getCodeReviewPlan('/test/workspace'));

    // Queue thought for first step (search)
    service.queueReActThought(MockAIResponses.getSearchThought('project structure'));

    // Queue thought for second step (analysis)
    service.queueReActThought(MockAIResponses.getAnalysisThought(['src/index.ts']));

    return service;
  }

  /**
   * Create a service configured for bug fix with self-correction
   */
  static createBugFixWithCorrectionScenario(): MockAIService {
    const service = new MockAIService();

    // Queue task planning response
    service.queueTaskPlan(MockAIResponses.getBugFixPlan('/test/workspace'));

    // Queue thought with missing parameter (will trigger correction)
    service.queueReActThought({
      thought: 'Search for the bug',
      action: 'search_codebase',
      parameters: {
        // Missing searchQuery - will need correction
        pattern: 'bug'
      },
      confidence: 0.7,
      reasoning: 'Need to find the bug'
    });

    // Queue self-correction response
    service.queueCorrection(MockAIResponses.getMissingParameterCorrection('searchQuery'));

    // Queue corrected thought
    service.queueReActThought(MockAIResponses.getSearchThought('bug error'));

    return service;
  }

  /**
   * Create a service configured for action failure scenario
   */
  static createActionFailureScenario(): MockAIService {
    const service = new MockAIService();

    // Queue task planning
    service.queueTaskPlan(MockAIResponses.getBugFixPlan('/test/workspace'));

    // Queue thought that will fail
    service.queueReActThought(MockAIResponses.getSearchThought('nonexistent file'));

    // Queue failure correction
    service.queueCorrection(
      MockAIResponses.getActionFailureCorrection('search_codebase', 'File not found')
    );

    return service;
  }

  /**
   * Create a service configured for invalid JSON scenario
   */
  static createInvalidJSONScenario(): MockAIService {
    const service = new MockAIService();

    // Queue malformed response
    service.queueResponse({
      content: '{ invalid json, missing quotes }',
      metadata: {
        model: 'mock-test',
        tokens: 50,
        processing_time: 20
      }
    });

    // Queue correction
    service.queueCorrection(MockAIResponses.getInvalidJSONCorrection());

    // Queue valid response after correction
    service.queueTaskPlan(MockAIResponses.getCodeReviewPlan());

    return service;
  }
}

/**
 * Helper to create a mock service with custom responses
 */
export function createMockAIService(...responses: AIResponse[]): MockAIService {
  const service = new MockAIService();
  responses.forEach(response => service.queueResponse(response));
  return service;
}
