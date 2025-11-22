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

// Mock window.scrollTo since jsdom doesn't implement it (needed by framer-motion)
window.scrollTo = vi.fn();

// Mock PointerEvent since jsdom doesn't implement it (needed by motion-dom)
if (typeof global.PointerEvent === 'undefined') {
  class PointerEvent extends MouseEvent {
    pointerId: number;
    width: number;
    height: number;
    pressure: number;
    tangentialPressure: number;
    tiltX: number;
    tiltY: number;
    twist: number;
    pointerType: string;
    isPrimary: boolean;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId || 0;
      this.width = params.width || 1;
      this.height = params.height || 1;
      this.pressure = params.pressure || 0;
      this.tangentialPressure = params.tangentialPressure || 0;
      this.tiltX = params.tiltX || 0;
      this.tiltY = params.tiltY || 0;
      this.twist = params.twist || 0;
      this.pointerType = params.pointerType || 'mouse';
      this.isPrimary = params.isPrimary !== undefined ? params.isPrimary : true;
    }
  }
  global.PointerEvent = PointerEvent as any;
}

// Mock Clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
  writable: true,
  configurable: true, // Allow redefinition by userEvent.setup()
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

// Mock Monaco Editor
// vi.mock('monaco-editor', () => ({
//   editor: {
//     create: vi.fn(),
//     createModel: vi.fn(),
//     setTheme: vi.fn(),
//     setModelLanguage: vi.fn(),
//     defineTheme: vi.fn(),
//     remeasureFonts: vi.fn(),
//     onDidCreateModel: vi.fn(),
//     onDidChangeModelLanguage: vi.fn(),
//     OverviewRulerLane: {
//       Left: 1,
//       Center: 2,
//       Right: 4,
//       Full: 7,
//     },
//   },
//   languages: {
//     register: vi.fn(),
//     registerCompletionItemProvider: vi.fn(() => ({ dispose: vi.fn() })),
//     setMonarchTokensProvider: vi.fn(),
//     setLanguageConfiguration: vi.fn(),
//     CompletionItemKind: {
//       Text: 0,
//       Method: 1,
//       Function: 2,
//       Constructor: 3,
//       Field: 4,
//       Variable: 5,
//       Class: 6,
//       Struct: 7,
//       Interface: 8,
//       Module: 9,
//       Property: 10,
//       Event: 11,
//       Operator: 12,
//       Unit: 13,
//       Value: 14,
//       Constant: 15,
//       Enum: 16,
//       EnumMember: 17,
//       Keyword: 18,
//       Color: 20,
//       File: 21,
//       Reference: 22,
//       Customcolor: 23,
//       Folder: 24,
//       TypeParameter: 25,
//       User: 26,
//       Issue: 27,
//       Snippet: 28,
//     },
//     CompletionItemInsertTextRule: {
//       KeepWhitespace: 1,
//       InsertAsSnippet: 4,
//     },
//   },
//   Range: vi.fn().mockImplementation((startLine, startCol, endLine, endCol) => ({
//     startLineNumber: startLine,
//     startColumn: startCol,
//     endLineNumber: endLine,
//     endColumn: endCol,
//   })),
//   Selection: vi.fn(),
//   KeyMod: {
//     CtrlCmd: 2048,
//     Shift: 1024,
//     Alt: 512,
//     WinCtrl: 256,
//   },
//   KeyCode: {
//     KeyK: 41,
//     KeyS: 49,
//     KeyF: 36,
//     KeyH: 38,
//     KeyD: 34,
//   },
// }));

// Mock @monaco-editor/react
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ value, onChange }) => {
    return {
      type: 'div',
      props: {
        'data-testid': 'monaco-editor',
        onChange: (e: any) => onChange?.(e.target.value),
        value,
      },
    };
  }),
  Editor: vi.fn(({ value, onChange }) => {
    return {
      type: 'div',
      props: {
        'data-testid': 'monaco-editor',
        onChange: (e: any) => onChange?.(e.target.value),
        value,
      },
    };
  }),
}));

// Mock monacopilot
vi.mock('monacopilot', () => ({
  registerCompletion: vi.fn(() => ({
    deregister: vi.fn(),
  })),
}));

// Mock framer-motion - Note: Cannot use React.createElement here in setup.ts
// Tests that need framer-motion should mock it locally with actual React elements
// This global mock is intentionally removed to avoid breaking existing tests

// Mock Worker API
(global as any).Worker = class Worker {
  url: string;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  postMessage(msg: any) {
    // Simulate async response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: { type: 'response', payload: msg } });
      }
    }, 0);
  }

  terminate() {
    // Mock terminate
  }

  addEventListener(type: string, listener: any) {
    if (type === 'message') {
      this.onmessage = listener;
    } else if (type === 'error') {
      this.onerror = listener;
    }
  }

  removeEventListener() {
    // Mock remove listener
  }
};
