/**
 * Error Boundary Components
 * 
 * This module provides both legacy class-based and modern function-based
 * error boundary implementations for the DeepCode Editor.
 * 
 * Migration Path:
 * 1. The legacy ErrorBoundary class is kept for compatibility
 * 2. New code should use ModernErrorBoundary (function component)
 * 3. Use withErrorBoundary HOC for easy component wrapping
 * 4. Use useErrorHandler hook for imperative error handling
 */

// Re-export the legacy class component for backward compatibility
export { ErrorBoundary as LegacyErrorBoundary } from '../ErrorBoundary'

// Export modern implementations
export { 
  ModernErrorBoundary as ErrorBoundary,
  ModernErrorBoundary,
  useErrorHandler,
  withErrorBoundary 
} from './ModernErrorBoundary'

// Default export is the modern version
export { ModernErrorBoundary as default } from './ModernErrorBoundary'