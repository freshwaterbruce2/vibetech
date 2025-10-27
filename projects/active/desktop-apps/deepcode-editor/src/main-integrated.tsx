import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Editor from '@monaco-editor/react';

import { logger } from './services/Logger';

import './index.css';

logger.debug('Loading DeepCode Editor with AI Integration...');

// Types
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

// DeepSeek API Service
class DeepSeekService {
  private apiKey: string;
  private baseUrl: string = 'https://api.deepseek.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(messages: Array<{ role: string; content: string }>) {
    if (!this.apiKey || this.apiKey === 'your_actual_api_key_here') {
      throw new Error('Please set a valid API key');
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.7,
          max_tokens: 2000,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
      }

      return response;
    } catch (error) {
      logger.error('DeepSeek API Error:', error);
      throw error;
    }
  }

  async *streamResponse(response: Response) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              logger.error('Error parsing chunk:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
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
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const deepSeekService = useRef<DeepSeekService | null>(null);

  // Load API key from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('deepseek_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      deepSeekService.current = new DeepSeekService(savedKey);
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
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      go: 'go',
      rs: 'rust',
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
    deepSeekService.current = new DeepSeekService(key);
    setSettingsOpen(false);
  };

  const sendMessage = async (content: string) => {
    if (!apiKey || apiKey === 'your_actual_api_key_here') {
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

    setMessages((prev) => [...prev, userMessage]);
    setIsAiResponding(true);
    setInputValue('');

    // Build context for AI
    const systemMessage = {
      role: 'system',
      content: `You are an AI coding assistant in DeepCode Editor. The user is currently working on a file named "${currentFile?.name || 'untitled'}" with the following content:\n\n\`\`\`${currentFile?.language || 'javascript'}\n${currentFile?.content || '// empty file'}\n\`\`\`\n\nProvide helpful, concise responses about the code. When suggesting code changes, format them clearly.`,
    };

    const chatMessages = [
      systemMessage,
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content },
    ];

    try {
      if (!deepSeekService.current) {
        throw new Error('API service not initialized');
      }

      const response = await deepSeekService.current.sendMessage(chatMessages);

      // Create AI message placeholder
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Stream the response
      let fullContent = '';
      for await (const chunk of deepSeekService.current.streamResponse(response)) {
        fullContent += chunk;
        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiMessage.id ? { ...msg, content: fullContent } : msg))
        );
      }
    } catch (error) {
      logger.error('AI Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to get AI response. Please check your API key and try again.'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsAiResponding(false);
    }
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
              AI-Powered Development with DeepSeek
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
                const fileName = prompt('Enter file name:', 'example.js');
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
                Create a new file and start coding with AI-powered assistance
              </p>
            </div>
          </div>

          {apiKey && apiKey !== 'your_actual_api_key_here' ? (
            <div
              style={{
                textAlign: 'center',
                marginTop: '2rem',
                padding: '1rem',
                background: '#1a472a',
                borderRadius: '8px',
                maxWidth: '400px',
                margin: '2rem auto',
              }}
            >
              <p style={{ margin: 0, color: '#4ade80' }}>
                ✅ API Key configured - AI features enabled!
              </p>
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                marginTop: '2rem',
                padding: '1rem',
                background: '#7c2d12',
                borderRadius: '8px',
                maxWidth: '400px',
                margin: '2rem auto',
              }}
            >
              <p style={{ margin: 0, color: '#fca5a5' }}>
                ⚠️ Please configure your API key in Settings to enable AI features
              </p>
            </div>
          )}
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

            <button
              onClick={() => {
                const fileName = prompt('Enter file name:', 'newfile.js');
                if (fileName) {
                  createNewFile(fileName);
                }
              }}
              style={{
                marginTop: '1rem',
                width: '100%',
                padding: '0.5rem',
                background: '#37373d',
                border: 'none',
                borderRadius: '4px',
                color: '#d4d4d4',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              + New File
            </button>
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
                  automaticLayout: true,
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
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
                <h3 style={{ margin: 0, fontSize: '16px', color: '#d4d4d4' }}>
                  AI Assistant {isAiResponding && '(thinking...)'}
                </h3>
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
                    <p>Ask me anything about your code!</p>
                    <p style={{ fontSize: '12px', marginTop: '1rem' }}>
                      Try: &quot;Explain this code&quot; or &quot;How can I improve this?&quot;
                    </p>
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
                        {msg.role === 'user' ? '👤 You' : '🤖 AI Assistant'}
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
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={isAiResponding ? 'AI is thinking...' : 'Ask about your code...'}
                  disabled={isAiResponding}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputValue.trim() && !isAiResponding) {
                      sendMessage(inputValue.trim());
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
                    opacity: isAiResponding ? 0.6 : 1,
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
  logger.debug('DeepCode Editor with AI Integration loaded!');
}
