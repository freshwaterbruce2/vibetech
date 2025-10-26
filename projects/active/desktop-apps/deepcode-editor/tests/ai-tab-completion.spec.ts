/**
 * AI Tab Completion E2E Tests (Playwright)
 * Verifies that inline AI completions work correctly in Monaco Editor
 *
 * Converted from Puppeteer to Playwright for Windows 11 compatibility
 */

import { test, expect, type Page } from '@playwright/test';
import {
  waitForMonacoReady,
  typeInMonaco,
  getMonacoContent,
  clearMonacoContent,
  setMonacoContent,
  waitForGhostText,
  isGhostTextVisible,
  acceptCompletion,
  dismissCompletion,
  setupConsoleCapture,
  getConsoleLogs,
  waitForProviderRegistered,
  isStreamingDisabled,
  waitForNonStreamingPath,
  waitForAIServiceCall
} from './helpers/monaco-helpers';
import {
  setupDeepSeekMock,
  setupContextualMock,
  clearMocks,
  MOCK_FUNCTION_COMPLETION
} from './mocks/deepseek-mock';

test.describe('AI Tab Completion', () => {
  test.beforeEach(async ({ page }) => {
    await setupConsoleCapture(page);

    // Navigate to app (uses baseURL from playwright.config.ts)
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for Monaco to be ready
    await waitForMonacoReady(page);
  });

  test.afterEach(async ({ page }) => {
    await clearMocks(page);
  });

  test.describe('Provider Initialization', () => {
    test('should initialize inline completion provider', async ({ page }) => {
      const registered = await waitForProviderRegistered(page, 10000);
      expect(registered).toBe(true);
    });

    test('should disable streaming mode by default', async ({ page }) => {
      await waitForProviderRegistered(page);
      const streamingDisabled = await isStreamingDisabled(page);
      expect(streamingDisabled).toBe(true);
    });

    test('should show activation message', async ({ page }) => {
      const logs = await getConsoleLogs(page);
      const hasActivationMessage = logs.some(log =>
        log.includes('AI Tab Completion activated')
      );
      expect(hasActivationMessage).toBe(true);
    });

    test('should disable demo mode when API key exists', async ({ page }) => {
      const logs = await getConsoleLogs(page);
      const demoModeDisabled = logs.some(log =>
        log.includes('demo mode disabled') || log.includes('isDemoMode: false')
      );
      expect(demoModeDisabled).toBe(true);
    });
  });

  test.describe('Completion Triggering', () => {
    test('should trigger provider on keystroke', async ({ page }) => {
      await setupDeepSeekMock(page);

      await typeInMonaco(page, 'function', 100);

      const logs = await getConsoleLogs(page);
      const providerTriggered = logs.some(log =>
        log.includes('[COMPLETION] Provider triggered')
      );
      expect(providerTriggered).toBe(true);
    });

    test('should use non-streaming path', async ({ page }) => {
      await setupDeepSeekMock(page);

      await typeInMonaco(page, 'function calculate(a, b) {', 100);

      // Wait for debounce (200ms) + some buffer
      await page.waitForTimeout(500);

      const usedNonStreaming = await waitForNonStreamingPath(page, 5000);
      expect(usedNonStreaming).toBe(true);
    });

    test('should call AI service after debounce', async ({ page }) => {
      await setupDeepSeekMock(page);

      await typeInMonaco(page, 'function sum(a, b) {', 100);

      // Wait for debounce timer
      await page.waitForTimeout(500);

      const aiServiceCalled = await waitForAIServiceCall(page, 5000);
      expect(aiServiceCalled).toBe(true);
    });

    test('should not trigger on empty line', async ({ page }) => {
      await setupDeepSeekMock(page);

      // Type spaces only
      await typeInMonaco(page, '   ', 100);

      await page.waitForTimeout(500);

      const logs = await getConsoleLogs(page);
      const exitedEarly = logs.some(log =>
        log.includes('EXITING EARLY - currentLine is empty')
      );

      // Should exit early for empty line
      expect(exitedEarly).toBe(true);
    });
  });

  test.describe('Ghost Text Display', () => {
    test('should show ghost text after typing function', async ({ page }) => {
      await setupContextualMock(page);

      await clearMonacoContent(page);
      await typeInMonaco(page, 'function calculate(a, b) {', 150);

      // Wait for debounce + API response
      await page.waitForTimeout(800);

      const hasGhostText = await waitForGhostText(page, 5000);
      expect(hasGhostText).toBe(true);
    });

    test('should show contextually relevant completion', async ({ page }) => {
      await setupDeepSeekMock(page, {
        completionText: MOCK_FUNCTION_COMPLETION
      });

      await clearMonacoContent(page);
      await typeInMonaco(page, 'function sum(a, b) {', 150);

      await page.waitForTimeout(1000);

      const isVisible = await isGhostTextVisible(page);
      expect(isVisible).toBe(true);
    });

    test('should update ghost text as user continues typing', async ({ page }) => {
      await setupContextualMock(page);

      await clearMonacoContent(page);
      await typeInMonaco(page, 'const add = (a, b)', 150);

      await page.waitForTimeout(500);

      // Continue typing
      await typeInMonaco(page, ' =>', 150);

      await page.waitForTimeout(800);

      const hasGhostText = await waitForGhostText(page, 5000);
      expect(hasGhostText).toBe(true);
    });
  });

  test.describe('Completion Acceptance', () => {
    test('should accept completion with Tab key', async ({ page }) => {
      await setupDeepSeekMock(page, {
        completionText: '  return a + b;\n}'
      });

      await clearMonacoContent(page);
      await typeInMonaco(page, 'function sum(a, b) {', 150);

      // Wait for ghost text
      await page.waitForTimeout(1000);
      const hasGhostText = await waitForGhostText(page, 5000);
      expect(hasGhostText).toBe(true);

      // Accept with Tab
      await acceptCompletion(page);

      // Wait for completion to be inserted
      await page.waitForTimeout(300);

      // Check content includes the completion
      const content = await getMonacoContent(page);
      expect(content).toContain('return a + b');
    });

    test('should dismiss completion with Escape key', async ({ page }) => {
      await setupDeepSeekMock(page);

      await clearMonacoContent(page);
      await typeInMonaco(page, 'function test() {', 150);

      // Wait for ghost text
      await page.waitForTimeout(1000);
      const hasGhostText = await waitForGhostText(page, 5000);

      if (hasGhostText) {
        // Dismiss with Escape
        await dismissCompletion(page);

        await page.waitForTimeout(200);

        // Ghost text should be gone
        const stillVisible = await isGhostTextVisible(page);
        expect(stillVisible).toBe(false);
      }
    });
  });

  test.describe('Caching', () => {
    test('should cache completions for identical context', async ({ page }) => {
      await setupDeepSeekMock(page);

      await clearMonacoContent(page);
      await typeInMonaco(page, 'function test() {', 150);

      // Wait for first completion
      await page.waitForTimeout(1000);

      const logsBeforeClear = await getConsoleLogs(page);
      const firstFetchCount = logsBeforeClear.filter(log =>
        log.includes('[COMPLETION] Fetching AI completion')
      ).length;

      // Clear and type same thing
      await clearMonacoContent(page);
      await typeInMonaco(page, 'function test() {', 150);

      await page.waitForTimeout(1000);

      const logsAfter = await getConsoleLogs(page);
      const cacheHit = logsAfter.some(log =>
        log.includes('[COMPLETION] Cache HIT')
      );

      // Should use cache on second attempt
      expect(cacheHit).toBe(true);
    });
  });

  test.describe('Debouncing', () => {
    test('should debounce rapid typing', async ({ page }) => {
      await setupDeepSeekMock(page);

      await clearMonacoContent(page);

      // Type rapidly without pauses
      await typeInMonaco(page, 'function rapidTyping', 50);

      const logsBeforePause = await getConsoleLogs(page);
      const fetchCountBefore = logsBeforePause.filter(log =>
        log.includes('[COMPLETION] Debounce timer fired')
      ).length;

      // Should have cleared timer multiple times
      const timerClears = logsBeforePause.filter(log =>
        log.includes('[COMPLETION] Cleared previous debounce timer')
      ).length;

      expect(timerClears).toBeGreaterThan(0);

      // Now pause and wait
      await page.waitForTimeout(500);

      const logsAfter = await getConsoleLogs(page);
      const fetchCountAfter = logsAfter.filter(log =>
        log.includes('[COMPLETION] Debounce timer fired')
      ).length;

      // Should have fired only once after pause
      expect(fetchCountAfter).toBe(fetchCountBefore + 1);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      await setupDeepSeekMock(page, {
        shouldFail: true,
        errorMessage: 'Rate limit exceeded'
      });

      await clearMonacoContent(page);
      await typeInMonaco(page, 'function handleError() {', 150);

      // Wait for completion attempt
      await page.waitForTimeout(1000);

      const logs = await getConsoleLogs(page);
      const hasError = logs.some(log =>
        log.includes('[ERROR]') || log.includes('Rate limit')
      );

      // Should log error but not crash
      expect(hasError).toBe(true);

      // Page should still be functional
      const isMonacoReady = await page.evaluate(() => {
        return window.monaco && window.monaco.editor.getModels().length > 0;
      });
      expect(isMonacoReady).toBe(true);
    });

    test('should continue working after network failure', async ({ page }) => {
      await setupDeepSeekMock(page, { shouldFail: true });

      await clearMonacoContent(page);
      await typeInMonaco(page, 'function failFirst() {', 150);

      await page.waitForTimeout(1000);

      // Now fix the mock
      await clearMocks(page);
      await setupDeepSeekMock(page);

      await clearMonacoContent(page);
      await typeInMonaco(page, 'function succeedNext() {', 150);

      await page.waitForTimeout(1000);

      const hasGhostText = await waitForGhostText(page, 5000);
      expect(hasGhostText).toBe(true);
    });
  });

  test.describe('Settings Integration', () => {
    test('should respect completion enabled/disabled setting', async ({ page }) => {
      await setupDeepSeekMock(page);

      // Disable completions via settings
      await page.evaluate(() => {
        const event = new CustomEvent('ai-completion-toggle', {
          detail: { enabled: false }
        });
        window.dispatchEvent(event);
      });

      await page.waitForTimeout(200);

      await clearMonacoContent(page);
      await typeInMonaco(page, 'function disabled() {', 150);

      await page.waitForTimeout(1000);

      // Should not show ghost text when disabled
      const hasGhostText = await waitForGhostText(page, 2000);
      expect(hasGhostText).toBe(false);
    });
  });

  test.describe('Multiple File Types', () => {
    test('should work with JavaScript files', async ({ page }) => {
      await setupContextualMock(page);

      await clearMonacoContent(page);
      await typeInMonaco(page, 'const myFunc = () =>', 150);

      await page.waitForTimeout(1000);

      const hasGhostText = await waitForGhostText(page, 5000);
      expect(hasGhostText).toBe(true);
    });

    test('should work with TypeScript files', async ({ page }) => {
      await setupContextualMock(page);

      await clearMonacoContent(page);
      await typeInMonaco(page, 'interface User {', 150);

      await page.waitForTimeout(1000);

      const hasGhostText = await waitForGhostText(page, 5000);
      expect(hasGhostText).toBe(true);
    });

    test('should provide context-aware completions', async ({ page }) => {
      await setupContextualMock(page);

      await clearMonacoContent(page);
      await typeInMonaco(page, 'class Calculator {', 150);

      await page.waitForTimeout(1000);

      const hasGhostText = await waitForGhostText(page, 5000);
      expect(hasGhostText).toBe(true);
    });
  });

  test.describe('Performance', () => {
    test('should respond within acceptable time', async ({ page }) => {
      await setupDeepSeekMock(page, { delay: 100 });

      await clearMonacoContent(page);

      const startTime = Date.now();
      await typeInMonaco(page, 'function perf() {', 150);

      await waitForGhostText(page, 5000);
      const endTime = Date.now();

      const totalTime = endTime - startTime;

      // Should complete within 3 seconds (debounce + API + render)
      expect(totalTime).toBeLessThan(3000);
    });

    test('should not block editor typing', async ({ page }) => {
      await setupDeepSeekMock(page);

      await clearMonacoContent(page);

      // Type continuously
      const testText = 'function test() { const x = 1; const y = 2; }';
      await typeInMonaco(page, testText, 50);

      // Check all text was entered
      const content = await getMonacoContent(page);
      expect(content).toBe(testText);
    });
  });
});
