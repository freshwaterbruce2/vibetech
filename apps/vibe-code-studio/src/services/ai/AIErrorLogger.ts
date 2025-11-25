/**
 * AI Error Logger
 *
 * Centralizes error logging to database for AI operations
 * Provides consistent error handling and prevents silent failures
 */

import { databaseService } from '../DatabaseService';

export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AIErrorContext {
  model?: string;
  provider?: string;
  operation?: string;
  additionalContext?: string;
}

export class AIErrorLogger {
  /**
   * Log API error to database
   */
  static async logApiError(
    error: Error | string,
    context: AIErrorContext,
    severity: ErrorSeverity = 'HIGH'
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    try {
      await databaseService.logMistake({
        mistakeType: 'api_error',
        mistakeCategory: context.provider || 'ai_api',
        description: `API request failed: ${errorMessage}`,
        contextWhenOccurred: this.formatContext(context),
        impactSeverity: severity,
        preventionStrategy: 'Implement retry logic with exponential backoff',
        tags: ['api', context.provider || 'ai', 'network'],
      });
    } catch (dbError) {
      // Don't fail the original operation if logging fails
      console.warn('[AIErrorLogger] Failed to log API error to database:', dbError);
    }
  }

  /**
   * Log streaming error to database
   */
  static async logStreamingError(
    error: Error | string,
    context: AIErrorContext,
    severity: ErrorSeverity = 'HIGH'
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    try {
      await databaseService.logMistake({
        mistakeType: 'streaming_error',
        mistakeCategory: 'api_streaming',
        description: `Streaming error: ${errorMessage}`,
        contextWhenOccurred: this.formatContext(context),
        impactSeverity: severity,
        preventionStrategy: 'Handle streaming errors gracefully with fallback',
        tags: ['api', 'streaming', context.provider || 'ai'],
      });
    } catch (dbError) {
      console.warn('[AIErrorLogger] Failed to log streaming error to database:', dbError);
    }
  }

  /**
   * Log empty response error
   */
  static async logEmptyResponse(
    context: AIErrorContext,
    severity: ErrorSeverity = 'MEDIUM'
  ): Promise<void> {
    try {
      await databaseService.logMistake({
        mistakeType: 'api_error',
        mistakeCategory: 'empty_response',
        description: 'No content in API response',
        contextWhenOccurred: this.formatContext(context),
        impactSeverity: severity,
        preventionStrategy: 'Validate API response structure before processing',
        tags: ['api', 'empty-response', 'validation'],
      });
    } catch (dbError) {
      console.warn('[AIErrorLogger] Failed to log empty response to database:', dbError);
    }
  }

  /**
   * Log HTTP error
   */
  static async logHttpError(
    statusCode: number,
    statusText: string,
    context: AIErrorContext,
    severity: ErrorSeverity = 'MEDIUM'
  ): Promise<void> {
    try {
      await databaseService.logMistake({
        mistakeType: 'streaming_error',
        mistakeCategory: 'http',
        description: `Streaming failed: HTTP ${statusCode} ${statusText}`,
        contextWhenOccurred: this.formatContext(context),
        impactSeverity: severity,
        preventionStrategy: 'Check API status and credentials before making requests',
        tags: ['streaming', 'sse', context.provider || 'ai', 'http-error'],
      });
    } catch (dbError) {
      console.warn('[AIErrorLogger] Failed to log HTTP error to database:', dbError);
    }
  }

  /**
   * Format context for logging
   */
  private static formatContext(context: AIErrorContext): string {
    const parts: string[] = [];

    if (context.provider) {
      parts.push(`Provider: ${context.provider}`);
    }

    if (context.model) {
      parts.push(`Model: ${context.model}`);
    }

    if (context.operation) {
      parts.push(`Operation: ${context.operation}`);
    }

    if (context.additionalContext) {
      parts.push(context.additionalContext);
    }

    return parts.join(', ');
  }

  /**
   * Check if error should be logged (avoid spam for certain errors)
   */
  static shouldLog(error: Error | string): boolean {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Don't log connection errors during expected disconnections
    if (errorMessage.includes('AbortError')) {
      return false;
    }

    return true;
  }
}
