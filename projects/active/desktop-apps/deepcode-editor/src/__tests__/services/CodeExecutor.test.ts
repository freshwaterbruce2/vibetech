/**
 * Test cases for CodeExecutor service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CodeExecutor, type ExecutionResult, type SecurityPolicy } from '../../services/CodeExecutor';

// Mock ElectronService
vi.mock('../../services/ElectronService', () => {
  return {
    ElectronService: vi.fn().mockImplementation(() => ({
      isElectron: () => false,
      invoke: vi.fn().mockResolvedValue({
        success: true,
        output: 'Mocked execution result',
        executionTime: 100,
        exitCode: 0
      })
    }))
  };
});

describe('CodeExecutor', () => {
  let codeExecutor: CodeExecutor;

  beforeEach(() => {
    codeExecutor = new CodeExecutor();
  });

  describe('Initialization', () => {
    it('should initialize with default timeout', () => {
      expect(codeExecutor.getDefaultTimeout()).toBe(30000);
    });

    it('should initialize with custom timeout', () => {
      const customExecutor = new CodeExecutor(5000);
      expect(customExecutor.getDefaultTimeout()).toBe(5000);
    });

    it('should initialize with custom security policy', () => {
      const customPolicy: Partial<SecurityPolicy> = {
        allowNetworkAccess: true,
        maxExecutionTime: 60000
      };
      const customExecutor = new CodeExecutor(undefined, customPolicy);
      const policy = customExecutor.getSecurityPolicy();
      
      expect(policy.allowNetworkAccess).toBe(true);
      expect(policy.maxExecutionTime).toBe(60000);
    });
  });

  describe('Security Validation', () => {
    it('should block dangerous commands', async () => {
      const result = await codeExecutor.executeCommand('rm -rf /');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Security violation');
    });

    it('should block dangerous code patterns', async () => {
      const dangerousCode = 'require("fs").unlinkSync("/important-file")';
      const result = await codeExecutor.executeCode(dangerousCode, 'javascript');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Security violation');
    });

    it('should allow safe commands', async () => {
      // This will fail in browser mode but should pass security validation
      const result = await codeExecutor.executeCommand('echo "Hello World"');
      
      // In browser mode, it should fail with browser mode message, not security error
      expect(result.error).not.toContain('Security violation');
    });
  });

  describe('Syntax Validation', () => {
    it('should validate JavaScript syntax correctly', async () => {
      const validCode = 'console.log("Hello World");';
      const validation = await codeExecutor.validateSyntax(validCode, 'javascript');
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect JavaScript syntax errors', async () => {
      const invalidCode = 'console.log("Hello World"';
      const validation = await codeExecutor.validateSyntax(invalidCode, 'javascript');
      
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should validate TypeScript syntax', async () => {
      const tsCode = 'const message: string = "Hello World";';
      const validation = await codeExecutor.validateSyntax(tsCode, 'typescript');
      
      expect(validation.valid).toBe(true);
    });

    it('should validate Python syntax', async () => {
      const pythonCode = 'print("Hello World")';
      const validation = await codeExecutor.validateSyntax(pythonCode, 'python');
      
      expect(validation.valid).toBe(true);
    });

    it('should validate Bash syntax', async () => {
      const bashCode = 'echo "Hello World"';
      const validation = await codeExecutor.validateSyntax(bashCode, 'bash');
      
      expect(validation.valid).toBe(true);
    });
  });

  describe('Code Execution in Browser Mode', () => {
    it('should execute safe JavaScript code', async () => {
      const code = 'const result = 2 + 2; result;';
      const result = await codeExecutor.executeCode(code, 'javascript');
      
      // In browser mode, basic JavaScript execution should work
      expect(result.success).toBe(true);
    });

    it('should handle JavaScript execution errors', async () => {
      const code = 'throw new Error("Test error");';
      const result = await codeExecutor.executeCode(code, 'javascript');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Test error');
    });

    it('should enforce execution timeout', async () => {
      const code = 'while(true) {}'; // Infinite loop
      const result = await codeExecutor.executeCode(code, 'javascript', { timeout: 1000 });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    });

    it('should not execute non-JavaScript languages in browser mode', async () => {
      const pythonCode = 'print("Hello World")';
      const result = await codeExecutor.executeCode(pythonCode, 'python');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not supported in browser mode');
    });
  });

  describe('Security Policy Management', () => {
    it('should update security policy', () => {
      const newPolicy: Partial<SecurityPolicy> = {
        allowNetworkAccess: true,
        maxExecutionTime: 60000
      };
      
      codeExecutor.updateSecurityPolicy(newPolicy);
      const policy = codeExecutor.getSecurityPolicy();
      
      expect(policy.allowNetworkAccess).toBe(true);
      expect(policy.maxExecutionTime).toBe(60000);
    });

    it('should respect timeout limits from security policy', () => {
      codeExecutor.updateSecurityPolicy({ maxExecutionTime: 10000 });
      codeExecutor.setDefaultTimeout(20000);
      
      // Should be capped at security policy limit
      expect(codeExecutor.getDefaultTimeout()).toBe(10000);
    });
  });

  describe('Language Support', () => {
    it('should return list of supported languages', () => {
      const languages = codeExecutor.getSupportedLanguages();
      
      expect(languages).toContain('javascript');
      expect(languages).toContain('typescript');
      expect(languages).toContain('python');
      expect(languages).toContain('bash');
      expect(languages).toContain('node');
      expect(languages).toContain('deno');
      expect(languages).toContain('bun');
    });
  });

  describe('Error Handling', () => {
    it('should handle execution errors gracefully', async () => {
      const result = await codeExecutor.executeCommand('nonexistent-command');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should return proper execution time', async () => {
      const result = await codeExecutor.executeCode('console.log("test");', 'javascript');
      
      expect(result.executionTime).toBeGreaterThan(0);
    });
  });
});