import React from 'react';

export const Debug: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '20px',
        zIndex: 9999,
        maxWidth: '500px',
        maxHeight: '300px',
        overflow: 'auto',
      }}
    >
      <h3>Debug Info</h3>
      <p>App loaded successfully!</p>
      <p>API Key: {import.meta.env['VITE_DEEPSEEK_API_KEY'] ? 'Set' : 'Not Set'}</p>
      <p>Base URL: {import.meta.env['VITE_DEEPSEEK_BASE_URL'] || 'Not Set'}</p>
      <p>Demo Mode: {import.meta.env['VITE_DEMO_MODE'] || 'Not Set'}</p>
      <p>Current Time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
};
