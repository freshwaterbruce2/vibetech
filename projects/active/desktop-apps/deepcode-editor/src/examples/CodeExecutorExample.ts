/**
 * CodeExecutor Usage Examples
 * 
 * This file demonstrates how to use the CodeExecutor service
 * for executing code in different languages with proper security.
 */
import { logger } from '../services/Logger';

import { CodeExecutor, type ExecutionOptions, type SecurityPolicy } from '../services/CodeExecutor';

export class CodeExecutorExample {
  private executor: CodeExecutor;

  constructor() {
    // Initialize with custom security policy
    const securityPolicy: Partial<SecurityPolicy> = {
      allowNetworkAccess: false,
      allowFileSystemAccess: false,
      maxExecutionTime: 10000, // 10 seconds
      maxMemoryUsage: 256 * 1024 * 1024, // 256MB
      blockedCommands: [
        'rm', 'del', 'format', 'sudo', 'su', 'chmod', 'chown',
        'systemctl', 'service', 'reboot', 'shutdown'
      ]
    };

    this.executor = new CodeExecutor(5000, securityPolicy);
  }

  /**
   * Execute JavaScript code examples
   */
  async demonstrateJavaScriptExecution() {
    logger.debug('=== JavaScript Execution Examples ===');

    // Simple calculation
    const mathResult = await this.executor.executeCode(`
      const a = 10;
      const b = 20;
      const result = a + b;
      logger.debug('Result:', result);
      result;
    `, 'javascript');

    logger.debug('Math Result:', mathResult);

    // Working with arrays and functions
    const arrayResult = await this.executor.executeCode(`
      const numbers = [1, 2, 3, 4, 5];
      const doubled = numbers.map(n => n * 2);
      const sum = doubled.reduce((acc, n) => acc + n, 0);
      logger.debug('Doubled:', doubled);
      logger.debug('Sum:', sum);
      sum;
    `, 'javascript');

    logger.debug('Array Result:', arrayResult);

    // Error handling example
    const errorResult = await this.executor.executeCode(`
      try {
        throw new Error('This is a test error');
      } catch (error) {
        logger.debug('Caught error:', error.message);
        return 'Error handled successfully';
      }
    `, 'javascript');

    logger.debug('Error Handling Result:', errorResult);
  }

  /**
   * Execute TypeScript code examples
   */
  async demonstrateTypeScriptExecution() {
    logger.debug('=== TypeScript Execution Examples ===');

    const tsResult = await this.executor.executeCode(`
      interface User {
        name: string;
        age: number;
      }

      const user: User = {
        name: 'John Doe',
        age: 30
      };

      function greetUser(user: User): string {
        return \`Hello, \${user.name}! You are \${user.age} years old.\`;
      }

      const greeting = greetUser(user);
      logger.debug(greeting);
      greeting;
    `, 'typescript');

    logger.debug('TypeScript Result:', tsResult);
  }

  /**
   * Execute Python code examples (only works in Electron mode)
   */
  async demonstratePythonExecution() {
    logger.debug('=== Python Execution Examples ===');

    const pythonResult = await this.executor.executeCode(`
def fibonacci(n):
    if n <= 1:
        return n
    else:
        return fibonacci(n-1) + fibonacci(n-2)

# Calculate first 10 Fibonacci numbers
fib_numbers = [fibonacci(i) for i in range(10)]
print("Fibonacci numbers:", fib_numbers)

# Simple class example
class Calculator:
    def add(self, a, b):
        return a + b
    
    def multiply(self, a, b):
        return a * b

calc = Calculator()
result = calc.add(5, 3)
print(f"5 + 3 = {result}")
    `, 'python');

    logger.debug('Python Result:', pythonResult);
  }

  /**
   * Execute shell commands (only works in Electron mode)
   */
  async demonstrateCommandExecution() {
    logger.debug('=== Command Execution Examples ===');

    // Simple echo command
    const echoResult = await this.executor.executeCommand('echo "Hello from shell!"');
    logger.debug('Echo Result:', echoResult);

    // List directory contents (safe command)
    const lsResult = await this.executor.executeCommand('ls -la');
    logger.debug('Directory Listing:', lsResult);

    // Dangerous command (should be blocked)
    const dangerousResult = await this.executor.executeCommand('rm -rf *');
    logger.debug('Dangerous Command Result:', dangerousResult);
  }

  /**
   * Demonstrate syntax validation
   */
  async demonstrateSyntaxValidation() {
    logger.debug('=== Syntax Validation Examples ===');

    // Valid JavaScript
    const validJS = await this.executor.validateSyntax(
      'const x = 10; logger.debug(x);', 
      'javascript'
    );
    logger.debug('Valid JavaScript:', validJS);

    // Invalid JavaScript
    const invalidJS = await this.executor.validateSyntax(
      'const x = 10 logger.debug(x);', // Missing semicolon
      'javascript'
    );
    logger.debug('Invalid JavaScript:', invalidJS);

    // Valid Python
    const validPython = await this.executor.validateSyntax(
      'def hello():\n    print("Hello World")',
      'python'
    );
    logger.debug('Valid Python:', validPython);

    // Valid TypeScript
    const validTS = await this.executor.validateSyntax(
      'interface User { name: string; } const user: User = { name: "John" };',
      'typescript'
    );
    logger.debug('Valid TypeScript:', validTS);
  }

  /**
   * Demonstrate security features
   */
  async demonstrateSecurityFeatures() {
    logger.debug('=== Security Features Examples ===');

    // Attempt to access file system (should be blocked)
    const fsAccessResult = await this.executor.executeCode(`
      const fs = require('fs');
      fs.readFileSync('/etc/passwd');
    `, 'javascript');
    logger.debug('File System Access Attempt:', fsAccessResult);

    // Attempt to spawn child process (should be blocked)
    const childProcessResult = await this.executor.executeCode(`
      const { exec } = require('child_process');
      exec('cat /etc/passwd');
    `, 'javascript');
    logger.debug('Child Process Attempt:', childProcessResult);

    // Safe code execution
    const safeResult = await this.executor.executeCode(`
      const data = [1, 2, 3, 4, 5];
      const processed = data.map(x => x * 2).filter(x => x > 5);
      logger.debug('Processed data:', processed);
      processed;
    `, 'javascript');
    logger.debug('Safe Code Execution:', safeResult);
  }

  /**
   * Demonstrate timeout and resource management
   */
  async demonstrateResourceManagement() {
    logger.debug('=== Resource Management Examples ===');

    // Fast execution
    const fastResult = await this.executor.executeCode(`
      const start = Date.now();
      let count = 0;
      for (let i = 0; i < 1000; i++) {
        count += i;
      }
      const end = Date.now();
      logger.debug(\`Processed \${count} in \${end - start}ms\`);
      count;
    `, 'javascript');
    logger.debug('Fast Execution:', fastResult);

    // Timeout example (this should timeout)
    const timeoutResult = await this.executor.executeCode(`
      logger.debug('Starting long operation...');
      while (true) {
        // Infinite loop - should timeout
      }
    `, 'javascript', { timeout: 2000 });
    logger.debug('Timeout Test:', timeoutResult);
  }

  /**
   * Demonstrate execution options
   */
  async demonstrateExecutionOptions() {
    logger.debug('=== Execution Options Examples ===');

    const options: ExecutionOptions = {
      timeout: 5000,
      environment: {
        NODE_ENV: 'test',
        DEBUG: 'true'
      }
    };

    const result = await this.executor.executeCode(`
      logger.debug('Environment:', process.env.NODE_ENV);
      logger.debug('Debug mode:', process.env.DEBUG);
      'Execution with custom options complete';
    `, 'javascript', options);

    logger.debug('Custom Options Result:', result);
  }

  /**
   * Run all examples
   */
  async runAllExamples() {
    try {
      await this.demonstrateJavaScriptExecution();
      await this.demonstrateTypeScriptExecution();
      await this.demonstratePythonExecution();
      await this.demonstrateCommandExecution();
      await this.demonstrateSyntaxValidation();
      await this.demonstrateSecurityFeatures();
      await this.demonstrateResourceManagement();
      await this.demonstrateExecutionOptions();
    } catch (error) {
      logger.error('Error running examples:', error);
    }
  }
}

// Usage example
export async function runCodeExecutorExamples() {
  const examples = new CodeExecutorExample();
  await examples.runAllExamples();
}

// Run examples if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  runCodeExecutorExamples().catch(console.error);
}