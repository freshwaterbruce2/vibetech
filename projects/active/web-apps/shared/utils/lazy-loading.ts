import React from 'react';

interface LazyRouteOptions {
  priority?: 'low' | 'medium' | 'high';
  preload?: boolean;
  dependencies?: string[];
}

// Simple preloader implementation
export const globalPreloader = {
  actions: new Map<string, number>(),
  callbacks: new Map<string, () => void>(),

  recordAction(action: string) {
    const count = this.actions.get(action) || 0;
    this.actions.set(action, count + 1);
  },

  registerPreloadCallback(route: string, callback: () => void) {
    this.callbacks.set(route, callback);
  },

  triggerPreload(route: string) {
    const callback = this.callbacks.get(route);
    if (callback) {
      callback();
    }
  }
};

export function createLazyRoute(
  importFn: () => Promise<any>,
  routeName: string,
  options: LazyRouteOptions = {}
) {
  const LazyComponent = React.lazy(importFn);

  // Auto-preload high priority routes
  if (options.preload && options.priority === 'high') {
    setTimeout(() => importFn().catch(() => {}), 100);
  }

  return LazyComponent;
}
