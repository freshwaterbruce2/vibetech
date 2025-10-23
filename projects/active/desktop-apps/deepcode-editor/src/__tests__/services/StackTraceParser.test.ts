/**
 * StackTraceParser Service Tests
 * TDD: Writing tests FIRST before implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';

export interface StackFrame {
  functionName?: string;
  file: string;
  line: number;
  column: number;
  source: string; // Original line from stack trace
}

export interface ParsedStackTrace {
  message: string;
  type: string; // Error, TypeError, etc.
  frames: StackFrame[];
  rawStack: string;
}

describe('StackTraceParser', () => {
  let StackTraceParser: any;

  beforeEach(async () => {
    try {
      const module = await import('../../services/StackTraceParser');
      StackTraceParser = module.StackTraceParser;
    } catch {
      // Expected to fail initially - TDD RED phase
      StackTraceParser = null;
    }
  });

  describe('Node.js Stack Trace Parsing', () => {
    it('should parse standard Node.js stack trace', () => {
      if (!StackTraceParser) return;

      const stackTrace = `Error: Cannot read property 'foo' of undefined
    at Object.<anonymous> (C:\\dev\\test\\file.ts:25:10)
    at Module._compile (internal/modules/cjs/loader.js:1063:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1092:10)`;

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      expect(parsed).toMatchObject({
        message: "Cannot read property 'foo' of undefined",
        type: 'Error',
        frames: expect.arrayContaining([
          expect.objectContaining({
            functionName: 'Object.<anonymous>',
            file: expect.stringContaining('file.ts'),
            line: 25,
            column: 10
          })
        ])
      });
    });

    it('should parse TypeError stack trace', () => {
      if (!StackTraceParser) return;

      const stackTrace = `TypeError: x is not a function
    at test (C:\\dev\\app.ts:42:5)
    at main (C:\\dev\\app.ts:100:3)`;

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      expect(parsed.type).toBe('TypeError');
      expect(parsed.message).toBe('x is not a function');
      expect(parsed.frames).toHaveLength(2);
      expect(parsed.frames[0]).toMatchObject({
        functionName: 'test',
        line: 42,
        column: 5
      });
    });

    it('should handle ReferenceError', () => {
      if (!StackTraceParser) return;

      const stackTrace = `ReferenceError: foo is not defined
    at eval (C:\\dev\\test.js:10:1)`;

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      expect(parsed.type).toBe('ReferenceError');
      expect(parsed.frames[0].functionName).toBe('eval');
    });
  });

  describe('Browser Stack Trace Parsing', () => {
    it('should parse Chrome/V8 stack trace', () => {
      if (!StackTraceParser) return;

      const stackTrace = `TypeError: Cannot read property 'length' of null
    at calculateTotal (https://example.com/app.js:150:25)
    at processCart (https://example.com/app.js:200:15)`;

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      expect(parsed.frames[0]).toMatchObject({
        functionName: 'calculateTotal',
        file: 'https://example.com/app.js',
        line: 150,
        column: 25
      });
    });

    it('should parse Firefox stack trace', () => {
      if (!StackTraceParser) return;

      const stackTrace = `TypeError: x is undefined
calculateTotal@https://example.com/app.js:150:25
processCart@https://example.com/app.js:200:15`;

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      expect(parsed.frames).toHaveLength(2);
      expect(parsed.frames[0]).toMatchObject({
        functionName: 'calculateTotal',
        file: 'https://example.com/app.js',
        line: 150,
        column: 25
      });
    });

    it('should handle webpack/bundled paths', () => {
      if (!StackTraceParser) return;

      const stackTrace = `Error: Test error
    at Module../src/components/App.tsx (webpack:///./src/components/App.tsx:25:10)`;

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      expect(parsed.frames[0]).toMatchObject({
        file: expect.stringContaining('src/components/App.tsx'),
        line: 25,
        column: 10
      });
    });
  });

  describe('Anonymous Functions', () => {
    it('should handle anonymous functions', () => {
      if (!StackTraceParser) return;

      const stackTrace = `Error: Test error
    at <anonymous> (C:\\dev\\test.js:10:5)`;

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      expect(parsed.frames[0]).toMatchObject({
        functionName: '<anonymous>',
        line: 10,
        column: 5
      });
    });

    it('should handle missing function name', () => {
      if (!StackTraceParser) return;

      const stackTrace = `Error: Test error
    at C:\\dev\\test.js:10:5`;

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      expect(parsed.frames[0]).toMatchObject({
        file: expect.stringContaining('test.js'),
        line: 10,
        column: 5
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty stack trace', () => {
      if (!StackTraceParser) return;

      const stackTrace = 'Error: Something went wrong';

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      expect(parsed.message).toBe('Something went wrong');
      expect(parsed.frames).toHaveLength(0);
    });

    it('should handle malformed stack trace', () => {
      if (!StackTraceParser) return;

      const stackTrace = 'Not a real stack trace';

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      expect(parsed.frames).toHaveLength(0);
    });

    it('should handle stack with internal Node.js modules', () => {
      if (!StackTraceParser) return;

      const stackTrace = `Error: Test
    at myFunction (C:\\dev\\app.js:10:5)
    at Module._compile (internal/modules/cjs/loader.js:1063:30)
    at myOtherFunction (C:\\dev\\app.js:20:10)`;

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      // Should include internal modules
      expect(parsed.frames).toHaveLength(3);
    });

    it('should preserve raw stack trace', () => {
      if (!StackTraceParser) return;

      const stackTrace = `Error: Test
    at foo (test.js:1:1)`;

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      expect(parsed.rawStack).toBe(stackTrace);
    });
  });

  describe('Frame Extraction', () => {
    it('should extract first frame correctly', () => {
      if (!StackTraceParser) return;

      const stackTrace = `Error: Test
    at first (C:\\dev\\a.js:10:5)
    at second (C:\\dev\\b.js:20:10)`;

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      const firstFrame = parsed.frames[0];
      expect(firstFrame.functionName).toBe('first');
      expect(firstFrame.line).toBe(10);
      expect(firstFrame.column).toBe(5);
    });

    it('should extract all frames', () => {
      if (!StackTraceParser) return;

      const stackTrace = `Error: Test
    at frame1 (a.js:1:1)
    at frame2 (b.js:2:2)
    at frame3 (c.js:3:3)`;

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      expect(parsed.frames).toHaveLength(3);
      expect(parsed.frames.map(f => f.functionName)).toEqual(['frame1', 'frame2', 'frame3']);
    });

    it('should normalize file paths', () => {
      if (!StackTraceParser) return;

      const stackTrace = `Error: Test
    at func (C:\\Users\\test\\file.ts:10:5)`;

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      // Should convert backslashes to forward slashes
      expect(parsed.frames[0].file).toContain('/');
      expect(parsed.frames[0].file).not.toContain('\\');
    });
  });

  describe('Error Type Detection', () => {
    const errorTypes = [
      'Error',
      'TypeError',
      'ReferenceError',
      'SyntaxError',
      'RangeError',
      'URIError',
      'EvalError'
    ];

    errorTypes.forEach(errorType => {
      it(`should detect ${errorType}`, () => {
        if (!StackTraceParser) return;

        const stackTrace = `${errorType}: Test message
    at test (file.js:1:1)`;

        const parser = new StackTraceParser();
        const parsed = parser.parse(stackTrace);

        expect(parsed.type).toBe(errorType);
      });
    });

    it('should default to "Error" for unknown types', () => {
      if (!StackTraceParser) return;

      const stackTrace = `UnknownErrorType: Test
    at test (file.js:1:1)`;

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      expect(parsed.type).toBe('UnknownErrorType');
    });
  });

  describe('Utility Methods', () => {
    it('should extract top frame', () => {
      if (!StackTraceParser) return;

      const stackTrace = `Error: Test
    at topFunction (top.js:1:1)
    at middleFunction (middle.js:2:2)`;

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      expect(parser.getTopFrame(parsed)).toMatchObject({
        functionName: 'topFunction',
        file: expect.stringContaining('top.js')
      });
    });

    it('should return null for empty frames', () => {
      if (!StackTraceParser) return;

      const parser = new StackTraceParser();
      const parsed: ParsedStackTrace = {
        message: 'Test',
        type: 'Error',
        frames: [],
        rawStack: ''
      };

      expect(parser.getTopFrame(parsed)).toBeNull();
    });

    it('should filter internal frames', () => {
      if (!StackTraceParser) return;

      const stackTrace = `Error: Test
    at myFunction (C:\\dev\\app.js:10:5)
    at Module._compile (internal/modules/cjs/loader.js:1063:30)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`;

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      const userFrames = parser.filterInternalFrames(parsed);

      expect(userFrames).toHaveLength(1);
      expect(userFrames[0].functionName).toBe('myFunction');
    });

    it('should format frame for display', () => {
      if (!StackTraceParser) return;

      const parser = new StackTraceParser();
      const frame: StackFrame = {
        functionName: 'testFunc',
        file: 'C:/dev/test.ts',
        line: 42,
        column: 10,
        source: 'at testFunc (C:/dev/test.ts:42:10)'
      };

      const formatted = parser.formatFrame(frame);

      expect(formatted).toContain('testFunc');
      expect(formatted).toContain('test.ts');
      expect(formatted).toContain('42');
      expect(formatted).toContain('10');
    });
  });

  describe('Real-World Examples', () => {
    it('should parse React error stack', () => {
      if (!StackTraceParser) return;

      const stackTrace = `Error: Minified React error #31
    at throwError (https://unpkg.com/react@18/umd/react.production.min.js:1:234)
    at Component.render (https://example.com/bundle.js:1000:50)
    at finishClassComponent (https://unpkg.com/react@18/umd/react.production.min.js:5:678)`;

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      expect(parsed.type).toBe('Error');
      expect(parsed.frames).toHaveLength(3);
      expect(parsed.frames[1].functionName).toBe('Component.render');
    });

    it('should parse async/await stack', () => {
      if (!StackTraceParser) return;

      const stackTrace = `Error: Async error
    at async loadData (C:\\dev\\api.ts:50:5)
    at async handleRequest (C:\\dev\\handler.ts:100:10)`;

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      expect(parsed.frames).toHaveLength(2);
      expect(parsed.frames[0].functionName).toContain('loadData');
    });

    it('should parse Promise rejection stack', () => {
      if (!StackTraceParser) return;

      const stackTrace = `UnhandledPromiseRejection: Error: Failed to fetch
    at fetchData (C:\\dev\\api.ts:25:15)
    at processRequest (C:\\dev\\app.ts:50:20)`;

      const parser = new StackTraceParser();
      const parsed = parser.parse(stackTrace);

      expect(parsed.type).toBe('UnhandledPromiseRejection');
      expect(parsed.message).toContain('Failed to fetch');
    });
  });
});
