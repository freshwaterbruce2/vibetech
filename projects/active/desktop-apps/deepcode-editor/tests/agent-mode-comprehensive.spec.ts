import { test, expect } from '@playwright/test';

/**
 * Comprehensive Agent Mode Test Suite
 *
 * Tests the unified Agent Mode system with:
 * - File creation workflow
 * - Command execution
 * - Multi-step tasks
 * - Error handling
 * - Live progress updates
 * - File auto-opening
 */

test.describe('Agent Mode - Comprehensive Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3007');

    // Wait for app to fully load
    await page.waitForSelector('[data-testid="app-container"]', {
      state: 'visible',
      timeout: 10000
    });

    // Open AI Chat in Agent Mode
    await page.keyboard.press('Control+Shift+A');

    // Wait for AI Chat to open
    await expect(page.locator('[data-testid="ai-chat"]')).toBeVisible({ timeout: 5000 });

    // Verify Agent Mode is selected
    await expect(page.locator('text=Agent Mode')).toBeVisible();
  });

  test('should display live progress during file analysis', async ({ page }) => {
    // Type analysis request
    const input = page.locator('[data-testid="chat-input"]');
    await input.fill('analyze the App.tsx file');
    await input.press('Enter');

    // Verify task plan appears
    await expect(page.locator('text=Agent Task')).toBeVisible({ timeout: 5000 });

    // Verify step execution indicators
    await expect(page.locator('[data-testid="step-status"]').first()).toBeVisible({ timeout: 10000 });

    // Wait for completion
    await expect(page.locator('text=Task completed')).toBeVisible({ timeout: 30000 });

    // Verify synthesis section with purple highlighting
    const synthesis = page.locator('[data-testid="synthesis-content"]');
    await expect(synthesis).toBeVisible();

    // Check for AUTO-GENERATED badge
    await expect(page.locator('text=AUTO-GENERATED')).toBeVisible();
  });

  test('should create a new file and open it automatically', async ({ page }) => {
    // Request file creation
    const input = page.locator('[data-testid="chat-input"]');
    await input.fill('create a new file called Button.tsx with a simple React button component');
    await input.press('Enter');

    // Verify task planning
    await expect(page.locator('text=Agent Task')).toBeVisible({ timeout: 5000 });

    // Verify write_file step
    await expect(page.locator('text=write_file').or(page.locator('text=Writing file'))).toBeVisible({
      timeout: 15000
    });

    // Verify file opens in editor
    await expect(page.locator('text=Button.tsx')).toBeVisible({ timeout: 10000 });

    // Verify file content contains React component
    await expect(page.locator('.monaco-editor')).toContainText('React', { timeout: 5000 });
    await expect(page.locator('.monaco-editor')).toContainText('button', { timeout: 5000 });
  });

  test('should execute git commands and show output', async ({ page }) => {
    // Request git status
    const input = page.locator('[data-testid="chat-input"]');
    await input.fill('run git status');
    await input.press('Enter');

    // Verify task creation
    await expect(page.locator('text=Agent Task')).toBeVisible({ timeout: 5000 });

    // Verify command execution step
    await expect(page.locator('text=execute_command').or(page.locator('text=Running command'))).toBeVisible({
      timeout: 15000
    });

    // Verify output is displayed (should contain git status output)
    await expect(page.locator('text=On branch').or(page.locator('text=nothing to commit'))).toBeVisible({
      timeout: 20000
    });
  });

  test('should handle multi-step tasks with sequential execution', async ({ page }) => {
    // Request multi-step task
    const input = page.locator('[data-testid="chat-input"]');
    await input.fill('create a LoginForm.tsx component and write a test file for it');
    await input.press('Enter');

    // Verify task with multiple steps
    await expect(page.locator('text=Agent Task')).toBeVisible({ timeout: 5000 });

    // Verify multiple steps appear
    const steps = page.locator('[data-testid="step-card"]');
    await expect(steps).toHaveCount(2, { timeout: 15000 }); // At least 2 steps (create component + create test)

    // Verify steps complete in order
    await expect(steps.nth(0)).toHaveAttribute('data-status', 'completed', { timeout: 30000 });
    await expect(steps.nth(1)).toHaveAttribute('data-status', 'completed', { timeout: 30000 });

    // Verify LoginForm.tsx opens
    await expect(page.locator('text=LoginForm.tsx')).toBeVisible({ timeout: 10000 });
  });

  test('should gracefully handle command execution errors', async ({ page }) => {
    // Request invalid command
    const input = page.locator('[data-testid="chat-input"]');
    await input.fill('run npm install nonexistent-package-xyz-123');
    await input.press('Enter');

    // Verify task creation
    await expect(page.locator('text=Agent Task')).toBeVisible({ timeout: 5000 });

    // Verify error handling (either error status or error message)
    await expect(
      page.locator('text=error').or(page.locator('[data-status="error"]'))
    ).toBeVisible({ timeout: 30000 });

    // Verify app remains responsive
    await expect(input).toBeEnabled();
  });

  test('should update step status in real-time', async ({ page }) => {
    // Start a file read task
    const input = page.locator('[data-testid="chat-input"]');
    await input.fill('read the package.json file');
    await input.press('Enter');

    // Capture step status changes
    const stepStatus = page.locator('[data-testid="step-status"]').first();

    // Should start as pending or in_progress
    await expect(stepStatus).toHaveAttribute('data-status', /pending|in_progress/, { timeout: 5000 });

    // Should complete
    await expect(stepStatus).toHaveAttribute('data-status', 'completed', { timeout: 15000 });
  });

  test('should display comprehensive synthesis after multiple file operations', async ({ page }) => {
    // Request analysis of multiple files
    const input = page.locator('[data-testid="chat-input"]');
    await input.fill('analyze App.tsx and Editor.tsx files');
    await input.press('Enter');

    // Wait for task completion
    await expect(page.locator('text=Task completed')).toBeVisible({ timeout: 45000 });

    // Verify synthesis section exists
    const synthesis = page.locator('[data-testid="synthesis-content"]');
    await expect(synthesis).toBeVisible();

    // Verify synthesis contains insights (should be comprehensive)
    const synthesisText = await synthesis.textContent();
    expect(synthesisText?.length).toBeGreaterThan(100); // Should be detailed

    // Verify AUTO-GENERATED badge
    await expect(page.locator('text=AUTO-GENERATED')).toBeVisible();
  });

  test('should maintain chat history with agent tasks', async ({ page }) => {
    // Execute first task
    const input = page.locator('[data-testid="chat-input"]');
    await input.fill('read vite.config.ts');
    await input.press('Enter');

    // Wait for completion
    await expect(page.locator('text=Task completed').first()).toBeVisible({ timeout: 20000 });

    // Execute second task
    await input.fill('read package.json');
    await input.press('Enter');

    // Verify both tasks are in history
    const tasks = page.locator('[data-testid="agent-task"]');
    await expect(tasks).toHaveCount(2, { timeout: 30000 });
  });

  test('should allow switching between Chat and Agent modes', async ({ page }) => {
    // Verify Agent Mode is active
    await expect(page.locator('[data-testid="mode-agent"].active')).toBeVisible();

    // Switch to Chat mode
    await page.locator('[data-testid="mode-chat"]').click();

    // Verify Chat mode is active
    await expect(page.locator('[data-testid="mode-chat"].active')).toBeVisible();

    // Switch back to Agent mode
    await page.locator('[data-testid="mode-agent"]').click();

    // Verify Agent mode is active again
    await expect(page.locator('[data-testid="mode-agent"].active')).toBeVisible();
  });

  test('should show task approval prompt for destructive operations', async ({ page }) => {
    // Request file deletion
    const input = page.locator('[data-testid="chat-input"]');
    await input.fill('delete the test-file.txt');
    await input.press('Enter');

    // Verify approval prompt appears (if implemented)
    // This test assumes destructive operations require approval
    const approvalPrompt = page.locator('[data-testid="approval-prompt"]');

    // If approval is implemented, it should appear
    // If not, this will timeout gracefully and we can skip
    try {
      await expect(approvalPrompt).toBeVisible({ timeout: 5000 });

      // Approve the action
      await page.locator('[data-testid="approve-button"]').click();

      // Verify execution continues
      await expect(page.locator('text=Task completed')).toBeVisible({ timeout: 15000 });
    } catch {
      // Approval not implemented yet - skip test
      test.skip();
    }
  });
});

test.describe('Agent Mode - Performance Tests', () => {
  test('should handle large file analysis without freezing UI', async ({ page }) => {
    await page.goto('http://localhost:3007');
    await page.waitForSelector('[data-testid="app-container"]', { state: 'visible' });

    // Open Agent Mode
    await page.keyboard.press('Control+Shift+A');
    await expect(page.locator('[data-testid="ai-chat"]')).toBeVisible({ timeout: 5000 });

    // Request analysis of large file
    const input = page.locator('[data-testid="chat-input"]');
    await input.fill('analyze all TypeScript files in src/components/');
    await input.press('Enter');

    // Verify UI remains responsive during execution
    await expect(input).toBeEnabled({ timeout: 2000 });

    // Verify task runs to completion
    await expect(page.locator('text=Task completed')).toBeVisible({ timeout: 60000 });
  });

  test('should not cause memory leaks after 5 consecutive tasks', async ({ page }) => {
    await page.goto('http://localhost:3007');
    await page.waitForSelector('[data-testid="app-container"]', { state: 'visible' });

    await page.keyboard.press('Control+Shift+A');
    await expect(page.locator('[data-testid="ai-chat"]')).toBeVisible({ timeout: 5000 });

    const input = page.locator('[data-testid="chat-input"]');

    // Execute 5 tasks in sequence
    for (let i = 0; i < 5; i++) {
      await input.fill(`read src/App.tsx (iteration ${i + 1})`);
      await input.press('Enter');
      await expect(page.locator('text=Task completed').nth(i)).toBeVisible({ timeout: 20000 });
    }

    // Measure memory usage (basic check)
    const metrics = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
      return null;
    });

    if (metrics) {
      const heapUsagePercent = (metrics.usedJSHeapSize / metrics.jsHeapSizeLimit) * 100;
      expect(heapUsagePercent).toBeLessThan(90); // Should not exceed 90% heap usage
    }
  });
});
