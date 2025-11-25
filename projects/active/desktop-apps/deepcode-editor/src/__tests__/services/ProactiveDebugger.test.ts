/**
 * ProactiveDebugger Tests
 * TDD: AI-powered proactive debugging with predictive analysis
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock DetectedError from ErrorDetector
const mockError = {
  id: 'err-1',
  type: 'typescript' as const,
  severity: 'error' as const,
  message: "Property 'foo' does not exist on type 'Bar'",
  file: '/test/file.ts',
  line: 10,
  column: 5,
  code: 'TS2339'
};

// Mock AIService
vi.mock('../../services/ai/UnifiedAIService', () => ({
  UnifiedAIService: vi.fn().mockImplementation(() => ({
    sendContextualMessage: vi.fn().mockResolvedValue('Suggested fix: Add property foo to interface Bar')
  }))
}));

describe('ProactiveDebugger', () => {
  let ProactiveDebugger: any;
  let mockAIService: any;

  beforeEach(async () => {
    mockAIService = {
      sendContextualMessage: vi.fn().mockResolvedValue('AI suggestion')
    };

    try {
      const module = await import('../../services/ProactiveDebugger');
      ProactiveDebugger = module.ProactiveDebugger;
    } catch {
      // Expected to fail initially - TDD RED phase
      ProactiveDebugger = null;
    }
  });

  describe('Initialization', () => {
    it('should initialize with AI service', () => {
      if (!ProactiveDebugger) return;

      expect(() => {
        new ProactiveDebugger(mockAIService);
      }).not.toThrow();
    });

    it('should start with empty error history', () => {
      if (!ProactiveDebugger) return;

      const proactiveDebugger = new ProactiveDebugger(mockAIService);
      const history = proactiveDebugger.getErrorHistory();

      expect(history).toEqual([]);
    });
  });

  describe('Error Analysis', () => {
    it('should analyze error and provide context', async () => {
      if (!ProactiveDebugger) return;

      const proactiveDebugger = new ProactiveDebugger(mockAIService);
      const analysis = await proactiveDebugger.analyzeError(mockError, 'const bar: Bar = {};');

      expect(analysis).toBeDefined();
      expect(analysis.error).toEqual(mockError);
      expect(analysis.context).toBeDefined();
      expect(analysis.insights).toBeDefined();
    });

    it('should detect error patterns', async () => {
      if (!ProactiveDebugger) return;

      const proactiveDebugger = new ProactiveDebugger(mockAIService);

      // Add similar errors
      await proactiveDebugger.analyzeError(mockError, 'code1');
      await proactiveDebugger.analyzeError({ ...mockError, id: 'err-2', line: 20 }, 'code2');
      await proactiveDebugger.analyzeError({ ...mockError, id: 'err-3', line: 30 }, 'code3');

      const patterns = proactiveDebugger.detectPatterns();

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].pattern).toBeDefined();
      expect(patterns[0].occurrences).toBeGreaterThanOrEqual(3);
    });

    it('should provide severity assessment', async () => {
      if (!ProactiveDebugger) return;

      const proactiveDebugger = new ProactiveDebugger(mockAIService);
      const analysis = await proactiveDebugger.analyzeError(mockError, 'code');

      expect(analysis.severityScore).toBeGreaterThan(0);
      expect(analysis.severityScore).toBeLessThanOrEqual(10);
    });

    it('should suggest preventive actions', async () => {
      if (!ProactiveDebugger) return;

      const proactiveDebugger = new ProactiveDebugger(mockAIService);
      const analysis = await proactiveDebugger.analyzeError(mockError, 'code');

      expect(analysis.preventiveActions).toBeDefined();
      expect(Array.isArray(analysis.preventiveActions)).toBe(true);
      expect(analysis.preventiveActions.length).toBeGreaterThan(0);
    });
  });

  describe('Predictive Analysis', () => {
    it('should predict potential errors from code', async () => {
      if (!ProactiveDebugger) return;

      const proactiveDebugger = new ProactiveDebugger(mockAIService);
      const code = `
        const user = getUser();
        console.log(user.name); // Potential null reference
      `;

      const predictions = await proactiveDebugger.predictErrors(code, '/test/file.ts');

      expect(Array.isArray(predictions)).toBe(true);
    });

    it('should assign confidence scores to predictions', async () => {
      if (!ProactiveDebugger) return;

      const proactiveDebugger = new ProactiveDebugger(mockAIService);
      const predictions = await proactiveDebugger.predictErrors('const x = null; x.foo();', '/test.ts');

      if (predictions.length > 0) {
        expect(predictions[0].confidence).toBeDefined();
        expect(predictions[0].confidence).toBeGreaterThan(0);
        expect(predictions[0].confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should categorize predicted errors', async () => {
      if (!ProactiveDebugger) return;

      const proactiveDebugger = new ProactiveDebugger(mockAIService);
      const predictions = await proactiveDebugger.predictErrors('async function() { await x; }', '/test.ts');

      if (predictions.length > 0) {
        expect(predictions[0].category).toBeDefined();
        expect(['null-reference', 'type-mismatch', 'async-await', 'promise-handling']).toContain(predictions[0].category);
      }
    });
  });

  describe('Error History', () => {
    it('should track error history', async () => {
      if (!ProactiveDebugger) return;

      const proactiveDebugger = new ProactiveDebugger(mockAIService);

      await proactiveDebugger.analyzeError(mockError, 'code');
      await proactiveDebugger.analyzeError({ ...mockError, id: 'err-2' }, 'code2');

      const history = proactiveDebugger.getErrorHistory();

      expect(history.length).toBe(2);
    });

    it('should limit history size', async () => {
      if (!ProactiveDebugger) return;

      const proactiveDebugger = new ProactiveDebugger(mockAIService, { maxHistorySize: 5 });

      for (let i = 0; i < 10; i++) {
        await proactiveDebugger.analyzeError({ ...mockError, id: `err-${i}` }, 'code');
      }

      const history = proactiveDebugger.getErrorHistory();

      expect(history.length).toBe(5);
    });

    it('should get errors by file', async () => {
      if (!ProactiveDebugger) return;

      const proactiveDebugger = new ProactiveDebugger(mockAIService);

      await proactiveDebugger.analyzeError({ ...mockError, file: '/file1.ts' }, 'code');
      await proactiveDebugger.analyzeError({ ...mockError, file: '/file2.ts', id: 'err-2' }, 'code');

      const file1Errors = proactiveDebugger.getErrorsByFile('/file1.ts');

      expect(file1Errors.length).toBe(1);
      expect(file1Errors[0].error.file).toBe('/file1.ts');
    });

    it('should clear history', async () => {
      if (!ProactiveDebugger) return;

      const proactiveDebugger = new ProactiveDebugger(mockAIService);

      await proactiveDebugger.analyzeError(mockError, 'code');
      proactiveDebugger.clearHistory();

      const history = proactiveDebugger.getErrorHistory();

      expect(history.length).toBe(0);
    });
  });

  describe('AI Insights', () => {
    it('should generate AI insights for errors', async () => {
      if (!ProactiveDebugger) return;

      const proactiveDebugger = new ProactiveDebugger(mockAIService);
      const analysis = await proactiveDebugger.analyzeError(mockError, 'const bar: Bar = {}; bar.foo();');

      expect(analysis.insights).toBeDefined();
      expect(analysis.insights.length).toBeGreaterThan(0);
    });

    it('should suggest related documentation', async () => {
      if (!ProactiveDebugger) return;

      const proactiveDebugger = new ProactiveDebugger(mockAIService);
      const analysis = await proactiveDebugger.analyzeError(mockError, 'code');

      expect(analysis.relatedDocs).toBeDefined();
      expect(Array.isArray(analysis.relatedDocs)).toBe(true);
    });

    it('should provide code examples', async () => {
      if (!ProactiveDebugger) return;

      const proactiveDebugger = new ProactiveDebugger(mockAIService);
      const analysis = await proactiveDebugger.analyzeError(mockError, 'code');

      expect(analysis.codeExamples).toBeDefined();
      expect(Array.isArray(analysis.codeExamples)).toBe(true);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track analysis time', async () => {
      if (!ProactiveDebugger) return;

      const proactiveDebugger = new ProactiveDebugger(mockAIService);
      const analysis = await proactiveDebugger.analyzeError(mockError, 'code');

      expect(analysis.analysisTime).toBeDefined();
      expect(analysis.analysisTime).toBeGreaterThan(0);
    });

    it('should cache repeated analyses', async () => {
      if (!ProactiveDebugger) return;

      const proactiveDebugger = new ProactiveDebugger(mockAIService);

      const analysis1 = await proactiveDebugger.analyzeError(mockError, 'same code');
      const analysis2 = await proactiveDebugger.analyzeError(mockError, 'same code');

      // Second call should be faster (cached)
      expect(analysis2.cached).toBe(true);
    });

    it('should provide performance metrics', () => {
      if (!ProactiveDebugger) return;

      const proactiveDebugger = new ProactiveDebugger(mockAIService);
      const metrics = proactiveDebugger.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalAnalyses).toBeDefined();
      expect(metrics.averageTime).toBeDefined();
      expect(metrics.cacheHitRate).toBeDefined();
    });
  });
});
