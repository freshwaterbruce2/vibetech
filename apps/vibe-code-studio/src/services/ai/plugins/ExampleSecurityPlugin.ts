/**
 * Example Security Plugin
 *
 * Demonstrates how to create a custom plugin for the AI system
 * This plugin adds security analysis capabilities
 */

import { ReviewPlugin, ReviewResult, EditOperation, Amendment } from '../plugin-system/types';
import { AgentTask } from '@nova/types';

export class SecurityAnalysisPlugin implements ReviewPlugin {
  id = 'security-analysis-plugin';
  name = 'Security Analysis Plugin';
  version = '1.0.0';
  type = 'reviewer' as const;
  enabled = true;

  reviewPerspective = 'security';
  confidenceThreshold = 0.8;

  capabilities = [{
    name: 'security-review',
    description: 'Perform comprehensive security analysis on code changes',
    handler: this.performReview.bind(this),
    priority: 10
  }];

  /**
   * Plugin lifecycle - called when registered
   */
  async onRegister(): Promise<void> {
    console.log(`[${this.name}] Plugin registered successfully`);
  }

  /**
   * Plugin lifecycle - called when unregistered
   */
  async onUnregister(): Promise<void> {
    console.log(`[${this.name}] Plugin unregistered`);
  }

  /**
   * Perform security review on task and edits
   */
  async performReview(
    task: AgentTask,
    edits: EditOperation[]
  ): Promise<ReviewResult> {
    const securityIssues: string[] = [];
    const amendments: Amendment[] = [];
    let score = 1.0;

    // Check for common security patterns in edits
    for (const edit of edits) {
      const issues = this.analyzeEditForSecurity(edit);
      securityIssues.push(...issues);

      // Reduce score for each issue found
      score -= issues.length * 0.1;
    }

    // Check task for security considerations
    const taskIssues = this.analyzeTaskForSecurity(task);
    securityIssues.push(...taskIssues);
    score -= taskIssues.length * 0.05;

    // Generate amendments for critical issues
    if (score < this.confidenceThreshold) {
      amendments.push(...this.generateSecurityAmendments(securityIssues, edits));
    }

    // Ensure score is between 0 and 1
    score = Math.max(0, Math.min(1, score));

    return {
      perspective: this.reviewPerspective,
      taskId: task.id,
      score,
      feedback: this.generateFeedback(securityIssues, score),
      requiredAmendments: amendments
    };
  }

  /**
   * Analyze an edit operation for security issues
   */
  private analyzeEditForSecurity(edit: EditOperation): string[] {
    const issues: string[] = [];

    for (const op of edit.operations) {
      // Check for SQL injection vulnerabilities
      if (op.content?.includes('SELECT') && op.content.includes('${')) {
        issues.push(`Potential SQL injection in ${edit.filePath}`);
      }

      // Check for hardcoded credentials
      if (op.content?.match(/password\s*=\s*["'][\w]+["']/i)) {
        issues.push(`Hardcoded password detected in ${edit.filePath}`);
      }

      // Check for insecure API keys
      if (op.content?.match(/api[_-]?key\s*=\s*["'][\w]+["']/i)) {
        issues.push(`Exposed API key in ${edit.filePath}`);
      }

      // Check for eval usage
      if (op.content?.includes('eval(')) {
        issues.push(`Dangerous eval() usage in ${edit.filePath}`);
      }

      // Check for unvalidated input
      if (op.content?.includes('req.body') && !op.content.includes('validate')) {
        issues.push(`Unvalidated user input in ${edit.filePath}`);
      }
    }

    return issues;
  }

  /**
   * Analyze a task for security considerations
   */
  private analyzeTaskForSecurity(task: AgentTask): string[] {
    const issues: string[] = [];

    // Check if task involves sensitive operations
    if (task.description.toLowerCase().includes('authentication')) {
      if (!task.description.toLowerCase().includes('secure')) {
        issues.push('Authentication task should mention security considerations');
      }
    }

    if (task.description.toLowerCase().includes('database')) {
      if (!task.description.toLowerCase().includes('sanitize')) {
        issues.push('Database operations should include input sanitization');
      }
    }

    // Check steps for security practices
    for (const step of task.steps) {
      if (step.action.type === 'write_file') {
        const filePath = step.action.params.filePath as string;
        if (filePath?.includes('.env') || filePath?.includes('config')) {
          issues.push(`Sensitive file modification: ${filePath}`);
        }
      }
    }

    return issues;
  }

  /**
   * Generate feedback based on security analysis
   */
  private generateFeedback(issues: string[], score: number): string[] {
    const feedback: string[] = [];

    if (score >= this.confidenceThreshold) {
      feedback.push(`✅ Security review passed (Score: ${Math.round(score * 100)}%)`);
    } else {
      feedback.push(`⚠️ Security issues detected (Score: ${Math.round(score * 100)}%)`);
    }

    if (issues.length > 0) {
      feedback.push(`Found ${issues.length} security concern(s):`);
      feedback.push(...issues.slice(0, 5)); // Show first 5 issues

      if (issues.length > 5) {
        feedback.push(`... and ${issues.length - 5} more issues`);
      }
    } else {
      feedback.push('No security issues detected');
    }

    // Add recommendations
    if (score < 0.9) {
      feedback.push('\nRecommendations:');
      feedback.push('- Add input validation for all user inputs');
      feedback.push('- Use parameterized queries for database operations');
      feedback.push('- Store sensitive data in environment variables');
      feedback.push('- Implement proper authentication and authorization');
    }

    return feedback;
  }

  /**
   * Generate amendments to fix security issues
   */
  private generateSecurityAmendments(
    issues: string[],
    edits: EditOperation[]
  ): Amendment[] {
    const amendments: Amendment[] = [];

    // Create amendment for SQL injection fixes
    if (issues.some(i => i.includes('SQL injection'))) {
      amendments.push({
        id: `sec-amendment-sql-${Date.now()}`,
        type: 'fix',
        description: 'Fix SQL injection vulnerabilities',
        changes: this.createSQLFixEdits(edits),
        atomic: true,
        dependencies: []
      });
    }

    // Create amendment for hardcoded credentials
    if (issues.some(i => i.includes('password') || i.includes('API key'))) {
      amendments.push({
        id: `sec-amendment-creds-${Date.now()}`,
        type: 'fix',
        description: 'Move credentials to environment variables',
        changes: this.createCredentialFixEdits(edits),
        atomic: true,
        dependencies: []
      });
    }

    // Create amendment for input validation
    if (issues.some(i => i.includes('Unvalidated'))) {
      amendments.push({
        id: `sec-amendment-validation-${Date.now()}`,
        type: 'enhancement',
        description: 'Add input validation',
        changes: this.createValidationEdits(edits),
        atomic: false,
        dependencies: []
      });
    }

    return amendments;
  }

  private createSQLFixEdits(originalEdits: EditOperation[]): EditOperation[] {
    // Generate fix edits for SQL injection issues
    return originalEdits.map(edit => ({
      ...edit,
      fileId: `fix-${edit.fileId}`,
      operations: edit.operations.map(op => ({
        ...op,
        content: op.content?.replace(/\$\{([^}]+)\}/g, '?') // Replace template literals with placeholders
      }))
    }));
  }

  private createCredentialFixEdits(originalEdits: EditOperation[]): EditOperation[] {
    // Generate edits to move credentials to env variables
    return originalEdits.map(edit => ({
      ...edit,
      fileId: `fix-${edit.fileId}`,
      operations: edit.operations.map(op => ({
        ...op,
        content: op.content
          ?.replace(/password\s*=\s*["'][\w]+["']/gi, 'password = process.env.PASSWORD')
          ?.replace(/api[_-]?key\s*=\s*["'][\w]+["']/gi, 'apiKey = process.env.API_KEY')
      }))
    }));
  }

  private createValidationEdits(originalEdits: EditOperation[]): EditOperation[] {
    // Generate edits to add input validation
    return originalEdits.map(edit => ({
      ...edit,
      fileId: `fix-${edit.fileId}`,
      operations: edit.operations.map(op => ({
        ...op,
        content: op.content?.includes('req.body')
          ? `// Add input validation\nconst validated = validateInput(req.body);\n${op.content}`
          : op.content
      }))
    }));
  }
}

// Export as default for easy plugin loading
export default new SecurityAnalysisPlugin();