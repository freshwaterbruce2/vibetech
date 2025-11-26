/**
 * Frontend Engineer Agent - UI/UX development specialist
 *
 * Focuses on React, component architecture, state management,
 * and frontend performance optimization.
 */

import { BaseSpecializedAgent } from './BaseSpecializedAgent';
import type { AgentCapability, AgentContext, AgentResponse } from '../types';

export class FrontendEngineerAgent extends BaseSpecializedAgent {
  constructor() {
    const capabilities: AgentCapability[] = [
      { name: 'React Development', description: 'React components and hooks', enabled: true },
      { name: 'State Management', description: 'Redux, Zustand, Context API', enabled: true },
      { name: 'UI/UX Design', description: 'Component design and accessibility', enabled: true },
      { name: 'Performance', description: 'Frontend optimization techniques', enabled: true },
      { name: 'CSS/Styling', description: 'Tailwind, styled-components, CSS-in-JS', enabled: true },
      { name: 'Testing', description: 'Component testing and E2E tests', enabled: true },
    ];

    const systemPrompt = `You are an expert Frontend Engineer specializing in React, TypeScript, and modern UI development. You have deep expertise in building performant, accessible, and maintainable user interfaces for desktop and web applications.

## Core Responsibilities

1. **React Development**
   - Design reusable component architectures
   - Implement React hooks and custom hooks
   - Optimize component rendering and re-renders
   - Handle component lifecycle and effects
   - Implement proper prop drilling solutions
   - Use React 19 features effectively

2. **State Management**
   - Choose appropriate state management solutions
   - Implement Zustand, Redux, or Context API
   - Design efficient state updates
   - Handle async state and loading states
   - Implement optimistic updates
   - Manage global vs local state

3. **UI/UX Design**
   - Create accessible components (WCAG 2.1)
   - Implement responsive designs
   - Design intuitive user interactions
   - Handle loading and error states gracefully
   - Implement keyboard navigation
   - Create consistent design systems

4. **Performance Optimization**
   - Implement code splitting and lazy loading
   - Optimize bundle size
   - Use React.memo and useMemo effectively
   - Implement virtual scrolling for large lists
   - Optimize images and assets
   - Reduce unnecessary re-renders

5. **Styling & Theming**
   - Implement Tailwind CSS or styled-components
   - Create consistent theming systems
   - Handle dark mode and theme switching
   - Implement responsive breakpoints
   - Use CSS variables effectively
   - Optimize CSS performance

6. **Testing**
   - Write component tests with Testing Library
   - Implement E2E tests with Playwright
   - Test accessibility
   - Mock API calls and state
   - Test user interactions
   - Ensure test coverage

## Technical Expertise

- **Languages**: TypeScript, JavaScript (ES6+), HTML5, CSS3
- **Frameworks**: React 19, Next.js, Vite
- **State**: Zustand, Redux Toolkit, Context API
- **Styling**: Tailwind CSS, styled-components, CSS Modules
- **Testing**: Vitest, Testing Library, Playwright
- **Build Tools**: Vite, Webpack, esbuild
- **UI Libraries**: shadcn/ui, Radix UI, Framer Motion

Provide specific, production-ready solutions with code examples, accessibility considerations, and performance best practices.`;

    super('Frontend Engineer', capabilities, systemPrompt);
  }

  getRole(): string {
    return 'Frontend specialist focusing on React, UI/UX, and client-side architecture';
  }

  getSpecialization(): string {
    return 'React development, state management, UI/UX design, and frontend performance optimization';
  }

  canHandle(request: string, context: AgentContext): boolean {
    const confidence = this.calculateConfidence(request, context);
    return confidence >= 0.6;
  }

  async process(request: string, context: AgentContext): Promise<AgentResponse> {
    const confidence = this.calculateConfidence(request, context);

    const prompt = this.buildPrompt(request, context);

    const response: AgentResponse = {
      content: `As a Frontend Engineer, I'll help you with: ${request}`,
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
      'react', 'component', 'jsx', 'tsx', 'hook', 'usestate', 'useeffect',
      'ui', 'ux', 'interface', 'design', 'layout', 'responsive',
      'css', 'style', 'tailwind', 'styled-components', 'theme',
      'state', 'redux', 'zustand', 'context',
      'performance', 'render', 'memo', 'optimization',
      'accessibility', 'a11y', 'aria', 'keyboard',
      'frontend', 'client', 'browser', 'dom',
    ];
  }

  protected isRelevantFileType(fileExtension: string): boolean {
    const frontendExtensions = ['tsx', 'jsx', 'ts', 'js', 'css', 'scss', 'html'];
    return frontendExtensions.includes(fileExtension);
  }

  private buildPrompt(request: string, context: AgentContext): string {
    let prompt = `${this.systemPrompt  }\n\n`;

    if (context.currentFile) {
      prompt += `Current File: ${context.currentFile}\n`;

      // Add file type context
      if (context.currentFile.includes('component')) {
        prompt += 'File Type: React Component\n';
      } else if (context.currentFile.includes('hook')) {
        prompt += 'File Type: Custom Hook\n';
      } else if (context.currentFile.includes('store') || context.currentFile.includes('state')) {
        prompt += 'File Type: State Management\n';
      }
    }

    if (context.selectedText) {
      prompt += `Selected Code:\n\`\`\`\n${context.selectedText.slice(0, 500)}\n\`\`\`\n\n`;
    }

    prompt += `Request: ${request}`;

    return prompt;
  }
}
