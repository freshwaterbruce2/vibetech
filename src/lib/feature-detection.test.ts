import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { featureExists, features, useFeatureDetection } from './feature-detection';

describe('featureExists', () => {
  it('should detect existing window features', () => {
    const result = featureExists('navigator');
    expect(result).toBe(true);
  });

  it('should detect existing document features', () => {
    const result = featureExists('document');
    expect(result).toBe(true);
  });

  it('should return false for non-existent features', () => {
    const result = featureExists('nonExistentFeature123');
    expect(result).toBe(false);
  });

  it('should handle errors gracefully', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock a feature that throws an error
    Object.defineProperty(window, 'throwingFeature', {
      get: () => {
        throw new Error('Test error');
      },
      configurable: true,
    });

    const result = featureExists('throwingFeature');

    expect(result).toBe(false);
    expect(consoleWarnSpy).toHaveBeenCalled();

    delete (window as any).throwingFeature;
    consoleWarnSpy.mockRestore();
  });
});

describe('features.webGL', () => {
  it('should detect WebGL support', () => {
    const result = features.webGL.check();
    expect(typeof result).toBe('boolean');
  });

  it('should provide fallback information', () => {
    expect(features.webGL.fallback).toBe('Static images instead of 3D rendering');
  });

  it('should handle missing canvas context', () => {
    const originalCreateElement = document.createElement;

    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          getContext: () => null,
        } as any;
      }
      return originalCreateElement.call(document, tagName);
    });

    const result = features.webGL.check();
    expect(result).toBe(false);

    document.createElement = originalCreateElement;
  });
});

describe('features.webP', () => {
  it('should detect WebP support', () => {
    const result = features.webP.check();
    expect(typeof result).toBe('boolean');
  });

  it('should provide fallback information', () => {
    expect(features.webP.fallback).toBe('PNG/JPG images');
  });

  it('should return false when canvas context unavailable', () => {
    const originalCreateElement = document.createElement;

    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          getContext: () => null,
          toDataURL: () => 'data:image/png',
        } as any;
      }
      return originalCreateElement.call(document, tagName);
    });

    const result = features.webP.check();
    expect(result).toBe(false);

    document.createElement = originalCreateElement;
  });

  it('should detect webP from canvas output', () => {
    const originalCreateElement = document.createElement;

    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          getContext: () => ({}),
          toDataURL: (type: string) => {
            if (type === 'image/webp') {
              return 'data:image/webp;base64,xyz';
            }
            return 'data:image/png';
          },
        } as any;
      }
      return originalCreateElement.call(document, tagName);
    });

    const result = features.webP.check();
    expect(result).toBe(true);

    document.createElement = originalCreateElement;
  });
});

describe('features.touchScreen', () => {
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

  it('should detect touch support via ontouchstart', () => {
    (window as any).ontouchstart = null;

    const result = features.touchScreen.check();
    expect(result).toBe(true);
  });

  it('should detect touch support via maxTouchPoints', () => {
    delete (window as any).ontouchstart;

    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 1,
    });

    const result = features.touchScreen.check();
    expect(result).toBe(true);
  });

  it('should return false for non-touch devices', () => {
    delete (window as any).ontouchstart;

    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      configurable: true,
      value: 0,
    });

    const result = features.touchScreen.check();
    expect(result).toBe(false);
  });

  it('should provide fallback information', () => {
    expect(features.touchScreen.fallback).toBe('Mouse-optimized interface');
  });
});

describe('useFeatureDetection', () => {
  it('should return check function', () => {
    const { check } = useFeatureDetection();

    expect(check).toBeDefined();
    expect(typeof check).toBe('function');
  });

  it('should return features object', () => {
    const { features: returnedFeatures } = useFeatureDetection();

    expect(returnedFeatures).toBeDefined();
    expect(returnedFeatures.webGL).toBeDefined();
    expect(returnedFeatures.webP).toBeDefined();
    expect(returnedFeatures.touchScreen).toBeDefined();
  });

  it('should provide working check function', () => {
    const { check } = useFeatureDetection();

    const result = check('navigator');
    expect(result).toBe(true);
  });

  it('should provide working features', () => {
    const { features: returnedFeatures } = useFeatureDetection();

    const webGLResult = returnedFeatures.webGL.check();
    expect(typeof webGLResult).toBe('boolean');

    const touchResult = returnedFeatures.touchScreen.check();
    expect(typeof touchResult).toBe('boolean');
  });
});
