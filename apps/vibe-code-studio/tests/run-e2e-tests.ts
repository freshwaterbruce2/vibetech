/**
 * E2E Test Runner for AI Tab Completion
 * Runs Puppeteer-based tests independently from Vitest
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TestResult {
  testFile: string;
  passed: number;
  failed: number;
  duration: number;
  errors: string[];
}

class E2ETestRunner {
  private devServerUrl = 'http://localhost:3001';
  private devServerProcess: any = null;
  private results: TestResult[] = [];

  async run(): Promise<void> {
    console.log('🚀 Starting E2E Test Runner\n');

    try {
      // Step 1: Start dev server
      console.log('📦 Starting development server...');
      await this.startDevServer();

      // Step 2: Wait for server to be ready
      console.log('⏳ Waiting for server to be ready...');
      await this.waitForServer();

      // Step 3: Run tests
      console.log('🧪 Running E2E tests...\n');
      await this.runTests();

      // Step 4: Report results
      this.reportResults();

    } catch (error) {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    } finally {
      // Cleanup
      await this.stopDevServer();
    }
  }

  private async startDevServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.devServerProcess = spawn('pnpm', ['run', 'dev:web'], {
        cwd: join(__dirname, '..'),
        shell: true,
        stdio: 'pipe'
      });

      let serverReady = false;

      this.devServerProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        if (output.includes('Local:') && !serverReady) {
          serverReady = true;
          setTimeout(() => resolve(), 2000); // Wait 2s after server starts
        }
      });

      this.devServerProcess.stderr?.on('data', (data: Buffer) => {
        const error = data.toString();
        if (error.includes('EADDRINUSE')) {
          // Server already running, that's fine
          serverReady = true;
          resolve();
        }
      });

      this.devServerProcess.on('error', (error: Error) => {
        if (!serverReady) {
          reject(error);
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!serverReady) {
          reject(new Error('Dev server failed to start within 30 seconds'));
        }
      }, 30000);
    });
  }

  private async waitForServer(): Promise<void> {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(this.devServerUrl);
        if (response.ok) {
          console.log('✅ Server is ready\n');
          return;
        }
      } catch (error) {
        // Server not ready yet
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error('Server failed to respond within timeout');
  }

  private async runTests(): Promise<void> {
    // For now, just run the AI tab completion tests
    // In the future, this can be expanded to run multiple test files
    const testFiles = [
      'tests/ai-tab-completion.spec.ts'
    ];

    for (const testFile of testFiles) {
      console.log(`\n📝 Running: ${testFile}`);
      console.log('─'.repeat(60));

      try {
        await this.runTestFile(testFile);
      } catch (error) {
        console.error(`❌ Test file failed: ${testFile}`, error);
      }
    }
  }

  private async runTestFile(testFile: string): Promise<void> {
    // Import and run the test file
    // This is a placeholder - actual implementation would use a test framework
    console.log(`⚠️  Manual test execution required`);
    console.log(`   Run: npx ts-node ${testFile}`);
  }

  private async stopDevServer(): Promise<void> {
    if (this.devServerProcess) {
      console.log('\n🛑 Stopping dev server...');
      this.devServerProcess.kill();

      // Wait for process to exit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private reportResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(60));

    if (this.results.length === 0) {
      console.log('\n⚠️  No automated test execution yet');
      console.log('   Tests are ready to run manually with Puppeteer');
      console.log('\n✅ Test infrastructure setup complete!');
      console.log('\nNext steps:');
      console.log('  1. Ensure dev server is running: pnpm run dev:web');
      console.log('  2. Run tests manually for now');
      console.log('  3. Verify AI tab completion works');
    }

    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);

    if (this.results.length > 0) {
      console.log(`\n✅ Passed: ${totalPassed}`);
      console.log(`❌ Failed: ${totalFailed}`);
      console.log(`\nTotal: ${this.results.length} test files`);

      if (totalFailed > 0) {
        process.exit(1);
      }
    }
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new E2ETestRunner();
  runner.run().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { E2ETestRunner };
