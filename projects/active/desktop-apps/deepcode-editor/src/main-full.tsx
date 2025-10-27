import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Editor from '@monaco-editor/react';

import { logger } from './services/Logger';

import './index.css';

logger.debug('Loading DeepCode Editor Full Version...');

// Simple types
interface FileItem {
  id: string;
  name: string;
  content: string;
  language: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function DeepCodeEditor() {
  const [view, setView] = useState('welcome');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [sidebarOpen] = useState(true);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Load API key from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('deepseek_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  const createNewFile = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || 'js';
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      css: 'css',
      html: 'html',
      json: 'json',
      md: 'markdown',
    };

    const newFile: FileItem = {
      id: Date.now().toString(),
      name,
      content: `// Welcome to DeepCode Editor!\n// Start coding with AI assistance...\n\nlogger.debug('Hello from ${name}!');\n`,
      language: languageMap[ext] || 'javascript',
    };

    setFiles([...files, newFile]);
    setCurrentFile(newFile);
    setView('editor');
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('deepseek_api_key', key);
    setSettingsOpen(false);
  };

  const sendMessage = async (content: string) => {
    if (!apiKey) {
      alert('Please set your DeepSeek API key in settings!');
      setSettingsOpen(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);

    // Simulate AI response for now
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I see you're working on ${currentFile?.name || 'a new file'}. Here's how I can help:\n\n1. I can explain code concepts\n2. Help debug issues\n3. Suggest improvements\n4. Generate code snippets\n\nWhat would you like help with?`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  // Settings Dialog
  if (settingsOpen) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            background: '#2d2d30',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
          }}
        >
          <h2 style={{ margin: '0 0 1rem 0', color: '#d4d4d4' }}>Settings</h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#d4d4d4' }}>
              DeepSeek API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#1e1e1e',
                border: '1px solid #3e3e42',
                borderRadius: '4px',
                color: '#d4d4d4',
                fontSize: '14px',
              }}
            />
            <p style={{ fontSize: '12px', color: '#808080', marginTop: '0.5rem' }}>
              Get your API key from{' '}
              <a
                href="https://platform.deepseek.com"
                target="_blank"
                style={{ color: '#007acc' }}
                rel="noreferrer"
              >
                platform.deepseek.com
              </a>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setSettingsOpen(false)}
              style={{
                padding: '0.5rem 1rem',
                background: '#3e3e42',
                color: '#d4d4d4',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => saveApiKey(apiKey)}
              style={{
                padding: '0.5rem 1rem',
                background: '#007acc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Welcome View
  if (view === 'welcome') {
    return (
      <div
        style={{
          background: '#1e1e1e',
          color: '#d4d4d4',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Title Bar */}
        <div
          style={{
            background: '#2d2d30',
            padding: '0.75rem 1rem',
            borderBottom: '1px solid #3e3e42',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>⚡</span>
            <span style={{ fontWeight: 600 }}>DeepCode Editor</span>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#d4d4d4',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#3e3e42')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Welcome Content */}
        <div style={{ flex: 1, padding: '2rem' }}>
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
              DeepCode Studio
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
              onClick={() => {
                const fileName = prompt('Enter file name:', 'new-file.js');
                if (fileName) {
                  createNewFile(fileName);
                }
              }}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                padding: '2rem',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📝</div>
              <h3 style={{ margin: '0 0 1rem 0', color: 'white' }}>New File</h3>
              <p style={{ margin: 0, opacity: 0.9, color: 'white' }}>
                Create a new file and start coding with AI-powered completions
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Editor View
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#1e1e1e',
      }}
    >
      {/* Title Bar */}
      <div
        style={{
          background: '#2d2d30',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid #3e3e42',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setView('welcome')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#d4d4d4',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ←
          </button>
          <span style={{ fontSize: '1.2rem' }}>⚡</span>
          <span style={{ fontWeight: 600 }}>DeepCode Editor</span>
          {currentFile && <span style={{ color: '#808080' }}>- {currentFile.name}</span>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setAiChatOpen(!aiChatOpen)}
            style={{
              background: aiChatOpen ? '#007acc' : 'transparent',
              border: 'none',
              color: '#d4d4d4',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
            }}
          >
            💬 AI Chat
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#d4d4d4',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
            }}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        {sidebarOpen && (
          <div
            style={{
              width: '200px',
              background: '#252526',
              borderRight: '1px solid #3e3e42',
              padding: '1rem',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '14px', color: '#d4d4d4' }}>FILES</h3>
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => setCurrentFile(file)}
                style={{
                  padding: '0.5rem',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  background: currentFile?.id === file.id ? '#37373d' : 'transparent',
                  marginBottom: '0.25rem',
                  fontSize: '14px',
                  color: '#d4d4d4',
                }}
                onMouseOver={(e) => {
                  if (currentFile?.id !== file.id) {
                    e.currentTarget.style.background = '#2a2a2a';
                  }
                }}
                onMouseOut={(e) => {
                  if (currentFile?.id !== file.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                📄 {file.name}
              </div>
            ))}
          </div>
        )}

        {/* Editor */}
        <div style={{ flex: 1, display: 'flex' }}>
          <div style={{ flex: 1 }}>
            {currentFile ? (
              <Editor
                height="100%"
                theme="vs-dark"
                language={currentFile.language}
                value={currentFile.content}
                onChange={(value) => {
                  if (value !== undefined && currentFile) {
                    setFiles(
                      files.map((f) => (f.id === currentFile.id ? { ...f, content: value } : f))
                    );
                    setCurrentFile({ ...currentFile, content: value });
                  }
                }}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#808080',
                }}
              >
                Select a file to edit
              </div>
            )}
          </div>

          {/* AI Chat Panel */}
          {aiChatOpen && (
            <div
              style={{
                width: '400px',
                background: '#252526',
                borderLeft: '1px solid #3e3e42',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid #3e3e42',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '16px', color: '#d4d4d4' }}>AI Assistant</h3>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                {messages.length === 0 ? (
                  <div style={{ color: '#808080', textAlign: 'center', marginTop: '2rem' }}>
                    Ask me anything about your code!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        background: msg.role === 'user' ? '#37373d' : '#2d2d30',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#d4d4d4',
                      }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                        {msg.role === 'user' ? '👤 You' : '🤖 AI'}
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  padding: '1rem',
                  borderTop: '1px solid #3e3e42',
                }}
              >
                <input
                  type="text"
                  placeholder="Ask about your code..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      sendMessage(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: '#1e1e1e',
                    border: '1px solid #3e3e42',
                    borderRadius: '4px',
                    color: '#d4d4d4',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<DeepCodeEditor />);
  logger.debug('DeepCode Editor mounted successfully!');
}
