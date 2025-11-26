/**
 * Technical Lead Agent - Architecture and team leadership specialist
 *
 * Focuses on system architecture, code quality, team processes,
 * and technical decision-making.
 */

import { BaseSpecializedAgent } from './BaseSpecializedAgent';
import type { AgentCapability, AgentContext, AgentResponse } from '../types';

export class TechnicalLeadAgent extends BaseSpecializedAgent {
  constructor() {
    const capabilities: AgentCapability[] = [
      { name: 'Architecture Design', description: 'System and software architecture', enabled: true },
      { name: 'Code Review', description: 'Code quality and best practices', enabled: true },
      { name: 'Technical Strategy', description: 'Technology selection and planning', enabled: true },
      { name: 'Team Leadership', description: 'Technical mentorship and guidance', enabled: true },
      { name: 'Performance', description: 'System-wide performance optimization', enabled: true },
      { name: 'DevOps', description: 'CI/CD, deployment, and infrastructure', enabled: true },
    ];

    const systemPrompt = `You are an experienced Technical Lead with expertise in software architecture, team leadership, and technical decision-making. You provide strategic guidance on system design, code quality, and engineering best practices.

## Core Responsibilities

1. **Architecture & Design**
   - Design scalable system architectures
   - Choose appropriate design patterns
   - Plan microservices vs monolith strategies
   - Design data flow and state management
   - Create technical specifications
   - Evaluate technology trade-offs

2. **Code Quality & Standards**
   - Establish coding standards and conventions
   - Perform thorough code reviews
   - Identify technical debt and refactoring opportunities
   - Ensure consistent patterns across codebase
   - Promote clean code principles
   - Implement quality gates and checks

3. **Technical Strategy**
   - Evaluate and select technologies
   - Plan technical roadmaps
   - Assess risks and mitigation strategies
   - Balance innovation with stability
   - Make build vs buy decisions
   - Plan for scalability and growth

4. **Performance & Optimization**
   - Identify system bottlenecks
   - Design performance monitoring strategies
   - Optimize critical paths
   - Plan caching strategies
   - Design for horizontal scaling
   - Implement load testing

5. **DevOps & Infrastructure**
   - Design CI/CD pipelines
   - Plan deployment strategies
   - Implement monitoring and alerting
   - Design disaster recovery plans
   - Optimize infrastructure costs
   - Ensure security compliance

6. **Team Leadership**
   - Mentor junior developers
   - Facilitate technical discussions
   - Resolve technical conflicts
   - Share knowledge and best practices
   - Foster engineering culture
   - Promote continuous learning

## Technical Expertise

- **Architecture**: Microservices, Event-driven, Serverless, Monorepo
- **Patterns**: DDD, CQRS, Event Sourcing, Clean Architecture
- **DevOps**: Docker, Kubernetes, CI/CD, Infrastructure as Code
- **Monitoring**: Logging, Metrics, Tracing, APM
- **Security**: OWASP, Secure SDLC, Threat Modeling
- **Methodologies**: Agile, TDD, Code Review, Documentation

Provide strategic, high-level guidance with practical implementation advice. Consider long-term maintainability, team capabilities, and business objectives.`;

    super('Technical Lead', capabilities, systemPrompt);
  }

  getRole(): string {
    return 'Technical leader providing architecture guidance and strategic direction';
  }

  getSpecialization(): string {
    return 'System architecture, code quality, technical strategy, and team leadership';
  }

  canHandle(request: string, context: AgentContext): boolean {
    const confidence = this.calculateConfidence(request, context);

    // Technical Lead handles high-level architecture and strategy questions
    const strategicKeywords = ['architecture', 'design', 'strategy', 'best practice', 'approach', 'pattern'];
    const hasStrategicKeyword = strategicKeywords.some(keyword =>
      request.toLowerCase().includes(keyword)
    );

    if (hasStrategicKeyword) {
      return confidence >= 0.5;
    }

    return confidence >= 0.7;
  }

  async process(request: string, context: AgentContext): Promise<AgentResponse> {
    const confidence = this.calculateConfidence(request, context);

    const prompt = this.buildPrompt(request, context);

    const response: AgentResponse = {
      content: `As a Technical Lead, I'll provide strategic guidance on: ${request}`,
      confidence,
      suggestions: this.extractSuggestions(request),
      followupQuestions: this.generateFollowupQuestions(request, context),
      relatedTopics: this.identifyRelatedTopics(request),
      metadata: {
        agent: this.name,
        context: context.currentFile || 'unknown',
        perspective: 'strategic',
      }
    };

    return response;
  }

  protected getRelevantKeywords(): string[] {
    return [
      'architecture', 'design', 'pattern', 'strategy', 'approach',
      'scalability', 'performance', 'optimization', 'refactor',
      'best practice', 'code review', 'quality', 'standards',
      'technical debt', 'maintainability', 'documentation',
      'devops', 'ci/cd', 'deployment', 'infrastructure',
      'monitoring', 'logging', 'metrics', 'observability',
      'security', 'compliance', 'risk', 'mitigation',
    ];
  }

  protected isRelevantFileType(fileExtension: string): boolean {
    // Technical Lead can work with any file type
    return true;
  }

  private buildPrompt(request: string, context: AgentContext): string {
    let prompt = `${this.systemPrompt  }\n\n`;

    if (context.workspaceRoot) {
      prompt += `Workspace: ${context.workspaceRoot}\n`;
    }

    if (context.projectType) {
      prompt += `Project Type: ${context.projectType}\n`;
    }

    if (context.currentFile) {
      prompt += `Current File: ${context.currentFile}\n`;
    }

    if (context.dependencies) {
      prompt += `Dependencies: ${Object.keys(context.dependencies).slice(0, 10).join(', ')}\n`;
    }

    if (context.selectedText) {
      prompt += `Selected Code:\n\`\`\`\n${context.selectedText.slice(0, 500)}\n\`\`\`\n\n`;
    }

    prompt += `Request: ${request}`;

    return prompt;
  }
}
