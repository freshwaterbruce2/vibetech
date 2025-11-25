/**
 * AIResponseMapper Tests
 *
 * Tests for unified AI response mapping
 */

import { describe, it, expect } from 'vitest';
import { AIResponseMapper } from '../../../services/ai/AIResponseMapper';

describe('AIResponseMapper', () => {
  describe('mapProviderResponse', () => {
    it('should map content from provider response', () => {
      const response = {
        content: 'Test response',
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
        finishReason: 'stop',
      };

      const result = AIResponseMapper.mapProviderResponse(response);

      expect(result.content).toBe('Test response');
      expect(result.usage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
      expect(result.finishReason).toBe('stop');
    });

    it('should extract content from choices array', () => {
      const response = {
        choices: [{ message: { content: 'Choice content' }, finishReason: 'length' }],
      };

      const result = AIResponseMapper.mapProviderResponse(response);

      expect(result.content).toBe('Choice content');
      expect(result.finishReason).toBe('length');
    });

    it('should handle missing usage data', () => {
      const response = {
        content: 'Test',
      };

      const result = AIResponseMapper.mapProviderResponse(response);

      expect(result.usage).toBeUndefined();
    });

    it('should normalize usage token field names', () => {
      const response = {
        content: 'Test',
        usage: {
          promptTokens: 5,
          completionTokens: 15,
          totalTokens: 20,
        },
      };

      const result = AIResponseMapper.mapProviderResponse(response);

      expect(result.usage?.promptTokens).toBe(5);
      expect(result.usage?.completionTokens).toBe(15);
      expect(result.usage?.totalTokens).toBe(20);
    });
  });

  describe('mapDeepSeekResponse', () => {
    it('should map DeepSeek API response', () => {
      const data = {
        choices: [
          {
            message: {
              content: 'DeepSeek response',
              reasoning_content: 'Reasoning here',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 12,
          completion_tokens: 25,
          total_tokens: 37,
        },
      };

      const result = AIResponseMapper.mapDeepSeekResponse(data);

      expect(result.content).toBe('DeepSeek response');
      expect(result.reasoning_content).toBe('Reasoning here');
      expect(result.usage).toEqual({
        promptTokens: 12,
        completionTokens: 25,
        totalTokens: 37,
      });
      expect(result.finishReason).toBe('stop');
    });

    it('should handle missing reasoning content', () => {
      const data = {
        choices: [{ message: { content: 'No reasoning' }, finish_reason: 'stop' }],
      };

      const result = AIResponseMapper.mapDeepSeekResponse(data);

      expect(result.content).toBe('No reasoning');
      expect(result.reasoning_content).toBeUndefined();
    });
  });

  describe('extractStreamContent', () => {
    it('should extract content from direct content field', () => {
      const chunk = { content: 'Stream chunk' };
      expect(AIResponseMapper.extractStreamContent(chunk)).toBe('Stream chunk');
    });

    it('should extract content from choices delta', () => {
      const chunk = { choices: [{ delta: { content: 'Delta content' } }] };
      expect(AIResponseMapper.extractStreamContent(chunk)).toBe('Delta content');
    });

    it('should return null if no content found', () => {
      const chunk = { choices: [{ delta: {} }] };
      expect(AIResponseMapper.extractStreamContent(chunk)).toBeNull();
    });
  });

  describe('extractStreamReasoning', () => {
    it('should extract reasoning from delta', () => {
      const chunk = {
        choices: [{ delta: { reasoning_content: 'Reasoning step' } }],
      };

      expect(AIResponseMapper.extractStreamReasoning(chunk)).toBe('Reasoning step');
    });

    it('should return null if no reasoning found', () => {
      const chunk = { choices: [{ delta: { content: 'No reasoning' } }] };
      expect(AIResponseMapper.extractStreamReasoning(chunk)).toBeNull();
    });
  });
});
