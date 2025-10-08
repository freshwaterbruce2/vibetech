import React from 'react';
import ReactDOM from 'react-dom/client';

import { ProductionErrorBoundary } from './components/ErrorBoundary/ProductionErrorBoundary';
import App from './App.tsx';

import './index.css';

// Use production or development error boundary based on environment
const ErrorBoundary = import.meta.env.PROD
  ? ProductionErrorBoundary
  : (await import('./components/ErrorBoundary/index')).ModernErrorBoundary;

// Initialize the app with error boundary
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  console.error('Root element not found!');
}
