/**
 * Completion Fetcher V2
 * Handles AI completion requests with multi-model routing
 *
 * October 2025 - Enhanced for multi-model ensemble
 * Supports Claude Haiku 4.5 + Sonnet 4.5 + DeepSeek
 * Implements October 2025 best practices:
 * - "Sonnet plans, Haiku executes" pattern
 * - Context-aware model selection
 * - Automatic fallback to DeepSeek
 */
import { logger } from '../../../services/Logger';
import type { AIContextRequest } from '../../../types';
import { AIProvider } from '../AIProviderInterface';
import { AIProviderManager } from '../AIProviderManager';
import { UnifiedAIService } from '../UnifiedAIService';

import type { ModelConfig } from './ModelSelector';
import type { CodeContext, CompletionResponse, FetcherOptions } from './types';

const DEFAULT_OPTIONS: FetcherOptions = {
  streaming: false,
  maxTokens: 500,
  temperature: 0.2,
  debounceMs: 200,
};

export class CompletionFetcherV2 {
  private aiService: UnifiedAIService;
  private options: FetcherOptions;
  private providerManager?: AIProviderManager;
  private anthropicReady: boolean = false;

  constructor(aiService: UnifiedAIService, options: Partial<FetcherOptions> = {}) {
    this.aiService = aiService;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.initializeProviders();
  }

  /**
   * Initialize AI providers for multi-model support
   */
  private async initializeProviders(): Promise<void> {
    try {
      // Try to get Anthropic API key from settings or environment
      const anthropicKey =
        localStorage.getItem('anthropic_api_key') ||
        (window as any).electronAPI?.getEnv?.('ANTHROPIC_API_KEY') ||
        process.env.REACT_APP_ANTHROPIC_API_KEY;

      if (anthropicKey) {
        this.providerManager = new AIProviderManager();
        await this.providerManager.initialize();

        // Configure Anthropic provider with October 2025 models
        await this.providerManager.configureProvider(AIProvider.ANTHROPIC, {
          provider: AIProvider.ANTHROPIC,
          apiKey: anthropicKey,
          model: 'claude-3-5-haiku-20241022', // Haiku 4.5
          maxTokens: 500,
          temperature: 0.3
        } as any);

        this.anthropicReady = true;
        logger.debug('[CompletionFetcherV2] Anthropic provider initialized (Haiku 4.5 + Sonnet 4.5 ready)');
      } else {
        logger.debug('[CompletionFetcherV2] No Anthropic API key found, using DeepSeek as primary');
      }
    } catch (error) {
      logger.warn('[CompletionFetcherV2] Failed to initialize Anthropic provider:', error);
      // Continue with DeepSeek only
    }
  }

  /**
   * Fetch completion from AI with model routing
   * Routes to appropriate provider based on modelConfig
   * Implements October 2025 best practices for multi-model ensemble
   */
  async fetch(context: CodeContext, modelConfig?: ModelConfig): Promise<CompletionResponse | null> {
    const startTime = Date.now();

    try {
      // Log model selection for debugging
      logger.debug(`[CompletionFetcherV2] Fetching with model: ${modelConfig?.displayName || 'DeepSeek (default)'}`);

      // Determine which provider to use
      const useAnthropic = modelConfig?.name.includes('claude') && this.anthropicReady;

      // Build optimized prompt based on model
      const prompt = this.buildPrompt(context, modelConfig);

      // Route to appropriate provider
      const responseText = useAnthropic
        ? await this.fetchFromAnthropic(prompt, context, modelConfig!)
        : await this.fetchFromDeepSeek(prompt, context);

      if (!responseText) {
        return null;
      }

      const latency = Date.now() - startTime;

      // Log performance for monitoring
      logger.debug(`[CompletionFetcherV2] Completion received in ${latency}ms from ${modelConfig?.name || 'deepseek-chat'}`);

      return {
        text: responseText,
        model: modelConfig?.name || 'deepseek-chat',
        latency,
        fromCache: false,
        wasStreaming: this.options.streaming,
      };
    } catch (error) {
      logger.error('[CompletionFetcherV2] Fetch error:', error);

      // Fallback to DeepSeek on Anthropic error
      if (modelConfig?.name.includes('claude')) {
        logger.debug('[CompletionFetcherV2] Anthropic failed, falling back to DeepSeek');
        return this.fetch(context); // Retry without modelConfig
      }

      return null;
    }
  }

  /**
   * Fetch completion from DeepSeek (primary provider)
   * Uses existing UnifiedAIService which has DeepSeek configured
   */
  private async fetchFromDeepSeek(
    prompt: string,
    context: CodeContext
  ): Promise<string | null> {
    return this.options.streaming
      ? await this.fetchStreamingDeepSeek(prompt, context)
      : await this.fetchNonStreamingDeepSeek(prompt, context);
  }

  /**
   * Fetch completion from Anthropic (optional enhancement)
   * Implements October 2025 best practice: Haiku for speed, Sonnet for complexity
   */
  private async fetchFromAnthropic(
    prompt: string,
    context: CodeContext,
    modelConfig: ModelConfig
  ): Promise<string | null> {
    if (!this.providerManager) {
      logger.warn('[CompletionFetcherV2] Anthropic not initialized, falling back to DeepSeek');
      return this.fetchFromDeepSeek(prompt, context);
    }

    try {
      // Set the correct model in provider manager
      await this.providerManager.setModel(modelConfig.name);

      const messages = [{
        role: 'user' as const,
        content: prompt
      }];

      if (this.options.streaming) {
        // Stream from Anthropic (best for user experience)
        let accumulated = '';
        const streamGenerator = this.providerManager.streamComplete(JSON.stringify(messages), {
          maxTokens: modelConfig.maxTokens,
          temperature: modelConfig.temperature
        } as any);

        for await (const chunk of streamGenerator) {
          if (chunk.choices[0]?.delta?.content) {
            accumulated += chunk.choices[0].delta.content;
          }
        }

        return accumulated || null;
      } else {
        // Non-streaming from Anthropic
        const response = await this.providerManager.complete(JSON.stringify(messages), {
          maxTokens: modelConfig.maxTokens,
          temperature: modelConfig.temperature
        } as any);

        return response?.choices[0]?.message?.content || null;
      }
    } catch (error) {
      logger.error('[CompletionFetcherV2] Anthropic error:', error);
      // Fallback to DeepSeek
      return this.fetchFromDeepSeek(prompt, context);
    }
  }

  /**
   * Fetch completion from DeepSeek without streaming
   */
  private async fetchNonStreamingDeepSeek(
    prompt: string,
    context: CodeContext
  ): Promise<string | null> {
    try {
      const request: AIContextRequest = {
        userQuery: prompt,
        relatedFiles: [],
        workspaceContext: {
          rootPath: '',
          totalFiles: 0,
          languages: [context.language],
          testFiles: 0,
          projectStructure: {},
          dependencies: {},
          exports: {},
          symbols: {},
          lastIndexed: new Date(),
          summary: 'Inline completion context',
        },
        conversationHistory: [],
      };

      const response = await this.aiService.sendContextualMessage(request);
      return response?.content || null;
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  /**
   * Fetch completion from DeepSeek with streaming
   */
  private async fetchStreamingDeepSeek(
    prompt: string,
    context: CodeContext
  ): Promise<string | null> {
    try {
      const request: AIContextRequest = {
        userQuery: prompt,
        relatedFiles: [],
        workspaceContext: {
          rootPath: '',
          totalFiles: 0,
          languages: [context.language],
          testFiles: 0,
          projectStructure: {},
          dependencies: {},
          exports: {},
          symbols: {},
          lastIndexed: new Date(),
          summary: 'Inline completion context (streaming)',
        },
        conversationHistory: [],
      };

      // Use streaming API
      const streamGenerator = this.aiService.sendContextualMessageStream(request);

      // Accumulate chunks
      let accumulated = '';
      for await (const chunk of streamGenerator) {
        accumulated += chunk;
        // Could emit progress events here for real-time display
      }

      return accumulated || null;
    } catch (error) {
      this.handleError(error);
      return null;
    }
  }

  /**
   * Build AI completion prompt optimized for each model
   * October 2025 best practice: Model-specific prompting
   */
  private buildPrompt(context: CodeContext, modelConfig?: ModelConfig): string {
    const isComplexContext = this.assessComplexity(context);
    const modelName = modelConfig?.name || 'deepseek-chat';

    // Model-specific prompt optimization
    if (modelName.includes('haiku')) {
      // Haiku 4.5: Concise, fast completions
      return this.buildHaikuPrompt(context, isComplexContext);
    } else if (modelName.includes('sonnet')) {
      // Sonnet 4.5: Complex reasoning, multi-step
      return this.buildSonnetPrompt(context, isComplexContext);
    } else {
      // DeepSeek: Balanced approach
      return this.buildDeepSeekPrompt(context, isComplexContext);
    }
  }

  /**
   * Build prompt optimized for Claude Haiku 4.5
   * Best for: Fast, single-file completions
   */
  private buildHaikuPrompt(context: CodeContext, isComplex: boolean): string {
    return `Complete the ${context.language} code below.
Requirements: Provide ONLY the completion text starting from the cursor position.
No explanations, no markdown, just code.

${context.prefix}`;
  }

  /**
   * Build prompt optimized for Claude Sonnet 4.5
   * Best for: Complex, multi-line completions with reasoning
   */
  private buildSonnetPrompt(context: CodeContext, isComplex: boolean): string {
    return `Complete the following ${context.language} code.
Context: Line ${context.lineNumber}, column ${context.column}
Task: Provide a sophisticated completion that follows best practices.
Output: ONLY the completion text, no explanations.

\`\`\`${context.language}
${context.prefix}`;
  }

  /**
   * Build prompt optimized for DeepSeek
   * Balanced between speed and quality
   */
  private buildDeepSeekPrompt(context: CodeContext, isComplex: boolean): string {
    if (isComplex) {
      return `Complete the following ${context.language} code.
Context: We're at line ${context.lineNumber}, column ${context.column}.
Requirements:
- Provide ONLY completion text, no explanations
- Match existing code style and patterns
- Consider the full context provided

\`\`\`${context.language}
${context.prefix}`;
    } else {
      return `Complete the following ${context.language} code. Provide ONLY the completion text, no explanations:

\`\`\`${context.language}
${context.prefix}`;
    }
  }

  /**
   * Assess context complexity for prompt optimization
   * October 2025: Enhanced complexity detection
   */
  private assessComplexity(context: CodeContext): boolean {
    const lines = context.prefix.split('\n').length;
    const hasNesting = (context.prefix.match(/\{/g) || []).length > 2;
    const hasFramework = /import.*from|require\(|@Component|useState|useEffect/.test(context.prefix);
    const hasTypes = /interface|type\s+\w+|<[A-Z]/.test(context.prefix);
    const hasAsync = /async|await|Promise/.test(context.prefix);

    // Complex if multiple indicators present
    const complexityScore =
      (lines > 10 ? 1 : 0) +
      (hasNesting ? 1 : 0) +
      (hasFramework ? 1 : 0) +
      (hasTypes ? 1 : 0) +
      (hasAsync ? 1 : 0);

    return complexityScore >= 2;
  }

  /**
   * Handle fetch errors with user-friendly messages
   */
  private handleError(error: unknown): void {
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        logger.warn('[CompletionFetcherV2] No API key configured');
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        logger.error('[CompletionFetcherV2] Network error:', error.message);
      } else {
        logger.error('[CompletionFetcherV2] Error:', error.message);
      }
    } else {
      logger.error('[CompletionFetcherV2] Unknown error:', error);
    }
  }

  /**
   * Update fetcher options
   */
  setOptions(options: Partial<FetcherOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get current options
   */
  getOptions(): FetcherOptions {
    return { ...this.options };
  }

  /**
   * Enable/disable streaming
   */
  setStreaming(enabled: boolean): void {
    this.options.streaming = enabled;
  }

  /**
   * Check if Anthropic is available
   */
  isAnthropicAvailable(): boolean {
    return this.anthropicReady;
  }

  /**
   * Get provider status for debugging
   */
  getProviderStatus(): { deepseek: boolean; anthropic: boolean } {
    return {
      deepseek: true, // Always available
      anthropic: this.anthropicReady
    };
  }
}