// AI service types and interfaces
export interface AIClientConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

// Use AIMessage from main types, but add system role support
export interface AISystemMessage {
  role: 'system';
  content: string;
}

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  reasoning_content?: string | undefined; // For deepseek-reasoner CoT content
}

export interface AIStreamResponse {
  content: string;
  reasoning_content?: string; // For deepseek-reasoner CoT streaming
  finished: boolean;
  error?: string;
}

export interface AICompletionRequest {
  messages: AIChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AICompletionResponse {
  content: string;
  reasoning_content?: string | undefined; // For deepseek-reasoner CoT content
  usage?:
    | {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
      }
    | undefined;
  finishReason?: string | undefined;
}

export interface AICodeContext {
  code: string;
  language: string;
  position: { line: number; column: number };
  fileName?: string;
}

// Agent task execution types
export interface AgentAction {
  type: string;
  params: Record<string, any>;
}

export interface AgentResult {
  success: boolean;
  data?: {
    thought?: string;
    [key: string]: any;
  };
  error?: string;
}

export interface AgentStep {
  action: AgentAction;
  description?: string;
  result?: AgentResult;
}
