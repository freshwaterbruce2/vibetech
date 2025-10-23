/**
 * Super Coding Agent - General purpose coding specialist with advanced capabilities
 */
import { BaseSpecializedAgent, AgentCapability, AgentContext, AgentResponse, CodeChange } from './BaseSpecializedAgent';
import { DeepSeekService } from '../DeepSeekService';

export class SuperCodingAgent extends BaseSpecializedAgent {
  constructor(deepSeekService: DeepSeekService) {
    super('Super Coding Agent', [
      AgentCapability.CODE_GENERATION,
      AgentCapability.REFACTORING,
      AgentCapability.DEBUGGING,
      AgentCapability.TESTING,
      AgentCapability.DOCUMENTATION,
      AgentCapability.CODE_REVIEW,
      AgentCapability.BEST_PRACTICES,
      AgentCapability.ERROR_HANDLING
    ], deepSeekService);
  }

  getRole(): string {
    return 'General purpose coding specialist with comprehensive development expertise';
  }

  getSpecialization(): string {
    return 'Code generation, refactoring, debugging, testing, documentation, and general software development best practices';
  }

  protected generatePrompt(request: string, context: AgentContext): string {
    const contextInfo = this.buildCodingContext(context);
    const codeAnalysis = this.analyzeCodeContext(context);
    
    return `You are a Super Coding Agent with comprehensive expertise across all aspects of software development. You excel at code generation, refactoring, debugging, testing, and applying best practices.

CONTEXT:
${contextInfo}

CODE ANALYSIS:
${codeAnalysis}

REQUEST: ${request}

As a Super Coding Agent, provide comprehensive guidance covering:

1. **Code Generation**: Clean, efficient, and maintainable code solutions
2. **Refactoring**: Improving code structure, readability, and performance
3. **Debugging**: Identifying and fixing issues, error analysis
4. **Testing**: Unit tests, integration tests, test strategies
5. **Documentation**: Clear comments, README files, API documentation
6. **Code Review**: Quality assessment, improvement suggestions
7. **Best Practices**: Industry standards, design patterns, conventions
8. **Error Handling**: Robust error management and recovery

Provide specific, actionable solutions with:
- Complete, working code examples
- Step-by-step implementation guidance
- Test cases and validation strategies
- Performance considerations
- Security implications
- Maintainability improvements
- Clear explanations of the reasoning behind each decision

Focus on delivering high-quality, production-ready code that follows modern development practices.`;
  }

  protected analyzeResponse(response: string, context: AgentContext): AgentResponse {
    const confidence = this.calculateCodingConfidence(response, context);
    const suggestions = this.extractCodingSuggestions(response);
    const codeChanges = this.identifyCodeChanges(response, context);
    
    return {
      content: response,
      confidence,
      suggestions,
      codeChanges,
      followupQuestions: this.generateCodingFollowups(response, context),
      relatedTopics: this.identifyCodingTopics(response)
    };
  }

  private buildCodingContext(context: AgentContext): string {
    let info = '';
    
    if (context.currentFile) {
      info += `Current File: ${context.currentFile}\n`;
      
      // Determine programming language and context
      const extension = context.currentFile.split('.').pop()?.toLowerCase();
      const languageMap: Record<string, string> = {
        'ts': 'TypeScript',
        'tsx': 'TypeScript React',
        'js': 'JavaScript',
        'jsx': 'JavaScript React',
        'py': 'Python',
        'java': 'Java',
        'cpp': 'C++',
        'c': 'C',
        'cs': 'C#',
        'go': 'Go',
        'rs': 'Rust',
        'php': 'PHP',
        'rb': 'Ruby',
        'swift': 'Swift',
        'kt': 'Kotlin'
      };
      
      if (extension && languageMap[extension]) {
        info += `Language: ${languageMap[extension]}\n`;
      }
      
      // Analyze file purpose
      if (context.currentFile.includes('test') || context.currentFile.includes('spec')) {
        info += `File Purpose: Test File\n`;
      } else if (context.currentFile.includes('util') || context.currentFile.includes('helper')) {
        info += `File Purpose: Utility/Helper\n`;
      } else if (context.currentFile.includes('component')) {
        info += `File Purpose: UI Component\n`;
      } else if (context.currentFile.includes('service') || context.currentFile.includes('api')) {
        info += `File Purpose: Service/API Layer\n`;
      } else if (context.currentFile.includes('model') || context.currentFile.includes('entity')) {
        info += `File Purpose: Data Model\n`;
      }
    }
    
    if (context.selectedText) {
      info += `Selected Code:\n\`\`\`\n${context.selectedText.slice(0, 600)}\n\`\`\`\n`;
      
      // Analyze selected code for context
      const codeAnalysis = this.analyzeSelectedCode(context.selectedText);
      if (codeAnalysis) {
        info += `Code Analysis: ${codeAnalysis}\n`;
      }
    }
    
    if (context.relatedFiles && context.relatedFiles.length > 0) {
      info += `Related Files: ${context.relatedFiles.slice(0, 5).join(', ')}\n`;
    }
    
    if (context.sessionHistory && context.sessionHistory.length > 0) {
      const recentContext = context.sessionHistory[0];
      info += `Recent Activity: ${recentContext.request.slice(0, 100)}...\n`;
    }

    return info || 'General coding context';
  }

  private analyzeCodeContext(context: AgentContext): string {
    if (!context.codebaseMetrics) {
      return 'Modern software project (inferred)';
    }
    
    const metrics = context.codebaseMetrics;
    let analysis = `Project Scale: ${metrics.totalFiles} files, ${metrics.totalLines} lines of code\n`;
    
    // Language distribution
    const languages = Object.entries(metrics.languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([lang, percentage]) => `${lang} (${Math.round(percentage * 100)}%)`)
      .join(', ');
    analysis += `Languages: ${languages}\n`;
    
    // Complexity assessment
    if (metrics.complexity > 0.8) {
      analysis += `Complexity: High - Consider refactoring for maintainability\n`;
    } else if (metrics.complexity > 0.6) {
      analysis += `Complexity: Moderate - Good balance of features and simplicity\n`;
    } else {
      analysis += `Complexity: Low - Simple and maintainable codebase\n`;
    }
    
    // Test coverage
    if (metrics.testCoverage !== undefined) {
      if (metrics.testCoverage > 0.8) {
        analysis += `Test Coverage: Excellent (${Math.round(metrics.testCoverage * 100)}%)\n`;
      } else if (metrics.testCoverage > 0.6) {
        analysis += `Test Coverage: Good (${Math.round(metrics.testCoverage * 100)}%)\n`;
      } else {
        analysis += `Test Coverage: Needs improvement (${Math.round(metrics.testCoverage * 100)}%)\n`;
      }
    }
    
    // Tech stack
    if (metrics.techStack.length > 0) {
      analysis += `Tech Stack: ${metrics.techStack.join(', ')}\n`;
    }
    
    return analysis;
  }

  private analyzeSelectedCode(code: string): string | null {
    if (!code || code.length < 10) return null;
    
    const patterns = {
      function: /function\s+\w+|const\s+\w+\s*=\s*\(/,
      class: /class\s+\w+/,
      interface: /interface\s+\w+/,
      type: /type\s+\w+/,
      component: /<[A-Z]\w*|export\s+default\s+function/,
      hook: /use[A-Z]\w*/,
      async: /async\s+|await\s+/,
      promise: /\.then\(|\.catch\(|Promise\./,
      error: /try\s*{|catch\s*\(|throw\s+/,
      test: /describe\(|it\(|test\(|expect\(/
    };
    
    const matches: string[] = [];
    
    Object.entries(patterns).forEach(([pattern, regex]) => {
      if (regex.test(code)) {
        matches.push(pattern);
      }
    });
    
    if (matches.length === 0) return null;
    
    return `Contains: ${matches.join(', ')}`;
  }

  private calculateCodingConfidence(response: string, context: AgentContext): number {
    let confidence = 0.8; // Base confidence for general coding
    
    // Increase confidence for code-related terms
    const codingTerms = [
      'function', 'class', 'method', 'variable', 'const', 'let', 'var',
      'if', 'else', 'for', 'while', 'return', 'import', 'export',
      'async', 'await', 'promise', 'callback', 'interface', 'type'
    ];
    
    const termCount = codingTerms.filter(term => 
      response.toLowerCase().includes(term)
    ).length;
    confidence += Math.min(termCount * 0.01, 0.1);
    
    // Strong boost for code examples
    if (response.includes('```')) {
      confidence += 0.08;
    }
    
    // Boost for specific programming concepts
    if (response.includes('refactor') || response.includes('optimize')) {
      confidence += 0.05;
    }
    
    if (response.includes('test') || response.includes('debug')) {
      confidence += 0.04;
    }
    
    // Context bonuses
    if (context.selectedText) {
      confidence += 0.05;
    }
    
    if (context.currentFile) {
      confidence += 0.03;
    }
    
    // Detailed response bonus
    if (response.length > 300) {
      confidence += 0.03;
    }
    
    // Penalty for very short responses
    if (response.length < 100) {
      confidence -= 0.15;
    }
    
    return Math.min(0.95, Math.max(0.6, confidence));
  }

  private extractCodingSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    
    // Standard patterns
    const numberedItems = response.match(/\d+\.\s*([^\n]+)/g);
    if (numberedItems) {
      suggestions.push(...numberedItems.map(item => item.replace(/\d+\.\s*/, '')));
    }
    
    const bulletItems = response.match(/[-*]\s*([^\n]+)/g);
    if (bulletItems) {
      suggestions.push(...bulletItems.map(item => item.replace(/[-*]\s*/, '')));
    }
    
    // Coding-specific patterns
    const codingPatterns = [
      /refactor\s+([^.]+)/gi,
      /optimize\s+([^.]+)/gi,
      /add\s+([^.]+(?:test|validation|error handling|logging)[^.]*)/gi,
      /implement\s+([^.]+)/gi,
      /use\s+([^.]+(?:pattern|library|framework|approach)[^.]*)/gi,
      /consider\s+([^.]+)/gi,
      /extract\s+([^.]+)/gi,
      /replace\s+([^.]+)/gi
    ];
    
    codingPatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        suggestions.push(...matches.map(match => match.trim()));
      }
    });
    
    return [...new Set(suggestions)].slice(0, 10);
  }

  private identifyCodeChanges(response: string, context: AgentContext): CodeChange[] {
    const changes: CodeChange[] = [];
    
    // Extract code blocks
    const codeBlocks = response.match(/```[\w]*\n([\s\S]*?)\n```/g);
    
    if (codeBlocks && context.currentFile) {
      codeBlocks.forEach((block, index) => {
        const code = block.replace(/```[\w]*\n/, '').replace(/\n```$/, '');
        
        // Determine change type
        let type: 'create' | 'modify' | 'delete' = 'modify';
        let description = `Code suggestion ${index + 1}`;
        
        if (code.includes('export default') || code.includes('function main')) {
          type = 'create';
          description = `New implementation suggestion`;
        } else if (code.includes('// TODO: Remove') || code.includes('// Delete')) {
          type = 'delete';
          description = `Code removal suggestion`;
        }
        
        changes.push({
          filePath: context.currentFile,
          type,
          content: code,
          description
        });
      });
    }
    
    return changes;
  }

  private generateCodingFollowups(response: string, context: AgentContext): string[] {
    const questions: string[] = [];
    
    if (response.includes('refactor') || response.includes('improve')) {
      questions.push('Would you like me to show the complete refactored version?');
    }
    
    if (response.includes('test') || response.includes('testing')) {
      questions.push('Do you need help writing comprehensive test cases for this code?');
    }
    
    if (response.includes('error') || response.includes('exception')) {
      questions.push('Would you like me to implement robust error handling strategies?');
    }
    
    if (response.includes('performance') || response.includes('optimize')) {
      questions.push('Do you need specific performance optimization techniques?');
    }
    
    if (response.includes('documentation') || response.includes('comment')) {
      questions.push('Should I help create comprehensive documentation for this code?');
    }
    
    // Context-based questions
    if (context.selectedText && context.selectedText.length > 100) {
      questions.push('Would you like me to analyze the selected code for potential improvements?');
    }
    
    if (context.codebaseMetrics?.testCoverage && context.codebaseMetrics.testCoverage < 0.7) {
      questions.push('Should I help improve the overall test coverage for this project?');
    }
    
    if (!response.includes('```')) {
      questions.push('Would you like me to provide specific code examples for implementation?');
    }
    
    return questions.slice(0, 3);
  }

  private identifyCodingTopics(response: string): string[] {
    const topics: string[] = [];
    
    const codingTopics = {
      'Code Generation': ['generate', 'create', 'implement', 'build', 'write code'],
      'Refactoring': ['refactor', 'restructure', 'improve', 'cleanup', 'organize'],
      'Debugging': ['debug', 'fix', 'error', 'bug', 'issue', 'troubleshoot'],
      'Testing': ['test', 'testing', 'unit test', 'integration', 'jest', 'mocha'],
      'Documentation': ['document', 'comment', 'readme', 'jsdoc', 'api doc'],
      'Performance': ['performance', 'optimize', 'efficiency', 'speed', 'memory'],
      'Security': ['security', 'secure', 'vulnerability', 'validation', 'sanitize'],
      'Design Patterns': ['pattern', 'singleton', 'factory', 'observer', 'strategy'],
      'Best Practices': ['best practice', 'convention', 'standard', 'guideline'],
      'Error Handling': ['error handling', 'exception', 'try catch', 'validation'],
      'Code Quality': ['quality', 'clean code', 'readable', 'maintainable'],
      'Architecture': ['architecture', 'structure', 'design', 'organization']
    };
    
    Object.entries(codingTopics).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => response.toLowerCase().includes(keyword))) {
        topics.push(topic);
      }
    });
    
    return topics;
  }
}