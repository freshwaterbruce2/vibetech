import {
  AICodeCompletion,
  AICodeGenerationRequest,
  AICodeGenerationResponse,
  AIContextRequest,
  AIMessage,
  AIResponse,
  DeepSeekConfig,
  WorkspaceContext,
} from '../types';
import { ApiError, handleApiError } from '../utils/errorHandler';

import { AIClient } from './ai/AIClient';
import { ConversationManager } from './ai/ConversationManager';
import { DemoResponseProvider } from './ai/DemoResponseProvider';
import { PromptBuilder } from './ai/PromptBuilder';
import { AIChatMessage, AIClientConfig } from './ai/types';

/**
 * Main AI service for code assistance, chat, and completions
 * Refactored to use modular architecture for better maintainability
 */
export class DeepSeekService {
  private aiClient: AIClient;
  private conversationManager: ConversationManager;
  private config: DeepSeekConfig;
  private isDemoMode: boolean;

  constructor(config?: Partial<DeepSeekConfig>) {
    this.config = {
      apiKey: config?.apiKey || import.meta.env['VITE_DEEPSEEK_API_KEY'] || 'demo_key',
      baseUrl:
        config?.baseUrl ||
        import.meta.env['VITE_DEEPSEEK_BASE_URL'] ||
        'https://api.deepseek.com/v1',
      model: config?.model || import.meta.env['VITE_DEEPSEEK_MODEL'] || 'deepseek-chat',
      temperature: config?.temperature || 0.3,
      maxTokens: config?.maxTokens || 2000,
    };

    this.isDemoMode = this.config.apiKey === 'demo_key';

    const clientConfig: AIClientConfig = {
      apiKey: this.config.apiKey,
      baseUrl: this.config.baseUrl,
      model: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    };

    this.aiClient = new AIClient(clientConfig);
    this.conversationManager = new ConversationManager();
  }

  updateConfig(newConfig: Partial<DeepSeekConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.isDemoMode = this.config.apiKey === 'demo_key';

    const clientConfig: AIClientConfig = {
      apiKey: this.config.apiKey,
      baseUrl: this.config.baseUrl,
      model: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens,
    };

    this.aiClient.updateConfig(clientConfig);
  }

  async sendMessage(message: string, context?: { workspaceContext?: WorkspaceContext; currentFile?: { path: string; content: string } }): Promise<AIResponse> {
    // Legacy method for backward compatibility
    const contextRequest: AIContextRequest = {
      userQuery: message,
      relatedFiles: [],
      workspaceContext: context?.workspaceContext || this.getDefaultWorkspaceContext(),
      conversationHistory: this.conversationManager.getHistory(),
    };

    if (context?.currentFile) {
      contextRequest.currentFile = {
        id: context.currentFile.path,
        name: context.currentFile.path.split('/').pop() || 'untitled',
        path: context.currentFile.path,
        content: context.currentFile.content,
        language: this.getLanguageFromPath(context.currentFile.path),
        isModified: false
      };
    }

    return this.sendContextualMessage(contextRequest);
  }

  async sendContextualMessage(request: AIContextRequest): Promise<AIResponse> {
    try {
      if (this.isDemoMode) {
        const response = DemoResponseProvider.getContextualResponse(request);
        // Add to conversation history for demo mode too
        this.conversationManager.addUserMessage(request.userQuery);
        this.conversationManager.addAssistantMessage(response.content);
        return response;
      }

      const systemPrompt = PromptBuilder.buildContextualSystemPrompt(request, this.config.model);
      const conversationHistory = this.conversationManager.getHistory();

      const messages: AIChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
          reasoning_content: msg.reasoning_content,
        })),
        { role: 'user', content: request.userQuery },
      ];

      const startTime = Date.now();
      const response = await this.aiClient.completion({ messages });
      const endTime = Date.now();

      // Add to conversation history
      this.conversationManager.addUserMessage(request.userQuery);
      this.conversationManager.addAssistantMessage(response.content);

      return {
        content: response.content,
        metadata: {
          model: this.config.model,
          tokens: response.usage?.totalTokens || 0,
          processing_time: endTime - startTime,
        },
      };
    } catch (error) {
      // Handle API errors properly
      const errorInfo = handleApiError(error);
      console.error('DeepSeek API error:', errorInfo);

      // If it's an auth error, throw it to be handled by the UI
      if (errorInfo.code === 'AUTH_ERROR') {
        throw new ApiError(errorInfo.message, errorInfo.code, errorInfo.details);
      }

      // For other errors, fallback to demo response
      const demoResponse = DemoResponseProvider.getContextualResponse(request);
      return {
        ...demoResponse,
        content: `${demoResponse.content}\n\n(Note: Using demo response due to error: ${errorInfo.message})`,
      };
    }
  }

  async *sendContextualMessageStream(
    request: AIContextRequest
  ): AsyncGenerator<string, void, unknown> {
    try {
      if (this.isDemoMode) {
        const response = DemoResponseProvider.getContextualResponse(request);
        // Add to conversation history for demo mode
        this.conversationManager.addUserMessage(request.userQuery);
        this.conversationManager.addAssistantMessage(response.content);

        const words = response.content.split(' ');
        for (const word of words) {
          yield `${word} `;
          await new Promise((resolve) => setTimeout(resolve, 10)); // Faster for tests
        }
        return;
      }

      const systemPrompt = PromptBuilder.buildContextualSystemPrompt(request, this.config.model);
      const conversationHistory = this.conversationManager.getHistory();

      const messages: AIChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
          reasoning_content: msg.reasoning_content,
        })),
        { role: 'user', content: request.userQuery },
      ];

      let fullResponse = '';

      for await (const chunk of this.aiClient.completionStream({ messages })) {
        fullResponse += chunk;
        yield chunk;
      }

      // Add to conversation history after completion
      this.conversationManager.addUserMessage(request.userQuery);
      this.conversationManager.addAssistantMessage(fullResponse);
    } catch (error) {
      const errorInfo = handleApiError(error);
      console.error('DeepSeek streaming error:', errorInfo);

      if (errorInfo.code === 'AUTH_ERROR') {
        throw new ApiError(errorInfo.message, errorInfo.code, errorInfo.details);
      }

      // Fallback to demo streaming
      const response = DemoResponseProvider.getContextualResponse(request);
      const words = response.content.split(' ');
      for (const word of words) {
        yield `${word} `;
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
  }

  async getCodeCompletion(
    code: string,
    language: string,
    position: { line: number; column: number }
  ): Promise<AICodeCompletion[]> {
    try {
      if (this.isDemoMode) {
        return DemoResponseProvider.getCodeCompletion(code, language, position);
      }

      const prompt = PromptBuilder.buildCodeCompletionPrompt(code, language, position);
      const response = await this.sendMessage(prompt);

      // Parse response to extract code completion
      const completionMatch = response.content.match(/```[\w]*\n([\s\S]*?)\n```/);
      const completionText = completionMatch?.[1] || response.content || '';

      return [
        {
          text: completionText,
          range: {
            startLineNumber: position.line,
            startColumn: position.column,
            endLineNumber: position.line,
            endColumn: position.column + completionText.length,
          },
          confidence: 0.75,
        },
      ];
    } catch (error) {
      console.error('Code completion error:', error);
      return DemoResponseProvider.getCodeCompletion(code, language, position);
    }
  }

  async explainCode(code: string, language: string): Promise<string> {
    const prompt = PromptBuilder.buildCodeExplanationPrompt(code, language);
    const response = await this.sendMessage(prompt);
    return response.content;
  }

  async refactorCode(code: string, language: string): Promise<string> {
    const prompt = PromptBuilder.buildRefactorPrompt(code, language);
    const response = await this.sendMessage(prompt);
    return response.content;
  }

  async generateCode(request: AICodeGenerationRequest): Promise<AICodeGenerationResponse> {
    try {
      if (this.isDemoMode) {
        return DemoResponseProvider.getCodeGenerationResponse(request);
      }

      const prompt = `Generate JavaScript code for: ${request.prompt}

Requirements:
'- Clean, readable code'
${request.context ? `- Context: ${request.context}` : ''}

Provide the code and a brief explanation of the implementation.`;

      const response = await this.sendMessage(prompt);

      // Extract code from response
      const codeMatch = response.content.match(/```[\w]*\n([\s\S]*?)\n```/);
      const code = codeMatch?.[1] || response.content || '';

      return {
        code,
        language: 'typescript', // Default language, can be improved to detect from context
        explanation: response.content,
      };
    } catch (error) {
      console.error('Code generation error:', error);
      return {
        code: '',
        language: 'typescript',
        explanation: `Failed to generate code. Please try again. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  clearConversationHistory(): void {
    this.conversationManager.clearHistory();
  }

  getConversationHistory(): AIMessage[] {
    return this.conversationManager.getHistory();
  }

  private getDefaultWorkspaceContext(): WorkspaceContext {
    return {
      rootPath: '/',
      totalFiles: 0,
      languages: ['JavaScript', 'TypeScript'],
      testFiles: 0,
      projectStructure: {},
      dependencies: {},
      exports: {},
      symbols: {},
      lastIndexed: new Date(),
      summary: 'Demo project',
    };
  }

  private getLanguageFromPath(path: string): string {
    const extension = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown'
    };
    return languageMap[extension || ''] || 'plaintext';
  }
}
