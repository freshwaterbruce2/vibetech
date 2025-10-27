/**
 * Vitest Test Setup
 * Configures browser APIs and global mocks for testing
 * Based on 2025 best practices for Vitest browser API mocking
 */

import '@testing-library/jest-dom';

import { vi } from 'vitest';

/**
 * Mock Clipboard API
 * Uses configurable property to allow redefinition in tests
 */
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
    readText: vi.fn().mockImplementation(() => Promise.resolve('')),
    write: vi.fn().mockImplementation(() => Promise.resolve()),
    read: vi.fn().mockImplementation(() => Promise.resolve([])),
  },
  configurable: true,
  writable: true,
});

/**
 * Mock Intersection Observer
 * Required for virtual lists and lazy loading components
 */
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

/**
 * Mock Resize Observer
 * Required for resizable panels and responsive components
 */
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

/**
 * Mock matchMedia
 * Required for responsive design tests
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/**
 * Mock localStorage
 * Provides a clean in-memory implementation
 */
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
  writable: true,
});

/**
 * Mock HTMLElement.scrollIntoView
 * Required for focus management tests
 */
Element.prototype.scrollIntoView = vi.fn();

/**
 * Mock HTMLElement.focus
 * Track focus calls in tests
 */
const originalFocus = HTMLElement.prototype.focus;
HTMLElement.prototype.focus = vi.fn(function (this: HTMLElement) {
  originalFocus.call(this);
});

/**
 * Mock HTMLElement.blur
 * Track blur calls in tests
 */
const originalBlur = HTMLElement.prototype.blur;
HTMLElement.prototype.blur = vi.fn(function (this: HTMLElement) {
  originalBlur.call(this);
});

/**
 * Mock window.getComputedStyle
 * Required for style-dependent tests
 */
if (!window.getComputedStyle) {
  window.getComputedStyle = (element: Element) => {
    return {
      getPropertyValue: () => '',
    } as unknown as CSSStyleDeclaration;
  };
}

/**
 * Suppress console errors during tests
 * Comment out during debugging
 */
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};

/**
 * Clean up between tests
 */
beforeEach(() => {
  // Clear all mocks
  vi.clearAllMocks();

  // Reset localStorage
  localStorageMock.clear();

  // Reset clipboard
  (navigator.clipboard.writeText as any).mockClear();
  (navigator.clipboard.readText as any).mockClear();
});

afterEach(() => {
  // Additional cleanup if needed
  vi.clearAllTimers();
});
