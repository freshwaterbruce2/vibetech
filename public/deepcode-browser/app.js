/**
 * Deepcode Browser - Main Application
 *
 * Features:
 * - Workspace search (ripgrep)
 * - Monaco editor for file viewing
 * - LSP integration (hover, completions, definitions)
 * - Learning context panel
 */

const searchInput = document.getElementById('q');
const resultsList = document.getElementById('results');
const filePathEl = document.getElementById('file-path');
const editorEl = document.getElementById('editor');
const contextContentEl = document.getElementById('context-content');

let editor = null;
let lspWs = null;
let currentFile = null;

// Initialize Monaco Editor
require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@latest/min/vs' } });
require(['vs/editor/editor.main'], () => {
  editor = monaco.editor.create(editorEl, {
    value: '',
    language: 'plaintext',
    readOnly: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true
  });
});

// Search functionality
searchInput.addEventListener('keypress', async (e) => {
  if (e.key !== 'Enter') return;

  const query = searchInput.value.trim();
  if (!query) return;

  try {
    const res = await fetch(`http://localhost:4001/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    resultsList.innerHTML = '';

    if (data.results && data.results.length > 0) {
      data.results.forEach(r => {
        const li = document.createElement('li');
        li.textContent = `${r.path}:${r.line}: ${r.preview}`;
        li.style.cursor = 'pointer';
        li.style.padding = '4px';
        li.style.borderBottom = '1px solid #eee';

        li.addEventListener('click', async () => {
          await loadFile(r.path, r.line);
        });

        resultsList.appendChild(li);
      });
    } else {
      resultsList.innerHTML = '<li>No results found</li>';
    }
  } catch (err) {
    console.error('Search failed:', err);
    resultsList.innerHTML = '<li style="color:red">Search service unavailable</li>';
  }
});

// Load file into editor
async function loadFile(path, lineNumber = 1) {
  try {
    const res = await fetch(`http://localhost:4001/file?path=${encodeURIComponent(path)}`);
    const data = await res.json();

    if (data.error) {
      editor.setValue(`Error: ${data.error}`);
      return;
    }

    currentFile = path;
    filePathEl.textContent = path;

    // Detect language from file extension
    const lang = getLanguageFromFilename(path);
    const model = monaco.editor.createModel(data.content, lang);
    editor.setModel(model);

    // Scroll to line if specified
    if (lineNumber) {
      editor.revealLineInCenter(lineNumber);
      editor.setPosition({ lineNumber, column: 1 });
    }

    // FIXED: Use actual file extension instead of language name
    // Get the actual file extension (e.g., "ts", "js", "py")
    const ext = path.split('.').pop()?.toLowerCase() || '';

    // Fetch learning context for this file
    try {
      const contextRes = await fetch(`http://localhost:4001/context/patterns?fileExtension=${ext}`);
      const context = await contextRes.json();

      // Update context panel
      let contextHTML = '';

      if (context.mistakes && context.mistakes.length > 0) {
        contextHTML += '<h5>⚠️ Past Mistakes</h5>';
        context.mistakes.forEach(m => {
          contextHTML += `<div class="hint"><strong>${m.severity || 'MEDIUM'}:</strong> ${m.description || m.mistake_description}</div>`;
        });
      }

      if (context.knowledge && context.knowledge.length > 0) {
        contextHTML += '<h5>💡 Knowledge Base</h5>';
        context.knowledge.forEach(k => {
          contextHTML += `<div class="knowledge"><strong>${k.title}:</strong> ${(k.content || '').substring(0, 100)}...</div>`;
        });
      }

      if (!contextHTML) {
        contextHTML = '<p style="color:#999">No specific patterns found for this file type.</p>';
      }

      contextContentEl.innerHTML = contextHTML;
    } catch (err) {
      console.warn('Could not fetch learning context:', err);
      contextContentEl.innerHTML = '<p style="color:#999">Learning context unavailable.</p>';
    }

    // Start LSP if not already connected
    if (!lspWs || lspWs.readyState !== WebSocket.OPEN) {
      startLSP(lang, path);
    } else {
      // Update LSP with new file
      updateLSPFile(path);
    }

  } catch (err) {
    console.error('Failed to load file:', err);
    editor.setValue(`Error loading file: ${err.message}`);
  }
}

// Language detection from filename
function getLanguageFromFilename(filename) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const langMap = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'py': 'python',
    'rs': 'rust',
    'go': 'go',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'sh': 'shell',
    'ps1': 'powershell',
    'sql': 'sql'
  };
  return langMap[ext] || 'plaintext';
}

// Start LSP connection
function startLSP(language, filePath) {
  if (lspWs && lspWs.readyState === WebSocket.OPEN) {
    return;
  }

  lspWs = new WebSocket('ws://localhost:5002');

  lspWs.onopen = () => {
    console.log('LSP connected');
    initializeLSP(language, filePath);
  };

  lspWs.onmessage = (event) => {
    handleLSPMessage(event.data);
  };

  lspWs.onerror = (error) => {
    console.error('LSP error:', error);
  };

  lspWs.onclose = () => {
    console.log('LSP disconnected');
  };
}

// Initialize LSP
function initializeLSP(language, filePath) {
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      processId: null,
      rootUri: null,
      capabilities: {},
      workspaceFolders: null
    }
  };

  sendLSPMessage(initRequest);

  // Send initialized notification
  const initialized = {
    jsonrpc: '2.0',
    method: 'initialized',
    params: {}
  };

  sendLSPMessage(initialized);

  // Open document
  updateLSPFile(filePath);
}

// Update LSP with current file
function updateLSPFile(filePath) {
  if (!currentFile || !editor) return;

  const content = editor.getValue();

  const didOpen = {
    jsonrpc: '2.0',
    method: 'textDocument/didOpen',
    params: {
      textDocument: {
        uri: `file:///${filePath.replace(/\\/g, '/')}`,
        languageId: getLanguageFromFilename(filePath),
        version: 1,
        text: content
      }
    }
  };

  sendLSPMessage(didOpen);
}

// Send LSP message
function sendLSPMessage(message) {
  if (!lspWs || lspWs.readyState !== WebSocket.OPEN) return;

  const content = JSON.stringify(message);
  // Use TextEncoder for browser-compatible byte length calculation
  const byteLength = new TextEncoder().encode(content).length;
  const header = `Content-Length: ${byteLength}\r\n\r\n`;
  lspWs.send(header + content);
}

// Handle LSP messages
function handleLSPMessage(data) {
  try {
    const message = JSON.parse(data);

    if (message.method === 'textDocument/publishDiagnostics') {
      const { diagnostics } = message.params;
      const markers = diagnostics.map(d => ({
        severity: d.severity || 1,
        startLineNumber: d.range.start.line + 1,
        startColumn: d.range.start.character + 1,
        endLineNumber: d.range.end.line + 1,
        endColumn: d.range.end.character + 1,
        message: d.message
      }));

      monaco.editor.setModelMarkers(editor.getModel(), 'lsp', markers);
    }
  } catch (err) {
    console.error('Failed to parse LSP message:', err);
  }
}

// LSP features
editor?.onDidChangeCursorPosition((e) => {
  if (!currentFile) return;

  const hoverRequest = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'textDocument/hover',
    params: {
      textDocument: {
        uri: `file:///${currentFile.replace(/\\/g, '/')}`
      },
      position: {
        line: e.position.lineNumber - 1,
        character: e.position.column - 1
      }
    }
  };

  sendLSPMessage(hoverRequest);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === ' ') {
    e.preventDefault();
    // Trigger completions
    editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
  }

  if (e.key === 'F12') {
    e.preventDefault();
    // Go to definition
    const position = editor.getPosition();
    const definitionRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'textDocument/definition',
      params: {
        textDocument: {
          uri: `file:///${currentFile.replace(/\\/g, '/')}`
        },
        position: {
          line: position.lineNumber - 1,
          character: position.column - 1
        }
      }
    };
    sendLSPMessage(definitionRequest);
  }
});
