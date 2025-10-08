import { Suspense, useCallback, useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';

// New AI components
import AgentMode from './components/AgentMode/AgentMode';
import ComposerMode from './components/AgentMode/ComposerMode';
import Editor from './components/Editor';
import { ModernErrorBoundary } from './components/ErrorBoundary/index';
import GitPanel from './components/GitPanel';
import { GlobalSearch } from './components/GlobalSearch';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
// Lazy loaded components
import { LazyAIChat, LazyCommandPalette, LazySettings } from './components/LazyComponents';
import ModelSelector from './components/ModelSelector/ModelSelector';
// Components
import { NotificationContainer } from './components/Notification';
import Sidebar from './components/Sidebar';
import StatusBar from './components/StatusBar';
// import { EnhancedTerminal } from './components/Terminal/EnhancedTerminal';
// Components - Using lazy loading for heavy components
import TitleBar from './components/TitleBar';
import WelcomeScreen from './components/WelcomeScreen';
import { useAIChat } from './hooks/useAIChat';
import { useAppSettings } from './hooks/useAppSettings';
// import { useCommandPalette } from './hooks/useCommandPalette';
import { useFileManager } from './hooks/useFileManager';
import { useNotifications } from './hooks/useNotifications';
// Custom Hooks
import { useWorkspace } from './hooks/useWorkspace';
import { autoUpdater } from './services/AutoUpdateService';
// Services
import { DeepSeekService } from './services/DeepSeekService';
import { FileSystemService } from './services/FileSystemService';
import { SearchService } from './services/SearchService';
import { telemetry } from './services/TelemetryService';
import { getUserFriendlyError } from './utils/errorHandler';
// Types
import { AIMessage, EditorFile } from './types';

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
  const [deepSeekService] = useState(() => new DeepSeekService());
  const [fileSystemService] = useState(() => new FileSystemService());

  // Notifications
  const { notifications, showError, showSuccess, showWarning, removeNotification } =
    useNotifications();

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
    handleOpenFile,
    handleCloseFile,
    handleFileChange,
    handleSaveFile,
    setCurrentFile,
  } = useFileManager({
    fileSystemService,
    onSaveSuccess: (fileName) => showSuccess('File Saved', `${fileName} saved successfully`),
    onSaveError: (fileName) => showError('Save Failed', `Unable to save ${fileName}`),
  });

  // AI Chat
  const {
    aiMessages,
    aiChatOpen,
    setAiChatOpen,
    handleSendMessage: handleAIMessage,
    addAiMessage,
  } = useAIChat({
    deepSeekService,
    currentFile,
    workspaceContext: workspaceContext || undefined,
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
  const [gitPanelOpen, setGitPanelOpen] = useState(false);
  
  // Agent Mode and Composer Mode state
  const [agentModeOpen, setAgentModeOpen] = useState(false);
  const [composerModeOpen, setComposerModeOpen] = useState(false);

  // Global search state
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  
  // Keyboard shortcuts state
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);

  // Search service
  const searchService = new SearchService(fileSystemService);
  const [currentModel, setCurrentModel] = useState('deepseek-v3');

  // Global search handlers
  const handleOpenFileFromSearch = useCallback((file: string, line?: number, column?: number) => {
    handleOpenFile(file);
    // TODO: Navigate to specific line/column in editor
    if (line) {
      // Add logic to jump to line in Monaco editor
      console.log('Navigate to line:', line, 'column:', column);
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global search: Ctrl+Shift+F
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setGlobalSearchOpen(true);
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Terminal state
  // const [terminalOpen, setTerminalOpen] = useState(false);

  // Handle workspace opening
  const handleOpenFolder = async (folderPath: string) => {
    try {
      console.log(`Opening workspace: ${folderPath}`);
      setWorkspaceFolder(folderPath);

      // Start workspace indexing
      await indexWorkspace(folderPath);

      // Update AI assistant with workspace context
      const contextMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ **Workspace Indexed Successfully!**

I've analyzed your project at \`${folderPath}\` and I'm now ready to help with:

🔍 **Repository Understanding**: ${workspaceContext?.totalFiles || 0} files indexed
🚀 **Multi-file Context**: I understand relationships between your files
⚡ **Smart Suggestions**: Context-aware code completion and generation
🧠 **Project Knowledge**: Familiar with your codebase structure

**Languages Detected**: ${workspaceContext?.languages.join(', ') || 'Analyzing...'}
**Test Files**: ${workspaceContext?.testFiles || 0} detected

Try asking me:
- "Create a new component that fits my project structure"
- "Explain how this file relates to others"
- "Generate tests for this function"
- "Refactor this code to match project patterns"

I'm now your context-aware coding companion! 🎯`,
        timestamp: new Date(),
      };

      addAiMessage(contextMessage);
    } catch (error) {
      console.error('Failed to open workspace:', error);

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

  // Command Palette (disabled for now)
  // const { commandPaletteOpen, setCommandPaletteOpen, commands } = useCommandPalette({
  //   onSaveFile: handleSaveFile,
  //   onOpenFolder: handleOpenFolder,
  //   onToggleSidebar: () => setSidebarOpen(!sidebarOpen),
  //   onToggleAIChat: () => setAiChatOpen(!aiChatOpen),
  //   onToggleGitPanel: () => setGitPanelOpen(!gitPanelOpen),
  //   onOpenSettings: () => setSettingsOpen(true),
  //   onOpenGlobalSearch: () => setGlobalSearchOpen(true),
  //   onOpenAgentMode: () => setAgentModeOpen(true),
  //   onOpenComposerMode: () => setComposerModeOpen(true),
  //   onOpenTerminal: () => setTerminalOpen(true),
  //   onShowKeyboardShortcuts: () => setKeyboardShortcutsOpen(true),
  //   onTriggerFindReplace: () => {
  //     // Trigger find/replace in the editor
  //     document.dispatchEvent(
  //       new KeyboardEvent('keydown', {
  //         key: 'f',
  //         ctrlKey: true,
  //         bubbles: true,
  //       })
  //     );
  //   },
  // });
  
  // Fallback command palette state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const commands: any[] = [];
  
  // Agent Mode and Composer Mode handlers
  const handleAgentModeComplete = async (_task: string) => {
    try {
      // TODO: Implement agent task execution
      showSuccess('Agent Mode', 'Task completed successfully');
      setAgentModeOpen(false);
    } catch (error) {
      showError('Agent Mode', 'Failed to complete task');
    }
  };
  
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
  
  const handleModelChange = (model: string) => {
    setCurrentModel(model);
    // Update AI service with new model
    deepSeekService.updateConfig({ model });
  };

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

    // Auto-open demo workspace if no workspace is open
    if (!workspaceFolder && openFiles.length === 0) {
      const demoPath = '/home/freshbruce/deepcode-editor/demo-workspace';
      handleOpenFolder(demoPath);
      // Open the index.js file automatically
      setTimeout(() => {
        handleOpenFile(`${demoPath}/index.js`);
      }, 1500); // Increased timeout to allow workspace to load
    }

    console.log('App initialization complete');
  }, [showWarning]);

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
        console.error('App Error:', error, errorInfo);
        showError('Application Error', 'An unexpected error occurred. Please refresh the page.');
      }}
      onReset={() => {
        // Clear any error state
        window.location.reload();
      }}
    >
      <Router>
        <AppContainer>
          <TitleBar onSettingsClick={() => setSettingsOpen(true)}>
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
              />
            )}

            <EditorSection>
              {currentFile ? (
                <Editor
                  file={currentFile}
                  openFiles={openFiles}
                  onFileChange={handleFileChange}
                  onCloseFile={handleCloseFile}
                  onSaveFile={handleSaveFile}
                  onFileSelect={setCurrentFile}
                  deepSeekService={deepSeekService}
                  workspaceContext={workspaceContext || undefined}
                  getFileContext={getFileContext}
                  settings={editorSettings}
                />
              ) : (
                <WelcomeScreen
                  onOpenFolder={handleOpenFolder}
                  onCreateFile={handleCreateFile}
                  workspaceContext={workspaceContext}
                  isIndexing={isIndexing}
                  indexingProgress={indexingProgress}
                />
              )}
            </EditorSection>

            {aiChatOpen && (
              <Suspense fallback={<div>Loading AI Chat...</div>}>
                <LazyAIChat
                  messages={aiMessages}
                  onSendMessage={handleAIMessage}
                  onClose={() => setAiChatOpen(false)}
                  showReasoningProcess={
                    editorSettings.aiModel === 'deepseek-reasoner' &&
                    editorSettings.showReasoningProcess
                  }
                  currentModel={editorSettings.aiModel}
                />
              </Suspense>
            )}

            {gitPanelOpen && <GitPanel workingDirectory={workspaceFolder || undefined} />}
          </MainContent>

          <StatusBar
            currentFile={currentFile}
            aiChatOpen={aiChatOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onToggleAIChat={() => setAiChatOpen(!aiChatOpen)}
            onOpenAgentMode={() => setAgentModeOpen(true)}
            onOpenComposerMode={() => setComposerModeOpen(true)}
            onOpenTerminal={() => {/* Terminal disabled */}}
          />

          <NotificationContainer notifications={notifications} onClose={removeNotification} />

          <Suspense fallback={<div>Loading Settings...</div>}>
            <LazySettings
              isOpen={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              settings={editorSettings}
              onSettingsChange={(newSettings) => {
                updateEditorSettings(newSettings);
                // Update DeepSeekService if AI model changed
                if (newSettings.aiModel && newSettings.aiModel !== editorSettings.aiModel) {
                  deepSeekService.updateConfig({ model: newSettings.aiModel });
                }
                showSuccess('Settings Updated', 'Your preferences have been saved');
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
          
          {/* Agent Mode */}
          <AgentMode
            isOpen={agentModeOpen}
            onClose={() => setAgentModeOpen(false)}
            onComplete={handleAgentModeComplete}
            workspaceContext={{
              workspaceFolder: workspaceFolder || '',
              ...(currentFile && { currentFile: currentFile.name }),
              openFiles: openFiles.map(f => f.name),
            }}
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
            deepSeekService={deepSeekService}
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
          
          {/* Terminal (disabled for now) */}
          {/* <EnhancedTerminal
            isOpen={terminalOpen}
            onClose={() => console.log('Terminal disabled')}
            workingDirectory={workspaceFolder || '/'}
          /> */}
        </AppContainer>
      </Router>
    </ModernErrorBoundary>
  );
}

export default App;
