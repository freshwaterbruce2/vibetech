import { logger } from './services/Logger';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Import Monaco workers using Vite's ?worker syntax (2025 best practice)
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

import { ProductionErrorBoundary } from './components/ErrorBoundary/ProductionErrorBoundary';
import App from './App.tsx';

import './index.css';
import './styles/live-editor-stream.css'; // PHASE 7: Live editor streaming styles

// Configure Monaco Editor workers (MUST be before loader.config)
self.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === 'json') {
      return new jsonWorker();
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker();
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker();
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker();
    }
    return new editorWorker();
  }
};

// Configure Monaco Editor to use local files instead of CDN (required for Tauri/Electron)
loader.config({ monaco });
logger.debug('✅ Monaco Editor configured with Vite workers (Tauri-compatible mode)');

// Use production error boundary (no dynamic imports to avoid blocking)
const ErrorBoundary = ProductionErrorBoundary;

// Initialize the app with error boundary
const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element #root not found in DOM!');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
