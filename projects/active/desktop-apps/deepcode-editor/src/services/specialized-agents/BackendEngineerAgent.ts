/**
 * Backend Engineer Agent - Server-side development and API specialist
 */
import { DeepSeekService } from '../DeepSeekService';

import { AgentCapability, AgentContext, AgentResponse,BaseSpecializedAgent } from './BaseSpecializedAgent';

export class BackendEngineerAgent extends BaseSpecializedAgent {
  constructor(deepSeekService: DeepSeekService) {
    super('Backend Engineer Agent', [
      AgentCapability.API_DESIGN,
      AgentCapability.DATABASE_DESIGN,
      AgentCapability.AUTHENTICATION,
      AgentCapability.CACHING,
      AgentCapability.MICROSERVICES,
      AgentCapability.MONITORING,
      AgentCapability.DATA_VALIDATION
    ], deepSeekService);
  }

  getRole(): string {
    return 'Backend specialist focusing on server-side architecture and API development';
  }

  getSpecialization(): string {
    return 'API design, database architecture, authentication, microservices, and server-side performance optimization';
  }

  protected generatePrompt(request: string, context: AgentContext): string {
    const contextInfo = this.buildBackendContext(context);
    const architectureInfo = this.analyzeBackendArchitecture(context);
    
    return `You are a Senior Backend Engineer with extensive experience in server-side development, API design, and distributed systems.

CONTEXT:
${contextInfo}

ARCHITECTURE:
${architectureInfo}

REQUEST: ${request}

As a Backend Engineer, provide guidance focusing on:

1. **API Design**: RESTful APIs, GraphQL, endpoint structure, versioning
2. **Database Architecture**: Schema design, relationships, indexing, optimization
3. **Authentication & Authorization**: JWT, OAuth, RBAC, security patterns
4. **Performance**: Caching strategies, query optimization, load balancing
5. **Microservices**: Service decomposition, communication patterns, data consistency
6. **Data Validation**: Input sanitization, schema validation, error handling
7. **Monitoring & Logging**: Observability, metrics, error tracking
8. **Scalability**: Horizontal scaling, database sharding, async processing

Provide specific, production-ready solutions with:
- API endpoint examples with proper HTTP methods and status codes
- Database schema designs with relationships
- Authentication flow implementations
- Caching strategies and configurations
- Error handling and validation patterns
- Performance optimization techniques

Focus on building robust, scalable, and secure backend systems.`;
  }

  protected analyzeResponse(response: string, context: AgentContext): AgentResponse {
    const confidence = this.calculateBackendConfidence(response, context);
    const suggestions = this.extractBackendSuggestions(response);
    
    return {
      content: response,
      confidence,
      suggestions,
      followupQuestions: this.generateBackendFollowups(response, context),
      relatedTopics: this.identifyBackendTopics(response)
    };
  }

  private buildBackendContext(context: AgentContext): string {
    let info = '';
    
    if (context.currentFile) {
      info += `Current File: ${context.currentFile}\n`;
      
      // Analyze file type for backend context
      if (context.currentFile.includes('api') || context.currentFile.includes('route')) {
        info += `File Type: API/Route Handler\n`;
      } else if (context.currentFile.includes('service') || context.currentFile.includes('controller')) {
        info += `File Type: Business Logic Service\n`;
      } else if (context.currentFile.includes('model') || context.currentFile.includes('schema')) {
        info += `File Type: Data Model/Schema\n`;
      } else if (context.currentFile.includes('middleware')) {
        info += `File Type: Middleware\n`;
      } else if (context.currentFile.includes('config')) {
        info += `File Type: Configuration\n`;
      }
    }
    
    if (context.selectedText) {
      info += `Selected Code:\n\`\`\`\n${context.selectedText.slice(0, 500)}\n\`\`\`\n`;
    }
    
    if (context.relatedFiles) {
      const backendFiles = context.relatedFiles.filter(file => 
        file.includes('api') || file.includes('service') || 
        file.includes('controller') || file.includes('model') ||
        file.includes('route') || file.includes('middleware')
      );
      
      if (backendFiles.length > 0) {
        info += `Related Backend Files: ${backendFiles.slice(0, 5).join(', ')}\n`;
      }
    }
    
    if (context.dependencies) {
      const backendDeps = context.dependencies.filter(dep =>
        ['express', 'fastify', 'koa', 'nestjs', 'mongodb', 'postgres', 'mysql', 'redis', 'prisma', 'typeorm']
          .some(backend => dep.toLowerCase().includes(backend))
      );
      
      if (backendDeps.length > 0) {
        info += `Backend Dependencies: ${backendDeps.join(', ')}\n`;
      }
    }

    return info || 'No specific backend context provided';
  }

  private analyzeBackendArchitecture(context: AgentContext): string {
    if (!context.codebaseMetrics) {
      return 'Modern Backend Architecture (inferred)';
    }
    
    const {techStack} = context.codebaseMetrics;
    const backendStack = techStack.filter(tech => 
      ['Node.js', 'Express', 'NestJS', 'Fastify', 'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker']
        .includes(tech)
    );
    
    let architecture = 'Layered Architecture';
    
    // Infer architecture patterns
    if (backendStack.includes('Docker') || context.files?.some(f => f.includes('docker'))) {
      architecture = 'Containerized Microservices';
    } else if (context.files?.some(f => f.includes('service') && f.includes('api'))) {
      architecture = 'Service-Oriented Architecture';
    } else if (context.files?.some(f => f.includes('controller') && f.includes('model'))) {
      architecture = 'MVC Pattern';
    }
    
    return `${architecture} with ${backendStack.join(' + ') || 'Modern Backend Stack'}`;
  }

  private calculateBackendConfidence(response: string, context: AgentContext): number {
    let confidence = 0.75; // Base confidence for backend tasks
    
    // Increase confidence for backend-specific terms
    const backendTerms = [
      'api', 'endpoint', 'database', 'server', 'authentication', 'authorization',
      'middleware', 'route', 'controller', 'service', 'model', 'schema',
      'cache', 'redis', 'mongodb', 'postgres', 'sql', 'nosql',
      'microservice', 'rest', 'graphql', 'jwt', 'oauth'
    ];
    
    const termCount = backendTerms.filter(term => 
      response.toLowerCase().includes(term)
    ).length;
    confidence += Math.min(termCount * 0.015, 0.15);
    
    // Increase confidence for code examples and technical details
    if (response.includes('```') || response.includes('app.') || response.includes('router.')) {
      confidence += 0.05;
    }
    
    // Increase confidence for specific backend patterns
    if (response.includes('HTTP') || response.includes('POST') || response.includes('GET')) {
      confidence += 0.04;
    }
    
    if (response.includes('middleware') || response.includes('validation')) {
      confidence += 0.03;
    }
    
    // Context bonuses
    if (context.currentFile?.includes('api') || context.currentFile?.includes('service')) {
      confidence += 0.05;
    }
    
    if (context.selectedText && (
      context.selectedText.includes('express') || 
      context.selectedText.includes('app.') ||
      context.selectedText.includes('router.')
    )) {
      confidence += 0.04;
    }
    
    // Penalize vague responses
    if (response.length < 150) {confidence -= 0.1;}
    if (!response.includes('api') && !response.includes('server') && !response.includes('database')) {
      confidence -= 0.05;
    }
    
    return Math.min(0.95, Math.max(0.5, confidence));
  }

  private extractBackendSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    
    // Standard suggestion patterns
    const numberedItems = response.match(/\d+\.\s*([^\n]+)/g);
    if (numberedItems) {
      suggestions.push(...numberedItems.map(item => item.replace(/\d+\.\s*/, '')));
    }
    
    const bulletItems = response.match(/[-*]\s*([^\n]+)/g);
    if (bulletItems) {
      suggestions.push(...bulletItems.map(item => item.replace(/[-*]\s*/, '')));
    }
    
    // Backend-specific patterns
    const backendPatterns = [
      /implement\s+([^.]+(?:api|endpoint|service|middleware|authentication)[^.]*)/gi,
      /use\s+([^.]+(?:database|cache|redis|mongodb|postgres)[^.]*)/gi,
      /add\s+([^.]+(?:validation|logging|monitoring|security)[^.]*)/gi,
      /configure\s+([^.]+)/gi,
      /optimize\s+([^.]+(?:query|performance|database)[^.]*)/gi,
      /secure\s+([^.]+)/gi
    ];
    
    backendPatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        suggestions.push(...matches.map(match => match.trim()));
      }
    });
    
    return [...new Set(suggestions)].slice(0, 8);
  }

  private generateBackendFollowups(response: string, context: AgentContext): string[] {
    const questions: string[] = [];
    
    if (response.includes('api') || response.includes('endpoint')) {
      questions.push('Would you like me to design the complete API specification with request/response schemas?');
    }
    
    if (response.includes('database') || response.includes('schema')) {
      questions.push('Do you need help with database schema design and relationships?');
    }
    
    if (response.includes('authentication') || response.includes('auth')) {
      questions.push('Would you like detailed implementation of the authentication flow?');
    }
    
    if (response.includes('performance') || response.includes('optimization')) {
      questions.push('Do you need specific performance optimization strategies for your backend?');
    }
    
    if (response.includes('microservice') || response.includes('service')) {
      questions.push('Would you like guidance on service decomposition and inter-service communication?');
    }
    
    // Context-based questions
    if (context.currentFile?.includes('api') && !response.includes('validation')) {
      questions.push('Should I add input validation and error handling to this API?');
    }
    
    if (!context.relatedFiles || context.relatedFiles.filter(f => f.includes('test')).length === 0) {
      questions.push('Would you like me to create API tests and integration test strategies?');
    }
    
    if (response.includes('cache') || response.includes('redis')) {
      questions.push('Do you need help implementing caching strategies and cache invalidation?');
    }
    
    return questions.slice(0, 3);
  }

  private identifyBackendTopics(response: string): string[] {
    const topics: string[] = [];
    
    const backendTopics = {
      'API Design': ['api', 'endpoint', 'rest', 'graphql', 'openapi', 'swagger'],
      'Database': ['database', 'sql', 'nosql', 'mongodb', 'postgres', 'mysql', 'schema'],
      'Authentication': ['auth', 'jwt', 'oauth', 'session', 'passport', 'security'],
      'Caching': ['cache', 'redis', 'memcached', 'cdn', 'caching'],
      'Microservices': ['microservice', 'service', 'distributed', 'messaging', 'queue'],
      'Performance': ['performance', 'optimization', 'scaling', 'load', 'bottleneck'],
      'Monitoring': ['monitoring', 'logging', 'metrics', 'observability', 'alerting'],
      'Deployment': ['deployment', 'docker', 'kubernetes', 'ci/cd', 'infrastructure'],
      'Data Validation': ['validation', 'sanitization', 'joi', 'yup', 'schema'],
      'Error Handling': ['error', 'exception', 'logging', 'debugging', 'monitoring']
    };
    
    Object.entries(backendTopics).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => response.toLowerCase().includes(keyword))) {
        topics.push(topic);
      }
    });
    
    return topics;
  }
}