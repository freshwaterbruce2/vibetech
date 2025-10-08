import { FileSystemItem } from '../types';

import { ElectronService } from './ElectronService';

export class FileSystemService {
  private files: Map<string, string> = new Map();
  private electronService: ElectronService;

  constructor() {
    this.electronService = new ElectronService();
    this.initializeDemoFiles();
  }

  private initializeDemoFiles() {
    // Pre-populate demo files for web mode
    this.files.set('/home/freshbruce/deepcode-editor/demo-workspace/index.js', `// Demo JavaScript file for testing AI features

class TodoApp {
  constructor() {
    this.todos = [];
    this.nextId = 1;
  }

  addTodo(text) {
    const todo = {
      id: this.nextId++,
      text,
      completed: false,
      createdAt: new Date()
    };
    this.todos.push(todo);
    return todo;
  }

  toggleTodo(id) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
    return todo;
  }

  deleteTodo(id) {
    const index = this.todos.findIndex(t => t.id === id);
    if (index !== -1) {
      return this.todos.splice(index, 1)[0];
    }
    return null;
  }

  getTodos() {
    return this.todos;
  }
}

// TODO: Add persistence with localStorage
// TODO: Add filtering by status
// TODO: Add search functionality

module.exports = TodoApp;`);

    this.files.set('/home/freshbruce/deepcode-editor/demo-workspace/README.md', `# Demo Workspace

This is a demo workspace for testing the DeepCode Editor with Cursor IDE features.

## Features to Test

1. **Multi-Model AI Support**
   - Use the Model Selector in the title bar
   - Switch between OpenAI, Anthropic, and DeepSeek models

2. **Agent Mode (Ctrl+Shift+A)**
   - Launch autonomous coding agent
   - Describe complex tasks and watch them execute

3. **Composer Mode (Ctrl+Shift+M)**
   - Edit multiple files simultaneously
   - AI-powered code generation across files

4. **Terminal Integration**
   - Click Terminal button in status bar
   - Run commands in integrated terminal

## Quick Start

1. Open a file from the sidebar
2. Try AI-powered code completion
3. Use Agent Mode for complex tasks
4. Use Composer Mode for multi-file edits`);

    // Add more demo files
    this.files.set('/home/freshbruce/deepcode-editor/demo-workspace/styles.css', `/* Demo CSS file for testing styling features */

.todo-app {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

.todo-header {
  text-align: center;
  margin-bottom: 30px;
}

.todo-header h1 {
  color: #333;
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.todo-input {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.todo-input input {
  flex: 1;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.todo-input input:focus {
  outline: none;
  border-color: #4CAF50;
}

.todo-input button {
  padding: 12px 24px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.todo-input button:hover {
  background: #45a049;
}

.todo-list {
  list-style: none;
  padding: 0;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #4CAF50;
}

.todo-item.completed {
  opacity: 0.6;
  text-decoration: line-through;
  border-left-color: #ccc;
}

.todo-item input[type="checkbox"] {
  margin-right: 12px;
  transform: scale(1.2);
}

.todo-item span {
  flex: 1;
  font-size: 16px;
}

.todo-item button {
  background: #ff4444;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.todo-item button:hover {
  background: #cc0000;
}`);

    this.files.set('/home/freshbruce/deepcode-editor/demo-workspace/utils.js', `// Utility functions for the Todo App

/**
 * Format a date to a readable string
 * @param {Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Generate a unique ID
 * @returns {string} Unique identifier
 */
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Debounce function to limit the rate of function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Filter todos based on completion status
 * @param {Array} todos - Array of todo items
 * @param {string} filter - Filter type: 'all', 'active', 'completed'
 * @returns {Array} Filtered todos
 */
function filterTodos(todos, filter) {
  switch (filter) {
    case 'active':
      return todos.filter(todo => !todo.completed);
    case 'completed':
      return todos.filter(todo => todo.completed);
    default:
      return todos;
  }
}

/**
 * Search todos by text content
 * @param {Array} todos - Array of todo items
 * @param {string} searchTerm - Search term
 * @returns {Array} Matching todos
 */
function searchTodos(todos, searchTerm) {
  if (!searchTerm.trim()) {
    return todos;
  }
  
  const term = searchTerm.toLowerCase();
  return todos.filter(todo => 
    todo.text.toLowerCase().includes(term)
  );
}

module.exports = {
  formatDate,
  generateId,
  debounce,
  filterTodos,
  searchTodos
};`);
  }

  async readFile(path: string): Promise<string> {
    if (this.electronService.isElectron) {
      const content = await this.electronService.readFile(path);
      return content || '';
    }

    // Fallback to in-memory storage for web
    return this.files.get(path) || '';
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (this.electronService.isElectron) {
      await this.electronService.writeFile(path, content);
      return;
    }

    // Fallback to in-memory storage for web
    this.files.set(path, content);
  }

  async createFile(path: string, content: string = ''): Promise<void> {
    if (this.files.has(path)) {
      throw new Error(`File already exists: ${path}`);
    }
    this.files.set(path, content);
  }

  async deleteFile(path: string): Promise<void> {
    if (!this.files.has(path)) {
      throw new Error(`File not found: ${path}`);
    }
    this.files.delete(path);
  }

  async createDirectory(_path: string): Promise<void> {
    // For demo purposes, we'll just track directories as empty strings
  }

  async listDirectory(path: string): Promise<FileSystemItem[]> {
    if (this.electronService.isElectron) {
      // Use Electron IPC to get real directory listing
      try {
        const result = await this.electronService.readDirectory(path);
        return result?.map(item => ({
          ...item,
          type: item.isDirectory ? 'directory' as const : 'file' as const
        })) || [];
      } catch (error) {
        console.error('Error listing directory:', error);
        return [];
      }
    }

    // For web mode, return demo files if it's the demo workspace
    if (path === '/home/freshbruce/deepcode-editor/demo-workspace') {
      return [
        {
          name: 'README.md',
          path: '/home/freshbruce/deepcode-editor/demo-workspace/README.md',
          type: 'file' as const,
          size: this.files.get('/home/freshbruce/deepcode-editor/demo-workspace/README.md')?.length || 0,
          modified: new Date(),
        },
        {
          name: 'index.js',
          path: '/home/freshbruce/deepcode-editor/demo-workspace/index.js',
          type: 'file' as const,
          size: this.files.get('/home/freshbruce/deepcode-editor/demo-workspace/index.js')?.length || 0,
          modified: new Date(),
        },
        {
          name: 'styles.css',
          path: '/home/freshbruce/deepcode-editor/demo-workspace/styles.css',
          type: 'file' as const,
          size: this.files.get('/home/freshbruce/deepcode-editor/demo-workspace/styles.css')?.length || 0,
          modified: new Date(),
        },
        {
          name: 'utils.js',
          path: '/home/freshbruce/deepcode-editor/demo-workspace/utils.js',
          type: 'file' as const,
          size: this.files.get('/home/freshbruce/deepcode-editor/demo-workspace/utils.js')?.length || 0,
          modified: new Date(),
        }
      ];
    }

    console.warn('Directory listing not available in web mode for path:', path);
    return [];
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  async isDirectory(path: string): Promise<boolean> {
    // Simple check for demo purposes
    return !path.includes('.');
  }

  async getFileStats(path: string) {
    const content = this.files.get(path) || '';
    return {
      size: content.length,
      created: new Date(),
      modified: new Date(),
      isDirectory: await this.isDirectory(path),
    };
  }

  // Path utility methods
  joinPath(...paths: string[]): string {
    return paths.join('/').replace(/\/+/g, '/');
  }

  dirname(path: string): string {
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash === -1) {
      return '.';
    }
    if (lastSlash === 0) {
      return '/';
    }
    return path.substring(0, lastSlash);
  }

  basename(path: string): string {
    const lastSlash = path.lastIndexOf('/');
    return path.substring(lastSlash + 1);
  }

  isAbsolute(path: string): boolean {
    return path.startsWith('/');
  }

  relative(from: string, to: string): string {
    // Simplified relative path calculation
    if (!this.isAbsolute(from) || !this.isAbsolute(to)) {
      throw new Error('Both paths must be absolute');
    }

    const fromParts = from.split('/').filter(Boolean);
    const toParts = to.split('/').filter(Boolean);

    let commonLength = 0;
    for (let i = 0; i < Math.min(fromParts.length, toParts.length); i++) {
      if (fromParts[i] === toParts[i]) {
        commonLength++;
      } else {
        break;
      }
    }

    const upCount = fromParts.length - commonLength;
    const upParts = Array(upCount).fill('..');
    const remainingParts = toParts.slice(commonLength);

    return [...upParts, ...remainingParts].join('/') || '.';
  }

  async getDirectoryStructure(path: string): Promise<FileSystemItem> {
    const items = await this.listDirectory(path);
    return {
      name: this.basename(path) || '.',
      path,
      type: 'directory',
      children: items,
    };
  }

  async getFileInfo(path: string) {
    const stats = await this.getFileStats(path);
    return {
      ...stats,
      name: this.basename(path),
      path,
      type: (await this.isDirectory(path)) ? 'directory' : 'file',
    };
  }
}
