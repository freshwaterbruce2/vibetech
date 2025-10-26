import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';

// New AI components
import ComposerMode from './components/AgentMode/ComposerMode';
import { BackgroundTaskPanel } from './components/BackgroundTaskPanel';
import { ComponentLibrary } from './components/ComponentLibrary';
import Editor from './components/Editor';
import { EditorStreamPanel } from './components/EditorStreamPanel';
import { ModernErrorBoundary } from './components/ErrorBoundary/index';
import { ErrorFixPanel } from './components/ErrorFixPanel';
import GitPanel from './components/GitPanel';
import { GlobalSearch } from './components/GlobalSearch';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
// Lazy loaded components
import { LazyAIChat, LazyCommandPalette, LazySettings } from './components/LazyComponents';
import ModelSelector from './components/ModelSelector/ModelSelector';
import { MultiFileEditApprovalPanel } from './components/MultiFileEditApprovalPanel';
// Components
import { NotificationContainer } from './components/Notification';
import { PreviewPanel } from './components/PreviewPanel';
// Visual no-code features
import { ScreenshotToCodePanel } from './components/ScreenshotToCodePanel';
import Sidebar from './components/Sidebar';
import StatusBar from './components/StatusBar';
import { TerminalPanel } from './components/TerminalPanel';
// Components - Using lazy loading for heavy components
import TitleBar from './components/TitleBar';
import { VisualEditor } from './components/VisualEditor';
import WelcomeScreen from './components/WelcomeScreen';
import { useAIChat } from './hooks/useAIChat';
import { useAICommandPalette } from './hooks/useAICommandPalette';
import { useAppSettings } from './hooks/useAppSettings';
import { useBackgroundTaskNotifications } from './hooks/useBackgroundTaskNotifications';
import { useFileManager } from './hooks/useFileManager';
import { useNotifications } from './hooks/useNotifications';
// Custom Hooks
import { useWorkspace } from './hooks/useWorkspace';
import { ExecutionEngine } from './services/ai/ExecutionEngine';
import { TaskPlanner } from './services/ai/TaskPlanner';
// Services
import { UnifiedAIService } from './services/ai/UnifiedAIService';
import { AutoFixCodeActionProvider } from './services/AutoFixCodeActionProvider';
import type { FixSuggestion,GeneratedFix } from './services/AutoFixService';
import { AutoFixService } from './services/AutoFixService';
import { autoUpdater } from './services/AutoUpdateService';
import { BackgroundAgentSystem } from './services/BackgroundAgentSystem';
// Database service
import { DatabaseService } from './services/DatabaseService';
import { DesignTokenManager } from './services/DesignTokenManager';
import type { DetectedError } from './services/ErrorDetector';
import { ErrorDetector } from './services/ErrorDetector';
import { FileSystemService } from './services/FileSystemService';
import { LiveEditorStream } from './services/LiveEditorStream';
import { logger } from './services/Logger';
import { MultiFileEditor } from './services/MultiFileEditor';
// import { GitService } from './services/GitService'; // Disabled for browser - uses Node.js child_process
import { SearchService } from './services/SearchService';
import { telemetry } from './services/TelemetryService';
import { WorkspaceService } from './services/WorkspaceService';
import type { FileChange, MultiFileEditPlan } from './types/multifile';
import { getUserFriendlyError } from './utils/errorHandler';
import { SecureApiKeyManager } from './utils/SecureApiKeyManager';
// Types
import { AIMessage, EditorFile } from './types';

// Browser-compatible Mock GitService (git_commit won't work in browser mode)
class MockGitService {
  async commit(_message: string): Promise<void> {
    logger.warn('[MockGitService] Git commits not supported in browser mode. Use Tauri/Electron version for git integration.');
    throw new Error('Git operations require Tauri/Electron environment');
  }
}

// Database service singleton (outside component)
let dbService: DatabaseService | null = null;
const _dbInitialized = false;
let dbInitError: Error | null = null;

const getDatabase = async (): Promise<DatabaseService> => {
  if (!dbService) {
    dbService = new DatabaseService();
    try {
      await dbService.initialize();
      logger.info('[App] Database initialized successfully');
    } catch (error) {
      dbInitError = error as Error;
      logger.warn('[App] Database initialization failed, using localStorage fallback:', error);
      // Service will automatically use localStorage fallback
    }

    // Expose to window for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
      (window as any).__deepcodeDB = dbService;
      (window as any).__deepcodeDBStatus = () => dbService?.getStatus();
      logger.debug('[App] Database service exposed to window.__deepcodeDB for debugging');
    }
  }
  return dbService;
};

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: #1e1e1e;
  color: #d4d4d4;
  overflow: hidden;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
`;

const EditorSection = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;
`;

const LoadingScreen = styled(motion.div)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const LoadingLogo = styled.div`
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #00d2ff, #3a7bd5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

function App() {
  const [isLoading] = useState(false); // Start without loading screen

  // Initialize services
  const [aiService] = useState(() => new UnifiedAIService());
  const [fileSystemService] = useState(() => new FileSystemService());
  const [workspaceService] = useState(() => new WorkspaceService());
  const [gitService] = useState(() => new MockGitService() as any); // Use MockGitService in browser mode
  const [multiFileEditor] = useState(() => new MultiFileEditor(aiService, fileSystemService));

  // Initialize Agent Mode V2 services
  const [taskPlanner] = useState(() => new TaskPlanner(aiService, fileSystemService));
  const [liveStream] = useState(() => new LiveEditorStream()); // PHASE 7: Live editor streaming
  const [executionEngine] = useState(() => {
    const engine = new ExecutionEngine(fileSystemService, aiService, workspaceService, gitService);
    engine.setLiveStream(liveStream); // Connect live streaming
    return engine;
  });
  const [backgroundAgentSystem] = useState(() =>
    new BackgroundAgentSystem(executionEngine, taskPlanner, 3) // Max 3 concurrent tasks
  );

  // Notifications
  const { notifications, showError, showSuccess, showWarning, removeNotification } =
    useNotifications();

  // Background task notifications
  useBackgroundTaskNotifications({
    backgroundAgentSystem,
    showSuccess,
    showError,
    showWarning
  });

  // Workspace management
  const { workspaceContext, isIndexing, indexingProgress, getFileContext, indexWorkspace } =
    useWorkspace();

  // App settings and UI state
  const {
    settingsOpen,
    setSettingsOpen,
    editorSettings,
    updateEditorSettings,
    sidebarOpen,
    setSidebarOpen,
    workspaceFolder,
    setWorkspaceFolder,
  } = useAppSettings();

  // File management
  const {
    currentFile,
    openFiles,
    handleOpenFile: handleOpenFileRaw,
    handleCloseFile,
    handleFileChange,
    handleSaveFile,
    setCurrentFile,
    setOpenFiles,
  } = useFileManager({
    fileSystemService,
    onSaveSuccess: (fileName) => showSuccess('File Saved', `${fileName} saved successfully`),
    onSaveError: (fileName) => showError('Save Failed', `Unable to save ${fileName}`),
  });

  // Wrap handleOpenFile with error handling
  const handleOpenFile = useCallback(async (filePath: string) => {
    try {
      await handleOpenFileRaw(filePath);
    } catch (error) {
      logger.error('[App] Failed to open file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to open file';
      showError('Open File Failed', errorMessage);
    }
  }, [handleOpenFileRaw, showError]);

  // Preview panel state
  const [previewOpen, setPreviewOpen] = useState(false);

  // Chat mode state
  const [chatMode, setChatMode] = useState<'chat' | 'agent' | 'composer'>('chat');

  // AI Chat
  const {
    aiMessages,
    aiChatOpen,
    setAiChatOpen,
    handleSendMessage: handleAIMessage,
    addAiMessage,
    updateAiMessage,
  } = useAIChat({
    aiService,
    currentFile,
    workspaceContext: workspaceContext || undefined,
    openFiles,
    workspaceFolder,
    sidebarOpen,
    previewOpen,
    onError: (error) =>
      showError(
        'AI Service Error',
        getUserFriendlyError({
          message: error.message,
          timestamp: new Date(),
        })
      ),
  });

  // Git panel state
  const [gitPanelOpen, _setGitPanelOpen] = useState(false);
  
  // Composer Mode state
  const [composerModeOpen, setComposerModeOpen] = useState(false);

  // Global search state
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  
  // Keyboard shortcuts state
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  const [backgroundPanelOpen, setBackgroundPanelOpen] = useState(false);

  // Visual panel state
  const [activeVisualPanel, setActiveVisualPanel] = useState<'none' | 'screenshot' | 'library' | 'visual'>('none');

  // Multi-file edit approval state
  const [multiFileEditPlan, setMultiFileEditPlan] = useState<MultiFileEditPlan | null>(null);
  const [multiFileChanges, setMultiFileChanges] = useState<FileChange[]>([]);
  const [multiFileApprovalOpen, setMultiFileApprovalOpen] = useState(false);

  // Initialize design tokens (memoized) - reserved for future use
  const _designTokens = useMemo(() => {
    return DesignTokenManager.loadFromLocalStorage() || new DesignTokenManager();
  }, []);

  // Auto-Fix Error Panel state
  const [currentError, setCurrentError] = useState<DetectedError | null>(null);
  const [currentFix, setCurrentFix] = useState<GeneratedFix | null>(null);
  const [errorFixPanelOpen, setErrorFixPanelOpen] = useState(false);
  const [fixLoading, setFixLoading] = useState(false);
  const [fixError, setFixError] = useState<string>('');
  const [terminalOpen, setTerminalOpen] = useState(false);

  // Auto-Fix refs
  const editorRef = useRef<any>(null); // Monaco editor instance
  const errorDetectorRef = useRef<ErrorDetector | null>(null);
  const autoFixServiceRef = useRef<AutoFixService | null>(null);
  const codeActionProviderRef = useRef<any>(null); // Monaco disposable for code action provider

  // Search service
  const searchService = new SearchService(fileSystemService);
  const [currentModel, setCurrentModel] = useState('deepseek-chat');
  const [deepseekApiKey, setDeepseekApiKey] = useState<string>('');

  // Auto-Fix: Handle editor mount - initialize error detection
  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    logger.debug('[AutoFix] Editor mounted, initializing error detection');
    editorRef.current = editor;

    // Initialize AutoFixService
    autoFixServiceRef.current = new AutoFixService(aiService);
    logger.debug('[AutoFix] AutoFixService initialized');

    // Initialize ErrorDetector
    errorDetectorRef.current = new ErrorDetector({
      editor,
      monaco,
      onError: (error: DetectedError) => {
        logger.debug('[AutoFix] Error detected:', error);
        setCurrentError(error);
        setErrorFixPanelOpen(true);
        setFixLoading(true);
        setFixError('');
        setCurrentFix(null);

        // Generate fix suggestions
        autoFixServiceRef.current?.generateFix(error, editor)
          .then((fix) => {
            logger.debug('[AutoFix] Fix generated:', fix);
            setCurrentFix(fix);
            setFixLoading(false);
          })
          .catch((err) => {
            logger.error('[AutoFix] Fix generation failed:', err);
            setFixError(err.message || 'Failed to generate fix');
            setFixLoading(false);
          });
      },
      onErrorResolved: (errorId: string) => {
        logger.debug('[AutoFix] Error resolved:', errorId);
        // Auto-dismiss panel if error is resolved
        if (currentError?.id === errorId) {
          setErrorFixPanelOpen(false);
          setCurrentError(null);
          setCurrentFix(null);
        }
      },
    });

    logger.debug('[AutoFix] ErrorDetector initialized');

    // Register Monaco Code Actions Provider for "Fix with AI" in context menu
    if (autoFixServiceRef.current && errorDetectorRef.current) {
      const provider = new AutoFixCodeActionProvider({
        autoFixService: autoFixServiceRef.current,
        errorDetector: errorDetectorRef.current,
        onFixApplied: (fixTitle: string) => {
          showSuccess('Fix Applied', fixTitle);
        },
        onFixFailed: (error: Error) => {
          showError('Fix Failed', error.message);
        }
      });

      // Register provider for all languages
      const disposable = monaco.languages.registerCodeActionProvider('*', provider);
      codeActionProviderRef.current = disposable;

      // Register command handlers
      provider.registerCommandHandlers(editor, monaco);

      logger.debug('[AutoFix] Code Actions Provider registered');
    }
  }, [aiService, currentError, showSuccess, showError]);

  // Auto-Fix: Apply suggested fix
  const handleApplyFix = useCallback((suggestion: FixSuggestion) => {
    if (!editorRef.current || !currentError) {
      logger.error('[AutoFix] Cannot apply fix: editor or error not available');
      return;
    }

    logger.debug('[AutoFix] Applying fix:', suggestion);

    try {
      const editor = editorRef.current;
      const model = editor.getModel();

      if (!model) {
        throw new Error('Editor model not available');
      }

      // Apply the fix
      editor.executeEdits('auto-fix', [{
        range: {
          startLineNumber: suggestion.startLine,
          startColumn: 1,
          endLineNumber: suggestion.endLine,
          endColumn: model.getLineMaxColumn(suggestion.endLine),
        },
        text: suggestion.code,
      }]);

      // Success feedback
      showSuccess('Fix Applied', suggestion.title);

      // Close panel
      setErrorFixPanelOpen(false);
      setCurrentError(null);
      setCurrentFix(null);

      logger.debug('[AutoFix] Fix applied successfully');
    } catch (error) {
      logger.error('[AutoFix] Failed to apply fix:', error);
      showError('Fix Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [currentError, showSuccess, showError]);

  // Global search handlers
  const handleOpenFileFromSearch = useCallback((file: string, line?: number, column?: number) => {
    handleOpenFile(file);
    // TODO: Navigate to specific line/column in editor
    if (line) {
      // Add logic to jump to line in Monaco editor
      logger.debug('Navigate to line:', line, 'column:', column);
    }
  }, [handleOpenFile]);

  const handleReplaceInFile = useCallback(async (
    file: string, 
    searchText: string, 
    replaceText: string, 
    options: any
  ) => {
    try {
      const result = await searchService.replaceInFile(
        file, 
        searchService['createSearchPattern'](searchText, options), 
        replaceText, 
        options
      );
      
      if (result.success && result.replacements > 0) {
        showSuccess('Replace Complete', `Replaced ${result.replacements} occurrences in ${file}`);
        
        // Refresh the file if it's currently open
        if (currentFile?.path === file) {
          const content = await fileSystemService.readFile(file);
          if (content !== undefined) {
            handleFileChange(content);
          }
        }
      }
    } catch (error) {
      showError('Replace Failed', `Failed to replace in ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [searchService, fileSystemService, currentFile, handleFileChange, showSuccess, showError]);

  // Visual panel handlers
  const handleToggleScreenshotPanel = useCallback(() => {
    setActiveVisualPanel(prev => prev === 'screenshot' ? 'none' : 'screenshot');
  }, []);

  const handleToggleComponentLibrary = useCallback(() => {
    setActiveVisualPanel(prev => prev === 'library' ? 'none' : 'library');
  }, []);

  const handleToggleVisualEditor = useCallback(() => {
    setActiveVisualPanel(prev => prev === 'visual' ? 'none' : 'visual');
  }, []);

  // Insert generated code into editor
  const handleInsertCode = useCallback((code: string) => {
    if (editorRef.current) {
      const position = editorRef.current.getPosition();
      editorRef.current.executeEdits('insert-code', [{
        range: {
          startLineNumber: position?.lineNumber || 1,
          startColumn: position?.column || 1,
          endLineNumber: position?.lineNumber || 1,
          endColumn: position?.column || 1,
        },
        text: code,
      }]);
    }
  }, []);

  // Multi-File Edit handlers
  const handleApplyMultiFileChanges = useCallback(async (selectedFiles: string[]) => {
    if (!multiFileEditPlan) {
      logger.error('[MultiFileEdit] No plan available');
      return;
    }

    try {
      const selectedChanges = multiFileChanges.filter(c => selectedFiles.includes(c.path));

      // Apply changes using MultiFileEditor
      const result = await multiFileEditor.applyChanges(selectedChanges);

      if (result.success) {
        showSuccess(
          'Changes Applied',
          `Successfully applied changes to ${result.appliedFiles.length} file(s)`
        );

        // Refresh currently open file if it was changed
        if (currentFile && selectedFiles.includes(currentFile.path)) {
          const content = await fileSystemService.readFile(currentFile.path);
          if (content !== undefined) {
            handleFileChange(content);
          }
        }
      } else {
        showError('Apply Failed', result.error || 'Unknown error');
      }

      // Close panel
      setMultiFileApprovalOpen(false);
      setMultiFileEditPlan(null);
      setMultiFileChanges([]);
    } catch (error) {
      logger.error('[MultiFileEdit] Failed to apply changes:', error);
      showError('Apply Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [multiFileEditPlan, multiFileChanges, multiFileEditor, currentFile, fileSystemService, handleFileChange, showSuccess, showError]);

  const handleRejectMultiFileChanges = useCallback(() => {
    setMultiFileApprovalOpen(false);
    setMultiFileEditPlan(null);
    setMultiFileChanges([]);
    logger.debug('[MultiFileEdit] Changes rejected');
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global search: Ctrl+Shift+F
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }

      // Agent Mode: Ctrl+Shift+A (open AI Chat in Agent Mode)
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setAiChatOpen(true);
        setChatMode('agent');
      }

      // Keyboard shortcuts: Ctrl+K Ctrl+S
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        const handleCtrlS = (nextEvent: KeyboardEvent) => {
          if (nextEvent.ctrlKey && nextEvent.key === 's') {
            nextEvent.preventDefault();
            setKeyboardShortcutsOpen(true);
            window.removeEventListener('keydown', handleCtrlS);
          }
        };
        window.addEventListener('keydown', handleCtrlS);
        setTimeout(() => window.removeEventListener('keydown', handleCtrlS), 2000);
      }
      
      // Command palette: Ctrl+Shift+P
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        // Command palette is handled by useCommandPalette hook
      }

      // Toggle Terminal: Ctrl+`
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setTerminalOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle workspace opening with file picker
  const handleOpenFolderDialog = async () => {
    try {
      logger.debug('Opening folder dialog...');

      // Check if Electron API is available
      if (window.electron?.isElectron) {
        logger.debug('[App] Using Electron dialog API');
        const result = await window.electron.dialog.openFolder({});
        logger.debug('[App] Electron dialog result:', result);
        if (!result.canceled && result.filePaths.length > 0 && result.filePaths[0]) {
          // Normalize path to forward slashes
          const normalizedPath = result.filePaths[0].replace(/\\/g, '/');
          logger.debug('[App] Opening folder:', normalizedPath);
          await handleOpenFolder(normalizedPath);
        } else {
          logger.debug('[App] Folder selection cancelled');
        }
      } else if ('showDirectoryPicker' in window) {
        // Use browser's File System Access API
        logger.debug('Using File System Access API');
        const dirHandle = await (window as any).showDirectoryPicker();
        logger.debug('Directory handle:', dirHandle);

        // Store the full path if available, otherwise use name
        const folderPath = dirHandle.path || dirHandle.name;
        logger.debug('Selected folder path:', folderPath);
        await handleOpenFolder(folderPath);
      } else {
        // Fallback: prompt for folder path
        logger.debug('Using prompt fallback');
        const folderPath = prompt('Enter folder path (e.g., C:\\Users\\YourName\\Projects\\MyProject):');
        if (folderPath) {
          await handleOpenFolder(folderPath);
        }
      }
    } catch (error) {
      logger.error('Error opening folder:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        logger.debug('User cancelled folder selection');
        return; // Don't show error for user cancellation
      }
      showError('Open Folder Failed', `Unable to open the selected folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle workspace opening
  const handleOpenFolder = async (folderPath: string) => {
    try {
      logger.debug(`Opening workspace: ${folderPath}`);
      setWorkspaceFolder(folderPath);

      // Start workspace indexing and get the context
      const indexedContext = await indexWorkspace(folderPath);

      if (indexedContext) {
        // Update AI assistant with workspace context using the returned context
        const contextMessage: AIMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ **Workspace Indexed Successfully!**

I've analyzed your project at \`${folderPath}\` and I'm now ready to help with:

🔍 **Repository Understanding**: ${indexedContext.totalFiles || 0} files indexed
🚀 **Multi-file Context**: I understand relationships between your files
⚡ **Smart Suggestions**: Context-aware code completion and generation
🧠 **Project Knowledge**: Familiar with your codebase structure

**Languages Detected**: ${indexedContext.languages.join(', ') || 'Analyzing...'}
**Test Files**: ${indexedContext.testFiles || 0} detected

Try asking me:
- "Create a new component that fits my project structure"
- "Explain how this file relates to others"
- "Generate tests for this function"
- "Refactor this code to match project patterns"

I'm now your context-aware coding companion! 🎯`,
          timestamp: new Date(),
        };

        addAiMessage(contextMessage);
      } else {
        throw new Error('Failed to index workspace');
      }
    } catch (error) {
      logger.error('Failed to open workspace:', error);

      const errorMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Failed to index workspace at \`${folderPath}\`. I can still help with individual files, but won't have full project context. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };

      addAiMessage(errorMessage);
    }
  };

  // Helper function for creating new files from welcome screen
  const handleCreateFile = (name: string) => {
    const getLanguageFromExtension = (filePath: string): string => {
      const ext = filePath.split('.').pop()?.toLowerCase();
      const languageMap: Record<string, string> = {
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        py: 'python',
        java: 'java',
        cpp: 'cpp',
        c: 'c',
        cs: 'csharp',
        php: 'php',
        rb: 'ruby',
        go: 'go',
        rs: 'rust',
        html: 'html',
        css: 'css',
        scss: 'scss',
        json: 'json',
        xml: 'xml',
        yaml: 'yaml',
        yml: 'yaml',
        md: 'markdown',
        sh: 'shell',
        sql: 'sql',
      };
      return languageMap[ext || ''] || 'plaintext';
    };

    const newFile: EditorFile = {
      id: name,
      name,
      path: name,
      content: '',
      language: getLanguageFromExtension(name),
      isModified: false,
    };

    // This would typically use the file manager, but for new files we need direct state manipulation
    setCurrentFile(newFile);
  };

  // Handle file deletion
  const handleDeleteFile = async (filePath: string): Promise<void> => {
    try {
      await fileSystemService.deleteFile(filePath);

      // Close the file if it's currently open
      if (currentFile?.path === filePath) {
        setCurrentFile(null);
      }

      // Remove from open files list if present
      const updatedOpenFiles = openFiles.filter(file => file.path !== filePath);
      setOpenFiles(updatedOpenFiles);

      showSuccess('File Deleted', `Successfully deleted ${filePath.split('/').pop()}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showError('Delete Failed', `Unable to delete file: ${errorMessage}`);
      throw error; // Re-throw to let Sidebar handle it if needed
    }
  };

  // Handle saving all open files
  const handleSaveAll = async () => {
    try {
      let savedCount = 0;
      for (const file of openFiles) {
        if (file.isModified) {
          await fileSystemService.writeFile(file.path, file.content);
          savedCount++;
        }
      }
      if (savedCount > 0) {
        showSuccess('Files Saved', `Successfully saved ${savedCount} file(s)`);
      } else {
        showWarning('No Changes', 'No files needed to be saved');
      }
    } catch (error) {
      showError('Save Failed', 'Unable to save all files');
    }
  };

  // Handle closing current workspace
  const handleCloseFolder = () => {
    setWorkspaceFolder(null);
    setCurrentFile(null);
    setOpenFiles([]);
    showSuccess('Workspace Closed', 'Workspace has been closed');
  };

  // Handle creating new file
  const handleNewFile = () => {
    const fileName = prompt('Enter new file name (e.g., script.js):');
    if (fileName) {
      handleCreateFile(fileName);
    }
  };

  // AI Command Handler
  const handleAICommand = useCallback(async (command: string) => {
    if (!currentFile || !currentFile.content) {
      showWarning('Please open a file first');
      return;
    }

    // Open AI chat if not already open
    if (!aiChatOpen) {
      setAiChatOpen(true);
    }

    // Build prompt based on command
    let prompt = '';
    const selectedCode = currentFile.content; // In a full implementation, get actual selection

    switch (command) {
      case 'explain':
        prompt = `Please explain this code:\n\n${selectedCode}`;
        break;
      case 'generate-tests':
        prompt = `Generate comprehensive test cases for this code:\n\n${selectedCode}`;
        break;
      case 'refactor':
        prompt = `Refactor this code to improve quality, readability, and maintainability:\n\n${selectedCode}`;
        break;
      case 'fix-bugs':
        prompt = `Analyze this code for potential bugs and suggest fixes:\n\n${selectedCode}`;
        break;
      case 'optimize':
        prompt = `Optimize this code for better performance:\n\n${selectedCode}`;
        break;
      case 'add-comments':
        prompt = `Add clear, helpful comments to this code:\n\n${selectedCode}`;
        break;
      case 'generate-component':
        prompt = 'Generate a React component based on the following description:\n[Component description]';
        break;
      default:
        prompt = selectedCode;
    }

    // Send to AI chat
    await handleAIMessage(prompt);
    showSuccess(`AI ${command} command executed`);
  }, [currentFile, aiChatOpen, setAiChatOpen, handleAIMessage, showSuccess, showWarning]);

  // AI-Powered Command Palette
  const { commandPaletteOpen, setCommandPaletteOpen, commands } = useAICommandPalette({
    onSaveFile: handleSaveFile,
    onOpenFolder: handleOpenFolderDialog,
    onNewFile: handleNewFile,
    onSaveAll: handleSaveAll,
    onCloseFolder: handleCloseFolder,
    onToggleSidebar: () => setSidebarOpen(!sidebarOpen),
    onToggleAIChat: () => setAiChatOpen(!aiChatOpen),
    onOpenSettings: () => setSettingsOpen(true),
    onAIExplainCode: () => handleAICommand('explain'),
    onAIGenerateTests: () => handleAICommand('generate-tests'),
    onAIRefactor: () => handleAICommand('refactor'),
    onAIFixBugs: () => handleAICommand('fix-bugs'),
    onAIOptimize: () => handleAICommand('optimize'),
    onAIAddComments: () => handleAICommand('add-comments'),
    onAIGenerateComponent: () => handleAICommand('generate-component'),
    onFormatDocument: () => {
      // Format will be handled by Monaco editor
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'f',
        shiftKey: true,
        altKey: true,
        bubbles: true,
      }));
    },
    currentFile: currentFile?.path || null,
  });
  
  // Composer Mode handler
  const handleComposerModeApply = async (files: any[]) => {
    try {
      // TODO: Implement multi-file changes application
      for (const file of files) {
        await fileSystemService.writeFile(file.path, file.content);
      }
      showSuccess('Composer Mode', `Applied changes to ${files.length} files`);
      setComposerModeOpen(false);
    } catch (error) {
      showError('Composer Mode', 'Failed to apply changes');
    }
  };
  
  const handleModelChange = async (model: string) => {
    setCurrentModel(model);
    // Update AI service with new model
    try {
      await aiService.setModel(model);
    } catch (error) {
      showError(
        'Model Error',
        error instanceof Error ? error.message : 'Failed to update AI model'
      );
    }
  };

  // State for database initialization status
  const [_dbStatus, setDbStatus] = useState<'initializing' | 'ready' | 'fallback'>('initializing');

  // Initialize database
  useEffect(() => {
    const initDatabase = async () => {
      setDbStatus('initializing');

      try {
        const db = await getDatabase();

        // Check if we're using fallback (by trying a simple operation)
        const usingFallback = await db.getSetting('_db_test_key').then(
          () => false,
          () => true
        );

        if (usingFallback || dbInitError) {
          setDbStatus('fallback');
          showWarning(
            'Database Service',
            'Unable to access database. Using localStorage for data persistence. Some features may be limited.'
          );
          logger.info('[App] Database using localStorage fallback mode');
        } else {
          setDbStatus('ready');
          logger.info('[App] Database initialized successfully with full features');

          // Log analytics event only if database is fully functional
          try {
            await db.logEvent('app_start', {
              platform: navigator.platform,
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
            });
          } catch (analyticsError) {
            // Don't fail app startup if analytics fails
            logger.warn('[App] Failed to log analytics event:', analyticsError);
          }
        }

        // Migrate strategy patterns from localStorage if available
        if (!usingFallback) {
          try {
            const migrationResult = await db.migrateStrategyMemory();
            if (migrationResult.migrated > 0) {
              logger.info(`[App] Migrated ${migrationResult.migrated} strategy patterns to database`);
            }
          } catch (migrationError) {
            logger.warn('[App] Strategy migration failed:', migrationError);
          }
        }
      } catch (error) {
        logger.error('[App] Critical database initialization error:', error);
        setDbStatus('fallback');
        showError(
          'Database Error',
          'Failed to initialize database service. The application will continue with limited functionality.'
        );
      }
    };

    // Initialize database asynchronously to avoid blocking app startup
    const timer = setTimeout(() => {
      initDatabase().catch(error => {
        logger.error('[App] Uncaught database initialization error:', error);
        setDbStatus('fallback');
      });
    }, 100); // Small delay to let the UI render first

    return () => clearTimeout(timer);
  }, [showWarning, showError]);

  // Initialize the application
  useEffect(() => {
    // Track app initialization
    telemetry.trackEvent('app_initialized', {
      version: import.meta.env['VITE_APP_VERSION'],
      platform: navigator.platform,
      language: navigator.language,
    });

    // Check for updates
    autoUpdater.checkForUpdates().then((updateInfo) => {
      if (updateInfo && updateInfo.mandatory) {
        showWarning(
          'Update Available',
          `Version ${updateInfo.version} is available. This is a mandatory update.`
        );
      }
    });

    // Auto-open demo workspace if no workspace is open (web mode only)
    if (!workspaceFolder && openFiles.length === 0 && !window.electron) {
      const demoPath = '/home/freshbruce/deepcode-editor/demo-workspace';
      handleOpenFolder(demoPath);
      // Open the index.js file automatically
      setTimeout(() => {
        handleOpenFile(`${demoPath}/index.js`);
      }, 1500); // Increased timeout to allow workspace to load
    }

    logger.debug('App initialization complete');
  }, [showWarning]);

  // Load DeepSeek API key on mount
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const keyManager = SecureApiKeyManager.getInstance();
        const key = await keyManager.getApiKey('deepseek');
        if (key) {
          setDeepseekApiKey(key);
        }
      } catch (error) {
        logger.error('Failed to load DeepSeek API key:', error);
      }
    };
    loadApiKey();
  }, []);

  if (isLoading) {
    return (
      <AnimatePresence>
        <LoadingScreen
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <LoadingLogo>⚡ DeepCode</LoadingLogo>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 40,
              height: 40,
              border: '3px solid rgba(255,255,255,0.3)',
              borderRadius: '50%',
              borderTopColor: '#00d2ff',
            }}
          />
        </LoadingScreen>
      </AnimatePresence>
    );
  }

  return (
    <ModernErrorBoundary
      onError={(error, errorInfo) => {
        logger.error('App Error:', error, errorInfo);
        showError('Application Error', 'An unexpected error occurred. Please refresh the page.');
      }}
      onReset={() => {
        // Clear any error state
        window.location.reload();
      }}
    >
      <Router>
        <AppContainer data-testid="app-container">
          <TitleBar
            onSettingsClick={() => setSettingsOpen(true)}
            onNewFile={handleNewFile}
            onOpenFolder={handleOpenFolderDialog}
            onSaveAll={handleSaveAll}
            onCloseFolder={handleCloseFolder}
            onScreenshotToCode={() => setActiveVisualPanel(activeVisualPanel === 'screenshot' ? 'none' : 'screenshot')}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onToggleAIChat={() => setAiChatOpen(!aiChatOpen)}
            onTogglePreview={() => setPreviewOpen(!previewOpen)}
            onToggleBackgroundPanel={() => setBackgroundPanelOpen(!backgroundPanelOpen)}
            previewOpen={previewOpen}
          >
            <ModelSelector
              currentModel={currentModel}
              onModelChange={handleModelChange}
            />
          </TitleBar>
          <MainContent>
            {sidebarOpen && (
              <Sidebar
                workspaceFolder={workspaceFolder}
                onOpenFile={handleOpenFile}
                onToggleAIChat={() => setAiChatOpen(!aiChatOpen)}
                aiChatOpen={aiChatOpen}
                fileSystemService={fileSystemService}
                onDeleteFile={handleDeleteFile}
                onOpenFolder={handleOpenFolderDialog}
                onShowSettings={() => setSettingsOpen(true)}
              />
            )}

            <EditorSection>
              {currentFile ? (
                <>
                  <Editor
                    file={currentFile}
                    openFiles={openFiles}
                    onFileChange={handleFileChange}
                    onCloseFile={handleCloseFile}
                    onSaveFile={handleSaveFile}
                    onFileSelect={setCurrentFile}
                    aiService={aiService}
                    workspaceContext={workspaceContext || undefined}
                    getFileContext={getFileContext}
                    settings={editorSettings}
                    liveStream={liveStream}
                    onEditorMount={handleEditorMount}
                  />
                  {previewOpen && (
                    <PreviewPanel
                      code={currentFile.content}
                      fileName={currentFile.name}
                      language={currentFile.language}
                      onClose={() => setPreviewOpen(false)}
                    />
                  )}
                </>
              ) : (
                <WelcomeScreen
                  onOpenFolder={handleOpenFolder}
                  onCreateFile={handleCreateFile}
                  onOpenAIChat={() => setAiChatOpen(true)}
                  onShowSettings={() => setSettingsOpen(true)}
                  workspaceContext={workspaceContext}
                  isIndexing={isIndexing}
                  indexingProgress={indexingProgress}
                />
              )}
            </EditorSection>

            {aiChatOpen && (
              <Suspense fallback={<div>Loading AI Chat...</div>}>
                <LazyAIChat
                  data-testid="ai-chat"
                  messages={aiMessages}
                  onSendMessage={handleAIMessage}
                  onClose={() => setAiChatOpen(false)}
                  showReasoningProcess={editorSettings.showReasoningProcess}
                  currentModel={editorSettings.aiModel}
                  mode={chatMode}
                  onModeChange={setChatMode}
                  taskPlanner={taskPlanner}
                  executionEngine={executionEngine}
                  workspaceContext={
                    workspaceFolder
                      ? {
                          workspaceRoot: workspaceFolder,
                          currentFile: currentFile?.path,
                          openFiles: openFiles.map((f) => f.path),
                          recentFiles: openFiles.slice(0, 5).map((f) => f.path),
                        }
                      : undefined
                  }
                  onAddMessage={addAiMessage}
                  onUpdateMessage={updateAiMessage}
                  onFileChanged={(filePath, action) => {
                    logger.debug('[App] Agent file changed:', filePath, action);
                    if (action === 'created' || action === 'modified') {
                      // Open the file in editor
                      handleOpenFile(filePath);
                    }
                  }}
                  onTaskComplete={(task) => {
                    showSuccess('Task Completed', `Successfully executed: ${task.title}`);
                  }}
                  onTaskError={(task, error) => {
                    showError('Task Failed', `Failed to execute ${task.title}: ${error.message}`);
                  }}
                />
              </Suspense>
            )}

            {gitPanelOpen && <GitPanel workingDirectory={workspaceFolder || undefined} />}

            {backgroundPanelOpen && (
              <BackgroundTaskPanel
                backgroundAgent={backgroundAgentSystem}
                onTaskClick={(task) => {
                  logger.debug('[App] Background task clicked:', task);
                  // Optional: Show task details in a modal or expand inline
                }}
              />
            )}
          </MainContent>

          <StatusBar
            currentFile={currentFile}
            aiChatOpen={aiChatOpen}
            backgroundPanelOpen={backgroundPanelOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onToggleAIChat={() => setAiChatOpen(!aiChatOpen)}
            onToggleBackgroundPanel={() => setBackgroundPanelOpen(!backgroundPanelOpen)}
            onOpenAgentMode={() => {
              if (!aiChatOpen) {setAiChatOpen(true);}
              setChatMode('agent');
            }}
            onOpenComposerMode={() => {
              if (!aiChatOpen) {setAiChatOpen(true);}
              setChatMode('composer');
            }}
            onOpenTerminal={() => {/* Terminal disabled */}}
            onToggleScreenshot={handleToggleScreenshotPanel}
            onToggleLibrary={handleToggleComponentLibrary}
            onToggleVisualEditor={handleToggleVisualEditor}
          />

          <NotificationContainer notifications={notifications} onClose={removeNotification} />

          {/* PHASE 7: Live Editor Streaming Control Panel */}
          <EditorStreamPanel
            isStreaming={liveStream.isCurrentlyStreaming()}
            onApprove={(filePath) => {
              logger.debug(`[App] Approved changes for: ${filePath}`);
              showSuccess('Changes Approved', `Applied changes to ${filePath}`);
            }}
            onReject={(filePath) => {
              logger.debug(`[App] Rejected changes for: ${filePath}`);
              showWarning('Changes Rejected', `Discarded changes to ${filePath}`);
            }}
          />

          {/* Auto-Fix Error Panel */}
          {errorFixPanelOpen && currentError && (
            <div style={{
              position: 'fixed',
              bottom: '80px',
              right: '20px',
              zIndex: 2000,
              maxWidth: '600px',
            }}>
              <ErrorFixPanel
                error={currentError}
                fix={currentFix}
                isLoading={fixLoading}
                errorMessage={fixError}
                showDiff={true}
                onApplyFix={handleApplyFix}
                onDismiss={() => {
                  setErrorFixPanelOpen(false);
                  setCurrentError(null);
                  setCurrentFix(null);
                }}
                onRetry={() => {
                  if (currentError && editorRef.current && autoFixServiceRef.current) {
                    setFixLoading(true);
                    setFixError('');
                    autoFixServiceRef.current.generateFix(currentError, editorRef.current)
                      .then((fix) => {
                        setCurrentFix(fix);
                        setFixLoading(false);
                      })
                      .catch((err) => {
                        setFixError(err.message || 'Failed to generate fix');
                        setFixLoading(false);
                      });
                  }
                }}
              />
            </div>
          )}

          <Suspense fallback={<div>Loading Settings...</div>}>
            <LazySettings
              isOpen={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              settings={editorSettings}
              onSettingsChange={async (newSettings) => {
                updateEditorSettings(newSettings);
                // Update AI service if model changed
                if (newSettings.aiModel && newSettings.aiModel !== editorSettings.aiModel) {
                  try {
                    await aiService.setModel(newSettings.aiModel);
                    showSuccess('Settings Updated', 'Your preferences have been saved');
                  } catch (error) {
                    showError(
                      'Model Error',
                      error instanceof Error ? error.message : 'Failed to update AI model'
                    );
                  }
                } else {
                  showSuccess('Settings Updated', 'Your preferences have been saved');
                }
              }}
            />
          </Suspense>

          <Suspense fallback={<div>Loading Command Palette...</div>}>
            <LazyCommandPalette
              isOpen={commandPaletteOpen}
              onClose={() => setCommandPaletteOpen(false)}
              commands={commands}
            />
          </Suspense>

          {/* Global Search */}
          <GlobalSearch
            isOpen={globalSearchOpen}
            onClose={() => setGlobalSearchOpen(false)}
            onOpenFile={handleOpenFileFromSearch}
            onReplaceInFile={handleReplaceInFile}
            workspaceFiles={openFiles.map(f => f.path) || []}
          />

          {/* Keyboard Shortcuts */}
          <KeyboardShortcuts
            isOpen={keyboardShortcutsOpen}
            onClose={() => setKeyboardShortcutsOpen(false)}
          />
          {/* Composer Mode */}
          <ComposerMode
            isOpen={composerModeOpen}
            onClose={() => setComposerModeOpen(false)}
            onApplyChanges={handleComposerModeApply}
            workspaceContext={{
              recentFiles: openFiles.map(f => f.path),
              openFiles: openFiles.map(f => f.path),
              gitBranch: 'main', // TODO: Get from Git service
            }}
            currentModel={currentModel}
            initialFiles={openFiles.map(f => ({
              id: f.path,
              path: f.path,
              content: f.content,
              originalContent: f.content,
              language: f.language,
              isDirty: false,
              isNew: false,
            }))}
          />

          {/* Visual No-Code Panels */}
          <AnimatePresence>
            {activeVisualPanel === 'screenshot' && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: '450px',
                  zIndex: 100,
                  boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
                }}
              >
                <ScreenshotToCodePanel
                  apiKey={deepseekApiKey}
                  onInsertCode={handleInsertCode}
                />
              </motion.div>
            )}

            {activeVisualPanel === 'library' && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: '450px',
                  zIndex: 100,
                  boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
                }}
              >
                <ComponentLibrary onInsertComponent={handleInsertCode} />
              </motion.div>
            )}

            {activeVisualPanel === 'visual' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 200,
                  background: 'rgba(0,0,0,0.95)',
                }}
              >
                <VisualEditor
                  onSave={(elements, code) => {
                    handleInsertCode(code);
                    setActiveVisualPanel('none');
                  }}
                />
              </motion.div>
            )}

            {/* Multi-File Edit Approval Panel */}
            {multiFileApprovalOpen && multiFileEditPlan && (
              <MultiFileEditApprovalPanel
                plan={multiFileEditPlan}
                changes={multiFileChanges}
                onApply={handleApplyMultiFileChanges}
                onReject={handleRejectMultiFileChanges}
              />
            )}
          </AnimatePresence>

          {/* Terminal Panel */}
          <TerminalPanel
            isOpen={terminalOpen}
            onClose={() => setTerminalOpen(false)}
          />
        </AppContainer>
      </Router>
    </ModernErrorBoundary>
  );
}

export default App;
