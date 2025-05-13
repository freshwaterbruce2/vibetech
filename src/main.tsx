
import React from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './context/ThemeProvider';
import { NotificationsProvider } from './context/NotificationsContext';

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <ThemeProvider defaultTheme="dark" enableSystem>
        <NotificationsProvider>
          <App />
        </NotificationsProvider>
      </ThemeProvider>
    </HelmetProvider>
  </React.StrictMode>
);
