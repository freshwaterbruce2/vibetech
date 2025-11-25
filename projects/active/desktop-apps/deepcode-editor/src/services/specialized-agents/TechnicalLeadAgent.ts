/**
 * Technical Lead Agent - Architecture and system design specialist
 */
import { DeepSeekService } from '../DeepSeekService';

import { AgentCapability, AgentContext, AgentResponse,BaseSpecializedAgent } from './BaseSpecializedAgent';

export class TechnicalLeadAgent extends BaseSpecializedAgent {
  constructor(deepSeekService: DeepSeekService) {
    super('Technical Lead Agent', [
      AgentCapability.ARCHITECTURE_DESIGN,
      AgentCapability.CODE_ANALYSIS,
      AgentCapability.BEST_PRACTICES,
      AgentCapability.CODE_REVIEW,
      AgentCapability.DESIGN_PATTERNS,
      AgentCapability.SYSTEM_DESIGN
    ], deepSeekService);
  }

  getRole(): string {
    return 'Architecture specialist with system design expertise';
  }

  getSpecialization(): string {
    return 'System architecture, design patterns, scalability, and technical leadership';
  }

  protected generatePrompt(request: string, context: AgentContext): string {
    const contextInfo = this.buildContextInfo(context);
    
    return `You are a Senior Technical Lead with extensive experience in system architecture and engineering leadership.

CONTEXT:
${contextInfo}

REQUEST: ${request}

As a Technical Lead, provide architectural guidance focusing on:

1. **System Design**: Overall architecture patterns and structure
2. **Scalability**: How to build systems that can grow
3. **Design Patterns**: Appropriate patterns for the problem
4. **Best Practices**: Industry standards and conventions
5. **Technology Choices**: Recommendations for tools and frameworks
6. **Code Organization**: Project structure and modularity
7. **Performance Considerations**: Architectural decisions affecting performance
8. **Maintainability**: Long-term code health and team productivity

Provide specific, actionable guidance with:
- Clear architectural recommendations
- Reasoning behind design decisions  
- Potential risks and mitigations
- Implementation priorities
- Code examples where helpful

Focus on high-level strategy while being practical and implementable.`;
  }

  protected analyzeResponse(response: string, context: AgentContext): AgentResponse {
    const confidence = this.calculateConfidence(response, context);
    const suggestions = this.extractSuggestions(response);
    const reasoning = this.extractReasoning(response);

    return {
      content: response,
      confidence,
      reasoning,
      suggestions,
      followupQuestions: this.generateFollowupQuestions(response, context),
      relatedTopics: this.identifyRelatedTopics(response)
    };
  }

  private buildContextInfo(context: AgentContext): string {
    let info = '';
    
    if (context.workspaceRoot) {
      info += `Workspace: ${context.workspaceRoot}\n`;
    }
    
    if (context.currentFile) {
      info += `Current File: ${context.currentFile}\n`;
    }
    
    if (context.codebaseMetrics) {
      const metrics = context.codebaseMetrics;
      info += `Project Scale: ${metrics.totalFiles} files, ${metrics.totalLines} lines\n`;
      info += `Tech Stack: ${metrics.techStack.join(', ')}\n`;
      info += `Complexity: ${Math.round(metrics.complexity * 100)}%\n`;
    }
    
    if (context.userPreferences?.technicalGuidance) {
      info += `Previous Guidance: ${context.userPreferences.technicalGuidance.slice(0, 200)}...\n`;
    }

    if (context.sessionHistory && context.sessionHistory.length > 0) {
      info += `Recent Context: ${context.sessionHistory[0].request.slice(0, 100)}...\n`;
    }

    return info || 'No specific context provided';
  }

  private calculateConfidence(response: string, context: AgentContext): number {
    let confidence = 0.8; // Base confidence
    
    // Increase confidence for architectural keywords
    const architecturalTerms = ['pattern', 'architecture', 'design', 'scalability', 'structure'];
    const termCount = architecturalTerms.filter(term => 
      response.toLowerCase().includes(term)
    ).length;
    confidence += termCount * 0.02;
    
    // Increase confidence if we have good context
    if (context.codebaseMetrics) {confidence += 0.05;}
    if (context.currentFile) {confidence += 0.03;}
    if (context.sessionHistory && context.sessionHistory.length > 0) {confidence += 0.02;}
    
    // Decrease confidence for vague responses
    if (response.length < 200) {confidence -= 0.1;}
    if (!response.includes('recommend') && !response.includes('suggest')) {confidence -= 0.05;}
    
    return Math.min(0.95, Math.max(0.5, confidence));
  }

  private extractSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    
    // Look for numbered lists
    const numberedItems = response.match(/\d+\.\s*([^\n]+)/g);
    if (numberedItems) {
      suggestions.push(...numberedItems.map(item => item.replace(/\d+\.\s*/, '')));
    }
    
    // Look for bullet points
    const bulletItems = response.match(/[-*]\s*([^\n]+)/g);
    if (bulletItems) {
      suggestions.push(...bulletItems.map(item => item.replace(/[-*]\s*/, '')));
    }
    
    // Look for recommendation patterns
    const recommendations = response.match(/(?:recommend|suggest|consider|should)\s+([^.]+)/gi);
    if (recommendations) {
      suggestions.push(...recommendations.map(rec => rec.replace(/^(?:recommend|suggest|consider|should)\s+/i, '')));
    }
    
    return suggestions.slice(0, 8); // Limit to top suggestions
  }

  private extractReasoning(response: string): string {
    // Look for reasoning patterns
    const reasoningPatterns = [
      /because\s+([^.]+)/i,
      /since\s+([^.]+)/i,
      /due to\s+([^.]+)/i,
      /given that\s+([^.]+)/i,
      /this ensures\s+([^.]+)/i
    ];
    
    for (const pattern of reasoningPatterns) {
      const match = response.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return 'Architectural analysis based on best practices and system design principles';
  }

  private generateFollowupQuestions(response: string, context: AgentContext): string[] {
    const questions: string[] = [];
    
    if (response.includes('architecture') || response.includes('design')) {
      questions.push('Would you like me to elaborate on any specific architectural pattern?');
    }
    
    if (response.includes('scalability')) {
      questions.push('What are your expected scale requirements for this system?');
    }
    
    if (response.includes('performance')) {
      questions.push('Do you have specific performance requirements or constraints?');
    }
    
    if (context.codebaseMetrics && context.codebaseMetrics.testCoverage && context.codebaseMetrics.testCoverage < 0.7) {
      questions.push('Would you like guidance on improving test coverage and quality?');
    }
    
    if (!context.currentFile) {
      questions.push('Would you like me to analyze specific files or components?');
    }
    
    return questions.slice(0, 3);
  }

  private identifyRelatedTopics(response: string): string[] {
    const topics: string[] = [];
    
    const topicKeywords = {
      'Design Patterns': ['pattern', 'singleton', 'factory', 'observer', 'strategy'],
      'System Architecture': ['architecture', 'microservices', 'monolith', 'distributed'],
      'Scalability': ['scalability', 'scaling', 'load', 'performance'],
      'Code Quality': ['quality', 'maintainability', 'readability', 'refactoring'],
      'Security': ['security', 'authentication', 'authorization', 'vulnerability'],
      'Testing': ['testing', 'unit test', 'integration', 'coverage'],
      'DevOps': ['deployment', 'ci/cd', 'infrastructure', 'monitoring']
    };
    
    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => response.toLowerCase().includes(keyword))) {
        topics.push(topic);
      }
    });
    
    return topics;
  }
}