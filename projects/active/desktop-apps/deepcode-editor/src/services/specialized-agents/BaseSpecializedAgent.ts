/**
 * Base class for all specialized agents in the multi-agent system
 * Provides common functionality, standardized interfaces, and learning capabilities
 */
import { DeepSeekService } from '../DeepSeekService';
import { logger } from '../../utils/logger';

export enum AgentCapability {
  CODE_ANALYSIS = 'code_analysis',
  CODE_GENERATION = 'code_generation',
  CODE_REVIEW = 'code_review',
  REFACTORING = 'refactoring',
  DEBUGGING = 'debugging',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation',
  SECURITY_SCANNING = 'security_scanning',
  PERFORMANCE_PROFILING = 'performance_profiling',
  ARCHITECTURE_DESIGN = 'architecture_design',
  SYSTEM_DESIGN = 'system_design',
  API_DESIGN = 'api_design',
  DATABASE_DESIGN = 'database_design',
  UI_DESIGN = 'ui_design',
  ACCESSIBILITY = 'accessibility',
  DEPLOYMENT = 'deployment',
  MONITORING = 'monitoring',
  OPTIMIZATION = 'optimization',
  BEST_PRACTICES = 'best_practices',
  DESIGN_PATTERNS = 'design_patterns',
  FORMATTING = 'formatting',
  ERROR_HANDLING = 'error_handling',
  STATE_MANAGEMENT = 'state_management',
  AUTHENTICATION = 'authentication',
  CACHING = 'caching',
  REAL_TIME = 'real_time',
  MICROSERVICES = 'microservices',
  CONTAINERIZATION = 'containerization',
  CI_CD = 'ci_cd',
  LOAD_TESTING = 'load_testing',
  VULNERABILITY_SCANNING = 'vulnerability_scanning',
  PENETRATION_TESTING = 'penetration_testing',
  COMPLIANCE = 'compliance',
  DATA_VALIDATION = 'data_validation',
  INTERNATIONALIZATION = 'internationalization',
  SEO = 'seo',
  ANALYTICS = 'analytics'
}

export interface AgentContext {
  workspaceRoot?: string;
  currentFile?: string;
  selectedText?: string;
  files?: string[];
  recentFiles?: string[];
  gitBranch?: string;
  projectType?: string;
  dependencies?: string[];
  userPreferences?: Record<string, any>;
  sessionHistory?: AgentMemory[];
  relatedFiles?: string[];
  codebaseMetrics?: CodebaseMetrics;
}

export interface CodebaseMetrics {
  totalFiles: number;
  totalLines: number;
  languages: Record<string, number>;
  complexity: number;
  testCoverage?: number;
  techStack: string[];
  patterns: string[];
}

export interface AgentResponse {
  content: string;
  confidence: number;
  reasoning?: string;
  suggestions?: string[];
  codeChanges?: CodeChange[];
  followupQuestions?: string[];
  relatedTopics?: string[];
  performance?: PerformanceMetrics;
}

export interface CodeChange {
  filePath: string;
  type: 'create' | 'modify' | 'delete';
  content?: string;
  lineStart?: number;
  lineEnd?: number;
  description: string;
}

export interface PerformanceMetrics {
  processingTime: number;
  memoryUsage: number;
  apiCalls: number;
  cacheHits: number;
  tokenCount: number;
}

export interface AgentMemory {
  id: string;
  timestamp: Date;
  request: string;
  response: string;
  context: Partial<AgentContext>;
  success: boolean;
  learnings?: string[];
  patterns?: string[];
}

export interface LearningPattern {
  pattern: string;
  frequency: number;
  successRate: number;
  contexts: string[];
  lastUsed: Date;
}

/**
 * Enhanced base class for specialized agents with learning capabilities
 */
export abstract class BaseSpecializedAgent {
  protected deepSeekService: DeepSeekService;
  protected memory: AgentMemory[] = [];
  protected learningPatterns: Map<string, LearningPattern> = new Map();
  protected performanceMetrics: PerformanceMetrics[] = [];
  protected contextCache: Map<string, any> = new Map();
  
  constructor(
    protected name: string,
    protected capabilities: AgentCapability[],
    deepSeekService: DeepSeekService
  ) {
    this.deepSeekService = deepSeekService;
    this.loadMemoryFromStorage();
  }

  /**
   * Abstract methods that must be implemented by specialized agents
   */
  abstract getRole(): string;
  abstract getSpecialization(): string;
  protected abstract generatePrompt(request: string, context: AgentContext): string;
  protected abstract analyzeResponse(response: string, context: AgentContext): AgentResponse;

  /**
   * Main processing method with enhanced context awareness and learning
   */
  async process(request: string, context: AgentContext = {}): Promise<AgentResponse> {
    const startTime = Date.now();
    const memoryId = this.generateMemoryId();
    
    try {
      // Enhance context with learning patterns and codebase analysis
      const enhancedContext = await this.enhanceContext(context, request);
      
      // Generate context-aware prompt
      const prompt = this.generatePrompt(request, enhancedContext);
      
      // Check cache for similar requests
      const cacheKey = this.generateCacheKey(request, enhancedContext);
      const cachedResponse = this.contextCache.get(cacheKey);
      
      if (cachedResponse && this.isCacheValid(cachedResponse)) {
        logger.debug(`Cache hit for agent ${this.name}`);
        return this.enhanceResponseWithMetrics(cachedResponse, startTime, true);
      }

      // Process with AI service
      const aiResponse = await this.deepSeekService.sendMessage(
        prompt,
        {
          currentFile: enhancedContext.currentFile ? {
            path: enhancedContext.currentFile,
            content: ''
          } : undefined
        }
      );

      // Analyze and enhance response
      const response = this.analyzeResponse(aiResponse.content, enhancedContext);
      
      // Cache the response
      this.contextCache.set(cacheKey, response);
      
      // Learn from this interaction
      await this.learn(request, response, enhancedContext, true);
      
      // Add performance metrics
      const enhancedResponse = this.enhanceResponseWithMetrics(response, startTime, false);
      
      // Store memory
      this.storeMemory({
        id: memoryId,
        timestamp: new Date(),
        request,
        response: response.content,
        context: enhancedContext,
        success: true,
        learnings: this.extractLearnings(request, response),
        patterns: this.identifyPatterns(request, enhancedContext)
      });

      return enhancedResponse;
      
    } catch (error) {
      logger.error(`Agent ${this.name} processing failed:`, error);
      
      // Store failed attempt for learning
      this.storeMemory({
        id: memoryId,
        timestamp: new Date(),
        request,
        response: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context,
        success: false
      });

      // Return fallback response
      return this.generateFallbackResponse(request, context, error);
    }
  }

  /**
   * Enhanced context analysis with codebase understanding
   */
  private async enhanceContext(context: AgentContext, request: string): Promise<AgentContext> {
    const enhanced: AgentContext = { ...context };

    // Add session history
    enhanced.sessionHistory = this.getRelevantMemories(request, 5);
    
    // Analyze related files based on current context
    if (context.currentFile && context.files) {
      enhanced.relatedFiles = this.findRelatedFiles(context.currentFile, context.files);
    }

    // Add codebase metrics if workspace is available
    if (context.workspaceRoot) {
      enhanced.codebaseMetrics = await this.analyzeCodebase(context.workspaceRoot);
    }

    // Add learning patterns relevant to this request
    const relevantPatterns = this.getRelevantPatterns(request);
    if (relevantPatterns.length > 0) {
      enhanced.userPreferences = {
        ...enhanced.userPreferences,
        learnedPatterns: relevantPatterns
      };
    }

    return enhanced;
  }

  /**
   * Intelligent pattern matching for related files
   */
  private findRelatedFiles(currentFile: string, allFiles: string[]): string[] {
    const currentDir = currentFile.split('/').slice(0, -1).join('/');
    const currentName = currentFile.split('/').pop()?.split('.')[0] || '';
    
    return allFiles
      .filter(file => {
        // Same directory files
        if (file.startsWith(currentDir)) return true;
        
        // Files with similar names
        const fileName = file.split('/').pop()?.split('.')[0] || '';
        if (fileName.includes(currentName) || currentName.includes(fileName)) return true;
        
        // Test files
        if (file.includes('test') || file.includes('spec')) {
          if (file.includes(currentName)) return true;
        }
        
        // Component/service relationships
        if (currentFile.includes('component') && file.includes('service')) return true;
        if (currentFile.includes('service') && file.includes('component')) return true;
        
        return false;
      })
      .slice(0, 10); // Limit to prevent overwhelming context
  }

  /**
   * Codebase analysis for better context understanding
   */
  private async analyzeCodebase(workspaceRoot: string): Promise<CodebaseMetrics> {
    // This would be implemented with actual file system analysis
    // For now, return mock data structure
    return {
      totalFiles: 100,
      totalLines: 10000,
      languages: { typescript: 0.7, javascript: 0.2, css: 0.1 },
      complexity: 0.6,
      testCoverage: 0.75,
      techStack: ['React', 'TypeScript', 'Vite', 'Electron'],
      patterns: ['Component Pattern', 'Hook Pattern', 'Service Pattern']
    };
  }

  /**
   * Machine learning capabilities for continuous improvement
   */
  private async learn(
    request: string,
    response: AgentResponse,
    context: AgentContext,
    success: boolean
  ): Promise<void> {
    // Extract patterns from successful interactions
    if (success && response.confidence > 0.7) {
      const patterns = this.identifyPatterns(request, context);
      
      patterns.forEach(pattern => {
        const existing = this.learningPatterns.get(pattern);
        if (existing) {
          existing.frequency++;
          existing.successRate = (existing.successRate + (success ? 1 : 0)) / 2;
          existing.lastUsed = new Date();
          if (context.projectType && !existing.contexts.includes(context.projectType)) {
            existing.contexts.push(context.projectType);
          }
        } else {
          this.learningPatterns.set(pattern, {
            pattern,
            frequency: 1,
            successRate: success ? 1 : 0,
            contexts: context.projectType ? [context.projectType] : [],
            lastUsed: new Date()
          });
        }
      });
    }

    // Periodically clean up old patterns
    if (this.learningPatterns.size > 1000) {
      this.cleanupOldPatterns();
    }
  }

  /**
   * Pattern identification for learning
   */
  private identifyPatterns(request: string, context: AgentContext): string[] {
    const patterns: string[] = [];
    
    // Request type patterns
    if (request.toLowerCase().includes('component')) patterns.push('component-creation');
    if (request.toLowerCase().includes('api')) patterns.push('api-integration');
    if (request.toLowerCase().includes('test')) patterns.push('testing');
    if (request.toLowerCase().includes('error')) patterns.push('error-handling');
    if (request.toLowerCase().includes('performance')) patterns.push('performance-optimization');
    
    // Context patterns
    if (context.currentFile?.endsWith('.tsx')) patterns.push('react-component');
    if (context.currentFile?.endsWith('.ts')) patterns.push('typescript-service');
    if (context.currentFile?.includes('test')) patterns.push('test-file');
    
    // Tech stack patterns
    context.codebaseMetrics?.techStack.forEach(tech => {
      patterns.push(`tech-${tech.toLowerCase()}`);
    });
    
    return patterns;
  }

  /**
   * Get relevant learning patterns for a request
   */
  private getRelevantPatterns(request: string): LearningPattern[] {
    const requestPatterns = this.identifyPatterns(request, {});
    
    return Array.from(this.learningPatterns.values())
      .filter(pattern => 
        requestPatterns.some(rp => pattern.pattern.includes(rp) || rp.includes(pattern.pattern))
      )
      .sort((a, b) => (b.frequency * b.successRate) - (a.frequency * a.successRate))
      .slice(0, 5);
  }

  /**
   * Enhanced response with performance metrics
   */
  private enhanceResponseWithMetrics(
    response: AgentResponse,
    startTime: number,
    fromCache: boolean
  ): AgentResponse {
    const processingTime = Date.now() - startTime;
    
    const metrics: PerformanceMetrics = {
      processingTime,
      memoryUsage: process.memoryUsage?.()?.heapUsed || 0,
      apiCalls: fromCache ? 0 : 1,
      cacheHits: fromCache ? 1 : 0,
      tokenCount: response.content.length / 4 // Rough estimate
    };

    this.performanceMetrics.push(metrics);
    
    // Keep only recent metrics
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-50);
    }

    return {
      ...response,
      performance: metrics
    };
  }

  /**
   * Generate fallback response for errors
   */
  private generateFallbackResponse(
    request: string,
    context: AgentContext,
    error: any
  ): AgentResponse {
    return {
      content: `I apologize, but I encountered an issue processing your request. Based on my specialization in ${this.getSpecialization()}, I can suggest some general approaches that might help.`,
      confidence: 0.3,
      reasoning: `Fallback response due to error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      suggestions: this.getGenericSuggestions(request, context)
    };
  }

  /**
   * Generic suggestions based on agent capabilities
   */
  private getGenericSuggestions(request: string, context: AgentContext): string[] {
    const suggestions: string[] = [];
    
    if (this.capabilities.includes(AgentCapability.CODE_REVIEW)) {
      suggestions.push('Consider running a code review to identify potential issues');
    }
    
    if (this.capabilities.includes(AgentCapability.TESTING)) {
      suggestions.push('Add comprehensive tests to verify the implementation');
    }
    
    if (this.capabilities.includes(AgentCapability.DOCUMENTATION)) {
      suggestions.push('Document the solution for future reference');
    }
    
    if (context.currentFile) {
      suggestions.push(`Review the current file: ${context.currentFile}`);
    }
    
    return suggestions;
  }

  /**
   * Memory and caching utilities
   */
  private generateMemoryId(): string {
    return `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(request: string, context: AgentContext): string {
    const contextKey = [
      context.currentFile,
      context.projectType,
      context.selectedText?.substring(0, 100)
    ].filter(Boolean).join('|');
    
    return `${request.substring(0, 200)}_${contextKey}`.replace(/\s+/g, '_');
  }

  private isCacheValid(cachedResponse: any): boolean {
    // Simple time-based cache validation (5 minutes)
    return cachedResponse._cacheTime && 
           (Date.now() - cachedResponse._cacheTime) < 5 * 60 * 1000;
  }

  private storeMemory(memory: AgentMemory): void {
    this.memory.push(memory);
    
    // Keep only recent memories
    if (this.memory.length > 100) {
      this.memory = this.memory.slice(-50);
    }
    
    // Persist to storage (would be implemented with actual storage)
    this.persistMemoryToStorage();
  }

  private getRelevantMemories(request: string, limit: number): AgentMemory[] {
    return this.memory
      .filter(m => m.success)
      .sort((a, b) => {
        // Score based on relevance and recency
        const aScore = this.calculateMemoryRelevance(request, a);
        const bScore = this.calculateMemoryRelevance(request, b);
        return bScore - aScore;
      })
      .slice(0, limit);
  }

  private calculateMemoryRelevance(request: string, memory: AgentMemory): number {
    const requestWords = request.toLowerCase().split(' ');
    const memoryWords = memory.request.toLowerCase().split(' ');
    
    // Word overlap score
    const overlap = requestWords.filter(word => 
      memoryWords.some(mWord => mWord.includes(word) || word.includes(mWord))
    ).length;
    
    // Recency score (more recent = higher score)
    const daysSince = (Date.now() - memory.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const recencyScore = Math.max(0, 1 - daysSince / 30); // Decay over 30 days
    
    return (overlap / requestWords.length) * 0.7 + recencyScore * 0.3;
  }

  private extractLearnings(request: string, response: AgentResponse): string[] {
    const learnings: string[] = [];
    
    if (response.confidence > 0.8) {
      learnings.push(`High confidence response for: ${request.substring(0, 50)}`);
    }
    
    if (response.suggestions && response.suggestions.length > 0) {
      learnings.push(`Successful suggestion generation: ${response.suggestions.length} items`);
    }
    
    return learnings;
  }

  private cleanupOldPatterns(): void {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    for (const [key, pattern] of this.learningPatterns.entries()) {
      if (pattern.lastUsed < cutoffDate && pattern.frequency < 3) {
        this.learningPatterns.delete(key);
      }
    }
  }

  private loadMemoryFromStorage(): void {
    // Implementation would load from persistent storage
    // For now, start with empty memory
  }

  private persistMemoryToStorage(): void {
    // Implementation would persist to storage
    // For now, keep in memory only
  }

  /**
   * Public interface methods
   */
  getName(): string {
    return this.name;
  }

  getCapabilities(): string[] {
    return this.capabilities.map(cap => cap.toString());
  }

  getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  getLearningStats(): {
    totalPatterns: number;
    totalMemories: number;
    avgConfidence: number;
    avgProcessingTime: number;
  } {
    const avgConfidence = this.memory.length > 0
      ? this.memory.reduce((sum, m) => sum + (m.success ? 1 : 0), 0) / this.memory.length
      : 0;
    
    const avgProcessingTime = this.performanceMetrics.length > 0
      ? this.performanceMetrics.reduce((sum, m) => sum + m.processingTime, 0) / this.performanceMetrics.length
      : 0;

    return {
      totalPatterns: this.learningPatterns.size,
      totalMemories: this.memory.length,
      avgConfidence,
      avgProcessingTime
    };
  }

  /**
   * Reset learning data (for testing or cleanup)
   */
  resetLearning(): void {
    this.memory = [];
    this.learningPatterns.clear();
    this.performanceMetrics = [];
    this.contextCache.clear();
  }
}