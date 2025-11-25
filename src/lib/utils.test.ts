import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cn, getScreenSize, isBrowser, isTouchDevice, safeWindow } from './utils';

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const condition = false;
    const result = cn('foo', condition && 'bar', 'baz');
    expect(result).toBe('foo baz');
  });

  it('should merge Tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('should handle arrays', () => {
    const result = cn(['foo', 'bar'], 'baz');
    expect(result).toBe('foo bar baz');
  });

  it('should handle objects', () => {
    const result = cn({ foo: true, bar: false, baz: true });
    expect(result).toBe('foo baz');
  });

  it('should handle undefined and null', () => {
    const result = cn('foo', undefined, null, 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle complex Tailwind merging', () => {
    const result = cn('text-red-500 bg-blue-500', 'text-green-500');
    expect(result).toBe('bg-blue-500 text-green-500');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });
});

describe('isBrowser', () => {
  it('should return true in test environment', () => {
    expect(isBrowser).toBe(true);
  });
});

describe('getScreenSize', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
  });

  it('should return current screen dimensions', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });

    const size = getScreenSize();

    expect(size.width).toBe(1024);
    expect(size.height).toBe(768);
    expect(size.isPortrait).toBe(false);
  });

  it('should detect portrait orientation', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    const size = getScreenSize();

    expect(size.isPortrait).toBe(true);
  });

  it('should detect landscape orientation', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });

    const size = getScreenSize();

    expect(size.isPortrait).toBe(false);
  });

  it('should handle mobile portrait dimensions', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    });

    const size = getScreenSize();

    expect(size.width).toBe(375);
    expect(size.height).toBe(667);
    expect(size.isPortrait).toBe(true);
  });
});

describe('isTouchDevice', () => {
  let originalOntouchstart: any;
  let originalMaxTouchPoints: number;

  beforeEach(() => {
    originalOntouchstart = (window as any).ontouchstart;
    originalMaxTouchPoints = navigator.maxTouchPoints;
  });

  afterEach(() => {
    if (originalOntouchstart === undefined) {
      delete (window as any).ontouchstart;
    } else {
      (window as any).ontouchstart = originalOntouchstart;
    }

    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: originalMaxTouchPoints,
    });
  });

  it('should detect touch via ontouchstart', () => {
    (window as any).ontouchstart = null;

    const result = isTouchDevice();

    expect(result).toBe(true);
  });

  it('should detect touch via maxTouchPoints', () => {
    delete (window as any).ontouchstart;

    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 5,
    });

    const result = isTouchDevice();

    expect(result).toBe(true);
  });

  it('should return false for non-touch devices', () => {
    delete (window as any).ontouchstart;

    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0,
    });

    const result = isTouchDevice();

    expect(result).toBe(false);
  });
});

describe('safeWindow', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;
  let originalScrollY: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    originalScrollY = window.scrollY;
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: originalScrollY,
    });
  });

  it('should return current window width', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });

    expect(safeWindow.width).toBe(1920);
  });

  it('should return current window height', () => {
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 1080,
    });

    expect(safeWindow.height).toBe(1080);
  });

  it('should return current scroll position', () => {
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 500,
    });

    expect(safeWindow.scrollY).toBe(500);
  });

  it('should return 0 for scroll at top', () => {
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    });

    expect(safeWindow.scrollY).toBe(0);
  });

  it('should be reactive to window changes', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    expect(safeWindow.width).toBe(1024);

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });

    expect(safeWindow.width).toBe(1920);
  });
});
