/**
 * Prompt Builder
 *
 * Utility for building consistent AI prompts across applications
 */

import type { AgentContext } from '../types';

export class PromptBuilder {
  private sections: string[] = [];

  /**
   * Add system context to the prompt
   */
  addSystemContext(context: string): this {
    this.sections.push(`## System Context\n${context}`);
    return this;
  }

  /**
   * Add file context from the current workspace
   */
  addFileContext(context: AgentContext): this {
    const parts: string[] = ['## File Context'];

    if (context.currentFile) {
      parts.push(`**Current File:** ${context.currentFile}`);
    }

    if (context.workspaceRoot) {
      parts.push(`**Workspace:** ${context.workspaceRoot}`);
    }

    if (context.projectType) {
      parts.push(`**Project Type:** ${context.projectType}`);
    }

    if (context.gitBranch) {
      parts.push(`**Git Branch:** ${context.gitBranch}`);
    }

    if (context.recentFiles && context.recentFiles.length > 0) {
      parts.push(`**Recent Files:**\n${context.recentFiles.slice(0, 5).map(f => `- ${f}`).join('\n')}`);
    }

    this.sections.push(parts.join('\n'));
    return this;
  }

  /**
   * Add code context (selected text or relevant code)
   */
  addCodeContext(code: string, language?: string): this {
    const lang = language || '';
    this.sections.push(`## Code Context\n\`\`\`${lang}\n${code}\n\`\`\``);
    return this;
  }

  /**
   * Add learning context (past mistakes and knowledge)
   */
  addLearningContext(mistakes: any[], knowledge: any[]): this {
    const parts: string[] = ['## Learning Context'];

    if (mistakes.length > 0) {
      parts.push('\n**Past Mistakes to Avoid:**');
      mistakes.forEach(m => {
        parts.push(`- [${m.impact_severity}] ${m.description}`);
        if (m.prevention_strategy) {
          parts.push(`  → Prevention: ${m.prevention_strategy}`);
        }
      });
    }

    if (knowledge.length > 0) {
      parts.push('\n**Relevant Knowledge:**');
      knowledge.forEach(k => {
        parts.push(`- ${k.title}: ${k.content.slice(0, 100)}...`);
      });
    }

    if (mistakes.length > 0 || knowledge.length > 0) {
      this.sections.push(parts.join('\n'));
    }

    return this;
  }

  /**
   * Add the user's request
   */
  addRequest(request: string): this {
    this.sections.push(`## Request\n${request}`);
    return this;
  }

  /**
   * Add specific instructions
   */
  addInstructions(instructions: string): this {
    this.sections.push(`## Instructions\n${instructions}`);
    return this;
  }

  /**
   * Add platform-specific context
   */
  addPlatformContext(platform: 'desktop' | 'web' | 'mobile' | 'python'): this {
    const platformHints = {
      desktop: 'Focus on desktop application patterns (Electron/Tauri), native APIs, and desktop UX',
      web: 'Focus on web standards, browser APIs, responsive design, and web performance',
      mobile: 'Focus on mobile-first design, touch interactions, and mobile performance',
      python: 'Focus on Python best practices, type hints, and Pythonic solutions'
    };

    this.sections.push(`## Platform Context\n${platformHints[platform]}`);
    return this;
  }

  /**
   * Build the final prompt
   */
  build(): string {
    return this.sections.join('\n\n');
  }

  /**
   * Reset the builder
   */
  reset(): this {
    this.sections = [];
    return this;
  }

  /**
   * Create a quick prompt with common patterns
   */
  static quick(request: string, context?: AgentContext): string {
    const builder = new PromptBuilder();

    if (context) {
      builder.addFileContext(context);

      if (context.selectedText) {
        builder.addCodeContext(context.selectedText);
      }
    }

    builder.addRequest(request);

    return builder.build();
  }
}
