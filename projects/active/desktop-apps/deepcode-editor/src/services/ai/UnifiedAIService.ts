/**
 * UnifiedAIService - Bridges DeepSeekService interface with AIProviderManager
 * Provides backward-compatible interface while using the new multi-provider system
 */
import { SecureApiKeyManager } from '@vibetech/shared-utils/security';

import { logger } from '../../services/Logger';
import {
  AIContextRequest,
  AIResponse,
  WorkspaceContext,
} from '../../types';

import { AIProvider, CompletionOptions,MODEL_REGISTRY } from './AIProviderInterface';
import { AIProviderManager } from './AIProviderManager';
import { DemoResponseProvider } from './DemoResponseProvider';

export class UnifiedAIService {
  private providerManager: AIProviderManager;
  private currentModel: string = 'deepseek-chat';
  private isDemoMode: boolean = true;
  private keyManager: SecureApiKeyManager;

  constructor(initialModel?: string) {
    this.providerManager = new AIProviderManager();
    this.keyManager = SecureApiKeyManager.getInstance();

    if (initialModel) {
      this.currentModel = initialModel;
    }

    // Check for stored API keys - will be loaded async by initializeProvidersFromStorage()
    const storedProviders: any[] = [];
    logger.debug('[UnifiedAI] Initializing, will load providers async');

    // Check if user forced demo mode via toggle (overrides everything)
    const forceDemoMode = typeof localStorage !== 'undefined' && localStorage.getItem('forceDemoMode') === 'true';

    if (forceDemoMode) {
      this.isDemoMode = true;
      logger.debug('[UnifiedAI] Demo mode FORCED by user toggle, ignoring API keys');
    } else if (storedProviders.length > 0) {
      this.isDemoMode = false;
      logger.debug('[UnifiedAI] API keys found, demo mode disabled immediately');
    } else {
      logger.debug('[UnifiedAI] No API keys found, staying in demo mode');
    }

    // Initialize providers with stored API keys (async - completes later!)
    this.initializeProvidersFromStorage();

    // Listen for API key updates from Settings component
    if (typeof window !== 'undefined') {
      window.addEventListener('apiKeyUpdated', this.handleApiKeyUpdate.bind(this) as EventListener);
    }
  }

  /**
   * Handle API key update event from Settings
   */
  private handleApiKeyUpdate(event: Event) {
    const customEvent = event as CustomEvent;
    logger.debug('[UnifiedAI] API key updated event received for provider:', customEvent.detail?.provider);
    this.refreshProviders().catch(err => {
      logger.error('[UnifiedAI] Failed to refresh providers after API key update:', err);
    });
  }

  /**
   * Initialize all providers that have API keys stored
   */
  private async initializeProvidersFromStorage(): Promise<void> {
    const storedProviders = await this.keyManager.getStoredProviders();
    logger.debug('[UnifiedAI] initializeProvidersFromStorage starting, found:', storedProviders.length, 'providers');

    for (const stored of storedProviders) {
      try {
        let provider: AIProvider | null = null;

        // Map storage provider IDs to AIProvider enum
        switch (stored.provider) {
          case 'openai':
            provider = AIProvider.OPENAI;
            break;
          case 'anthropic':
            provider = AIProvider.ANTHROPIC;
            break;
          case 'google':
            provider = AIProvider.GOOGLE;
            break;
          case 'deepseek':
            provider = AIProvider.DEEPSEEK;
            break;
        }

        if (provider) {
          const apiKey = await this.keyManager.getApiKey(stored.provider);
          if (apiKey) {
            await this.providerManager.setProvider(provider, {
              provider,
              apiKey,
              model: this.getDefaultModelForProvider(provider),
            });
            logger.debug(`[UnifiedAI] Initialized provider: ${provider}`);
            this.isDemoMode = false; // We have at least one real provider
            logger.debug('[UnifiedAI] Demo mode disabled, isDemoMode:', this.isDemoMode);
          }
        }
      } catch (error) {
        logger.error(`Failed to initialize provider ${stored.provider}:`, error);
      }
    }

    logger.debug('[UnifiedAI] initializeProvidersFromStorage complete, final isDemoMode:', this.isDemoMode);
  }

  /**
   * Get default model for a provider
   */
  private getDefaultModelForProvider(provider: AIProvider): string {
    const models = Object.values(MODEL_REGISTRY).filter(m => m.provider === provider);
    return models.length > 0 ? models[0].id : '';
  }

  /**
   * Update the current model
   */
  async setModel(modelId: string): Promise<void> {
    let modelInfo = MODEL_REGISTRY[modelId];

    // Auto-fix invalid model IDs (fallback to deepseek-chat)
    if (!modelInfo) {
      logger.warn(`Unknown model: ${modelId}. Falling back to deepseek-chat.`);
      modelId = 'deepseek-chat';
      modelInfo = MODEL_REGISTRY[modelId];

      if (!modelInfo) {
        throw new Error(`Fatal error: Default model deepseek-chat not found in registry.`);
      }
    }

    // Check if provider is configured
    if (!this.providerManager.isProviderConfigured(modelInfo.provider)) {
      // Try to initialize the provider if we have an API key
      const providerName = this.getProviderStorageName(modelInfo.provider);
      const apiKey = await this.keyManager.getApiKey(providerName);

      if (apiKey) {
        await this.providerManager.setProvider(modelInfo.provider, {
          provider: modelInfo.provider,
          apiKey,
          model: modelId,
        });
        this.isDemoMode = false;
      } else {
        throw new Error(
          `API key not configured for ${modelInfo.provider}. Please add your API key in Settings > API Keys.`
        );
      }
    }

    this.currentModel = modelId;
  }

  /**
   * Map AIProvider enum to storage provider name
   */
  private getProviderStorageName(provider: AIProvider): string {
    switch (provider) {
      case AIProvider.OPENAI: return 'openai';
      case AIProvider.ANTHROPIC: return 'anthropic';
      case AIProvider.GOOGLE: return 'google';
      case AIProvider.DEEPSEEK: return 'deepseek';
      default: return '';
    }
  }

  /**
   * Send a contextual message (backward compatible)
   */
  async sendContextualMessage(request: AIContextRequest): Promise<AIResponse> {
    logger.debug('[UnifiedAI] sendContextualMessage called, isDemoMode:', this.isDemoMode);

    if (this.isDemoMode) {
      logger.debug('[UnifiedAI] RETURNING DEMO RESPONSE - API keys not initialized yet!');
      return DemoResponseProvider.getContextualResponse(request);
    }

    logger.debug('[UnifiedAIService] Calling providerManager.complete() with model:', this.currentModel);

    const completion = await this.providerManager.complete(this.currentModel, {
      messages: [
        {
          role: 'system',
          content: this.buildSystemPrompt(request),
        },
        {
          role: 'user',
          content: request.userQuery,
        },
      ],
      temperature: 0.3,
      maxTokens: 8192, // Maximum supported by DeepSeek models for full task planning responses
    });

    logger.debug('[UnifiedAIService] Received completion:', completion);
    logger.debug('[UnifiedAIService] Completion choices:', completion.choices);
    logger.debug('[UnifiedAIService] First choice:', completion.choices?.[0]);

    // Extract content from first choice
    const content = completion.choices?.[0]?.message?.content || completion.content || '';
    logger.debug('[UnifiedAIService] Extracted content:', content);

    const result = {
      content,
      metadata: {
        model: this.currentModel,
        tokens: completion.usage?.totalTokens || 0,
        processing_time: 0,
      },
    };

    logger.debug('[UnifiedAIService] Returning AIResponse:', result);

    return result;
  }

  /**
   * Stream a contextual message response
   */
  async *sendContextualMessageStream(request: AIContextRequest): AsyncGenerator<string> {
    if (this.isDemoMode) {
      const response = DemoResponseProvider.getContextualResponse(request);
      // Simulate streaming for demo mode
      const words = response.content.split(' ');
      for (const word of words) {
        yield `${word  } `;
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return;
    }

    const modelInfo = MODEL_REGISTRY[this.currentModel];
    if (!modelInfo) {
      throw new Error(`Unknown model: ${this.currentModel}`);
    }

    // Check if provider is configured
    if (!this.providerManager.isProviderConfigured(modelInfo.provider)) {
      throw new Error(
        `Provider ${modelInfo.provider} not configured. Please add your API key in Settings.`
      );
    }

    try {
      for await (const chunk of this.providerManager.streamComplete(this.currentModel, {
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt(request),
          },
          {
            role: 'user',
            content: request.userQuery,
          },
        ],
        temperature: 0.3,
        maxTokens: 2000,
      })) {
        // Handle StreamCompletionResponse from providers
        const chunkAny = chunk as any;

        // Extract content from choices[0].delta.content (standard OpenAI/DeepSeek format)
        if (chunkAny.choices && chunkAny.choices[0]?.delta?.content) {
          yield chunkAny.choices[0].delta.content;
        }

        // Handle custom format with type/delta (for future providers)
        if (chunkAny.type === 'content' && chunkAny.delta) {
          yield chunkAny.delta;
        }

        // Handle reasoning content if model supports it
        if (chunkAny.type === 'reasoning' && chunkAny.delta) {
          yield `[REASONING] ${chunkAny.delta}`;
        }
      }
    } catch (error) {
      logger.error('Streaming error:', error);
      throw error;
    }
  }

  /**
   * Build system prompt from context
   */
  private buildSystemPrompt(request: AIContextRequest): string {
    let prompt = `You are an expert coding assistant. You help developers write, understand, and improve code.

CRITICAL ANTI-HALLUCINATION INSTRUCTIONS (2025 Best Practices):
1. Use ONLY the information explicitly provided in the workspace context below
2. Do NOT assume or guess about technologies, frameworks, or architectures not listed
3. If information is not in the context, say "I cannot determine this from the provided context"
4. VERIFY project type from package.json dependencies before answering
5. Do NOT hallucinate about non-existent frameworks (e.g., do not assume Express if not in deps)
6. Be conservative and accurate rather than confident and wrong

`;

    // Add workspace context with detailed project information
    if (request.workspaceContext) {
      // FIX: AI Hallucination - Root Cause #3 (Include comprehensive summary from Phase 1)
      const { summary } = request.workspaceContext;

      // Log summary to verify it's being sent (Phase 5 - Debugging)
      logger.debug('[UnifiedAI] Workspace summary length:', summary?.length || 0, 'chars');
      logger.debug('[UnifiedAI] Summary preview:', summary?.substring(0, 500));

      prompt += `Workspace: ${request.workspaceContext.rootPath}
Languages: ${request.workspaceContext?.languages?.join(', ') || 'unknown'}
Total Files: ${request.workspaceContext.totalFiles}
Test Files: ${request.workspaceContext.testFiles}

`;

      // Include comprehensive workspace summary (CRITICAL - contains all Phase 1 improvements)
      if (summary && summary.length > 100) {
        prompt += `=== COMPREHENSIVE WORKSPACE ANALYSIS ===
${summary}

`;
      }

      // Include project structure overview
      if (request.workspaceContext.projectStructure && Object.keys(request.workspaceContext.projectStructure).length > 0) {
        prompt += `Project Structure:\n`;
        const folders = Object.keys(request.workspaceContext.projectStructure).slice(0, 20);
        folders.forEach(folder => {
          prompt += `- ${folder}\n`;
        });
        if (Object.keys(request.workspaceContext.projectStructure).length > 20) {
          prompt += `... and ${Object.keys(request.workspaceContext.projectStructure).length - 20} more directories\n`;
        }
        prompt += '\n';
      }

      // Include key dependencies
      if (request.workspaceContext.dependencies && Object.keys(request.workspaceContext.dependencies).length > 0) {
        const depTypes = Object.keys(request.workspaceContext.dependencies);
        if (depTypes.length > 0) {
          prompt += `Dependencies:\n`;
          depTypes.forEach(type => {
            const deps = request.workspaceContext!.dependencies[type];
            if (deps && deps.length > 0) {
              prompt += `- ${type}: ${deps.slice(0, 10).join(', ')}${deps.length > 10 ? ` (+ ${deps.length - 10} more)` : ''}\n`;
            }
          });
          prompt += '\n';
        }
      }

      // Note: To get actual file contents, the user should:
      // 1. Open specific files in the editor (they'll be in request.currentFile or openFiles)
      // 2. Use @file syntax to reference specific files
      // 3. The workspace indexing provides structure, not all file contents
    }

    // Add current file context
    if (request.currentFile || (request as any).fileContent) {
      const filePath = request.currentFile?.path || 'Current file';
      const language = request.currentFile?.language || 'text';
      const content = (request as any).fileContent || request.currentFile?.content;

      prompt += `Current file: ${filePath}
Language: ${language}

`;

      if (content) {
        // Smart truncation: Include up to 50,000 characters (similar to Cursor)
        // For larger files, include beginning and end sections
        const maxChars = 50000;
        let fileContent = content;

        if (content.length > maxChars) {
          const halfMax = Math.floor(maxChars / 2);
          const beginning = content.substring(0, halfMax);
          const end = content.substring(content.length - halfMax);
          fileContent = `${beginning}\n\n... [File truncated: ${content.length - maxChars} characters omitted] ...\n\n${end}`;
        }

        prompt += `File content:
\`\`\`${language}
${fileContent}
\`\`\`

`;
      }
    }

    // Add open files context (like Cursor's multi-file awareness)
    if (request.userActivity?.openFiles && request.userActivity.openFiles.length > 0) {
      prompt += `Open files in workspace:
${request.userActivity.openFiles.map(f => `- ${f.path}`).slice(0, 10).join('\n')}
${request.userActivity.openFiles.length > 10 ? `... and ${request.userActivity.openFiles.length - 10} more` : ''}

`;
    }

    prompt += `When the user asks you to review, explain, or analyze code:
- Read and understand the FULL file content provided above
- Give specific line-by-line feedback when relevant
- Identify potential bugs, security issues, or performance problems
- Suggest improvements with clear reasoning
- Point out best practices violations

When writing code:
- Follow best practices and conventions
- Include comments for complex logic
- Consider edge cases and error handling
- Suggest tests when appropriate
- Maintain consistency with the existing codebase style`;

    return prompt;
  }

  /**
   * Get current model
   */
  getCurrentModel(): string {
    return this.currentModel;
  }

  /**
   * Check if in demo mode
   */
  isDemo(): boolean {
    return this.isDemoMode;
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    return this.providerManager.getAvailableModels();
  }

  /**
   * Check if a provider is configured
   */
  isProviderConfigured(provider: AIProvider): boolean {
    return this.providerManager.isProviderConfigured(provider);
  }

  /**
   * Refresh providers from storage (call after API keys are added/updated)
   */
  async refreshProviders(): Promise<void> {
    logger.debug('[UnifiedAI] Refreshing providers from storage...');
    await this.initializeProvidersFromStorage();
    logger.debug('[UnifiedAI] Providers refreshed, isDemoMode:', this.isDemoMode);
  }

  /**
   * Get default workspace context (for backward compatibility)
   */
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
}
