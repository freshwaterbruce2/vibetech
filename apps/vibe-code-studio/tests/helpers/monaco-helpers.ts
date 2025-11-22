/**
 * Monaco Editor Test Helpers
 * Utilities for interacting with Monaco editor in tests
 */

import { Page } from '@playwright/test';
import type * as monaco from 'monaco-editor';

declare global {
  interface Window {
    monaco: typeof monaco;
    consoleHistory?: string[];
  }
}

/**
 * Wait for Monaco editor to be fully loaded and ready
 */
export async function waitForMonacoReady(page: Page, timeout = 5000): Promise<void> {
  await page.waitForFunction(
    () => {
      return (
        window.monaco &&
        window.monaco.editor &&
        window.monaco.editor.getModels().length > 0
      );
    },
    { timeout }
  );
}

/**
 * Type text into the Monaco editor
 */
export async function typeInMonaco(page: Page, text: string, delay = 100): Promise<void> {
  // Focus the Monaco textarea
  await page.click('.monaco-editor textarea');

  // Type with delay to simulate real typing (triggers debounce)
  for (const char of text) {
    await page.keyboard.type(char);
    await page.waitForTimeout(delay);
  }
}

/**
 * Get the current content of the Monaco editor
 */
export async function getMonacoContent(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const models = window.monaco.editor.getModels();
    if (models.length === 0) {
      throw new Error('No Monaco models found');
    }
    return models[0].getValue();
  });
}

/**
 * Clear all content from the Monaco editor
 */
export async function clearMonacoContent(page: Page): Promise<void> {
  await page.evaluate(() => {
    const models = window.monaco.editor.getModels();
    if (models.length > 0) {
      models[0].setValue('');
    }
  });
}

/**
 * Set content in the Monaco editor
 */
export async function setMonacoContent(page: Page, content: string): Promise<void> {
  await page.evaluate((text) => {
    const models = window.monaco.editor.getModels();
    if (models.length > 0) {
      models[0].setValue(text);
    }
  }, content);
}

/**
 * Wait for ghost text (inline completion) to appear
 */
export async function waitForGhostText(page: Page, timeout = 3000): Promise<boolean> {
  try {
    await page.waitForSelector('.ghost-text, .inline-completion, [class*="ghost"], [class*="inline-suggest"]', {
      timeout,
      visible: true,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if ghost text is currently visible
 */
export async function isGhostTextVisible(page: Page): Promise<boolean> {
  const ghostText = await page.$('.ghost-text, .inline-completion, [class*="ghost"], [class*="inline-suggest"]');
  if (!ghostText) return false;

  return await ghostText.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  });
}

/**
 * Get the ghost text content
 */
export async function getGhostTextContent(page: Page): Promise<string | null> {
  const ghostText = await page.$('.ghost-text, .inline-completion, [class*="ghost"], [class*="inline-suggest"]');
  if (!ghostText) return null;

  return await ghostText.evaluate((el) => el.textContent);
}

/**
 * Press Tab to accept inline completion
 */
export async function acceptCompletion(page: Page): Promise<void> {
  await page.keyboard.press('Tab');
}

/**
 * Press Escape to dismiss inline completion
 */
export async function dismissCompletion(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
}

/**
 * Get console logs from the page
 * Requires console history to be captured (see setupConsoleCapture)
 */
export async function getConsoleLogs(page: Page): Promise<string[]> {
  return await page.evaluate(() => window.consoleHistory || []);
}

/**
 * Setup console log capturing
 * Call this before navigating to the page
 */
export async function setupConsoleCapture(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.consoleHistory = [];
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = function(...args) {
      window.consoleHistory!.push('[LOG] ' + args.join(' '));
      originalLog.apply(console, args);
    };

    console.warn = function(...args) {
      window.consoleHistory!.push('[WARN] ' + args.join(' '));
      originalWarn.apply(console, args);
    };

    console.error = function(...args) {
      window.consoleHistory!.push('[ERROR] ' + args.join(' '));
      originalError.apply(console, args);
    };
  });
}

/**
 * Wait for a specific console log message
 */
export async function waitForConsoleLog(
  page: Page,
  messagePattern: string | RegExp,
  timeout = 5000
): Promise<string | null> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const logs = await getConsoleLogs(page);
    const found = logs.find((log) => {
      if (typeof messagePattern === 'string') {
        return log.includes(messagePattern);
      }
      return messagePattern.test(log);
    });

    if (found) return found;

    await page.waitForTimeout(100);
  }

  return null;
}

/**
 * Get the current cursor position in Monaco
 */
export async function getCursorPosition(page: Page): Promise<{ line: number; column: number }> {
  return await page.evaluate(() => {
    const editors = window.monaco.editor.getEditors();
    if (editors.length === 0) {
      throw new Error('No Monaco editors found');
    }

    const position = editors[0].getPosition();
    if (!position) {
      throw new Error('No cursor position found');
    }

    return {
      line: position.lineNumber,
      column: position.column,
    };
  });
}

/**
 * Set the cursor position in Monaco
 */
export async function setCursorPosition(page: Page, line: number, column: number): Promise<void> {
  await page.evaluate(({ line, column }) => {
    const editors = window.monaco.editor.getEditors();
    if (editors.length > 0) {
      editors[0].setPosition({ lineNumber: line, column });
    }
  }, { line, column });
}

/**
 * Wait for the inline completion provider to be registered
 */
export async function waitForProviderRegistered(page: Page, timeout = 5000): Promise<boolean> {
  const log = await waitForConsoleLog(
    page,
    '[COMPLETION] InlineCompletionProvider initialized',
    timeout
  );
  return log !== null;
}

/**
 * Check if streaming is disabled (should be false for non-streaming mode)
 */
export async function isStreamingDisabled(page: Page): Promise<boolean> {
  const logs = await getConsoleLogs(page);
  const initLog = logs.find(log => log.includes('[COMPLETION] InlineCompletionProvider initialized'));

  if (!initLog) return false;

  return initLog.includes('streamingEnabled: false');
}

/**
 * Wait for provider to take non-streaming path
 */
export async function waitForNonStreamingPath(page: Page, timeout = 5000): Promise<boolean> {
  const log = await waitForConsoleLog(
    page,
    '[COMPLETION] Taking NON-STREAMING path',
    timeout
  );
  return log !== null;
}

/**
 * Wait for AI service to be called
 */
export async function waitForAIServiceCall(page: Page, timeout = 5000): Promise<boolean> {
  const log = await waitForConsoleLog(
    page,
    '[UnifiedAI] sendContextualMessage called',
    timeout
  );
  return log !== null;
}
