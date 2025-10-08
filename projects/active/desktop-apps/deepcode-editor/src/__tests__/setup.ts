import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect, vi } from 'vitest';

// Add custom jest-dom matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables - for tests we keep process.env since it's Node.js environment
if (typeof process !== 'undefined') {
  process.env['REACT_APP_DEEPSEEK_API_KEY'] = 'demo_key';
  process.env['REACT_APP_DEEPSEEK_BASE_URL'] = 'https://api.deepseek.com/v1';
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollIntoView since jsdom doesn't implement it
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock Clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
  writable: true,
});

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args: any[]) => {
  // Filter out known React warnings/errors that are expected in tests
  const message = args[0]?.toString() || '';
  if (
    message.includes('Warning: ReactDOM.render is no longer supported') ||
    message.includes('Error: Uncaught') ||
    message.includes('Consider adding an error boundary')
  ) {
    return;
  }
  originalError.apply(console, args);
};

console.warn = (...args: any[]) => {
  // Filter out known warnings
  const message = args[0]?.toString() || '';
  if (message.includes('componentWillReceiveProps') || message.includes('componentWillUpdate')) {
    return;
  }
  originalWarn.apply(console, args);
};

// Add global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as any;

// Add jest global for tests that still use it
(global as any).jest = vi;
