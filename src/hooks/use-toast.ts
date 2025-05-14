
// This file would normally import from a toast lib, but we're recreating the minimum needed

import { useState, useEffect } from "react";

// Make sure the variant type includes 'success'
export type ToastVariant = "default" | "destructive" | "accent" | "warning" | "success";

export interface Toast {
  id: string;
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: ToastVariant;
}

interface ToastOptions {
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: ToastVariant;
}

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

// Use a simplified implementation
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Clean up after TOAST_REMOVE_DELAY
    const timers = toasts.map(toast => {
      return setTimeout(() => {
        setToasts(prevToasts => prevToasts.filter(t => t.id !== toast.id));
      }, TOAST_REMOVE_DELAY);
    });
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [toasts]);

  function toast(opts: ToastOptions) {
    const id = genId();
    const newToast = { id, ...opts };
    
    setToasts(prevToasts => {
      const limitedToasts = [...prevToasts, newToast].slice(-TOAST_LIMIT);
      return limitedToasts;
    });
    
    return {
      id,
      dismiss: () => setToasts(prevToasts => prevToasts.filter(t => t.id !== id)),
      update: (props: ToastOptions) => setToasts(prevToasts => 
        prevToasts.map(t => t.id === id ? { ...t, ...props } : t)
      )
    };
  }

  function dismiss(toastId: string) {
    setToasts(prevToasts => prevToasts.filter(t => t.id !== toastId));
  }

  return {
    toasts,
    toast,
    dismiss,
  };
};

// For convenience, also provide a direct toast function
const toast = (opts: ToastOptions) => {
  // This would normally use some kind of global state management
  // For now, we're logging to console as a fallback
  console.log('Toast:', opts);
  
  // Return a dummy object for API compatibility
  return {
    id: genId(),
    dismiss: () => {},
    update: () => {}
  };
};

export { toast };
