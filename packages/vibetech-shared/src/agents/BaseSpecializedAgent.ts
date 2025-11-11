/**
 * Base class for all specialized agents
 * Provides common functionality and interface for agent implementations
 */

import type { AgentCapability, AgentContext, AgentResponse } from '../types';

export abstract class BaseSpecializedAgent {
  protected name: string;
  protected capabilities: AgentCapability[];
  protected systemPrompt: string;

  constructor(name: string, capabilities: AgentCapability[], systemPrompt: string) {
    this.name = name;
    this.capabilities = capabilities;
    this.systemPrompt = systemPrompt;
  }

  /**
   * Get the agent's name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get the agent's capabilities
   */
  getCapabilities(): AgentCapability[] {
    return this.capabilities;
  }

  /**
   * Get the agent's system prompt
   */
  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  /**
   * Check if agent can handle a specific request
   */
  abstract canHandle(request: string, context: AgentContext): boolean;

  /**
   * Process a request and generate a response
   */
  abstract process(request: string, context: AgentContext): Promise<AgentResponse>;

  /**
   * Get the agent's role description
   */
  abstract getRole(): string;

  /**
   * Get the agent's specialization areas
   */
  abstract getSpecialization(): string;

  /**
   * Calculate confidence score for handling a request
   */
  protected calculateConfidence(request: string, context: AgentContext): number {
    let confidence = 0.5; // Base confidence

    // Check for relevant keywords in request
    const keywords = this.getRelevantKeywords();
    const requestLower = request.toLowerCase();

    for (const keyword of keywords) {
      if (requestLower.includes(keyword.toLowerCase())) {
        confidence += 0.1;
      }
    }

    // Check context relevance
    if (context.currentFile) {
      const fileExt = context.currentFile.split('.').pop()?.toLowerCase();
      if (this.isRelevantFileType(fileExt || '')) {
        confidence += 0.2;
      }
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Get keywords relevant to this agent's domain
   */
  protected abstract getRelevantKeywords(): string[];

  /**
   * Check if file type is relevant to this agent
   */
  protected abstract isRelevantFileType(fileExtension: string): boolean;

  /**
   * Extract actionable suggestions from response
   */
  protected extractSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    const lines = response.split('\n');

    for (const line of lines) {
      // Look for bullet points, numbered lists, or action items
      if (line.match(/^[\-\*\d]+\.?\s+/)) {
        const suggestion = line.replace(/^[\-\*\d]+\.?\s+/, '').trim();
        if (suggestion.length > 10 && suggestion.length < 200) {
          suggestions.push(suggestion);
        }
      }
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  /**
   * Generate follow-up questions based on response
   */
  protected generateFollowupQuestions(response: string, context: AgentContext): string[] {
    const questions: string[] = [];

    // This is a simplified implementation
    // In a real system, this would use NLP or AI to generate relevant questions

    if (response.includes('database')) {
      questions.push('What database technology would you recommend?');
    }

    if (response.includes('performance')) {
      questions.push('How can we measure and monitor performance?');
    }

    if (response.includes('security')) {
      questions.push('What security best practices should we follow?');
    }

    return questions.slice(0, 3);
  }

  /**
   * Identify related topics from response
   */
  protected identifyRelatedTopics(response: string): string[] {
    const topics: string[] = [];
    const topicKeywords = {
      'API': ['api', 'endpoint', 'rest', 'graphql'],
      'Database': ['database', 'sql', 'query', 'schema'],
      'Security': ['security', 'authentication', 'authorization', 'encryption'],
      'Performance': ['performance', 'optimization', 'caching', 'scaling'],
      'Testing': ['test', 'testing', 'unit test', 'integration test'],
      'Architecture': ['architecture', 'design pattern', 'microservice'],
    };

    const responseLower = response.toLowerCase();

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => responseLower.includes(keyword))) {
        topics.push(topic);
      }
    }

    return topics;
  }
}
