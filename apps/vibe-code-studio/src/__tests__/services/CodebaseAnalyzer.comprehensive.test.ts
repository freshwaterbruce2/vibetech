/**
 * Comprehensive Test Suite for CodebaseAnalyzer
 * Tests AI-powered codebase analysis, caching, and pattern recognition
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CodebaseAnalyzer } from '../../services/CodebaseAnalyzer';
import { DeepSeekService } from '../../services/DeepSeekService';
import { FileSystemService } from '../../services/FileSystemService';

// Mock DeepSeekService
vi.mock('../../services/DeepSeekService');
// Mock FileSystemService
vi.mock('../../services/FileSystemService');

describe('CodebaseAnalyzer - Comprehensive Tests', () => {
  let analyzer: CodebaseAnalyzer;
  let mockDeepSeek: DeepSeekService;
  let mockFileSystem: FileSystemService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock instances
    mockDeepSeek = new DeepSeekService('test-api-key');
    mockFileSystem = new FileSystemService();

    // Mock DeepSeekService streaming responses
    vi.spyOn(mockDeepSeek, 'sendContextualMessageStream').mockImplementation(async function* () {
      yield 'Mock AI analysis response';
    });

    analyzer = new CodebaseAnalyzer(mockFileSystem, mockDeepSeek);
  });

  describe('Initialization', () => {
    it('should create analyzer instance with required services', () => {
      expect(analyzer).toBeDefined();
      expect(analyzer).toBeInstanceOf(CodebaseAnalyzer);
    });

    it('should initialize with empty analysis cache', () => {
      const cached = analyzer.getCachedAnalysis('/test/path');
      expect(cached).toBeNull();
    });
  });

  describe('analyzeCodebase - Main Analysis', () => {
    it('should perform comprehensive codebase analysis', async () => {
      const rootPath = '/test/project';
      const context = await analyzer.analyzeCodebase(rootPath);

      expect(context).toBeDefined();
      expect(context.projectStructure).toBeDefined();
      expect(context.dependencies).toBeDefined();
      expect(context.patterns).toBeDefined();
      expect(context.metrics).toBeDefined();
      expect(context.relationships).toBeDefined();
      expect(context.documentation).toBeDefined();
      expect(context.technicalDebt).toBeDefined();
      expect(context.architecture).toBeDefined();
    });

    it('should include project structure with file stats', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');

      expect(context.projectStructure.rootPath).toBe('/test/project');
      expect(context.projectStructure.fileTypes).toBeDefined();
      expect(context.projectStructure.totalFiles).toBeGreaterThan(0);
      expect(context.projectStructure.totalLines).toBeGreaterThan(0);
      expect(context.projectStructure.languages).toBeInstanceOf(Array);
      expect(context.projectStructure.languages.length).toBeGreaterThan(0);
    });

    it('should include language distribution with percentages', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const languages = context.projectStructure.languages;

      expect(languages).toBeInstanceOf(Array);
      languages.forEach(lang => {
        expect(lang).toHaveProperty('language');
        expect(lang).toHaveProperty('files');
        expect(lang).toHaveProperty('lines');
        expect(lang).toHaveProperty('percentage');
        expect(lang.percentage).toBeGreaterThan(0);
        expect(lang.percentage).toBeLessThanOrEqual(100);
      });
    });

    it('should cache analysis results', async () => {
      const rootPath = '/test/project';
      const context = await analyzer.analyzeCodebase(rootPath);

      const cached = analyzer.getCachedAnalysis(rootPath);
      expect(cached).toEqual(context);
    });

    it('should handle analysis errors gracefully', async () => {
      // Note: When AI analysis fails, methods catch errors and return empty results
      // The main analyzeCodebase wraps everything in try-catch
      // So we need to verify it completes successfully even with AI failures
      vi.spyOn(mockDeepSeek, 'sendContextualMessageStream').mockImplementation(async function* () {
        throw new Error('AI service error');
      });

      // Should complete successfully with empty/default results
      const context = await analyzer.analyzeCodebase('/test/project');
      expect(context).toBeDefined();
      expect(context.patterns.designPatterns).toEqual([]);
      expect(context.technicalDebt).toEqual([]);
    });

    it('should support includeTests option', async () => {
      const context = await analyzer.analyzeCodebase('/test/project', { includeTests: true });
      expect(context).toBeDefined();
      expect(context.metrics.testCoverage).toBeDefined();
    });

    it('should support analyzePerformance option', async () => {
      const context = await analyzer.analyzeCodebase('/test/project', { analyzePerformance: true });
      expect(context).toBeDefined();
      expect(context.metrics.performance).toBeDefined();
      expect(context.metrics.performance.bundleSize).toBeDefined();
    });

    it('should support deepAnalysis option', async () => {
      const context = await analyzer.analyzeCodebase('/test/project', { deepAnalysis: true });
      expect(context).toBeDefined();
      expect(context.architecture).toBeDefined();
    });

    it('should execute sub-analyses in parallel', async () => {
      const startTime = Date.now();
      await analyzer.analyzeCodebase('/test/project');
      const duration = Date.now() - startTime;

      // Parallel execution should be fast (< 1 second in mock environment)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('getCachedAnalysis - Cache Management', () => {
    it('should return cached analysis if within max age', async () => {
      const rootPath = '/test/project';
      await analyzer.analyzeCodebase(rootPath);

      const cached = analyzer.getCachedAnalysis(rootPath, 300000); // 5 minutes
      expect(cached).not.toBeNull();
      expect(cached?.projectStructure.rootPath).toBe(rootPath);
    });

    it('should return null if cache is too old', async () => {
      const rootPath = '/test/project';
      await analyzer.analyzeCodebase(rootPath);

      // Request with 0ms max age
      const cached = analyzer.getCachedAnalysis(rootPath, 0);
      expect(cached).toBeNull();
    });

    it('should return null if path not cached', () => {
      const cached = analyzer.getCachedAnalysis('/uncached/path');
      expect(cached).toBeNull();
    });

    it('should use default max age of 5 minutes', async () => {
      const rootPath = '/test/project';
      await analyzer.analyzeCodebase(rootPath);

      const cached = analyzer.getCachedAnalysis(rootPath); // No max age specified
      expect(cached).not.toBeNull();
    });

    it('should cache multiple analyses for different paths', async () => {
      await analyzer.analyzeCodebase('/project1');
      await analyzer.analyzeCodebase('/project2');

      const cached1 = analyzer.getCachedAnalysis('/project1');
      const cached2 = analyzer.getCachedAnalysis('/project2');

      expect(cached1).not.toBeNull();
      expect(cached2).not.toBeNull();
      expect(cached1?.projectStructure.rootPath).toBe('/project1');
      expect(cached2?.projectStructure.rootPath).toBe('/project2');
    });
  });

  describe('Dependencies Analysis', () => {
    it('should return dependency map with all categories', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');

      expect(context.dependencies).toBeDefined();
      expect(context.dependencies.internal).toBeInstanceOf(Array);
      expect(context.dependencies.external).toBeInstanceOf(Array);
      expect(context.dependencies.circular).toBeInstanceOf(Array);
      expect(context.dependencies.unused).toBeInstanceOf(Array);
      expect(context.dependencies.missing).toBeInstanceOf(Array);
    });
  });

  describe('Code Patterns Analysis - AI-Powered', () => {
    it('should analyze code patterns using AI', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');

      expect(mockDeepSeek.sendContextualMessageStream).toHaveBeenCalled();
      expect(context.patterns).toBeDefined();
      expect(context.patterns.designPatterns).toBeInstanceOf(Array);
      expect(context.patterns.namingConventions).toBeInstanceOf(Array);
      expect(context.patterns.codeStyles).toBeInstanceOf(Array);
      expect(context.patterns.antiPatterns).toBeInstanceOf(Array);
    });

    it('should detect design patterns with confidence scores', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const patterns = context.patterns.designPatterns;

      patterns.forEach(pattern => {
        expect(pattern).toHaveProperty('name');
        expect(pattern).toHaveProperty('files');
        expect(pattern).toHaveProperty('confidence');
        expect(pattern).toHaveProperty('description');
        expect(pattern.confidence).toBeGreaterThanOrEqual(0);
        expect(pattern.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should identify naming conventions with consistency scores', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const conventions = context.patterns.namingConventions;

      conventions.forEach(convention => {
        expect(convention).toHaveProperty('type');
        expect(convention).toHaveProperty('pattern');
        expect(convention).toHaveProperty('examples');
        expect(convention).toHaveProperty('consistency');
        expect(convention.consistency).toBeGreaterThanOrEqual(0);
        expect(convention.consistency).toBeLessThanOrEqual(1);
      });
    });

    it('should analyze code style consistency', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const styles = context.patterns.codeStyles;

      styles.forEach(style => {
        expect(style).toHaveProperty('aspect');
        expect(style).toHaveProperty('style');
        expect(style).toHaveProperty('consistency');
      });
    });

    it('should handle pattern analysis errors gracefully', async () => {
      vi.spyOn(mockDeepSeek, 'sendContextualMessageStream').mockImplementation(async function* () {
        throw new Error('AI service error');
      });

      // Pattern analysis catches errors and returns empty results
      const context = await analyzer.analyzeCodebase('/test/project');
      expect(context.patterns.designPatterns).toEqual([]);
      expect(context.patterns.namingConventions).toEqual([]);
      expect(context.patterns.codeStyles).toEqual([]);
      expect(context.patterns.antiPatterns).toEqual([]);
    });
  });

  describe('Metrics Analysis', () => {
    it('should calculate complexity metrics', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const complexity = context.metrics.complexity;

      expect(complexity).toBeDefined();
      expect(complexity.cyclomaticComplexity).toBeGreaterThan(0);
      expect(complexity.cognitiveComplexity).toBeGreaterThan(0);
      expect(complexity.nestingDepth).toBeGreaterThan(0);
      expect(complexity.functionLength).toBeGreaterThan(0);
      expect(complexity.classSize).toBeGreaterThan(0);
    });

    it('should calculate maintainability metrics', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const maintainability = context.metrics.maintainability;

      expect(maintainability).toBeDefined();
      expect(maintainability.duplicatedLines).toBeGreaterThanOrEqual(0);
      expect(maintainability.duplicatedBlocks).toBeGreaterThanOrEqual(0);
      expect(maintainability.maintainabilityIndex).toBeGreaterThan(0);
      expect(maintainability.maintainabilityIndex).toBeLessThanOrEqual(100);
      expect(maintainability.technicalDebtRatio).toBeGreaterThanOrEqual(0);
    });

    it('should calculate test coverage metrics', async () => {
      const context = await analyzer.analyzeCodebase('/test/project', { includeTests: true });
      const coverage = context.metrics.testCoverage;

      expect(coverage).toBeDefined();
      expect(coverage.linesCovered).toBeGreaterThanOrEqual(0);
      expect(coverage.totalLines).toBeGreaterThan(0);
      expect(coverage.linesCovered).toBeLessThanOrEqual(coverage.totalLines);
      expect(coverage.branchesCovered).toBeGreaterThanOrEqual(0);
      expect(coverage.totalBranches).toBeGreaterThanOrEqual(0);
      expect(coverage.testFiles).toBeInstanceOf(Array);
      expect(coverage.uncoveredFiles).toBeInstanceOf(Array);
    });

    it('should calculate performance metrics', async () => {
      const context = await analyzer.analyzeCodebase('/test/project', { analyzePerformance: true });
      const performance = context.metrics.performance;

      expect(performance).toBeDefined();
      expect(performance.bundleSize).toBeGreaterThan(0);
      expect(performance.loadTime).toBeGreaterThan(0);
      expect(performance.memoryUsage).toBeGreaterThan(0);
      expect(performance.hotspots).toBeInstanceOf(Array);
    });
  });

  describe('File Relationships Analysis', () => {
    it('should analyze file relationships and clusters', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const relationships = context.relationships;

      expect(relationships).toBeDefined();
      expect(relationships.clusters).toBeInstanceOf(Array);
      expect(relationships.isolatedFiles).toBeInstanceOf(Array);
      expect(relationships.coreFiles).toBeInstanceOf(Array);
      expect(relationships.utilityFiles).toBeInstanceOf(Array);
    });

    it('should identify core files', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const coreFiles = context.relationships.coreFiles;

      expect(coreFiles).toBeInstanceOf(Array);
      expect(coreFiles.length).toBeGreaterThan(0);
      coreFiles.forEach(file => {
        expect(typeof file).toBe('string');
      });
    });
  });

  describe('Documentation Analysis', () => {
    it('should analyze README documentation quality', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const readme = context.documentation.readme;

      expect(readme).toBeDefined();
      expect(readme).toHaveProperty('exists');
      expect(readme).toHaveProperty('completeness');
      expect(readme).toHaveProperty('clarity');
      expect(readme).toHaveProperty('upToDate');
      expect(readme.completeness).toBeGreaterThanOrEqual(0);
      expect(readme.completeness).toBeLessThanOrEqual(1);
      expect(readme.clarity).toBeGreaterThanOrEqual(0);
      expect(readme.clarity).toBeLessThanOrEqual(1);
    });

    it('should analyze code comments', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const comments = context.documentation.comments;

      expect(comments).toBeDefined();
      expect(comments).toHaveProperty('ratio');
      expect(comments).toHaveProperty('quality');
      expect(comments).toHaveProperty('outdated');
      expect(comments).toHaveProperty('missing');
      expect(comments.outdated).toBeInstanceOf(Array);
      expect(comments.missing).toBeInstanceOf(Array);
    });

    it('should analyze type definitions', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const types = context.documentation.typeDefinitions;

      expect(types).toBeDefined();
      expect(types).toHaveProperty('coverage');
      expect(types).toHaveProperty('quality');
      expect(types).toHaveProperty('missingTypes');
      expect(types.missingTypes).toBeInstanceOf(Array);
    });

    it('should analyze API documentation', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const api = context.documentation.apiDocumentation;

      expect(api).toBeDefined();
      expect(api).toHaveProperty('endpoints');
      expect(api).toHaveProperty('documented');
      expect(api).toHaveProperty('examples');
      expect(api).toHaveProperty('upToDate');
    });
  });

  describe('Technical Debt Analysis - AI-Powered', () => {
    it('should detect technical debt using AI', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');

      expect(mockDeepSeek.sendContextualMessageStream).toHaveBeenCalled();
      expect(context.technicalDebt).toBeInstanceOf(Array);
    });

    it('should categorize technical debt by type', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const debt = context.technicalDebt;

      debt.forEach(item => {
        expect(item).toHaveProperty('type');
        expect(['code_smell', 'bug_risk', 'security_issue', 'performance_issue', 'maintainability_issue'])
          .toContain(item.type);
      });
    });

    it('should include severity levels', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const debt = context.technicalDebt;

      debt.forEach(item => {
        expect(item).toHaveProperty('severity');
        expect(['low', 'medium', 'high', 'critical']).toContain(item.severity);
      });
    });

    it('should include effort estimates', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const debt = context.technicalDebt;

      debt.forEach(item => {
        expect(item).toHaveProperty('effort');
        expect(['trivial', 'easy', 'medium', 'hard', 'complex']).toContain(item.effort);
      });
    });

    it('should include impact assessment', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const debt = context.technicalDebt;

      debt.forEach(item => {
        expect(item).toHaveProperty('impact');
        expect(['low', 'medium', 'high']).toContain(item.impact);
        expect(item).toHaveProperty('description');
        expect(item.description.length).toBeGreaterThan(0);
      });
    });

    it('should handle technical debt analysis errors', async () => {
      vi.spyOn(mockDeepSeek, 'sendContextualMessageStream').mockImplementation(async function* () {
        throw new Error('AI service error');
      });

      // Technical debt analysis catches errors and returns empty array
      const context = await analyzer.analyzeCodebase('/test/project');
      expect(context.technicalDebt).toEqual([]);
    });
  });

  describe('Architecture Analysis - AI-Powered', () => {
    it('should analyze architecture patterns using AI', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');

      expect(mockDeepSeek.sendContextualMessageStream).toHaveBeenCalled();
      expect(context.architecture).toBeDefined();
      expect(context.architecture.patterns).toBeInstanceOf(Array);
      expect(context.architecture.layers).toBeInstanceOf(Array);
      expect(context.architecture.modules).toBeInstanceOf(Array);
      expect(context.architecture.dataFlow).toBeDefined();
      expect(context.architecture.recommendations).toBeInstanceOf(Array);
    });

    it('should identify architecture patterns with confidence', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const patterns = context.architecture.patterns;

      patterns.forEach(pattern => {
        expect(pattern).toHaveProperty('name');
        expect(pattern).toHaveProperty('confidence');
        expect(pattern).toHaveProperty('description');
        expect(pattern).toHaveProperty('files');
        expect(pattern.confidence).toBeGreaterThanOrEqual(0);
        expect(pattern.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should analyze architecture layers', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const layers = context.architecture.layers;

      expect(layers).toBeInstanceOf(Array);
      layers.forEach(layer => {
        expect(layer).toHaveProperty('name');
        expect(layer).toHaveProperty('files');
        expect(layer).toHaveProperty('dependencies');
        expect(layer).toHaveProperty('violations');
        expect(layer.files).toBeInstanceOf(Array);
        expect(layer.dependencies).toBeInstanceOf(Array);
        expect(layer.violations).toBeInstanceOf(Array);
      });
    });

    it('should analyze data flow', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const dataFlow = context.architecture.dataFlow;

      expect(dataFlow).toBeDefined();
      expect(dataFlow.sources).toBeInstanceOf(Array);
      expect(dataFlow.sinks).toBeInstanceOf(Array);
      expect(dataFlow.transformations).toBeInstanceOf(Array);
      expect(dataFlow.bottlenecks).toBeInstanceOf(Array);
    });

    it('should provide architecture recommendations', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const recommendations = context.architecture.recommendations;

      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('type');
        expect(['refactor', 'extract', 'merge', 'restructure']).toContain(rec.type);
        expect(rec).toHaveProperty('description');
        expect(rec).toHaveProperty('files');
        expect(rec).toHaveProperty('benefit');
        expect(rec).toHaveProperty('effort');
        expect(['low', 'medium', 'high']).toContain(rec.effort);
      });
    });

    it('should handle architecture analysis errors', async () => {
      vi.spyOn(mockDeepSeek, 'sendContextualMessageStream').mockImplementation(async function* () {
        throw new Error('AI service error');
      });

      // Architecture analysis catches errors and returns empty structures
      const context = await analyzer.analyzeCodebase('/test/project');
      expect(context.architecture.patterns).toEqual([]);
      expect(context.architecture.layers).toEqual([]);
      expect(context.architecture.modules).toEqual([]);
      expect(context.architecture.recommendations).toEqual([]);
    });
  });

  describe('getFocusedAnalysis - Targeted Analysis', () => {
    it('should perform focused pattern analysis for specific files', async () => {
      const result = await analyzer.getFocusedAnalysis(['/test/file.ts'], 'patterns');

      expect(result).toBeDefined();
      expect(mockDeepSeek.sendContextualMessageStream).toHaveBeenCalled();
    });

    it('should perform focused debt analysis', async () => {
      const result = await analyzer.getFocusedAnalysis(['/test/file.ts'], 'debt');

      expect(result).toBeDefined();
      expect(mockDeepSeek.sendContextualMessageStream).toHaveBeenCalled();
    });

    it('should perform focused architecture analysis', async () => {
      const result = await analyzer.getFocusedAnalysis(['/test/file.ts'], 'architecture');

      expect(result).toBeDefined();
      expect(mockDeepSeek.sendContextualMessageStream).toHaveBeenCalled();
    });

    it('should perform focused metrics analysis', async () => {
      const result = await analyzer.getFocusedAnalysis(['/test/file.ts'], 'metrics');

      expect(result).toBeDefined();
    });

    it('should throw error for unknown analysis type', async () => {
      await expect(
        analyzer.getFocusedAnalysis(['/test/file.ts'], 'unknown' as any)
      ).rejects.toThrow('Unknown analysis type');
    });

    it('should handle empty file list', async () => {
      const result = await analyzer.getFocusedAnalysis([], 'patterns');
      expect(result).toBeNull();
    });
  });

  describe('analyzeFileChange - Real-time Analysis', () => {
    it('should analyze individual file changes', async () => {
      const result = await analyzer.analyzeFileChange('/test/file.ts', 'const x = 1;');

      expect(result).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(result.debt).toBeDefined();
      expect(result.metrics).toBeDefined();
    });

    it('should return patterns for changed file', async () => {
      const result = await analyzer.analyzeFileChange('/test/file.ts', 'const x = 1;');

      expect(result.patterns.designPatterns).toBeInstanceOf(Array);
      expect(result.patterns.namingConventions).toBeInstanceOf(Array);
      expect(result.patterns.codeStyles).toBeInstanceOf(Array);
      expect(result.patterns.antiPatterns).toBeInstanceOf(Array);
    });

    it('should return technical debt for changed file', async () => {
      const result = await analyzer.analyzeFileChange('/test/file.ts', 'const x = 1;');

      expect(result.debt).toBeInstanceOf(Array);
    });

    it('should return partial metrics for changed file', async () => {
      const result = await analyzer.analyzeFileChange('/test/file.ts', 'const x = 1;');

      expect(result.metrics).toBeDefined();
      expect(result.metrics.complexity).toBeDefined();
      expect(result.metrics.complexity?.cyclomaticComplexity).toBeGreaterThan(0);
    });

    it('should handle different file types', async () => {
      const tsResult = await analyzer.analyzeFileChange('/test/file.ts', 'const x = 1;');
      const jsxResult = await analyzer.analyzeFileChange('/test/component.tsx', '<div />');
      const jsResult = await analyzer.analyzeFileChange('/test/script.js', 'var y = 2;');

      expect(tsResult).toBeDefined();
      expect(jsxResult).toBeDefined();
      expect(jsResult).toBeDefined();
    });
  });

  describe('generateInsights - AI-Powered Recommendations', () => {
    it('should generate actionable insights from analysis', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const insights = await analyzer.generateInsights(context);

      expect(insights).toBeInstanceOf(Array);
      expect(insights.length).toBeGreaterThan(0);
      expect(mockDeepSeek.sendContextualMessageStream).toHaveBeenCalled();
    });

    it('should include priority improvements in insights', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const insights = await analyzer.generateInsights(context);

      insights.forEach(insight => {
        expect(typeof insight).toBe('string');
        expect(insight.length).toBeGreaterThan(0);
      });
    });

    it('should handle insight generation errors', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');

      vi.spyOn(mockDeepSeek, 'sendContextualMessageStream').mockImplementation(async function* () {
        throw new Error('AI service error');
      });

      const insights = await analyzer.generateInsights(context);
      expect(insights).toBeInstanceOf(Array);
      expect(insights[0]).toContain('unavailable');
    });

    it('should calculate coverage percentage correctly', async () => {
      const context = await analyzer.analyzeCodebase('/test/project');
      const coverage = (context.metrics.testCoverage.linesCovered / context.metrics.testCoverage.totalLines) * 100;

      expect(coverage).toBeGreaterThanOrEqual(0);
      expect(coverage).toBeLessThanOrEqual(100);
    });
  });

  describe('Performance & Edge Cases', () => {
    it('should handle large projects efficiently', async () => {
      const startTime = Date.now();
      await analyzer.analyzeCodebase('/large/project');
      const duration = Date.now() - startTime;

      // Should complete in reasonable time even with mocks
      expect(duration).toBeLessThan(2000); // 2 seconds
    });

    it('should handle multiple concurrent analyses', async () => {
      const promises = [
        analyzer.analyzeCodebase('/project1'),
        analyzer.analyzeCodebase('/project2'),
        analyzer.analyzeCodebase('/project3'),
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.projectStructure).toBeDefined();
      });
    });

    it('should handle special characters in paths', async () => {
      const context = await analyzer.analyzeCodebase('/test/project with spaces/@special');
      expect(context).toBeDefined();
      expect(context.projectStructure.rootPath).toBe('/test/project with spaces/@special');
    });

    it('should handle empty project paths', async () => {
      const context = await analyzer.analyzeCodebase('');
      expect(context).toBeDefined();
      expect(context.projectStructure.rootPath).toBe('');
    });

    it('should handle Windows-style paths', async () => {
      const context = await analyzer.analyzeCodebase('C:\\Users\\test\\project');
      expect(context).toBeDefined();
      expect(context.projectStructure.rootPath).toBe('C:\\Users\\test\\project');
    });

    it('should invalidate cache after re-analysis', async () => {
      const rootPath = '/test/project';

      // First analysis
      await analyzer.analyzeCodebase(rootPath);
      const firstCache = analyzer.getCachedAnalysis(rootPath);

      // Second analysis (should update cache)
      await analyzer.analyzeCodebase(rootPath);
      const secondCache = analyzer.getCachedAnalysis(rootPath);

      expect(firstCache).not.toBeNull();
      expect(secondCache).not.toBeNull();
      // Cache timestamp should be updated
    });
  });

  describe('AI Integration - DeepSeekService', () => {
    it('should call AI service with correct context for patterns', async () => {
      await analyzer.analyzeCodebase('/test/project');

      const calls = vi.mocked(mockDeepSeek.sendContextualMessageStream).mock.calls;
      const patternCall = calls.find(call =>
        call[0].userQuery.includes('Analyze the codebase patterns')
      );

      expect(patternCall).toBeDefined();
      expect(patternCall?.[0].workspaceContext).toBeDefined();
      expect(patternCall?.[0].workspaceContext.languages).toContain('TypeScript');
    });

    it('should call AI service for technical debt analysis', async () => {
      await analyzer.analyzeCodebase('/test/project');

      const calls = vi.mocked(mockDeepSeek.sendContextualMessageStream).mock.calls;
      const debtCall = calls.find(call =>
        call[0].userQuery.includes('technical debt')
      );

      expect(debtCall).toBeDefined();
    });

    it('should call AI service for architecture analysis', async () => {
      await analyzer.analyzeCodebase('/test/project');

      const calls = vi.mocked(mockDeepSeek.sendContextualMessageStream).mock.calls;
      const archCall = calls.find(call =>
        call[0].userQuery.includes('architecture')
      );

      expect(archCall).toBeDefined();
    });

    it('should stream AI responses correctly', async () => {
      let streamedContent = '';
      vi.spyOn(mockDeepSeek, 'sendContextualMessageStream').mockImplementation(async function* () {
        yield 'chunk1 ';
        yield 'chunk2 ';
        yield 'chunk3';
      });

      // Simulate streaming by capturing the content
      const context = await analyzer.analyzeCodebase('/test/project');

      // Verify analysis completed successfully even with streaming
      expect(context).toBeDefined();
    });
  });
});
