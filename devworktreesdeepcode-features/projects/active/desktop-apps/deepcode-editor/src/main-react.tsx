import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('Loading React app...');

function DeepCodeApp() {
  const [currentView, setCurrentView] = React.useState('welcome');

  const openProject = () => {
    console.log('Opening project...');
    alert('Open Project clicked! (This will open folder picker)');
  };

  const createFile = () => {
    console.log('Creating new file...');
    const fileName = prompt('Enter file name:', 'new-file.js');
    if (fileName) {
      setCurrentView('editor');
      console.log('Creating file:', fileName);
    }
  };

  if (currentView === 'editor') {
    return (
      <div
        style={{
          background: '#1e1e1e',
          color: '#d4d4d4',
          minHeight: '100vh',
          padding: '2rem',
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <button
            onClick={() => setCurrentView('welcome')}
            style={{
              background: '#007acc',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ← Back to Welcome
          </button>
        </div>

        <div
          style={{
            background: '#2d2d30',
            border: '1px solid #3e3e42',
            borderRadius: '8px',
            padding: '1rem',
            minHeight: '400px',
            fontFamily: 'Monaco, Consolas, monospace',
            fontSize: '14px',
          }}
        >
          <div style={{ color: '#608b4e' }}>{`// Welcome to DeepCode Editor!`}</div>
          <div style={{ color: '#9cdcfe' }}>
            console.log
            <span style={{ color: '#d4d4d4' }}>
              (<span style={{ color: '#ce9178' }}>&apos;Hello from DeepCode!&apos;</span>)
            </span>
          </div>
          <div></div>
          <div style={{ color: '#608b4e' }}>{`// Start coding with AI assistance...`}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#1e1e1e',
        color: '#d4d4d4',
        minHeight: '100vh',
        padding: '2rem',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          marginBottom: '3rem',
        }}
      >
        <h1
          style={{
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '3rem',
            margin: 0,
            marginBottom: '0.5rem',
          }}
        >
          ⚡ DeepCode Studio
        </h1>
        <p
          style={{
            fontSize: '1.2rem',
            opacity: 0.8,
            margin: 0,
          }}
        >
          Next-Level AI-Powered Development Experience
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <div
          onClick={openProject}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: '2rem',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            border: '2px solid rgba(255,255,255,0.1)',
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📁</div>
          <h3 style={{ margin: '0 0 1rem 0', color: 'white' }}>Open Project</h3>
          <p style={{ margin: 0, opacity: 0.9, color: 'white' }}>
            Open an existing project and let AI understand your codebase for intelligent assistance
          </p>
        </div>

        <div
          onClick={createFile}
          style={{
            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
            borderRadius: '12px',
            padding: '2rem',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            border: '2px solid rgba(255,255,255,0.1)',
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
          <h3 style={{ margin: '0 0 1rem 0', color: 'white' }}>New File</h3>
          <p style={{ margin: 0, opacity: 0.9, color: 'white' }}>
            Create a new file and start coding with AI-powered completions and suggestions
          </p>
        </div>
      </div>

      <div
        style={{
          textAlign: 'center',
          marginTop: '3rem',
          opacity: 0.7,
        }}
      >
        <p>Built with the power of DeepSeek AI and React</p>
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  console.log('Creating React root...');
  ReactDOM.createRoot(root).render(<DeepCodeApp />);
  console.log('React app mounted successfully!');
} else {
  console.error('Root element not found!');
}
