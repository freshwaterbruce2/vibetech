/**
 * StackTraceParser - Parse stack traces from JavaScript/TypeScript errors
 * Updated to support TDD tests and comprehensive parsing
 */

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

// Legacy support for existing code
export interface DetectedError {
  id: string;
  type: 'typescript' | 'eslint' | 'runtime';
  severity: 'error' | 'warning' | 'info';
  message: string;
  file: string;
  line: number;
  column: number;
  code?: string;
  source?: string;
}

export class StackTraceParser {
  /**
   * Parse a stack trace string into structured format
   */
  parse(stackTrace: string): ParsedStackTrace {
    const lines = stackTrace.split('\n');
    const frames: StackFrame[] = [];

    // Extract error message and type from first line
    const firstLine = lines[0] || '';
    const errorMatch = firstLine.match(/([\w]+(?:Error)?|UnhandledPromiseRejection):\s*(.+)/);

    const type = errorMatch ? errorMatch[1] : 'Error';
    const message = errorMatch ? errorMatch[2].trim() : firstLine.trim();

    // Parse stack frames
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) {continue;}

      const frame = this.parseFrameLine(line);
      if (frame) {
        frames.push(frame);
      }
    }

    return {
      message,
      type,
      frames,
      rawStack: stackTrace
    };
  }

  /**
   * Parse a single frame line
   */
  private parseFrameLine(line: string): StackFrame | null {
    // Node.js style: "    at functionName (file.ts:10:5)"
    const nodeRegex = /at\s+(?:async\s+)?(?:(.+?)\s+)?\((.+?):(\d+):(\d+)\)/;

    // Browser style: "functionName@file.js:10:5"
    const browserRegex = /^(.+?)@(.+?):(\d+):(\d+)/;

    // Simple style: "    at file.ts:10:5"
    const simpleRegex = /at\s+(?:async\s+)?(.+?):(\d+):(\d+)$/;

    // Webpack style: "at Module../src/file.ts (webpack:///./src/file.ts:10:5)"
    const webpackRegex = /at\s+Module\.\.\/(.*?)\s+\((?:webpack:\/\/\/)?\.\/(.+?):(\d+):(\d+)\)/;

    // Try webpack pattern first
    let match = webpackRegex.exec(line);
    if (match) {
      return {
        functionName: 'Module',
        file: this.normalizeFilePath(match[2]),
        line: parseInt(match[3], 10),
        column: parseInt(match[4], 10),
        source: line.trim()
      };
    }

    // Try Node.js pattern
    match = nodeRegex.exec(line);
    if (match) {
      return {
        functionName: match[1] || '<anonymous>',
        file: this.normalizeFilePath(match[2]),
        line: parseInt(match[3], 10),
        column: parseInt(match[4], 10),
        source: line.trim()
      };
    }

    // Try browser pattern
    match = browserRegex.exec(line.trim());
    if (match) {
      return {
        functionName: match[1],
        file: match[2],
        line: parseInt(match[3], 10),
        column: parseInt(match[4], 10),
        source: line.trim()
      };
    }

    // Try simple pattern
    match = simpleRegex.exec(line);
    if (match) {
      return {
        file: this.normalizeFilePath(match[1]),
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        source: line.trim()
      };
    }

    return null;
  }

  /**
   * Get the top frame (first frame in the stack)
   */
  getTopFrame(parsed: ParsedStackTrace): StackFrame | null {
    return parsed.frames.length > 0 ? parsed.frames[0] : null;
  }

  /**
   * Filter out internal frames (Node.js internals, etc.)
   */
  filterInternalFrames(parsed: ParsedStackTrace): StackFrame[] {
    return parsed.frames.filter(frame => {
      const file = frame.file.toLowerCase();

      // Filter out Node.js internals
      if (file.includes('internal/') || file.includes('node:internal/')) {
        return false;
      }

      // Filter out common internal modules
      if (file.includes('node_modules') &&
          (file.includes('/loader.js') || file.includes('/task_queues'))) {
        return false;
      }

      return true;
    });
  }

  /**
   * Format a frame for display
   */
  formatFrame(frame: StackFrame): string {
    const parts: string[] = [];

    if (frame.functionName) {
      parts.push(`at ${frame.functionName}`);
    } else {
      parts.push('at');
    }

    // Extract filename from path
    const fileName = frame.file.split('/').pop() || frame.file;
    parts.push(`(${fileName}:${frame.line}:${frame.column})`);

    return parts.join(' ');
  }

  /**
   * Normalize file path
   */
  private normalizeFilePath(path: string): string {
    // Convert backslashes to forward slashes
    let normalized = path.replace(/\\/g, '/');

    // Remove webpack prefixes
    normalized = normalized.replace(/^webpack:\/\/\/\.\//, '');

    return normalized;
  }

  // ===== Legacy API Support =====

  /**
   * Legacy: Parse terminal output for errors
   */
  parseTerminalOutput(output: string): DetectedError[] {
    const errors: DetectedError[] = [];

    // Parse TypeScript compiler errors
    const tsErrors = this.parseTypeScriptErrors(output);
    errors.push(...tsErrors);

    // Parse runtime errors
    const runtimeErrors = this.parseRuntimeErrors(output);
    errors.push(...runtimeErrors);

    return errors;
  }

  /**
   * Legacy: Parse TypeScript compiler output
   */
  private parseTypeScriptErrors(output: string): DetectedError[] {
    const errors: DetectedError[] = [];
    const tsErrorRegex = /(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)/g;

    let match;
    while ((match = tsErrorRegex.exec(output)) !== null) {
      const [, file, line, column, severity, code, message] = match;

      if (file && line && column && severity && code && message) {
        errors.push({
          id: `${file}-${line}-${column}`,
          type: 'typescript',
          severity: severity as 'error' | 'warning',
          message,
          file: file.trim(),
          line: parseInt(line),
          column: parseInt(column),
          code: `TS${code}`,
          source: 'typescript',
        });
      }
    }

    return errors;
  }

  /**
   * Legacy: Parse runtime error stack traces
   */
  private parseRuntimeErrors(output: string): DetectedError[] {
    const errors: DetectedError[] = [];
    const errorBlocks = output.split('\n\n');

    for (const block of errorBlocks) {
      const parsed = this.parse(block);
      if (parsed && parsed.frames.length > 0) {
        const topFrame = parsed.frames[0];

        errors.push({
          id: `runtime-${topFrame.file}-${topFrame.line}`,
          type: 'runtime',
          severity: 'error',
          message: parsed.message,
          file: topFrame.file,
          line: topFrame.line,
          column: topFrame.column,
          source: 'runtime',
        });
      }
    }

    return errors;
  }
}
