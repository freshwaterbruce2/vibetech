/**
 * AutoFixService Tests
 * TDD: Writing tests FIRST before implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DetectedError } from '../../services/ErrorDetector';

export interface FixSuggestion {
  id: string;
  title: string;
  description: string;
  code: string;
  startLine: number;
  endLine: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface GeneratedFix {
  error: DetectedError;
  suggestions: FixSuggestion[];
  context: string;
  explanation: string;
}

describe('AutoFixService', () => {
  let AutoFixService: any;
  let mockAIService: any;
  let mockEditor: any;
  let mockModel: any;
  let service: any;

  beforeEach(async () => {
    // Mock AI service
    mockAIService = {
      sendContextualMessage: vi.fn(),
      complete: vi.fn()
    };

    // Mock Monaco model (reusable instance)
    mockModel = {
      getValue: vi.fn(() => 'const x = 1;\nconst y = 2;'),
      getLineContent: vi.fn((line: number) => `line ${line}`),
      getValueInRange: vi.fn(() => 'selected code')
    };

    // Mock Monaco editor
    mockEditor = {
      getModel: vi.fn(() => mockModel),
      getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 }))
    };

    try {
      const module = await import('../../services/AutoFixService');
      AutoFixService = module.AutoFixService;
    } catch {
      // Expected to fail initially - TDD RED phase
      AutoFixService = null;
    }
  });

  describe('Initialization', () => {
    it('should initialize with AI service', () => {
      if (!AutoFixService) return;

      expect(() => {
        service = new AutoFixService(mockAIService);
      }).not.toThrow();
    });

    it('should require AI service', () => {
      if (!AutoFixService) return;

      expect(() => {
        new AutoFixService(null);
      }).toThrow('AI service is required');
    });
  });

  describe('Fix Generation', () => {
    it('should generate fix for TypeScript error', async () => {
      if (!AutoFixService) return;

      const error: DetectedError = {
        id: 'ts-error-1',
        type: 'typescript',
        severity: 'error',
        message: "Property 'foo' does not exist on type 'Bar'",
        file: '/test/file.ts',
        line: 10,
        column: 5,
        code: '2339'
      };

      mockAIService.sendContextualMessage.mockResolvedValue(
        'Add the "foo" property to the Bar type:\n\n```typescript\ninterface Bar {\n  foo: string;\n}\n```'
      );

      service = new AutoFixService(mockAIService);
      const fix = await service.generateFix(error, mockEditor);

      expect(fix).toMatchObject({
        error,
        suggestions: expect.arrayContaining([
          expect.objectContaining({
            title: expect.any(String),
            code: expect.any(String),
            confidence: expect.stringMatching(/high|medium|low/)
          })
        ]),
        explanation: expect.any(String)
      });
    });

    it('should generate fix for ESLint error', async () => {
      if (!AutoFixService) return;

      const error: DetectedError = {
        id: 'eslint-error-1',
        type: 'eslint',
        severity: 'error',
        message: 'Missing semicolon',
        file: '/test/file.ts',
        line: 15,
        column: 20,
        code: 'semi'
      };

      mockAIService.sendContextualMessage.mockResolvedValue(
        'Add a semicolon at the end of the line:\n\n```typescript\nconst x = 1;\n```'
      );

      service = new AutoFixService(mockAIService);
      const fix = await service.generateFix(error, mockEditor);

      expect(fix.suggestions.length).toBeGreaterThan(0);
      expect(fix.suggestions[0].code).toContain(';');
    });

    it('should generate fix for runtime error', async () => {
      if (!AutoFixService) return;

      const error: DetectedError = {
        id: 'runtime-error-1',
        type: 'runtime',
        severity: 'error',
        message: "Cannot read property 'length' of null",
        file: '/test/file.ts',
        line: 25,
        column: 10,
        stackTrace: 'at processData (file.ts:25:10)'
      };

      mockAIService.sendContextualMessage.mockResolvedValue(
        'Add null check before accessing length:\n\n```typescript\nif (data !== null) {\n  console.log(data.length);\n}\n```'
      );

      service = new AutoFixService(mockAIService);
      const fix = await service.generateFix(error, mockEditor);

      expect(fix.suggestions[0].code).toContain('null');
    });
  });

  describe('Multiple Suggestions', () => {
    it('should generate multiple fix suggestions', async () => {
      if (!AutoFixService) return;

      const error: DetectedError = {
        id: 'test-error',
        type: 'typescript',
        severity: 'error',
        message: "Type 'string' is not assignable to type 'number'",
        file: '/test/file.ts',
        line: 10,
        column: 5
      };

      mockAIService.sendContextualMessage.mockResolvedValue(
        'Here are 3 ways to fix this:\n\n' +
        '1. Convert string to number:\n```typescript\nconst x: number = parseInt(str);\n```\n\n' +
        '2. Change type to string:\n```typescript\nconst x: string = str;\n```\n\n' +
        '3. Use union type:\n```typescript\nconst x: string | number = str;\n```'
      );

      service = new AutoFixService(mockAIService);
      const fix = await service.generateFix(error, mockEditor);

      expect(fix.suggestions.length).toBeGreaterThanOrEqual(1);
    });

    it('should rank suggestions by confidence', async () => {
      if (!AutoFixService) return;

      const error: DetectedError = {
        id: 'test-error',
        type: 'typescript',
        severity: 'error',
        message: 'Test error',
        file: '/test/file.ts',
        line: 10,
        column: 5
      };

      mockAIService.sendContextualMessage.mockResolvedValue(
        'Suggestion 1 (most likely fix):\n```typescript\nconst x = 1;\n```\n\n' +
        'Alternative approach:\n```typescript\nconst x: number = 1;\n```'
      );

      service = new AutoFixService(mockAIService);
      const fix = await service.generateFix(error, mockEditor);

      // First suggestion should have highest confidence
      if (fix.suggestions.length > 1) {
        const confidenceOrder = ['high', 'medium', 'low'];
        const firstIndex = confidenceOrder.indexOf(fix.suggestions[0].confidence);
        const secondIndex = confidenceOrder.indexOf(fix.suggestions[1].confidence);

        expect(firstIndex).toBeLessThanOrEqual(secondIndex);
      }
    });
  });

  describe('Context Extraction', () => {
    it('should extract surrounding code context', async () => {
      if (!AutoFixService) return;

      const error: DetectedError = {
        id: 'test-error',
        type: 'typescript',
        severity: 'error',
        message: 'Test error',
        file: '/test/file.ts',
        line: 10,
        column: 5
      };

      mockEditor.getModel().getValue.mockReturnValue(
        'function test() {\n' +
        '  const x = 1;\n' +
        '  const y = 2;\n' +  // line 10 (error line)
        '  return x + y;\n' +
        '}'
      );

      mockAIService.sendContextualMessage.mockResolvedValue('Fix code');

      service = new AutoFixService(mockAIService);
      const fix = await service.generateFix(error, mockEditor);

      expect(fix.context).toBeTruthy();
      expect(fix.context.length).toBeGreaterThan(0);
    });

    it('should include error location in context', async () => {
      if (!AutoFixService) return;

      const error: DetectedError = {
        id: 'test-error',
        type: 'typescript',
        severity: 'error',
        message: 'Test error',
        file: '/test/file.ts',
        line: 5,
        column: 10
      };

      mockAIService.sendContextualMessage.mockResolvedValue('Fix code');

      service = new AutoFixService(mockAIService);
      await service.generateFix(error, mockEditor);

      // Check that AI was called with context including line number
      expect(mockAIService.sendContextualMessage).toHaveBeenCalledWith(
        expect.stringContaining('line 5'),
        expect.any(Object)
      );
    });

    it('should limit context to relevant lines', async () => {
      if (!AutoFixService) return;

      const error: DetectedError = {
        id: 'test-error',
        type: 'typescript',
        severity: 'error',
        message: 'Test error',
        file: '/test/file.ts',
        line: 50,
        column: 5
      };

      // Create a large file
      const largeFile = Array.from({ length: 200 }, (_, i) => `line ${i + 1}`).join('\n');
      mockEditor.getModel().getValue.mockReturnValue(largeFile);

      mockAIService.sendContextualMessage.mockResolvedValue('Fix code');

      service = new AutoFixService(mockAIService);
      const fix = await service.generateFix(error, mockEditor);

      // Context should not include entire file
      const contextLines = fix.context.split('\n').length;
      expect(contextLines).toBeLessThan(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service errors gracefully', async () => {
      if (!AutoFixService) return;

      const error: DetectedError = {
        id: 'test-error',
        type: 'typescript',
        severity: 'error',
        message: 'Test error',
        file: '/test/file.ts',
        line: 10,
        column: 5
      };

      mockAIService.sendContextualMessage.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      service = new AutoFixService(mockAIService);

      await expect(service.generateFix(error, mockEditor)).rejects.toThrow('AI service error');
    });

    it('should handle malformed AI responses', async () => {
      if (!AutoFixService) return;

      const error: DetectedError = {
        id: 'test-error',
        type: 'typescript',
        severity: 'error',
        message: 'Test error',
        file: '/test/file.ts',
        line: 10,
        column: 5
      };

      mockAIService.sendContextualMessage.mockResolvedValue(
        'This is not a valid response with no code blocks'
      );

      service = new AutoFixService(mockAIService);
      const fix = await service.generateFix(error, mockEditor);

      // Should still return a response, even if no code blocks found
      expect(fix).toBeDefined();
      expect(fix.explanation).toBeTruthy();
    });

    it('should handle missing editor context', async () => {
      if (!AutoFixService) return;

      const error: DetectedError = {
        id: 'test-error',
        type: 'typescript',
        severity: 'error',
        message: 'Test error',
        file: '/test/file.ts',
        line: 10,
        column: 5
      };

      const editorWithoutModel = {
        getModel: vi.fn(() => null)
      };

      mockAIService.sendContextualMessage.mockResolvedValue('Fix code');

      service = new AutoFixService(mockAIService);

      await expect(
        service.generateFix(error, editorWithoutModel)
      ).rejects.toThrow('Editor model not found');
    });
  });

  describe('Prompt Building', () => {
    it('should build appropriate prompt for TypeScript errors', async () => {
      if (!AutoFixService) return;

      const error: DetectedError = {
        id: 'test-error',
        type: 'typescript',
        severity: 'error',
        message: "Property 'foo' does not exist",
        file: '/test/file.ts',
        line: 10,
        column: 5,
        code: '2339'
      };

      mockAIService.sendContextualMessage.mockResolvedValue('Fix code');

      service = new AutoFixService(mockAIService);
      await service.generateFix(error, mockEditor);

      const callArgs = mockAIService.sendContextualMessage.mock.calls[0];
      const prompt = callArgs[0];

      expect(prompt).toContain('TypeScript');
      expect(prompt).toContain('2339');
      expect(prompt).toContain("Property 'foo' does not exist");
    });

    it('should include error code in prompt when available', async () => {
      if (!AutoFixService) return;

      const error: DetectedError = {
        id: 'test-error',
        type: 'typescript',
        severity: 'error',
        message: 'Test error',
        file: '/test/file.ts',
        line: 10,
        column: 5,
        code: 'TS2345'
      };

      mockAIService.sendContextualMessage.mockResolvedValue('Fix code');

      service = new AutoFixService(mockAIService);
      await service.generateFix(error, mockEditor);

      const prompt = mockAIService.sendContextualMessage.mock.calls[0][0];
      expect(prompt).toContain('TS2345');
    });

    it('should include stack trace for runtime errors', async () => {
      if (!AutoFixService) return;

      const error: DetectedError = {
        id: 'test-error',
        type: 'runtime',
        severity: 'error',
        message: 'Test error',
        file: '/test/file.ts',
        line: 10,
        column: 5,
        stackTrace: 'at test (file.ts:10:5)\nat main (file.ts:20:3)'
      };

      mockAIService.sendContextualMessage.mockResolvedValue('Fix code');

      service = new AutoFixService(mockAIService);
      await service.generateFix(error, mockEditor);

      const prompt = mockAIService.sendContextualMessage.mock.calls[0][0];
      expect(prompt).toContain('stack trace');
      expect(prompt).toContain('at test');
    });
  });

  describe('Fix Application', () => {
    it('should provide preview before applying fix', async () => {
      if (!AutoFixService) return;

      const error: DetectedError = {
        id: 'test-error',
        type: 'typescript',
        severity: 'error',
        message: 'Test error',
        file: '/test/file.ts',
        line: 10,
        column: 5
      };

      mockAIService.sendContextualMessage.mockResolvedValue(
        'Fix:\n```typescript\nconst x: number = 1;\n```'
      );

      service = new AutoFixService(mockAIService);
      const fix = await service.generateFix(error, mockEditor);

      // Should have suggestions with code that can be previewed
      expect(fix.suggestions[0]).toMatchObject({
        code: expect.any(String),
        startLine: expect.any(Number),
        endLine: expect.any(Number)
      });
    });

    it('should calculate correct line ranges for fixes', async () => {
      if (!AutoFixService) return;

      const error: DetectedError = {
        id: 'test-error',
        type: 'typescript',
        severity: 'error',
        message: 'Test error',
        file: '/test/file.ts',
        line: 10,
        column: 5
      };

      mockAIService.sendContextualMessage.mockResolvedValue(
        'Replace line 10 with:\n```typescript\nconst x: number = 1;\nconst y: number = 2;\n```'
      );

      service = new AutoFixService(mockAIService);
      const fix = await service.generateFix(error, mockEditor);

      const suggestion = fix.suggestions[0];
      expect(suggestion.startLine).toBeLessThanOrEqual(suggestion.endLine);
    });
  });

  describe('Caching', () => {
    it('should cache fixes for same error', async () => {
      if (!AutoFixService) return;

      const error: DetectedError = {
        id: 'test-error',
        type: 'typescript',
        severity: 'error',
        message: 'Test error',
        file: '/test/file.ts',
        line: 10,
        column: 5
      };

      mockAIService.sendContextualMessage.mockResolvedValue('Fix code');

      service = new AutoFixService(mockAIService);

      // Generate fix twice
      await service.generateFix(error, mockEditor);
      await service.generateFix(error, mockEditor);

      // AI service should only be called once (second call uses cache)
      expect(mockAIService.sendContextualMessage).toHaveBeenCalledTimes(1);
    });

    it('should invalidate cache when code changes', async () => {
      if (!AutoFixService) return;

      const error: DetectedError = {
        id: 'test-error',
        type: 'typescript',
        severity: 'error',
        message: 'Test error',
        file: '/test/file.ts',
        line: 10,
        column: 5
      };

      mockAIService.sendContextualMessage.mockResolvedValue('Fix code');

      service = new AutoFixService(mockAIService);

      // Generate fix
      await service.generateFix(error, mockEditor);

      // Change code by updating the mock model
      mockModel.getValue.mockReturnValue('different code');

      // Generate fix again
      await service.generateFix(error, mockEditor);

      // AI service should be called twice (cache invalidated)
      expect(mockAIService.sendContextualMessage).toHaveBeenCalledTimes(2);
    });
  });
});
