/**
 * useKeyboard Hook
 * Provides keyboard event handling with accessibility best practices
 * Follows WCAG 2.2 guidelines for keyboard interaction
 *
 * @example
 * ```tsx
 * const handleAction = () => logger.debug('Action triggered!');
 * const { keyDownHandler } = useKeyboard({
 *   onEnter: handleAction,
 *   onEscape: () => close(),
 *   onArrowDown: () => moveDown(),
 * });
 *
 * <div onKeyDown={keyDownHandler}>...</div>
 * ```
 */
import { logger } from '../services/Logger';

import { useCallback, useEffect, useRef } from 'react';

export interface KeyboardHandlers {
  onEnter?: (event: KeyboardEvent) => void;
  onSpace?: (event: KeyboardEvent) => void;
  onEscape?: (event: KeyboardEvent) => void;
  onArrowUp?: (event: KeyboardEvent) => void;
  onArrowDown?: (event: KeyboardEvent) => void;
  onArrowLeft?: (event: KeyboardEvent) => void;
  onArrowRight?: (event: KeyboardEvent) => void;
  onTab?: (event: KeyboardEvent) => void;
  onShiftTab?: (event: KeyboardEvent) => void;
  /** Custom key handler - receives key code */
  onCustomKey?: (key: string, event: KeyboardEvent) => void;
}

export interface UseKeyboardOptions extends KeyboardHandlers {
  /** Enable keyboard handling */
  enabled?: boolean;
  /** Prevent default behavior for handled keys */
  preventDefault?: boolean;
  /** Stop event propagation for handled keys */
  stopPropagation?: boolean;
}

export function useKeyboard(options: UseKeyboardOptions = {}) {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
    onEnter,
    onSpace,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab,
    onCustomKey,
  } = options;

  const handlersRef = useRef(options);

  // Keep handlers up to date
  useEffect(() => {
    handlersRef.current = options;
  }, [options]);

  const keyDownHandler = useCallback((event: React.KeyboardEvent | KeyboardEvent) => {
    if (!enabled) return;

    const handlers = handlersRef.current;
    let handled = false;

    switch (event.key) {
      case 'Enter':
        if (handlers.onEnter) {
          handlers.onEnter(event as KeyboardEvent);
          handled = true;
        }
        break;

      case ' ':
      case 'Space':
        if (handlers.onSpace) {
          handlers.onSpace(event as KeyboardEvent);
          handled = true;
        }
        break;

      case 'Escape':
      case 'Esc':
        if (handlers.onEscape) {
          handlers.onEscape(event as KeyboardEvent);
          handled = true;
        }
        break;

      case 'ArrowUp':
      case 'Up':
        if (handlers.onArrowUp) {
          handlers.onArrowUp(event as KeyboardEvent);
          handled = true;
        }
        break;

      case 'ArrowDown':
      case 'Down':
        if (handlers.onArrowDown) {
          handlers.onArrowDown(event as KeyboardEvent);
          handled = true;
        }
        break;

      case 'ArrowLeft':
      case 'Left':
        if (handlers.onArrowLeft) {
          handlers.onArrowLeft(event as KeyboardEvent);
          handled = true;
        }
        break;

      case 'ArrowRight':
      case 'Right':
        if (handlers.onArrowRight) {
          handlers.onArrowRight(event as KeyboardEvent);
          handled = true;
        }
        break;

      case 'Tab':
        if (event.shiftKey && handlers.onShiftTab) {
          handlers.onShiftTab(event as KeyboardEvent);
          handled = true;
        } else if (!event.shiftKey && handlers.onTab) {
          handlers.onTab(event as KeyboardEvent);
          handled = true;
        }
        break;

      default:
        if (handlers.onCustomKey) {
          handlers.onCustomKey(event.key, event as KeyboardEvent);
          handled = true;
        }
    }

    if (handled) {
      if (preventDefault) event.preventDefault();
      if (stopPropagation) event.stopPropagation();
    }
  }, [enabled, preventDefault, stopPropagation]);

  return {
    keyDownHandler,
  };
}

/**
 * useGlobalKeyboard Hook
 * Registers global keyboard event listeners
 * Useful for application-wide shortcuts
 */
export function useGlobalKeyboard(handlers: KeyboardHandlers, enabled = true) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const currentHandlers = handlersRef.current;

      // Don't trigger global shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (event.key) {
        case 'Enter':
          currentHandlers.onEnter?.(event);
          break;
        case ' ':
        case 'Space':
          currentHandlers.onSpace?.(event);
          break;
        case 'Escape':
        case 'Esc':
          currentHandlers.onEscape?.(event);
          break;
        case 'ArrowUp':
        case 'Up':
          currentHandlers.onArrowUp?.(event);
          break;
        case 'ArrowDown':
        case 'Down':
          currentHandlers.onArrowDown?.(event);
          break;
        case 'ArrowLeft':
        case 'Left':
          currentHandlers.onArrowLeft?.(event);
          break;
        case 'ArrowRight':
        case 'Right':
          currentHandlers.onArrowRight?.(event);
          break;
        case 'Tab':
          if (event.shiftKey) {
            currentHandlers.onShiftTab?.(event);
          } else {
            currentHandlers.onTab?.(event);
          }
          break;
        default:
          currentHandlers.onCustomKey?.(event.key, event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);
}
