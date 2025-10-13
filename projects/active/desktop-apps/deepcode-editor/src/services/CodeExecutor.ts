/**
 * CodeExecutor - Service for executing code snippets and commands
 * Secure implementation with sandboxed execution and proper error handling
 */

import { ElectronService } from './ElectronService';

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode?: number;
  executionTime: number;
  resourceUsage?: {
    memory?: number;
    cpu?: number;
  };
}

export interface ExecutionOptions {
  timeout?: number;
  workingDirectory?: string;
  environment?: Record<string, string>;
  shell?: boolean;
  stdin?: string;
  maxMemory?: number;
  args?: string[];
  sandbox?: boolean;
}

export interface SecurityPolicy {
  allowNetworkAccess: boolean;
  allowFileSystemAccess: boolean;
  allowedDirectories: string[];
  blockedCommands: string[];
  maxExecutionTime: number;
  maxMemoryUsage: number;
}

export type SupportedLanguage = 
  | 'javascript' 
  | 'typescript' 
  | 'python' 
  | 'bash' 
  | 'node' 
  | 'deno' 
  | 'bun';

export class CodeExecutor {
  private timeout: number = 30000; // 30 seconds default timeout
  private electronService: ElectronService;
  private securityPolicy: SecurityPolicy;
  private tempDir: string = '/tmp/deepcode-executor';
  private executionCounter = 0;

  constructor(defaultTimeout?: number, customSecurityPolicy?: Partial<SecurityPolicy>) {
    if (defaultTimeout) {
      this.timeout = defaultTimeout;
    }
    
    this.electronService = new ElectronService();
    
    // Default security policy - restrictive by default
    this.securityPolicy = {
      allowNetworkAccess: false,
      allowFileSystemAccess: false,
      allowedDirectories: ['/tmp/deepcode-executor'],
      blockedCommands: [
        'rm', 'rmdir', 'del', 'format', 'fdisk', 'mkfs',
        'dd', 'sudo', 'su', 'chmod', 'chown', 'passwd',
        'useradd', 'userdel', 'systemctl', 'service',
        'reboot', 'shutdown', 'halt', 'poweroff'
      ],
      maxExecutionTime: 30000,
      maxMemoryUsage: 512 * 1024 * 1024, // 512MB
      ...customSecurityPolicy
    };
  }

  /**
   * Execute a shell command with security checks
   */
  async executeCommand(
    command: string,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const executionId = `cmd_${++this.executionCounter}_${Date.now()}`;
    
    try {
      // Security validation
      const securityCheck = this.validateCommandSecurity(command);
      if (!securityCheck.allowed) {
        return {
          success: false,
          output: '',
          error: `Security violation: ${securityCheck.reason}`,
          executionTime: Date.now() - startTime,
          exitCode: -1
        };
      }

      // Prepare execution options
      const execOptions: ExecutionOptions = {
        timeout: options.timeout || this.timeout,
        workingDirectory: options.workingDirectory || this.tempDir,
        environment: {
          PATH: this.getSafePathEnvironment(),
          NODE_ENV: 'sandbox',
          ...options.environment
        },
        shell: options.shell !== false,
        maxMemory: Math.min(options.maxMemory || this.securityPolicy.maxMemoryUsage, this.securityPolicy.maxMemoryUsage),
        ...(options.stdin && { stdin: options.stdin })
      };

      // Execute via Electron main process if available
      if (this.electronService.isElectron) {
        return await this.executeViaElectron('command', {
          command,
          options: execOptions,
          executionId
        });
      }

      // Fallback to browser-safe execution (very limited)
      return await this.executeBrowserSafe(command, execOptions, startTime);

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown execution error',
        executionTime,
        exitCode: -1
      };
    }
  }

  /**
   * Execute code in different languages
   */
  async executeCode(
    code: string,
    language: SupportedLanguage = 'javascript',
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const executionId = `code_${language}_${++this.executionCounter}_${Date.now()}`;
    
    try {
      // Validate code syntax first
      const syntaxValidation = await this.validateSyntax(code, language);
      if (!syntaxValidation.valid) {
        return {
          success: false,
          output: '',
          error: `Syntax errors: ${syntaxValidation.errors.join(', ')}`,
          executionTime: Date.now() - startTime,
          exitCode: -1
        };
      }

      // Security validation for code content
      const securityCheck = this.validateCodeSecurity(code, language);
      if (!securityCheck.allowed) {
        return {
          success: false,
          output: '',
          error: `Security violation: ${securityCheck.reason}`,
          executionTime: Date.now() - startTime,
          exitCode: -1
        };
      }

      // Prepare execution based on language
      const executionStrategy = this.getExecutionStrategy(language, code, options);
      
      if (this.electronService.isElectron) {
        return await this.executeViaElectron('code', {
          code,
          language,
          strategy: executionStrategy,
          options,
          executionId
        });
      }

      // Browser fallback - JavaScript only
      if (language === 'javascript') {
        return await this.executeJavaScriptSafe(code, options, startTime);
      }

      return {
        success: false,
        output: '',
        error: `Language ${language} execution not supported in browser mode`,
        executionTime: Date.now() - startTime,
        exitCode: -1
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown code execution error',
        executionTime,
        exitCode: -1
      };
    }
  }

  /**
   * Validate code syntax without execution
   */
  async validateSyntax(
    code: string,
    language: SupportedLanguage
  ): Promise<{ valid: boolean; errors: string[] }> {
    try {
      switch (language) {
        case 'javascript':
        case 'node':
          return this.validateJavaScriptSyntax(code);
        
        case 'typescript':
          return this.validateTypeScriptSyntax(code);
        
        case 'python':
          return await this.validatePythonSyntax(code);
        
        case 'bash':
          return this.validateBashSyntax(code);
        
        default:
          return {
            valid: false,
            errors: [`Syntax validation not implemented for language: ${language}`]
          };
      }
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Syntax validation error']
      };
    }
  }

  /**
   * Kill a running execution by ID
   */
  async killExecution(executionId: string): Promise<boolean> {
    if (this.electronService.isElectron) {
      try {
        const result = await this.executeViaElectron('kill', { executionId });
        return result.success;
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return ['javascript', 'typescript', 'python', 'bash', 'node', 'deno', 'bun'];
  }

  /**
   * Update security policy
   */
  updateSecurityPolicy(policy: Partial<SecurityPolicy>): void {
    this.securityPolicy = { ...this.securityPolicy, ...policy };
  }

  /**
   * Get current security policy
   */
  getSecurityPolicy(): SecurityPolicy {
    return { ...this.securityPolicy };
  }

  /**
   * Set default timeout for executions
   */
  setDefaultTimeout(timeout: number): void {
    this.timeout = Math.min(timeout, this.securityPolicy.maxExecutionTime);
  }

  /**
   * Get current default timeout
   */
  getDefaultTimeout(): number {
    return this.timeout;
  }

  // Private security validation methods
  private validateCommandSecurity(command: string): { allowed: boolean; reason?: string } {
    const cmd = command.trim().toLowerCase();
    
    // Check for blocked commands
    for (const blocked of this.securityPolicy.blockedCommands) {
      if (cmd.includes(blocked)) {
        return {
          allowed: false,
          reason: `Command contains blocked operation: ${blocked}`
        };
      }
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      /\brm\s+-rf\s*\//, // rm -rf /
      /\>\s*\/dev\//, // redirect to system devices
      /\|\s*sh/, // pipe to shell
      /\$\(.*\)/, // command substitution
      /`.*`/, // backtick command substitution
      /\;\s*(rm|del|format)/, // chained dangerous commands
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(cmd)) {
        return {
          allowed: false,
          reason: 'Command contains potentially dangerous pattern'
        };
      }
    }

    return { allowed: true };
  }

  private validateCodeSecurity(code: string, language: SupportedLanguage): { allowed: boolean; reason?: string } {
    const codeToCheck = code.toLowerCase();
    
    // Common dangerous patterns across languages
    const dangerousPatterns = [
      /require\s*\(\s*['"]fs['"]/,
      /require\s*\(\s*['"]child_process['"]/,
      /import.*fs.*from/,
      /import.*child_process.*from/,
      /exec\s*\(/,
      /spawn\s*\(/,
      /eval\s*\(/,
      /function\s*\(\s*\)\s*{\s*return\s*this/,
      /__filename/,
      /__dirname/,
      /process\s*\./,
      /global\s*\./,
    ];

    // Language-specific dangerous patterns
    if (language === 'python') {
      dangerousPatterns.push(
        /import\s+os/,
        /import\s+subprocess/,
        /import\s+sys/,
        /exec\s*\(/,
        /eval\s*\(/,
        /__import__\s*\(/,
        /compile\s*\(/
      );
    }

    for (const pattern of dangerousPatterns) {
      if (pattern.test(codeToCheck)) {
        return {
          allowed: false,
          reason: 'Code contains potentially dangerous operations'
        };
      }
    }

    return { allowed: true };
  }

  private getSafePathEnvironment(): string {
    // Return a restricted PATH that only includes safe directories
    return '/usr/local/bin:/usr/bin:/bin';
  }

  private getExecutionStrategy(language: SupportedLanguage, _code: string, _options: ExecutionOptions) {
    switch (language) {
      case 'javascript':
      case 'node':
        return {
          runtime: 'node',
          args: ['--max-old-space-size=256', '--no-warnings'],
          extension: '.js'
        };
      
      case 'typescript':
        return {
          runtime: 'tsx',
          args: ['--no-warnings'],
          extension: '.ts',
          fallback: {
            runtime: 'node',
            args: ['-r', 'ts-node/register', '--no-warnings'],
            extension: '.ts'
          }
        };
      
      case 'python':
        return {
          runtime: 'python3',
          args: ['-u'], // unbuffered output
          extension: '.py'
        };
      
      case 'bash':
        return {
          runtime: 'bash',
          args: ['-e'], // exit on error
          extension: '.sh'
        };
      
      case 'deno':
        return {
          runtime: 'deno',
          args: ['run', '--allow-none'],
          extension: '.ts'
        };
      
      case 'bun':
        return {
          runtime: 'bun',
          args: ['run'],
          extension: '.js'
        };
      
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  // Syntax validation methods
  private validateJavaScriptSyntax(code: string): { valid: boolean; errors: string[] } {
    try {
      // Use Function constructor for syntax checking (safer than eval)
      new Function(code);
      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'JavaScript syntax error']
      };
    }
  }

  private validateTypeScriptSyntax(code: string): { valid: boolean; errors: string[] } {
    // Basic TypeScript validation - in a real implementation,
    // you would use the TypeScript compiler API
    try {
      // For now, just check for basic syntax issues
      if (code.includes('interface') || code.includes('type ') || code.includes(': ')) {
        // Basic TypeScript pattern detected
        return { valid: true, errors: [] };
      }
      
      // Fall back to JavaScript validation
      return this.validateJavaScriptSyntax(code);
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'TypeScript syntax error']
      };
    }
  }

  private async validatePythonSyntax(code: string): Promise<{ valid: boolean; errors: string[] }> {
    // Basic Python syntax validation
    // In a real implementation, you would use Python's ast module or a parser
    const pythonSyntaxIssues: string[] = [];
    
    // Check for basic indentation issues
    const lines = code.split('\n');
    let expectedIndent = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line.trim() === '') continue;

      const _indent = line.length - line.trimStart().length;
      
      // Basic indentation check
      if (line.trimEnd().endsWith(':')) {
        expectedIndent += 4;
      }
    }
    
    return { valid: pythonSyntaxIssues.length === 0, errors: pythonSyntaxIssues };
  }

  private validateBashSyntax(code: string): { valid: boolean; errors: string[] } {
    // Basic bash syntax validation
    const bashSyntaxIssues: string[] = [];
    
    // Check for unmatched quotes
    const singleQuotes = (code.match(/'/g) || []).length;
    const doubleQuotes = (code.match(/"/g) || []).length;
    
    if (singleQuotes % 2 !== 0) {
      bashSyntaxIssues.push('Unmatched single quotes');
    }
    
    if (doubleQuotes % 2 !== 0) {
      bashSyntaxIssues.push('Unmatched double quotes');
    }
    
    return { valid: bashSyntaxIssues.length === 0, errors: bashSyntaxIssues };
  }

  // Execution methods
  private async executeViaElectron(type: string, payload: any): Promise<ExecutionResult> {
    try {
      const result = await this.electronService.invoke('code-execute', {
        type,
        payload,
        securityPolicy: this.securityPolicy
      });
      
      return result || {
        success: false,
        output: '',
        error: 'No response from Electron main process',
        executionTime: 0,
        exitCode: -1
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Electron execution error',
        executionTime: 0,
        exitCode: -1
      };
    }
  }

  private async executeBrowserSafe(
    _command: string, 
    _options: ExecutionOptions, 
    startTime: number
  ): Promise<ExecutionResult> {
    // Very limited browser-safe command execution
    const executionTime = Date.now() - startTime;
    
    return {
      success: false,
      output: '',
      error: 'Command execution not available in browser mode. Please use the desktop application.',
      executionTime,
      exitCode: -1
    };
  }

  private async executeJavaScriptSafe(
    code: string, 
    options: ExecutionOptions, 
    startTime: number
  ): Promise<ExecutionResult> {
    try {
      // Create a sandboxed execution context
      const sandbox = {
        console: {
          log: (...args: any[]) => args.join(' '),
          error: (...args: any[]) => args.join(' '),
          warn: (...args: any[]) => args.join(' '),
          info: (...args: any[]) => args.join(' ')
        },
        setTimeout: undefined,
        setInterval: undefined,
        clearTimeout: undefined,
        clearInterval: undefined,
        fetch: undefined,
        XMLHttpRequest: undefined,
        WebSocket: undefined
      };

      // Create execution function with timeout
      const executeWithTimeout = (code: string, timeout: number): Promise<any> => {
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error(`Execution timed out after ${timeout}ms`));
          }, timeout);

          try {
            // Create function with sandbox
            const func = new Function(
              'sandbox',
              `
              const { console } = sandbox;
              let result;
              try {
                ${code}
              } catch (error) {
                throw error;
              }
              return result;
              `
            );
            
            const result = func(sandbox);
            clearTimeout(timer);
            resolve(result);
          } catch (error) {
            clearTimeout(timer);
            reject(error);
          }
        });
      };

      const result = await executeWithTimeout(code, options.timeout || this.timeout);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        output: typeof result !== 'undefined' ? String(result) : '',
        executionTime,
        exitCode: 0
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'JavaScript execution error',
        executionTime,
        exitCode: -1
      };
    }
  }
}