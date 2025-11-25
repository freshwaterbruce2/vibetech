/**
 * AIErrorLogger Tests
 *
 * Tests for centralized AI error logging
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIErrorLogger } from '../../../services/ai/AIErrorLogger';
import { databaseService } from '../../../services/DatabaseService';

// Mock database service
vi.mock('../../../services/DatabaseService', () => ({
  databaseService: {
    logMistake: vi.fn().mockResolvedValue(1),
  },
}));

describe('AIErrorLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logApiError', () => {
    it('should log API error to database', async () => {
      const error = new Error('API failed');
      const context = {
        model: 'gpt-4',
        provider: 'openai',
        operation: 'completion',
      };

      await AIErrorLogger.logApiError(error, context);

      expect(databaseService.logMistake).toHaveBeenCalledWith(
        expect.objectContaining({
          mistakeType: 'api_error',
          mistakeCategory: 'openai',
          description: 'API request failed: API failed',
          impactSeverity: 'HIGH',
          tags: ['api', 'openai', 'network'],
        })
      );
    });

    it('should handle string errors', async () => {
      await AIErrorLogger.logApiError('String error', { provider: 'test' });

      expect(databaseService.logMistake).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'API request failed: String error',
        })
      );
    });

    it('should not fail if database logging fails', async () => {
      vi.mocked(databaseService.logMistake).mockRejectedValueOnce(new Error('DB error'));

      await expect(
        AIErrorLogger.logApiError(new Error('Test'), { provider: 'test' })
      ).resolves.not.toThrow();
    });
  });

  describe('logStreamingError', () => {
    it('should log streaming error with correct category', async () => {
      const error = new Error('Stream failed');
      const context = { model: 'deepseek-chat', provider: 'deepseek' };

      await AIErrorLogger.logStreamingError(error, context);

      expect(databaseService.logMistake).toHaveBeenCalledWith(
        expect.objectContaining({
          mistakeType: 'streaming_error',
          mistakeCategory: 'api_streaming',
          description: 'Streaming error: Stream failed',
          tags: ['api', 'streaming', 'deepseek'],
        })
      );
    });
  });

  describe('logEmptyResponse', () => {
    it('should log empty response error', async () => {
      const context = { model: 'gpt-4', provider: 'openai' };

      await AIErrorLogger.logEmptyResponse(context);

      expect(databaseService.logMistake).toHaveBeenCalledWith(
        expect.objectContaining({
          mistakeType: 'api_error',
          mistakeCategory: 'empty_response',
          description: 'No content in API response',
        })
      );
    });
  });

  describe('logHttpError', () => {
    it('should log HTTP error with status code', async () => {
      await AIErrorLogger.logHttpError(500, 'Internal Server Error', {
        provider: 'anthropic',
        model: 'claude-3',
      });

      expect(databaseService.logMistake).toHaveBeenCalledWith(
        expect.objectContaining({
          mistakeCategory: 'http',
          description: 'Streaming failed: HTTP 500 Internal Server Error',
          tags: ['streaming', 'sse', 'anthropic', 'http-error'],
        })
      );
    });
  });

  describe('shouldLog', () => {
    it('should return true for most errors', () => {
      expect(AIErrorLogger.shouldLog(new Error('Normal error'))).toBe(true);
      expect(AIErrorLogger.shouldLog('String error')).toBe(true);
    });

    it('should return false for AbortError', () => {
      const abortError = new Error('AbortError: Request aborted');
      expect(AIErrorLogger.shouldLog(abortError)).toBe(false);
    });
  });

  describe('formatContext', () => {
    it('should format context with all fields', async () => {
      const context = {
        provider: 'openai',
        model: 'gpt-4',
        operation: 'completion',
        additionalContext: 'Extra info',
      };

      await AIErrorLogger.logApiError(new Error('Test'), context);

      expect(databaseService.logMistake).toHaveBeenCalledWith(
        expect.objectContaining({
          contextWhenOccurred: 'Provider: openai, Model: gpt-4, Operation: completion, Extra info',
        })
      );
    });

    it('should handle partial context', async () => {
      const context = { model: 'gpt-4' };

      await AIErrorLogger.logApiError(new Error('Test'), context);

      expect(databaseService.logMistake).toHaveBeenCalledWith(
        expect.objectContaining({
          contextWhenOccurred: 'Model: gpt-4',
        })
      );
    });
  });
});
