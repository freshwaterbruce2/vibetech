import React from 'react';
import ReactDOM from 'react-dom/client';
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

import { ProductionErrorBoundary } from './components/ErrorBoundary/ProductionErrorBoundary';
import App from './App.tsx';

import './index.css';
import './styles/live-editor-stream.css'; // PHASE 7: Live editor streaming styles

// Configure Monaco Editor to use local files instead of CDN (required for Tauri/Electron)
loader.config({ monaco });
console.log('✅ Monaco Editor configured to use local files (Tauri-compatible mode)');

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
