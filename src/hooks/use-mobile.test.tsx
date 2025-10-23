import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDeviceType, useIsMobile, useIsPortrait } from './use-mobile';

describe('useIsMobile', () => {
  let matchMediaMock: any;
  let listeners: ((event: any) => void)[] = [];

  beforeEach(() => {
    listeners = [];
    matchMediaMock = vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn((_event: string, listener: (e: any) => void) => {
        listeners.push(listener);
      }),
      removeEventListener: vi.fn((_event: string, listener: (e: any) => void) => {
        listeners = listeners.filter(l => l !== listener);
      }),
      dispatchEvent: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    listeners = [];
    vi.restoreAllMocks();
  });

  it('should return false by default during SSR', () => {
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should return true when viewport is mobile size', async () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn((_event: string, listener: (e: any) => void) => {
        listeners.push(listener);
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));

    const { result } = renderHook(() => useIsMobile());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should return false when viewport is desktop size', async () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn((_event: string, listener: (e: any) => void) => {
        listeners.push(listener);
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));

    const { result } = renderHook(() => useIsMobile());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('should update when viewport changes to mobile', async () => {
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    // Trigger resize to mobile
    act(() => {
      listeners.forEach(listener => listener({ matches: true }));
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should update when viewport changes to desktop', async () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn((_event: string, listener: (e: any) => void) => {
        listeners.push(listener);
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));

    const { result } = renderHook(() => useIsMobile());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    // Trigger resize to desktop
    act(() => {
      listeners.forEach(listener => listener({ matches: false }));
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = vi.fn();

    matchMediaMock.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: removeEventListenerSpy,
      dispatchEvent: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));

    const { unmount } = renderHook(() => useIsMobile());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });
});

describe('useIsPortrait', () => {
  let matchMediaMock: any;
  let listeners: ((event: any) => void)[] = [];

  beforeEach(() => {
    listeners = [];
    matchMediaMock = vi.fn((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn((_event: string, listener: (e: any) => void) => {
        listeners.push(listener);
      }),
      removeEventListener: vi.fn((_event: string, listener: (e: any) => void) => {
        listeners = listeners.filter(l => l !== listener);
      }),
      dispatchEvent: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    listeners = [];
    vi.restoreAllMocks();
  });

  it('should return true by default during SSR', () => {
    const { result } = renderHook(() => useIsPortrait());
    expect(result.current).toBe(true);
  });

  it('should return true when orientation is portrait', async () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn((_event: string, listener: (e: any) => void) => {
        listeners.push(listener);
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));

    const { result } = renderHook(() => useIsPortrait());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should return false when orientation is landscape', async () => {
    matchMediaMock.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn((_event: string, listener: (e: any) => void) => {
        listeners.push(listener);
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));

    const { result } = renderHook(() => useIsPortrait());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('should update when orientation changes to landscape', async () => {
    const { result } = renderHook(() => useIsPortrait());

    expect(result.current).toBe(true);

    // Trigger orientation change
    act(() => {
      listeners.forEach(listener => listener({ matches: false }));
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('should cleanup event listeners on unmount', () => {
    const removeEventListenerSpy = vi.fn();

    matchMediaMock.mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: removeEventListenerSpy,
      dispatchEvent: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));

    const { unmount } = renderHook(() => useIsPortrait());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });
});

describe('useDeviceType', () => {
  let matchMediaMock: any;

  beforeEach(() => {
    matchMediaMock = vi.fn((query: string) => {
      // Default: desktop and landscape
      const isMaxWidth = query.includes('max-width');
      const isPortrait = query.includes('portrait');

      return {
        matches: isMaxWidth ? false : (isPortrait ? false : true),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      };
    });

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return correct desktop landscape state', async () => {
    const { result } = renderHook(() => useDeviceType());

    await waitFor(() => {
      expect(result.current).toEqual({
        isMobile: false,
        isPortrait: false,
        isLandscape: true,
        isDesktop: true,
      });
    });
  });

  it('should return correct mobile portrait state', async () => {
    matchMediaMock.mockImplementation((query: string) => {
      const isMaxWidth = query.includes('max-width');
      const isPortrait = query.includes('portrait');

      return {
        matches: isMaxWidth ? true : (isPortrait ? true : false),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      };
    });

    const { result } = renderHook(() => useDeviceType());

    await waitFor(() => {
      expect(result.current).toEqual({
        isMobile: true,
        isPortrait: true,
        isLandscape: false,
        isDesktop: false,
      });
    });
  });

  it('should return correct mobile landscape state', async () => {
    matchMediaMock.mockImplementation((query: string) => {
      const isMaxWidth = query.includes('max-width');
      const isPortrait = query.includes('portrait');

      return {
        matches: isMaxWidth ? true : (isPortrait ? false : true),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      };
    });

    const { result } = renderHook(() => useDeviceType());

    await waitFor(() => {
      expect(result.current).toEqual({
        isMobile: true,
        isPortrait: false,
        isLandscape: true,
        isDesktop: false,
      });
    });
  });

  it('should return correct desktop portrait state', async () => {
    matchMediaMock.mockImplementation((query: string) => {
      const isMaxWidth = query.includes('max-width');
      const isPortrait = query.includes('portrait');

      return {
        matches: isMaxWidth ? false : (isPortrait ? true : false),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      };
    });

    const { result } = renderHook(() => useDeviceType());

    await waitFor(() => {
      expect(result.current).toEqual({
        isMobile: false,
        isPortrait: true,
        isLandscape: false,
        isDesktop: true,
      });
    });
  });
});
