/**
 * useFocusTrap Hook
 * Implements focus trapping for modals and dialogs
 * Follows WCAG 2.2 AA guidelines for keyboard navigation
 *
 * Features:
 * - Traps focus within a container element
 * - Restores focus to the triggering element on unmount
 * - Handles Tab and Shift+Tab navigation
 * - Auto-focuses first focusable element
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const trapRef = useFocusTrap<HTMLDivElement>(isOpen);
 *
 *   if (!isOpen) return null;
 *
 *   return (
 *     <div ref={trapRef} role="dialog" aria-modal="true">
 *       <button onClick={onClose}>Close</button>
 *       <input type="text" placeholder="Search..." />
 *     </div>
 *   );
 * }
 * ```
 */

import { useEffect, useRef } from 'react';

export interface UseFocusTrapOptions {
  /** Whether focus trap is active */
  isActive?: boolean;
  /** Auto-focus first element on mount */
  autoFocus?: boolean;
  /** Restore focus to triggering element on unmount */
  restoreFocus?: boolean;
  /** Initial element to focus (overrides autoFocus) */
  initialFocus?: HTMLElement | null;
  /** Allow clicking outside to close (will call onEscape) */
  allowOutsideClick?: boolean;
  /** Callback when Escape is pressed */
  onEscape?: () => void;
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
    (element) => {
      // Filter out hidden elements
      return !!(
        element.offsetWidth ||
        element.offsetHeight ||
        element.getClientRects().length
      );
    }
  );
}

export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  options: UseFocusTrapOptions = {}
) {
  const {
    isActive = true,
    autoFocus = true,
    restoreFocus = true,
    initialFocus = null,
    onEscape,
  } = options;

  const containerRef = useRef<T>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Store the currently focused element to restore later
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    // Auto-focus first element or initial focus element
    if (autoFocus || initialFocus) {
      const elementToFocus = initialFocus || getFocusableElements(container)[0];
      if (elementToFocus) {
        // Use setTimeout to ensure the element is rendered and focusable
        setTimeout(() => {
          elementToFocus.focus();
        }, 0);
      }
    }

    // Handle Tab key to trap focus
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Escape
      if (event.key === 'Escape' || event.key === 'Esc') {
        event.preventDefault();
        onEscape?.();
        return;
      }

      // Handle Tab
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements(container);

        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab: moving backwards
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: moving forwards
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Restore focus to previously focused element
      if (restoreFocus && previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isActive, autoFocus, initialFocus, restoreFocus, onEscape]);

  return containerRef;
}

/**
 * useFocusVisible Hook
 * Tracks whether focus should be visible (keyboard navigation)
 * vs hidden (mouse/touch interaction)
 */
export function useFocusVisible() {
  const [focusVisible, setFocusVisible] = React.useState(false);
  const hadKeyboardEvent = React.useRef(false);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        hadKeyboardEvent.current = true;
        setFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      hadKeyboardEvent.current = false;
      setFocusVisible(false);
    };

    const handleFocus = () => {
      if (hadKeyboardEvent.current) {
        setFocusVisible(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('focus', handleFocus, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('focus', handleFocus, true);
    };
  }, []);

  return focusVisible;
}

/**
 * useAriaLive Hook
 * Announces dynamic content changes to screen readers
 */
export function useAriaLive() {
  const liveRegionRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    // Create aria-live region
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';

    document.body.appendChild(liveRegion);
    liveRegionRef.current = liveRegion;

    return () => {
      if (liveRegionRef.current) {
        document.body.removeChild(liveRegionRef.current);
      }
    };
  }, []);

  const announce = React.useCallback((message: string) => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
    }
  }, []);

  return announce;
}

// Re-export React for the hooks that use it directly
import * as React from 'react';
