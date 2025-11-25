/**
 * Frontend Engineer Agent - UI/UX and client-side development specialist
 */
import { DeepSeekService } from '../DeepSeekService';

import { AgentCapability, AgentContext, AgentResponse, BaseSpecializedAgent, CodeChange } from './BaseSpecializedAgent';

export class FrontendEngineerAgent extends BaseSpecializedAgent {
  constructor(deepSeekService: DeepSeekService) {
    super('Frontend Engineer Agent', [
      AgentCapability.UI_DESIGN,
      AgentCapability.CODE_GENERATION,
      AgentCapability.STATE_MANAGEMENT,
      AgentCapability.ACCESSIBILITY,
      AgentCapability.PERFORMANCE_PROFILING,
      AgentCapability.SEO,
      AgentCapability.INTERNATIONALIZATION
    ], deepSeekService);
  }

  getRole(): string {
    return 'Frontend specialist focusing on user interfaces and client-side development';
  }

  getSpecialization(): string {
    return 'React, TypeScript, UI/UX design, accessibility, performance optimization, and modern frontend frameworks';
  }

  protected generatePrompt(request: string, context: AgentContext): string {
    const contextInfo = this.buildContextInfo(context);
    const techStackInfo = this.analyzeTechStack(context);
    
    return `You are a Senior Frontend Engineer with expertise in modern web development, specializing in React, TypeScript, and user experience.

CONTEXT:
${contextInfo}

TECH STACK:
${techStackInfo}

REQUEST: ${request}

As a Frontend Engineer, provide guidance focusing on:

1. **User Interface**: Component design, layout, and user interaction
2. **React Best Practices**: Hooks, state management, component patterns
3. **TypeScript**: Type safety and developer experience
4. **Performance**: Rendering optimization, bundle size, loading strategies
5. **Accessibility**: WCAG compliance and inclusive design
6. **State Management**: Local state, context, and external stores
7. **Styling**: CSS-in-JS, responsive design, design systems
8. **User Experience**: Intuitive interfaces and smooth interactions

Provide specific, implementable solutions with:
- React component examples with TypeScript
- Performance optimization techniques
- Accessibility considerations
- Modern CSS/styling approaches
- State management recommendations
- Code splitting and lazy loading strategies

Focus on creating maintainable, performant, and accessible user interfaces.`;
  }

  protected analyzeResponse(response: string, context: AgentContext): AgentResponse {
    const confidence = this.calculateFrontendConfidence(response, context);
    const suggestions = this.extractFrontendSuggestions(response);
    const codeChanges = this.identifyCodeChanges(response, context);
    
    return {
      content: response,
      confidence,
      suggestions,
      codeChanges,
      followupQuestions: this.generateFrontendFollowups(response, context),
      relatedTopics: this.identifyFrontendTopics(response)
    };
  }

  private buildContextInfo(context: AgentContext): string {
    let info = '';
    
    if (context.currentFile) {
      info += `Current File: ${context.currentFile}\n`;
      
      // Analyze file type for frontend context
      if (context.currentFile.endsWith('.tsx') || context.currentFile.endsWith('.jsx')) {
        info += `File Type: React Component\n`;
      } else if (context.currentFile.endsWith('.css') || context.currentFile.endsWith('.scss')) {
        info += `File Type: Stylesheet\n`;
      } else if (context.currentFile.includes('test')) {
        info += `File Type: Test File\n`;
      }
    }
    
    if (context.selectedText) {
      info += `Selected Code:\n\`\`\`\n${context.selectedText.slice(0, 500)}\n\`\`\`\n`;
    }
    
    if (context.relatedFiles) {
      const frontendFiles = context.relatedFiles.filter(file => 
        file.endsWith('.tsx') || file.endsWith('.jsx') || 
        file.endsWith('.css') || file.endsWith('.scss') ||
        file.includes('component') || file.includes('hook')
      );
      
      if (frontendFiles.length > 0) {
        info += `Related Frontend Files: ${frontendFiles.slice(0, 5).join(', ')}\n`;
      }
    }
    
    if (context.userPreferences?.previousSuggestions) {
      info += `Previous Suggestions: ${context.userPreferences.previousSuggestions.slice(0, 3).join(', ')}\n`;
    }

    return info || 'No specific frontend context provided';
  }

  private analyzeTechStack(context: AgentContext): string {
    if (!context.codebaseMetrics) {
      return 'React + TypeScript (inferred)';
    }
    
    const {techStack} = context.codebaseMetrics;
    const frontendStack = techStack.filter(tech => 
      ['React', 'Vue', 'Angular', 'TypeScript', 'JavaScript', 'CSS', 'SCSS', 'Tailwind', 'styled-components']
        .includes(tech)
    );
    
    return frontendStack.length > 0 ? frontendStack.join(' + ') : 'Modern Frontend Stack';
  }

  private calculateFrontendConfidence(response: string, context: AgentContext): number {
    let confidence = 0.75; // Base confidence for frontend tasks
    
    // Increase confidence for frontend-specific terms
    const frontendTerms = [
      'component', 'react', 'jsx', 'tsx', 'hooks', 'state', 'props', 'render',
      'css', 'styling', 'responsive', 'accessibility', 'performance', 'ui', 'ux'
    ];
    
    const termCount = frontendTerms.filter(term => 
      response.toLowerCase().includes(term)
    ).length;
    confidence += Math.min(termCount * 0.02, 0.15);
    
    // Increase confidence for code examples
    if (response.includes('```') || response.includes('const ') || response.includes('function ')) {
      confidence += 0.05;
    }
    
    // Increase confidence for specific React patterns
    if (response.includes('useState') || response.includes('useEffect') || response.includes('useCallback')) {
      confidence += 0.05;
    }
    
    // Context bonuses
    if (context.currentFile?.endsWith('.tsx') || context.currentFile?.endsWith('.jsx')) {
      confidence += 0.05;
    }
    
    if (context.selectedText && (context.selectedText.includes('React') || context.selectedText.includes('component'))) {
      confidence += 0.03;
    }
    
    // Penalize vague responses
    if (response.length < 150) {confidence -= 0.1;}
    if (!response.includes('component') && !response.includes('React')) {confidence -= 0.05;}
    
    return Math.min(0.95, Math.max(0.5, confidence));
  }

  private extractFrontendSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    
    // Standard suggestion extraction
    const numberedItems = response.match(/\d+\.\s*([^\n]+)/g);
    if (numberedItems) {
      suggestions.push(...numberedItems.map(item => item.replace(/\d+\.\s*/, '')));
    }
    
    const bulletItems = response.match(/[-*]\s*([^\n]+)/g);
    if (bulletItems) {
      suggestions.push(...bulletItems.map(item => item.replace(/[-*]\s*/, '')));
    }
    
    // Frontend-specific suggestion patterns
    const frontendPatterns = [
      /use\s+(useState|useEffect|useCallback|useMemo|useContext|useReducer)/gi,
      /implement\s+([^.]+(?:component|hook|state|styling)[^.]*)/gi,
      /add\s+([^.]+(?:accessibility|responsive|performance)[^.]*)/gi,
      /optimize\s+([^.]+)/gi,
      /consider\s+([^.]+)/gi
    ];
    
    frontendPatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        suggestions.push(...matches.map(match => match.trim()));
      }
    });
    
    return [...new Set(suggestions)].slice(0, 8);
  }

  private identifyCodeChanges(response: string, context: AgentContext): CodeChange[] {
    const changes: CodeChange[] = [];
    
    // Look for code blocks in the response
    const codeBlocks = response.match(/```(?:typescript|javascript|tsx|jsx|css|scss)?\n([\s\S]*?)\n```/g);
    
    if (codeBlocks && context.currentFile) {
      codeBlocks.forEach((block, index) => {
        const code = block.replace(/```(?:typescript|javascript|tsx|jsx|css|scss)?\n/, '').replace(/\n```$/, '');
        
        // Determine change type based on content
        let type: 'create' | 'modify' | 'delete' = 'modify';
        if (code.includes('export default') && code.includes('function')) {
          type = 'create';
        }
        
        changes.push({
          filePath: context.currentFile,
          type,
          content: code,
          description: `Code example ${index + 1} from frontend engineer analysis`
        });
      });
    }
    
    return changes;
  }

  private generateFrontendFollowups(response: string, context: AgentContext): string[] {
    const questions: string[] = [];
    
    if (response.includes('component') || response.includes('React')) {
      questions.push('Would you like me to create a complete component implementation?');
    }
    
    if (response.includes('state') || response.includes('useState')) {
      questions.push('Do you need help with state management architecture for this component?');
    }
    
    if (response.includes('performance') || response.includes('optimization')) {
      questions.push('Would you like specific performance optimization strategies?');
    }
    
    if (response.includes('accessibility') || response.includes('a11y')) {
      questions.push('Do you need detailed accessibility implementation guidance?');
    }
    
    if (response.includes('styling') || response.includes('css')) {
      questions.push('Would you like me to suggest specific styling approaches or design patterns?');
    }
    
    // Context-based questions
    if (context.currentFile?.endsWith('.tsx') && !response.includes('TypeScript')) {
      questions.push('Would you like TypeScript type definitions for these components?');
    }
    
    if (!context.relatedFiles || context.relatedFiles.length === 0) {
      questions.push('Should I analyze related components or create supporting files?');
    }
    
    return questions.slice(0, 3);
  }

  private identifyFrontendTopics(response: string): string[] {
    const topics: string[] = [];
    
    const frontendTopics = {
      'React Hooks': ['hook', 'useState', 'useEffect', 'useCallback', 'useMemo'],
      'Component Architecture': ['component', 'props', 'composition', 'reusable'],
      'State Management': ['state', 'context', 'redux', 'zustand', 'management'],
      'Styling & CSS': ['css', 'styled', 'styling', 'responsive', 'design'],
      'Performance': ['performance', 'optimization', 'lazy', 'memo', 'bundle'],
      'Accessibility': ['accessibility', 'a11y', 'aria', 'wcag', 'inclusive'],
      'TypeScript': ['typescript', 'types', 'interface', 'generic'],
      'Testing': ['test', 'testing', 'jest', 'react-testing-library'],
      'User Experience': ['ux', 'user', 'interaction', 'usability', 'interface'],
      'Build & Tooling': ['webpack', 'vite', 'babel', 'bundler', 'build']
    };
    
    Object.entries(frontendTopics).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => response.toLowerCase().includes(keyword))) {
        topics.push(topic);
      }
    });
    
    return topics;
  }
}