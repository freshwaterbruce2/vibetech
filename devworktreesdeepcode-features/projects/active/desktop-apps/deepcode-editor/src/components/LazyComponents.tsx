import { lazy, Suspense, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import styled from 'styled-components';

import { vibeTheme } from '../styles/theme';

/**
 * Lazy Component Loading - 2025 Code Splitting Patterns
 *
 * Features:
 * - Dynamic imports for heavy components
 * - Graceful loading states
 * - Error boundaries integration
 * - Preloading strategies
 * - Route-based splitting
 */

// Loading fallback component
const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: ${vibeTheme.colors.textSecondary};

  svg {
    animation: spin 1s linear infinite;
    margin-bottom: ${vibeTheme.spacing.md};
    color: ${vibeTheme.colors.purple};
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.div`
  font-size: ${vibeTheme.typography.fontSize.sm};
`;

interface LoadingFallbackProps {
  message?: string | undefined;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = 'Loading component...',
}) => (
  <LoadingContainer>
    <Loader2 size={24} />
    <LoadingText>{message}</LoadingText>
  </LoadingContainer>
);

// Higher-order component for lazy loading with custom fallback
export function withLazyLoading(
  importFn: () => Promise<any>,
  exportName?: string,
  fallbackMessage?: string
): React.FC<any> {
  const LazyComponent = lazy(async () => {
    const module = await importFn();

    // Handle named exports
    if (exportName && exportName !== 'default') {
      // Check if the module has the named export
      if (exportName in module) {
        return { default: module[exportName] };
      }
    }

    // If it's already a default export or module itself is the component
    if ('default' in module) {
      return module;
    }

    // Otherwise, assume the module itself is the component
    return { default: module };
  });

  const WrappedComponent: React.FC<any> = (props) => (
    <Suspense fallback={<LoadingFallback message={fallbackMessage} />}>
      <LazyComponent {...props} />
    </Suspense>
  );

  WrappedComponent.displayName = `Lazy(${exportName || 'Component'})`;

  return WrappedComponent;
}

// Lazy-loaded heavy components
export const LazyMonacoEditor = lazy(() => import('@monaco-editor/react'));

export const LazyAIChat = lazy(() => import('./AIChat'));

export const LazySettings = lazy(() => import('./Settings'));

export const LazyCommandPalette = lazy(() => import('./CommandPalette'));

export const LazyErrorBoundaryExamples = lazy(() => 
  import('./ErrorBoundary/ErrorBoundaryExamples').then(module => ({
    default: module.ErrorBoundaryExamples
  }))
);

export const LazyAICodeEditor = lazy(() => import('./AICodeEditor'));

// Route-based code splitting
export const routes = {
  editor: lazy(() => import('../pages/EditorPage')),
  settings: lazy(() => import('../pages/SettingsPage')),
  welcome: lazy(() => import('../pages/WelcomePage')),
};

// Preload strategies for better UX
export const preloadStrategies = {
  // Preload on hover
  preloadOnHover: (componentName: keyof typeof preloadMap) => {
    const preloadFn = preloadMap[componentName];
    if (preloadFn) {
      preloadFn();
    }
  },

  // Preload on idle
  preloadOnIdle: (componentName: keyof typeof preloadMap) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        const preloadFn = preloadMap[componentName];
        if (preloadFn) {
          preloadFn();
        }
      });
    }
  },

  // Preload with intersection observer
  preloadOnVisible: (element: HTMLElement, componentName: keyof typeof preloadMap) => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          const preloadFn = preloadMap[componentName];
          if (preloadFn) {
            preloadFn();
          }
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  },
};

// Preload functions map
const preloadMap = {
  monacoEditor: () => import('@monaco-editor/react'),
  aiChat: () => import('./AIChat'),
  settings: () => import('./Settings'),
  commandPalette: () => import('./CommandPalette'),
  aiCodeEditor: () => import('./AICodeEditor'),
};

// Bundle size optimization utilities
export const bundleOptimization = {
  // Load heavy libraries only when needed
  loadMonaco: async () => {
    const monaco = await import('monaco-editor');
    return monaco;
  },

  // Load chart library on demand (when installed)
  loadCharts: async () => {
    // Placeholder - install recharts when needed
    // const recharts = await import('recharts')
    // return recharts
    return null;
  },

  // Load markdown parser on demand
  loadMarkdown: async () => {
    const marked = await import('marked');
    return marked;
  },
};

// Component with resource hints
export const ResourceHints: React.FC = () => {
  useEffect(() => {
    // Prefetch critical resources
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/assets/monaco-editor.js';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return null;
};

// Usage example:
/*
// In App.tsx
import { LazyAIChat, preloadStrategies } from './components/LazyComponents'

function App() {
  // Preload AI Chat when idle
  useEffect(() => {
    preloadStrategies.preloadOnIdle('aiChat')
  }, [])
  
  return (
    <div>
      {showAIChat && <LazyAIChat />}
    </div>
  )
}
*/
