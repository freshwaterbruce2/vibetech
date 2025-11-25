// AI service module exports
export { AIClient } from './AIClient';
export { ConversationManager } from './ConversationManager';
export { DemoResponseProvider } from './DemoResponseProvider';
export { PromptBuilder } from './PromptBuilder';

// New modular exports (Phase 4)
export { AIProviderDetector } from './AIProviderDetector';
export { AIResponseMapper } from './AIResponseMapper';
export { AIErrorLogger } from './AIErrorLogger';

export type {
  AIChatMessage,
  AIClientConfig,
  AICodeContext,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamResponse,
  AISystemMessage,
} from './types';
