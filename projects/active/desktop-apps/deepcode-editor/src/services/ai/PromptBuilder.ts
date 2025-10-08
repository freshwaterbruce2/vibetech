import { AIContextRequest, WorkspaceContext } from '../../types';

/**
 * Builds system prompts and context for AI interactions
 */
export class PromptBuilder {
  static buildBaseSystemPrompt(model?: string): string {
    // Optimize prompt based on model
    if (model === 'deepseek-coder') {
      return `You are DeepSeek Coder, a specialized programming AI assistant in DeepCode Editor. You excel at generating, analyzing, and optimizing code.

Your specialized capabilities:
- Advanced code generation with best practices
- Deep understanding of design patterns and architectures
- Performance optimization and algorithms
- Complex refactoring and modernization
- Multi-file code generation and project structure
- Advanced debugging and root cause analysis

Coding guidelines:
- Write production-ready, clean code
- Follow language-specific conventions and idioms
- Include proper error handling and edge cases
- Add helpful inline comments for complex logic
- Optimize for both readability and performance
- Consider security best practices`;
    } else if (model === 'deepseek-reasoner') {
      return `You are DeepSeek Reasoner in DeepCode Editor. You provide detailed reasoning for complex programming problems.

Your approach:
- Break down complex problems step-by-step
- Show your reasoning process clearly
- Consider multiple solutions and trade-offs
- Explain the "why" behind recommendations
- Validate assumptions and edge cases
- Provide comprehensive analysis

When solving problems:
- First understand the requirements fully
- Consider different approaches
- Analyze pros and cons
- Recommend the best solution with justification`;
    }

    // Default prompt for deepseek-chat
    return `You are an expert programming assistant built into DeepCode Editor, an AI-powered code editor. You help developers write, understand, and improve code.

Your capabilities:
- Code completion and generation
- Code explanation and documentation
- Debugging and error fixing
- Code refactoring and optimization
- Best practices and code review

Guidelines:
- Be concise but thorough
- Provide working, production-ready code
- Explain complex concepts clearly
- Suggest improvements when relevant
- Use markdown formatting for code blocks
- Focus on the specific programming language being used`;
  }

  static buildContextualSystemPrompt(request: AIContextRequest, model?: string): string {
    let prompt = this.buildBaseSystemPrompt(model);

    // Add workspace context
    if (request.workspaceContext) {
      prompt += this.buildWorkspaceSection(request.workspaceContext);
    }

    // Add current file context
    if (request.currentFile) {
      prompt += `

Current File Context:
- File: ${request.currentFile.name}
- Language: ${request.currentFile.language}
- Content: ${request.currentFile.content.substring(0, 1000)}${request.currentFile.content.length > 1000 ? '...' : ''}`;
    }

    // Add related files context
    if (request.relatedFiles && request.relatedFiles.length > 0) {
      prompt += `

Related Files:
${request.relatedFiles
  .slice(0, 3)
  .map(
    (file) =>
      `- ${file.path} (relevance: ${file.relevance}): ${file.content.substring(0, 200)}${file.content.length > 200 ? '...' : ''}`
  )
  .join('\n')}`;
    }

    return prompt;
  }

  static buildWorkspaceSection(context: WorkspaceContext): string {
    return `

Project Context:
- Root: ${context.rootPath}
- Files: ${context.totalFiles} total
- Languages: ${context.languages.join(', ')}
- Test Coverage: ${context.testFiles} test files
${context.summary ? `- Summary: ${context.summary}` : ''}
${Object.keys(context.dependencies).length > 0 ? `- Dependencies: ${Object.keys(context.dependencies).slice(0, 5).join(', ')}` : ''}`;
  }

  static buildCodeCompletionPrompt(
    code: string,
    language: string,
    position: { line: number; column: number }
  ): string {
    return `Complete the following ${language} code. Only return the completion, no explanations:

\`\`\`${language}
${code}
\`\`\`

Complete from line ${position.line}, column ${position.column}.`;
  }

  static buildCodeExplanationPrompt(code: string, language: string): string {
    return `Explain this ${language} code in detail:

\`\`\`${language}
${code}
\`\`\`

Please provide:
1. What the code does
2. How it works
3. Any potential issues or improvements`;
  }

  static buildRefactorPrompt(code: string, language: string): string {
    return `Refactor this ${language} code to improve readability, performance, and maintainability:

\`\`\`${language}
${code}
\`\`\`

Provide the refactored code with explanations of the changes made.`;
  }
}
