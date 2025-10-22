import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(
  document.getElementById('root')
);
root.render(
  React.createElement(React.StrictMode, null,
    React.createElement(App, null)
  )
);

// Register service worker for PWA functionality
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('[PWA] NOVA is ready for offline use');
  },
  onUpdate: (registration) => {
    console.log('[PWA] New version available');
    // You could show a custom update notification here
  }
});

// Request notification permission for enhanced PWA experience
serviceWorkerRegistration.requestNotificationPermission();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();