/**
 * CodeExecutor Usage Examples
 * 
 * This file demonstrates how to use the CodeExecutor service
 * for executing code in different languages with proper security.
 */

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
    console.log('=== JavaScript Execution Examples ===');

    // Simple calculation
    const mathResult = await this.executor.executeCode(`
      const a = 10;
      const b = 20;
      const result = a + b;
      console.log('Result:', result);
      result;
    `, 'javascript');

    console.log('Math Result:', mathResult);

    // Working with arrays and functions
    const arrayResult = await this.executor.executeCode(`
      const numbers = [1, 2, 3, 4, 5];
      const doubled = numbers.map(n => n * 2);
      const sum = doubled.reduce((acc, n) => acc + n, 0);
      console.log('Doubled:', doubled);
      console.log('Sum:', sum);
      sum;
    `, 'javascript');

    console.log('Array Result:', arrayResult);

    // Error handling example
    const errorResult = await this.executor.executeCode(`
      try {
        throw new Error('This is a test error');
      } catch (error) {
        console.log('Caught error:', error.message);
        return 'Error handled successfully';
      }
    `, 'javascript');

    console.log('Error Handling Result:', errorResult);
  }

  /**
   * Execute TypeScript code examples
   */
  async demonstrateTypeScriptExecution() {
    console.log('=== TypeScript Execution Examples ===');

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
      console.log(greeting);
      greeting;
    `, 'typescript');

    console.log('TypeScript Result:', tsResult);
  }

  /**
   * Execute Python code examples (only works in Electron mode)
   */
  async demonstratePythonExecution() {
    console.log('=== Python Execution Examples ===');

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

    console.log('Python Result:', pythonResult);
  }

  /**
   * Execute shell commands (only works in Electron mode)
   */
  async demonstrateCommandExecution() {
    console.log('=== Command Execution Examples ===');

    // Simple echo command
    const echoResult = await this.executor.executeCommand('echo "Hello from shell!"');
    console.log('Echo Result:', echoResult);

    // List directory contents (safe command)
    const lsResult = await this.executor.executeCommand('ls -la');
    console.log('Directory Listing:', lsResult);

    // Dangerous command (should be blocked)
    const dangerousResult = await this.executor.executeCommand('rm -rf *');
    console.log('Dangerous Command Result:', dangerousResult);
  }

  /**
   * Demonstrate syntax validation
   */
  async demonstrateSyntaxValidation() {
    console.log('=== Syntax Validation Examples ===');

    // Valid JavaScript
    const validJS = await this.executor.validateSyntax(
      'const x = 10; console.log(x);', 
      'javascript'
    );
    console.log('Valid JavaScript:', validJS);

    // Invalid JavaScript
    const invalidJS = await this.executor.validateSyntax(
      'const x = 10 console.log(x);', // Missing semicolon
      'javascript'
    );
    console.log('Invalid JavaScript:', invalidJS);

    // Valid Python
    const validPython = await this.executor.validateSyntax(
      'def hello():\n    print("Hello World")',
      'python'
    );
    console.log('Valid Python:', validPython);

    // Valid TypeScript
    const validTS = await this.executor.validateSyntax(
      'interface User { name: string; } const user: User = { name: "John" };',
      'typescript'
    );
    console.log('Valid TypeScript:', validTS);
  }

  /**
   * Demonstrate security features
   */
  async demonstrateSecurityFeatures() {
    console.log('=== Security Features Examples ===');

    // Attempt to access file system (should be blocked)
    const fsAccessResult = await this.executor.executeCode(`
      const fs = require('fs');
      fs.readFileSync('/etc/passwd');
    `, 'javascript');
    console.log('File System Access Attempt:', fsAccessResult);

    // Attempt to spawn child process (should be blocked)
    const childProcessResult = await this.executor.executeCode(`
      const { exec } = require('child_process');
      exec('cat /etc/passwd');
    `, 'javascript');
    console.log('Child Process Attempt:', childProcessResult);

    // Safe code execution
    const safeResult = await this.executor.executeCode(`
      const data = [1, 2, 3, 4, 5];
      const processed = data.map(x => x * 2).filter(x => x > 5);
      console.log('Processed data:', processed);
      processed;
    `, 'javascript');
    console.log('Safe Code Execution:', safeResult);
  }

  /**
   * Demonstrate timeout and resource management
   */
  async demonstrateResourceManagement() {
    console.log('=== Resource Management Examples ===');

    // Fast execution
    const fastResult = await this.executor.executeCode(`
      const start = Date.now();
      let count = 0;
      for (let i = 0; i < 1000; i++) {
        count += i;
      }
      const end = Date.now();
      console.log(\`Processed \${count} in \${end - start}ms\`);
      count;
    `, 'javascript');
    console.log('Fast Execution:', fastResult);

    // Timeout example (this should timeout)
    const timeoutResult = await this.executor.executeCode(`
      console.log('Starting long operation...');
      while (true) {
        // Infinite loop - should timeout
      }
    `, 'javascript', { timeout: 2000 });
    console.log('Timeout Test:', timeoutResult);
  }

  /**
   * Demonstrate execution options
   */
  async demonstrateExecutionOptions() {
    console.log('=== Execution Options Examples ===');

    const options: ExecutionOptions = {
      timeout: 5000,
      environment: {
        NODE_ENV: 'test',
        DEBUG: 'true'
      }
    };

    const result = await this.executor.executeCode(`
      console.log('Environment:', process.env.NODE_ENV);
      console.log('Debug mode:', process.env.DEBUG);
      'Execution with custom options complete';
    `, 'javascript', options);

    console.log('Custom Options Result:', result);
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
      console.error('Error running examples:', error);
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