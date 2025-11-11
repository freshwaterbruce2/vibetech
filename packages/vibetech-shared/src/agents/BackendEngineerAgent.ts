/**
 * Backend Engineer Agent - Server-side development specialist
 *
 * Focuses on API design, database architecture, authentication,
 * and server-side performance optimization.
 */

import type { AgentCapability, AgentContext, AgentResponse } from '../types';
import { BaseSpecializedAgent } from './BaseSpecializedAgent';

export class BackendEngineerAgent extends BaseSpecializedAgent {
  constructor() {
    const capabilities: AgentCapability[] = [
      { name: 'API Design', description: 'RESTful and GraphQL API design', enabled: true },
      { name: 'Database Design', description: 'Schema design and optimization', enabled: true },
      { name: 'Authentication', description: 'JWT, OAuth, and security patterns', enabled: true },
      { name: 'Caching', description: 'Redis and caching strategies', enabled: true },
      { name: 'Microservices', description: 'Service architecture and communication', enabled: true },
      { name: 'Performance', description: 'Backend performance optimization', enabled: true },
    ];

    const systemPrompt = `You are an expert Backend Engineer specializing in Node.js applications, API design, and AI service integration. You have deep expertise in building scalable, secure, and performant backend systems for modern applications with a focus on developer tools and AI-powered features.

## Core Responsibilities

1. **API Design & Development**
   - Design RESTful and GraphQL APIs following industry best practices
   - Implement proper API versioning and backward compatibility
   - Create clear API documentation with OpenAPI/Swagger specifications
   - Design efficient request/response schemas with proper validation
   - Implement rate limiting, throttling, and API key management
   - Handle CORS, authentication, and authorization properly

2. **Node.js & TypeScript Development**
   - Write clean, maintainable TypeScript code with strict typing
   - Implement robust error handling and logging strategies
   - Design modular service architecture with clear separation of concerns
   - Create efficient middleware for cross-cutting concerns
   - Optimize for performance and memory efficiency
   - Implement proper dependency injection and IoC patterns

3. **AI Service Integration**
   - Integrate with LLM APIs (DeepSeek, OpenAI, Anthropic, etc.)
   - Implement streaming responses for real-time AI interactions
   - Design efficient prompt management and template systems
   - Handle token counting, usage tracking, and cost optimization
   - Implement fallback strategies for AI service failures
   - Create abstraction layers for multiple AI providers
   - Design context management for conversation memory

4. **Database & Data Management**
   - Implement secure database operations with proper indexing
   - Design efficient schema with relationships and constraints
   - Optimize queries for performance
   - Handle migrations and versioning
   - Implement caching strategies (Redis, in-memory)
   - Design data validation and sanitization

5. **Security & Authentication**
   - Implement secure authentication flows (JWT, OAuth)
   - Design role-based access control (RBAC) systems
   - Protect against common vulnerabilities (OWASP Top 10)
   - Implement input validation and sanitization
   - Secure API endpoints with proper middleware
   - Handle secrets and environment variables safely

## Technical Expertise

- **Languages**: Node.js, TypeScript, JavaScript (ES6+)
- **Frameworks**: Express, Fastify, NestJS, Koa
- **Databases**: PostgreSQL, Redis, SQLite, Vector databases
- **AI/ML**: LangChain, OpenAI SDK, streaming responses, embeddings
- **Protocols**: REST, GraphQL, WebSockets, gRPC, SSE
- **Testing**: Jest, Vitest, Supertest, API testing strategies
- **Security**: JWT, OAuth 2.0, encryption, rate limiting

Provide specific, production-ready solutions with code examples, best practices, and performance considerations.`;

    super('Backend Engineer', capabilities, systemPrompt);
  }

  getRole(): string {
    return 'Backend specialist focusing on server-side architecture and API development';
  }

  getSpecialization(): string {
    return 'API design, database architecture, authentication, microservices, and server-side performance optimization';
  }

  canHandle(request: string, context: AgentContext): boolean {
    const confidence = this.calculateConfidence(request, context);
    return confidence >= 0.6;
  }

  async process(request: string, context: AgentContext): Promise<AgentResponse> {
    const confidence = this.calculateConfidence(request, context);

    // Build contextual prompt
    const prompt = this.buildPrompt(request, context);

    // In a real implementation, this would call an AI service
    // For now, return a structured response
    const response: AgentResponse = {
      content: `As a Backend Engineer, I'll help you with: ${request}`,
      confidence,
      suggestions: this.extractSuggestions(request),
      followupQuestions: this.generateFollowupQuestions(request, context),
      relatedTopics: this.identifyRelatedTopics(request),
      metadata: {
        agent: this.name,
        context: context.currentFile || 'unknown',
      }
    };

    return response;
  }

  protected getRelevantKeywords(): string[] {
    return [
      'api', 'endpoint', 'rest', 'graphql', 'server', 'backend',
      'database', 'sql', 'query', 'schema', 'migration',
      'authentication', 'authorization', 'jwt', 'oauth', 'security',
      'caching', 'redis', 'performance', 'optimization',
      'microservice', 'service', 'middleware', 'express',
      'node', 'typescript', 'async', 'promise',
    ];
  }

  protected isRelevantFileType(fileExtension: string): boolean {
    const backendExtensions = ['ts', 'js', 'mjs', 'cjs', 'sql', 'prisma'];
    return backendExtensions.includes(fileExtension);
  }

  private buildPrompt(request: string, context: AgentContext): string {
    let prompt = this.systemPrompt + '\n\n';

    if (context.currentFile) {
      prompt += `Current File: ${context.currentFile}\n`;
    }

    if (context.selectedText) {
      prompt += `Selected Code:\n\`\`\`\n${context.selectedText.slice(0, 500)}\n\`\`\`\n\n`;
    }

    prompt += `Request: ${request}`;

    return prompt;
  }
}
