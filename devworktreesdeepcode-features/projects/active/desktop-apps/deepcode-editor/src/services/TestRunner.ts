/**
 * TestRunner - Production-ready service for running tests and validating code quality
 * Supports Jest, Vitest, Mocha, and other popular test frameworks
 */

import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import { join, resolve, relative, dirname, basename, extname } from 'path';
import { existsSync } from 'fs';

// Enhanced interfaces for comprehensive test support
export interface TestResult {
  passed: boolean;
  testName: string;
  output: string;
  error?: string;
  duration: number;
  location?: {
    file: string;
    line?: number;
    column?: number;
  };
  assertions?: number;
  retries?: number;
}

export interface TestSuite {
  name: string;
  file?: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests?: number;
  todoTests?: number;
  duration: number;
  coverage?: CoverageInfo;
}

export interface CoverageInfo {
  lines: { covered: number; total: number; percentage: number };
  functions: { covered: number; total: number; percentage: number };
  branches: { covered: number; total: number; percentage: number };
  statements: { covered: number; total: number; percentage: number };
  files?: CoverageFileInfo[];
}

export interface CoverageFileInfo {
  file: string;
  lines: { covered: number; total: number; percentage: number };
  functions: { covered: number; total: number; percentage: number };
  branches: { covered: number; total: number; percentage: number };
  statements: { covered: number; total: number; percentage: number };
  uncoveredLines?: number[];
}

export interface TestFrameworkInfo {
  name: string;
  version?: string;
  configFile?: string;
  command: string;
  args: string[];
  patterns: string[];
  supports: {
    coverage: boolean;
    watch: boolean;
    filtering: boolean;
    bail: boolean;
    parallel: boolean;
  };
}

export interface TestRunnerOptions {
  testFramework?: 'jest' | 'vitest' | 'mocha' | 'cypress' | 'playwright' | 'auto';
  pattern?: string;
  verbose?: boolean;
  coverage?: boolean;
  timeout?: number;
  bail?: boolean;
  parallel?: boolean;
  watch?: boolean;
  maxWorkers?: number;
  reporter?: string;
  setupFiles?: string[];
  testMatch?: string[];
  testIgnore?: string[];
  env?: Record<string, string>;
  workingDirectory?: string;
}

export interface TestDiscoveryResult {
  framework: TestFrameworkInfo;
  testFiles: string[];
  totalTests: number;
  configFiles: string[];
}

export class TestRunner {
  private defaultFramework: string = 'auto';
  private defaultTimeout: number = 60000; // 1 minute
  private workspaceRoot: string;
  private logger: (message: string, level?: 'info' | 'warn' | 'error') => void;
  private frameworkCache: Map<string, TestFrameworkInfo> = new Map();
  private runningProcesses: Set<ChildProcess> = new Set();

  constructor(
    workspaceRoot?: string,
    framework?: string,
    logger?: (message: string, level?: 'info' | 'warn' | 'error') => void
  ) {
    this.workspaceRoot = workspaceRoot || process.cwd();
    this.logger = logger || this.defaultLogger;
    
    if (framework) {
      this.defaultFramework = framework;
    }

    // Cleanup processes on exit
    process.on('exit', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  private defaultLogger(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [TestRunner] [${level.toUpperCase()}]`;
    console.log(`${prefix} ${message}`);
  }

  private async cleanup(): Promise<void> {
    for (const process of this.runningProcesses) {
      try {
        process.kill('SIGTERM');
      } catch (error) {
        // Process might already be dead
      }
    }
    this.runningProcesses.clear();
  }

  /**
   * Detect available test frameworks in the project
   */
  async detectFrameworks(): Promise<TestFrameworkInfo[]> {
    const frameworks: TestFrameworkInfo[] = [];
    
    try {
      const packageJsonPath = join(this.workspaceRoot, 'package.json');
      
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        const allDeps = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies
        };

        // Detect Vitest
        if (allDeps.vitest) {
          const configFile = this.findConfigFile(['vitest.config.ts', 'vitest.config.js', 'vite.config.ts', 'vite.config.js']);
          frameworks.push({
            name: 'vitest',
            version: allDeps.vitest,
            configFile,
            command: 'npx',
            args: ['vitest'],
            patterns: ['**/*.{test,spec}.{js,ts,jsx,tsx}', '**/__tests__/**/*.{js,ts,jsx,tsx}'],
            supports: {
              coverage: true,
              watch: true,
              filtering: true,
              bail: true,
              parallel: true
            }
          });
        }

        // Detect Jest
        if (allDeps.jest || allDeps['@jest/core']) {
          const configFile = this.findConfigFile(['jest.config.js', 'jest.config.ts', 'jest.config.json']);
          frameworks.push({
            name: 'jest',
            version: allDeps.jest || allDeps['@jest/core'],
            configFile,
            command: 'npx',
            args: ['jest'],
            patterns: ['**/*.{test,spec}.{js,ts,jsx,tsx}', '**/__tests__/**/*.{js,ts,jsx,tsx}'],
            supports: {
              coverage: true,
              watch: true,
              filtering: true,
              bail: true,
              parallel: true
            }
          });
        }

        // Detect Mocha
        if (allDeps.mocha) {
          const configFile = this.findConfigFile(['.mocharc.json', '.mocharc.js', 'mocha.opts']);
          frameworks.push({
            name: 'mocha',
            version: allDeps.mocha,
            configFile,
            command: 'npx',
            args: ['mocha'],
            patterns: ['test/**/*.{js,ts}', '**/*.test.{js,ts}'],
            supports: {
              coverage: false, // Requires nyc
              watch: true,
              filtering: true,
              bail: true,
              parallel: false
            }
          });
        }

        // Detect Playwright
        if (allDeps['@playwright/test']) {
          const configFile = this.findConfigFile(['playwright.config.ts', 'playwright.config.js']);
          frameworks.push({
            name: 'playwright',
            version: allDeps['@playwright/test'],
            configFile,
            command: 'npx',
            args: ['playwright', 'test'],
            patterns: ['tests/**/*.{js,ts}', 'e2e/**/*.{js,ts}'],
            supports: {
              coverage: true,
              watch: false,
              filtering: true,
              bail: true,
              parallel: true
            }
          });
        }

        // Detect Cypress
        if (allDeps.cypress) {
          const configFile = this.findConfigFile(['cypress.config.ts', 'cypress.config.js', 'cypress.json']);
          frameworks.push({
            name: 'cypress',
            version: allDeps.cypress,
            configFile,
            command: 'npx',
            args: ['cypress', 'run'],
            patterns: ['cypress/e2e/**/*.{js,ts}', 'cypress/integration/**/*.{js,ts}'],
            supports: {
              coverage: true,
              watch: false,
              filtering: true,
              bail: false,
              parallel: false
            }
          });
        }
      }
    } catch (error) {
      this.logger(`Failed to detect frameworks: ${error instanceof Error ? error.message : 'Unknown error'}`, 'warn');
    }

    return frameworks;
  }

  private findConfigFile(possibleNames: string[]): string | undefined {
    for (const name of possibleNames) {
      const path = join(this.workspaceRoot, name);
      if (existsSync(path)) {
        return path;
      }
    }
    return undefined;
  }

  /**
   * Discover tests in the project
   */
  async discoverTests(options: TestRunnerOptions = {}): Promise<TestDiscoveryResult> {
    const frameworks = await this.detectFrameworks();
    const framework = await this.selectFramework(options.testFramework, frameworks);
    
    if (!framework) {
      throw new Error('No test framework detected. Please install jest, vitest, mocha, or another supported framework.');
    }

    const testFiles = await this.findTestFiles(framework.patterns, options.testMatch, options.testIgnore);
    const totalTests = await this.countTests(testFiles, framework);
    
    return {
      framework,
      testFiles,
      totalTests,
      configFiles: framework.configFile ? [framework.configFile] : []
    };
  }

  private async selectFramework(
    preferred?: string,
    available: TestFrameworkInfo[] = []
  ): Promise<TestFrameworkInfo | null> {
    if (preferred && preferred !== 'auto') {
      const framework = available.find(f => f.name === preferred);
      if (framework) {
        return framework;
      }
      this.logger(`Preferred framework '${preferred}' not found, falling back to auto-detection`, 'warn');
    }

    // Auto-select the best framework
    if (available.length === 0) {
      return null;
    }

    // Prioritize: Vitest > Jest > Playwright > Mocha > Cypress
    const priority = ['vitest', 'jest', 'playwright', 'mocha', 'cypress'];
    for (const name of priority) {
      const framework = available.find(f => f.name === name);
      if (framework) {
        return framework;
      }
    }

    return available[0];
  }

  private async findTestFiles(
    patterns: string[],
    testMatch?: string[],
    testIgnore?: string[]
  ): Promise<string[]> {
    const glob = await this.importGlob();
    const allPatterns = [...patterns, ...(testMatch || [])];
    const testFiles: string[] = [];

    for (const pattern of allPatterns) {
      try {
        const files = await glob(pattern, {
          cwd: this.workspaceRoot,
          absolute: true,
          ignore: testIgnore || ['**/node_modules/**']
        });
        testFiles.push(...files);
      } catch (error) {
        this.logger(`Failed to glob pattern '${pattern}': ${error}`, 'warn');
      }
    }

    return [...new Set(testFiles)]; // Remove duplicates
  }

  private async importGlob(): Promise<any> {
    try {
      // Try to import glob dynamically
      const { glob } = await import('glob');
      return glob;
    } catch (error) {
      // Fallback to a simple file finder
      return this.simpleGlob.bind(this);
    }
  }

  private async simpleGlob(
    pattern: string,
    options: { cwd: string; absolute: boolean; ignore?: string[] }
  ): Promise<string[]> {
    const files: string[] = [];
    
    const walkDir = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          const relativePath = relative(options.cwd, fullPath);
          
          // Check ignore patterns
          if (options.ignore?.some(ignore => relativePath.includes(ignore))) {
            continue;
          }
          
          if (entry.isDirectory()) {
            await walkDir(fullPath);
          } else if (entry.isFile()) {
            // Simple pattern matching
            if (this.matchesPattern(entry.name, pattern)) {
              files.push(options.absolute ? fullPath : relativePath);
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };
    
    await walkDir(options.cwd);
    return files;
  }

  private matchesPattern(filename: string, pattern: string): boolean {
    // Very basic pattern matching - just check for test/spec files
    const name = filename.toLowerCase();
    return name.includes('.test.') || name.includes('.spec.') || 
           name.includes('test') || name.includes('spec');
  }

  private async countTests(testFiles: string[], framework: TestFrameworkInfo): Promise<number> {
    let totalCount = 0;
    
    for (const file of testFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        // Simple regex to count test/it blocks
        const testMatches = content.match(/\b(test|it|describe)\s*\(/g) || [];
        totalCount += testMatches.length;
      } catch (error) {
        // Skip files we can't read
      }
    }
    
    return totalCount;
  }

  /**
   * Run tests for a specific file or pattern
   */
  async runTests(
    filePattern: string,
    options: TestRunnerOptions = {}
  ): Promise<TestSuite> {
    const startTime = Date.now();
    
    try {
      this.logger(`Running tests for pattern: ${filePattern}`);
      
      const discovery = await this.discoverTests(options);
      const framework = discovery.framework;
      
      // Filter test files by pattern
      const matchingFiles = discovery.testFiles.filter(file => 
        file.includes(filePattern) || relative(this.workspaceRoot, file).includes(filePattern)
      );
      
      if (matchingFiles.length === 0) {
        this.logger(`No test files found matching pattern: ${filePattern}`, 'warn');
        return {
          name: filePattern,
          tests: [],
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          duration: Date.now() - startTime
        };
      }
      
      const result = await this.executeTests(framework, matchingFiles, options);
      
      this.logger(`Test execution completed for ${filePattern}: ${result.passedTests}/${result.totalTests} passed`);
      
      return {
        ...result,
        name: filePattern,
        duration: Date.now() - startTime
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger(`Test execution failed: ${errorMessage}`, 'error');
      
      return {
        name: filePattern,
        tests: [{
          passed: false,
          testName: `Test execution for ${filePattern}`,
          output: '',
          error: errorMessage,
          duration
        }],
        totalTests: 1,
        passedTests: 0,
        failedTests: 1,
        duration
      };
    }
  }

  /**
   * Run all tests in the project
   */
  async runAllTests(options: TestRunnerOptions = {}): Promise<TestSuite[]> {
    const startTime = Date.now();
    
    try {
      this.logger('Running all tests in the project');
      
      const discovery = await this.discoverTests(options);
      const framework = discovery.framework;
      
      if (discovery.testFiles.length === 0) {
        this.logger('No test files found in the project', 'warn');
        return [{
          name: 'All Tests',
          tests: [],
          totalTests: 0,
          passedTests: 0,
          failedTests: 0,
          duration: Date.now() - startTime
        }];
      }
      
      const result = await this.executeTests(framework, discovery.testFiles, options);
      
      // Group results by test file if there are multiple files
      const suites: TestSuite[] = [];
      
      if (discovery.testFiles.length > 1) {
        // Group tests by file
        const testsByFile = new Map<string, TestResult[]>();
        
        for (const test of result.tests) {
          const file = test.location?.file || 'Unknown';
          if (!testsByFile.has(file)) {
            testsByFile.set(file, []);
          }
          testsByFile.get(file)!.push(test);
        }
        
        for (const [file, tests] of testsByFile) {
          suites.push({
            name: relative(this.workspaceRoot, file),
            file,
            tests,
            totalTests: tests.length,
            passedTests: tests.filter(t => t.passed).length,
            failedTests: tests.filter(t => !t.passed).length,
            duration: tests.reduce((sum, t) => sum + t.duration, 0)
          });
        }
      } else {
        suites.push({
          ...result,
          name: 'All Tests',
          duration: Date.now() - startTime
        });
      }
      
      const totalPassed = suites.reduce((sum, s) => sum + s.passedTests, 0);
      const totalTests = suites.reduce((sum, s) => sum + s.totalTests, 0);
      
      this.logger(`All tests completed: ${totalPassed}/${totalTests} passed`);
      
      return suites;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      this.logger(`Failed to run all tests: ${errorMessage}`, 'error');
      
      return [{
        name: 'All Tests',
        tests: [{
          passed: false,
          testName: 'Test Suite Execution',
          output: '',
          error: errorMessage,
          duration
        }],
        totalTests: 1,
        passedTests: 0,
        failedTests: 1,
        duration
      }];
    }
  }

  private async executeTests(
    framework: TestFrameworkInfo,
    testFiles: string[],
    options: TestRunnerOptions
  ): Promise<TestSuite> {
    return new Promise((resolve, reject) => {
      const args = [...framework.args];
      
      // Add test files
      args.push(...testFiles.map(f => relative(this.workspaceRoot, f)));
      
      // Add options
      if (options.coverage && framework.supports.coverage) {
        if (framework.name === 'vitest') {
          args.push('--coverage');
        } else if (framework.name === 'jest') {
          args.push('--coverage');
        }
      }
      
      if (options.verbose) {
        args.push('--verbose');
      }
      
      if (options.bail && framework.supports.bail) {
        if (framework.name === 'vitest') {
          args.push('--bail=1');
        } else if (framework.name === 'jest') {
          args.push('--bail');
        }
      }
      
      if (options.reporter) {
        args.push('--reporter', options.reporter);
      } else {
        // Use JSON reporter for parsing
        if (framework.name === 'vitest') {
          args.push('--reporter=json');
        } else if (framework.name === 'jest') {
          args.push('--json');
        }
      }
      
      if (options.maxWorkers && framework.supports.parallel) {
        args.push('--maxWorkers', options.maxWorkers.toString());
      }
      
      // Set timeout
      const timeout = options.timeout || this.defaultTimeout;
      if (framework.name === 'vitest') {
        args.push('--testTimeout', timeout.toString());
      } else if (framework.name === 'jest') {
        args.push('--testTimeout', timeout.toString());
      }
      
      this.logger(`Executing: ${framework.command} ${args.join(' ')}`);
      
      const child = spawn(framework.command, args, {
        cwd: options.workingDirectory || this.workspaceRoot,
        env: { 
          ...process.env, 
          ...options.env,
          CI: 'true' // Disable interactive features
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      this.runningProcesses.add(child);
      
      let stdout = '';
      let stderr = '';
      
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      const cleanupTimer = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Test execution timed out after ${timeout}ms`));
      }, timeout);
      
      child.on('close', (code) => {
        clearTimeout(cleanupTimer);
        this.runningProcesses.delete(child);
        
        try {
          const result = this.parseTestOutput(framework, stdout, stderr, code || 0);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      child.on('error', (error) => {
        clearTimeout(cleanupTimer);
        this.runningProcesses.delete(child);
        reject(new Error(`Failed to execute tests: ${error.message}`));
      });
    });
  }

  private parseTestOutput(
    framework: TestFrameworkInfo,
    stdout: string,
    stderr: string,
    exitCode: number
  ): TestSuite {
    const tests: TestResult[] = [];
    let coverage: CoverageInfo | undefined;
    
    try {
      if (framework.name === 'vitest' || framework.name === 'jest') {
        // Try to parse JSON output
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{')) {
            try {
              const result = JSON.parse(line);
              if (result.testResults || result.results) {
                const parsed = this.parseJestVitestJson(result);
                tests.push(...parsed.tests);
                if (parsed.coverage) {
                  coverage = parsed.coverage;
                }
              }
            } catch (e) {
              // Not JSON, try text parsing
            }
          }
        }
      }
      
      // Fallback to text parsing if JSON parsing failed
      if (tests.length === 0) {
        tests.push(...this.parseTextOutput(stdout, stderr, framework));
      }
      
    } catch (error) {
      this.logger(`Failed to parse test output: ${error}`, 'warn');
      
      // Create a single test result based on exit code
      tests.push({
        passed: exitCode === 0,
        testName: 'Test Execution',
        output: stdout,
        error: exitCode !== 0 ? stderr || 'Tests failed' : undefined,
        duration: 0
      });
    }
    
    return {
      name: 'Test Results',
      tests,
      totalTests: tests.length,
      passedTests: tests.filter(t => t.passed).length,
      failedTests: tests.filter(t => !t.passed).length,
      duration: tests.reduce((sum, t) => sum + t.duration, 0),
      coverage
    };
  }

  private parseJestVitestJson(result: any): { tests: TestResult[]; coverage?: CoverageInfo } {
    const tests: TestResult[] = [];
    let coverage: CoverageInfo | undefined;
    
    // Handle Jest format
    if (result.testResults) {
      for (const testResult of result.testResults) {
        const file = testResult.name;
        
        for (const assertionResult of testResult.assertionResults || []) {
          tests.push({
            passed: assertionResult.status === 'passed',
            testName: assertionResult.fullName || assertionResult.title,
            output: assertionResult.failureMessages?.join('\n') || '',
            error: assertionResult.status === 'failed' ? 
              assertionResult.failureMessages?.join('\n') : undefined,
            duration: assertionResult.duration || 0,
            location: {
              file,
              line: assertionResult.location?.line,
              column: assertionResult.location?.column
            }
          });
        }
      }
      
      // Parse coverage if available
      if (result.coverageMap) {
        coverage = this.parseCoverage(result.coverageMap);
      }
    }
    
    // Handle Vitest format
    if (result.results) {
      for (const suiteResult of result.results) {
        const file = suiteResult.file;
        
        const extractTests = (tasks: any[]): void => {
          for (const task of tasks) {
            if (task.type === 'test') {
              tests.push({
                passed: task.result?.state === 'pass',
                testName: task.name,
                output: task.result?.error?.message || '',
                error: task.result?.state === 'fail' ? 
                  task.result?.error?.message : undefined,
                duration: task.result?.duration || 0,
                location: {
                  file,
                  line: task.location?.line,
                  column: task.location?.column
                }
              });
            } else if (task.tasks) {
              extractTests(task.tasks);
            }
          }
        };
        
        if (suiteResult.tasks) {
          extractTests(suiteResult.tasks);
        }
      }
    }
    
    return { tests, coverage };
  }

  private parseTextOutput(stdout: string, stderr: string, framework: TestFrameworkInfo): TestResult[] {
    const tests: TestResult[] = [];
    const output = stdout + stderr;
    
    // Simple regex-based parsing for different frameworks
    if (framework.name === 'mocha') {
      // Parse Mocha output
      const testRegex = /\s*(✓|×|\d+\))\s+(.+?)(?:\s+\((\d+)ms\))?/g;
      let match;
      
      while ((match = testRegex.exec(output)) !== null) {
        const [, status, name, duration] = match;
        tests.push({
          passed: status === '✓' || /^\d+\)/.test(status),
          testName: name.trim(),
          output: '',
          duration: duration ? parseInt(duration) : 0
        });
      }
    } else {
      // Generic parsing - look for common test patterns
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.includes('PASS') || line.includes('✓')) {
          const testName = line.replace(/.*?(PASS|✓)\s*/, '').trim();
          if (testName) {
            tests.push({
              passed: true,
              testName,
              output: line,
              duration: 0
            });
          }
        } else if (line.includes('FAIL') || line.includes('×')) {
          const testName = line.replace(/.*?(FAIL|×)\s*/, '').trim();
          if (testName) {
            tests.push({
              passed: false,
              testName,
              output: line,
              error: 'Test failed',
              duration: 0
            });
          }
        }
      }
    }
    
    // If no tests found, create a summary result
    if (tests.length === 0) {
      const passed = !stderr && stdout.includes('pass');
      tests.push({
        passed,
        testName: 'Test Suite',
        output: stdout,
        error: passed ? undefined : stderr || 'Tests failed',
        duration: 0
      });
    }
    
    return tests;
  }

  private parseCoverage(coverageMap: any): CoverageInfo {
    // This is a simplified coverage parser
    // In a real implementation, you'd use istanbul/nyc coverage format
    const files: CoverageFileInfo[] = [];
    let totalLines = 0, coveredLines = 0;
    let totalFunctions = 0, coveredFunctions = 0;
    let totalBranches = 0, coveredBranches = 0;
    let totalStatements = 0, coveredStatements = 0;
    
    for (const [filePath, fileCoverage] of Object.entries(coverageMap || {})) {
      const fc = fileCoverage as any;
      
      if (fc.s && fc.f && fc.b) {
        const linesCov = Object.values(fc.s as Record<string, number>);
        const funcsCov = Object.values(fc.f as Record<string, number>);
        const branchesCov = Object.values(fc.b as Record<string, number[]>).flat();
        
        const fileCoveredLines = linesCov.filter(v => v > 0).length;
        const fileTotalLines = linesCov.length;
        const fileCoveredFunctions = funcsCov.filter(v => v > 0).length;
        const fileTotalFunctions = funcsCov.length;
        const fileCoveredBranches = branchesCov.filter(v => v > 0).length;
        const fileTotalBranches = branchesCov.length;
        
        files.push({
          file: filePath,
          lines: {
            covered: fileCoveredLines,
            total: fileTotalLines,
            percentage: fileTotalLines > 0 ? (fileCoveredLines / fileTotalLines) * 100 : 0
          },
          functions: {
            covered: fileCoveredFunctions,
            total: fileTotalFunctions,
            percentage: fileTotalFunctions > 0 ? (fileCoveredFunctions / fileTotalFunctions) * 100 : 0
          },
          branches: {
            covered: fileCoveredBranches,
            total: fileTotalBranches,
            percentage: fileTotalBranches > 0 ? (fileCoveredBranches / fileTotalBranches) * 100 : 0
          },
          statements: {
            covered: fileCoveredLines, // Simplified
            total: fileTotalLines,
            percentage: fileTotalLines > 0 ? (fileCoveredLines / fileTotalLines) * 100 : 0
          }
        });
        
        totalLines += fileTotalLines;
        coveredLines += fileCoveredLines;
        totalFunctions += fileTotalFunctions;
        coveredFunctions += fileCoveredFunctions;
        totalBranches += fileTotalBranches;
        coveredBranches += fileCoveredBranches;
        totalStatements += fileTotalLines;
        coveredStatements += fileCoveredLines;
      }
    }
    
    return {
      lines: {
        covered: coveredLines,
        total: totalLines,
        percentage: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0
      },
      functions: {
        covered: coveredFunctions,
        total: totalFunctions,
        percentage: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0
      },
      branches: {
        covered: coveredBranches,
        total: totalBranches,
        percentage: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0
      },
      statements: {
        covered: coveredStatements,
        total: totalStatements,
        percentage: totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0
      },
      files
    };
  }

  /**
   * Generate test for a given code snippet
   */
  async generateTest(
    code: string,
    filename: string,
    options: TestRunnerOptions = {}
  ): Promise<string> {
    try {
      const frameworks = await this.detectFrameworks();
      const framework = await this.selectFramework(options.testFramework, frameworks);
      
      if (!framework) {
        throw new Error('No test framework detected for test generation');
      }
      
      const ext = extname(filename);
      const baseName = basename(filename, ext);
      const isTypeScript = ext === '.ts' || ext === '.tsx';
      const isReact = ext === '.jsx' || ext === '.tsx';
      
      let template = '';
      
      if (framework.name === 'vitest') {
        template = this.generateVitestTemplate(code, baseName, isTypeScript, isReact);
      } else if (framework.name === 'jest') {
        template = this.generateJestTemplate(code, baseName, isTypeScript, isReact);
      } else if (framework.name === 'mocha') {
        template = this.generateMochaTemplate(code, baseName, isTypeScript);
      } else {
        // Generic template
        template = this.generateGenericTemplate(code, baseName, isTypeScript, isReact);
      }
      
      this.logger(`Generated test template for ${filename} using ${framework.name}`);
      return template;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger(`Failed to generate test: ${errorMessage}`, 'error');
      throw new Error(`Failed to generate test: ${errorMessage}`);
    }
  }

  private generateVitestTemplate(code: string, baseName: string, isTypeScript: boolean, isReact: boolean): string {
    const imports = [
      "import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';"
    ];
    
    if (isReact) {
      imports.push("import { render, screen, fireEvent, cleanup } from '@testing-library/react';");
      imports.push("import { userEvent } from '@testing-library/user-event';");
    }
    
    imports.push(`import { ${this.extractExports(code).join(', ')} } from './${baseName}';`);
    
    const tests = this.generateTestCases(code, baseName, isReact);
    
    return `${imports.join('\n')}\n\n${tests}`;
  }

  private generateJestTemplate(code: string, baseName: string, isTypeScript: boolean, isReact: boolean): string {
    const imports = [];
    
    if (isReact) {
      imports.push("import { render, screen, fireEvent, cleanup } from '@testing-library/react';");
      imports.push("import userEvent from '@testing-library/user-event';");
    }
    
    imports.push(`import { ${this.extractExports(code).join(', ')} } from './${baseName}';`);
    
    const tests = this.generateTestCases(code, baseName, isReact);
    
    return `${imports.join('\n')}\n\n${tests}`;
  }

  private generateMochaTemplate(code: string, baseName: string, isTypeScript: boolean): string {
    const imports = [
      "import { expect } from 'chai';",
      `import { ${this.extractExports(code).join(', ')} } from './${baseName}';`
    ];
    
    const tests = this.generateTestCases(code, baseName, false, 'mocha');
    
    return `${imports.join('\n')}\n\n${tests}`;
  }

  private generateGenericTemplate(code: string, baseName: string, isTypeScript: boolean, isReact: boolean): string {
    const imports = [
      `import { ${this.extractExports(code).join(', ')} } from './${baseName}';`
    ];
    
    const tests = this.generateTestCases(code, baseName, isReact);
    
    return `${imports.join('\n')}\n\n${tests}`;
  }

  private extractExports(code: string): string[] {
    const exports: string[] = [];
    
    // Extract named exports
    const namedExports = code.match(/export\s+(?:const|let|var|function|class)\s+(\w+)/g);
    if (namedExports) {
      exports.push(...namedExports.map(exp => exp.split(/\s+/).pop()!));
    }
    
    // Extract default export
    const defaultExport = code.match(/export\s+default\s+(\w+)/);
    if (defaultExport) {
      exports.push(defaultExport[1]);
    }
    
    // Extract export { ... } statements
    const exportStatements = code.match(/export\s*\{([^}]+)\}/g);
    if (exportStatements) {
      for (const statement of exportStatements) {
        const names = statement.match(/\{([^}]+)\}/)?.[1]
          .split(',')
          .map(name => name.trim().split(/\s+as\s+/)[0].trim());
        if (names) {
          exports.push(...names);
        }
      }
    }
    
    return exports.length > 0 ? exports : ['default'];
  }

  private generateTestCases(code: string, baseName: string, isReact: boolean, framework: string = 'vitest'): string {
    const functions = this.extractFunctions(code);
    const classes = this.extractClasses(code);
    const testFunction = framework === 'mocha' ? 'it' : 'it';
    
    let tests = `describe('${baseName}', () => {\n`;
    
    if (isReact) {
      tests += `  afterEach(() => {\n    cleanup();\n  });\n\n`;
    }
    
    // Generate tests for functions
    for (const func of functions) {
      tests += `  describe('${func}', () => {\n`;
      tests += `    ${testFunction}('should be defined', () => {\n`;
      tests += `      expect(${func}).toBeDefined();\n`;
      tests += `    });\n\n`;
      
      if (isReact && (func.includes('Component') || func[0] === func[0].toUpperCase())) {
        tests += `    ${testFunction}('should render without crashing', () => {\n`;
        tests += `      render(<${func} />);\n`;
        tests += `    });\n\n`;
      } else {
        tests += `    ${testFunction}('should work correctly', () => {\n`;
        tests += `      // TODO: Add test implementation\n`;
        tests += `      // const result = ${func}();\n`;
        tests += `      // expect(result).toBe(expected);\n`;
        tests += `    });\n\n`;
      }
      
      tests += `  });\n\n`;
    }
    
    // Generate tests for classes
    for (const cls of classes) {
      tests += `  describe('${cls}', () => {\n`;
      tests += `    ${testFunction}('should be instantiable', () => {\n`;
      tests += `      const instance = new ${cls}();\n`;
      tests += `      expect(instance).toBeInstanceOf(${cls});\n`;
      tests += `    });\n\n`;
      tests += `  });\n\n`;
    }
    
    // If no functions or classes found, generate a basic test
    if (functions.length === 0 && classes.length === 0) {
      tests += `  ${testFunction}('should be defined', () => {\n`;
      tests += `    expect(true).toBe(true);\n`;
      tests += `    // TODO: Add actual tests\n`;
      tests += `  });\n\n`;
    }
    
    tests += `});`;
    
    return tests;
  }

  private extractFunctions(code: string): string[] {
    const functions: string[] = [];
    
    // Extract function declarations
    const funcDeclarations = code.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/g);
    if (funcDeclarations) {
      functions.push(...funcDeclarations.map(func => func.split(/\s+/).pop()!));
    }
    
    // Extract arrow functions
    const arrowFunctions = code.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g);
    if (arrowFunctions) {
      functions.push(...arrowFunctions.map(func => func.split(/\s+/)[1]));
    }
    
    return functions;
  }

  private extractClasses(code: string): string[] {
    const classes: string[] = [];
    
    const classDeclarations = code.match(/(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/g);
    if (classDeclarations) {
      classes.push(...classDeclarations.map(cls => cls.split(/\s+/).pop()!));
    }
    
    return classes;
  }

  /**
   * Get test coverage for the project or specific files
   */
  async getCoverage(filePattern?: string): Promise<CoverageInfo> {
    try {
      this.logger('Getting test coverage information');
      
      const frameworks = await this.detectFrameworks();
      const framework = frameworks.find(f => f.supports.coverage);
      
      if (!framework) {
        this.logger('No framework found that supports coverage', 'warn');
        return this.getDefaultCoverage();
      }
      
      // Run tests with coverage
      const options: TestRunnerOptions = {
        coverage: true,
        testFramework: framework.name as any
      };
      
      let result: TestSuite;
      if (filePattern) {
        result = await this.runTests(filePattern, options);
      } else {
        const suites = await this.runAllTests(options);
        result = this.combineSuites(suites);
      }
      
      return result.coverage || this.getDefaultCoverage();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger(`Failed to get coverage: ${errorMessage}`, 'error');
      throw new Error(`Failed to get coverage: ${errorMessage}`);
    }
  }

  private getDefaultCoverage(): CoverageInfo {
    return {
      lines: { covered: 0, total: 0, percentage: 0 },
      functions: { covered: 0, total: 0, percentage: 0 },
      branches: { covered: 0, total: 0, percentage: 0 },
      statements: { covered: 0, total: 0, percentage: 0 }
    };
  }

  private combineSuites(suites: TestSuite[]): TestSuite {
    const allTests = suites.flatMap(s => s.tests);
    const totalDuration = suites.reduce((sum, s) => sum + s.duration, 0);
    
    return {
      name: 'Combined Results',
      tests: allTests,
      totalTests: allTests.length,
      passedTests: allTests.filter(t => t.passed).length,
      failedTests: allTests.filter(t => !t.passed).length,
      duration: totalDuration,
      coverage: suites.find(s => s.coverage)?.coverage
    };
  }

  /**
   * Watch tests for changes
   */
  async watchTests(options: TestRunnerOptions = {}): Promise<() => void> {
    const frameworks = await this.detectFrameworks();
    const framework = await this.selectFramework(options.testFramework, frameworks);
    
    if (!framework || !framework.supports.watch) {
      throw new Error('Selected framework does not support watch mode');
    }
    
    this.logger('Starting test watch mode');
    
    const args = [...framework.args, '--watch'];
    
    const child = spawn(framework.command, args, {
      cwd: options.workingDirectory || this.workspaceRoot,
      env: { ...process.env, ...options.env },
      stdio: 'inherit'
    });
    
    this.runningProcesses.add(child);
    
    return () => {
      child.kill('SIGTERM');
      this.runningProcesses.delete(child);
      this.logger('Stopped test watch mode');
    };
  }

  /**
   * Set default test framework
   */
  setDefaultFramework(framework: string): void {
    this.defaultFramework = framework;
    this.logger(`Default framework set to: ${framework}`);
  }

  /**
   * Get current default framework
   */
  getDefaultFramework(): string {
    return this.defaultFramework;
  }

  /**
   * Get workspace root path
   */
  getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  /**
   * Set workspace root path
   */
  setWorkspaceRoot(path: string): void {
    this.workspaceRoot = resolve(path);
    this.logger(`Workspace root set to: ${this.workspaceRoot}`);
  }
}