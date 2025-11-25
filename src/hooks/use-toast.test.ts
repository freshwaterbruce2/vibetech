import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reducer, toast, useToast } from './use-toast';

describe('toast reducer', () => {
  const initialState = { toasts: [] };

  it('should add toast to state', () => {
    const toast = {
      id: '1',
      title: 'Test',
      open: true,
    };

    const newState = reducer(initialState, {
      type: 'ADD_TOAST',
      toast,
    });

    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0]).toEqual(toast);
  });

  it('should limit toasts to 5', () => {
    const stateWithToasts = {
      toasts: [
        { id: '1', open: true },
        { id: '2', open: true },
        { id: '3', open: true },
        { id: '4', open: true },
        { id: '5', open: true },
      ],
    };

    const newState = reducer(stateWithToasts, {
      type: 'ADD_TOAST',
      toast: { id: '6', open: true },
    });

    expect(newState.toasts).toHaveLength(5);
    expect(newState.toasts[0].id).toBe('6');
    expect(newState.toasts[4].id).toBe('4');
  });

  it('should update existing toast', () => {
    const stateWithToasts = {
      toasts: [
        { id: '1', title: 'Original', open: true },
        { id: '2', title: 'Test', open: true },
      ],
    };

    const newState = reducer(stateWithToasts, {
      type: 'UPDATE_TOAST',
      toast: { id: '1', title: 'Updated' },
    });

    expect(newState.toasts[0].title).toBe('Updated');
    expect(newState.toasts[1].title).toBe('Test');
  });

  it('should dismiss specific toast', () => {
    vi.useFakeTimers();

    const stateWithToasts = {
      toasts: [
        { id: '1', open: true },
        { id: '2', open: true },
      ],
    };

    const newState = reducer(stateWithToasts, {
      type: 'DISMISS_TOAST',
      toastId: '1',
    });

    expect(newState.toasts[0].open).toBe(false);
    expect(newState.toasts[1].open).toBe(true);

    vi.useRealTimers();
  });

  it('should dismiss all toasts when no toastId provided', () => {
    vi.useFakeTimers();

    const stateWithToasts = {
      toasts: [
        { id: '1', open: true },
        { id: '2', open: true },
      ],
    };

    const newState = reducer(stateWithToasts, {
      type: 'DISMISS_TOAST',
    });

    expect(newState.toasts[0].open).toBe(false);
    expect(newState.toasts[1].open).toBe(false);

    vi.useRealTimers();
  });

  it('should remove specific toast', () => {
    const stateWithToasts = {
      toasts: [
        { id: '1', open: true },
        { id: '2', open: true },
      ],
    };

    const newState = reducer(stateWithToasts, {
      type: 'REMOVE_TOAST',
      toastId: '1',
    });

    expect(newState.toasts).toHaveLength(1);
    expect(newState.toasts[0].id).toBe('2');
  });

  it('should remove all toasts when no toastId provided', () => {
    const stateWithToasts = {
      toasts: [
        { id: '1', open: true },
        { id: '2', open: true },
      ],
    };

    const newState = reducer(stateWithToasts, {
      type: 'REMOVE_TOAST',
      toastId: undefined,
    });

    expect(newState.toasts).toHaveLength(0);
  });
});

describe('toast function', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create toast with default variant', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'Test Toast' });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]?.title).toBe('Test Toast');
    expect(result.current.toasts[0]?.variant).toBe('default');
  });

  it('should create toast with custom variant', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'Success Toast', variant: 'success' });
    });

    expect(result.current.toasts[0]?.variant).toBe('success');
  });

  it('should return dismiss function', () => {
    const { result } = renderHook(() => useToast());

    let dismissFn: (() => void) | undefined;

    act(() => {
      const { dismiss } = toast({ title: 'Test' });
      dismissFn = dismiss;
    });

    expect(dismissFn).toBeDefined();

    act(() => {
      dismissFn?.();
    });

    expect(result.current.toasts[0]?.open).toBe(false);
  });

  it('should return update function', () => {
    const { result } = renderHook(() => useToast());

    let updateFn: ((props: any) => void) | undefined;

    act(() => {
      const { update } = toast({ title: 'Original' });
      updateFn = update;
    });

    act(() => {
      updateFn?.({ title: 'Updated' });
    });

    expect(result.current.toasts[0]?.title).toBe('Updated');
  });

  it('should dismiss toast and mark as closed', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      const { id, dismiss } = toast({ title: 'Dismissible Toast' });
      toastId = id;
      dismiss();
    });

    // Find the toast and verify it's marked as closed
    const dismissedToast = result.current.toasts.find(t => t.id === toastId);
    expect(dismissedToast?.open).toBe(false);
  });
});

describe('useToast hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should provide toast state', () => {
    const { result } = renderHook(() => useToast());

    // Toast state is shared across tests, so just verify it exists and is an array
    expect(Array.isArray(result.current.toasts)).toBe(true);
  });

  it('should provide toast function', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.toast).toBeDefined();
    expect(typeof result.current.toast).toBe('function');
  });

  it('should provide dismiss function', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current.dismiss).toBeDefined();
    expect(typeof result.current.dismiss).toBe('function');
  });

  it('should update state when toast is added', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'New Toast' });
    });

    // Toast limit is 5, so we should have at most 5 toasts
    expect(result.current.toasts.length).toBeLessThanOrEqual(5);
    expect(result.current.toasts.length).toBeGreaterThan(0);
    // Newest toast appears first
    expect(result.current.toasts[0]?.title).toBe('New Toast');
  });

  it('should dismiss toast by id', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;

    act(() => {
      const { id } = result.current.toast({ title: 'Dismissible' });
      toastId = id;
    });

    act(() => {
      result.current.dismiss(toastId);
    });

    expect(result.current.toasts[0]?.open).toBe(false);
  });

  it('should dismiss all toasts when no id provided', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Toast 1' });
      result.current.toast({ title: 'Toast 2' });
    });

    // Toast limit is 5, so we should have at least our 2 new toasts
    expect(result.current.toasts.length).toBeGreaterThanOrEqual(2);

    act(() => {
      result.current.dismiss();
    });

    // All toasts should be closed
    const allClosed = result.current.toasts.every(t => !t.open);
    expect(allClosed).toBe(true);
  });

  it('should handle multiple toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Toast 1' });
      result.current.toast({ title: 'Toast 2' });
      result.current.toast({ title: 'Toast 3' });
    });

    // Toast limit is 5, so we should have at most 5 toasts
    expect(result.current.toasts.length).toBeLessThanOrEqual(5);
    // Newest toasts appear first
    expect(result.current.toasts[0]?.title).toBe('Toast 3');
    expect(result.current.toasts[1]?.title).toBe('Toast 2');
    expect(result.current.toasts[2]?.title).toBe('Toast 1');
  });

  it('should cleanup listeners on unmount', () => {
    const { unmount } = renderHook(() => useToast());

    // Should not throw
    expect(() => unmount()).not.toThrow();
  });
});
