import { logger } from '../services/Logger';
import React, { useState, useCallback } from 'react';
import {
  Code,
  FileText,
  FolderOpen,
  Save,
  Search,
  Settings,
  Sparkles,
  TestTube,
  Wand2,
  Zap,
  Bug,
  MessageSquare,
  PanelLeftClose,
  Palette,
} from 'lucide-react';

interface Command {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category?: string;
  keywords?: string[];
}

interface UseAICommandPaletteProps {
  onSaveFile?: () => void;
  onOpenFolder?: () => void;
  onNewFile?: () => void;
  onSaveAll?: () => void;
  onCloseFolder?: () => void;
  onToggleSidebar?: () => void;
  onToggleAIChat?: () => void;
  onOpenSettings?: () => void;
  onAIExplainCode?: () => void;
  onAIGenerateTests?: () => void;
  onAIRefactor?: () => void;
  onAIFixBugs?: () => void;
  onAIOptimize?: () => void;
  onAIAddComments?: () => void;
  onAIGenerateComponent?: () => void;
  onFormatDocument?: () => void;
  currentFile?: string | null;
}

export const useAICommandPalette = (props: UseAICommandPaletteProps) => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Build comprehensive command list
  const commands: Command[] = [
    // File Operations
    {
      id: 'file-new',
      title: 'New File',
      description: 'Create a new file',
      icon: <FileText size={18} />,
      shortcut: 'Ctrl+N',
      action: () => props.onNewFile?.(),
      category: 'File',
      keywords: ['create', 'new', 'file'],
    },
    {
      id: 'file-open-folder',
      title: 'Open Folder',
      description: 'Open a folder as workspace',
      icon: <FolderOpen size={18} />,
      shortcut: 'Ctrl+O',
      action: () => props.onOpenFolder?.(),
      category: 'File',
      keywords: ['open', 'folder', 'workspace'],
    },
    {
      id: 'file-save',
      title: 'Save File',
      description: 'Save the current file',
      icon: <Save size={18} />,
      shortcut: 'Ctrl+S',
      action: () => props.onSaveFile?.(),
      category: 'File',
      keywords: ['save', 'file'],
    },
    {
      id: 'file-save-all',
      title: 'Save All',
      description: 'Save all open files',
      icon: <Save size={18} />,
      shortcut: 'Ctrl+Shift+S',
      action: () => props.onSaveAll?.(),
      category: 'File',
      keywords: ['save', 'all', 'files'],
    },
    {
      id: 'file-close-folder',
      title: 'Close Folder',
      description: 'Close the current workspace',
      icon: <FolderOpen size={18} />,
      action: () => props.onCloseFolder?.(),
      category: 'File',
      keywords: ['close', 'folder', 'workspace'],
    },

    // AI-Powered Commands (Cursor/Claude Code style)
    {
      id: 'ai-explain',
      title: 'AI: Explain Code',
      description: 'Get AI explanation of selected code',
      icon: <Sparkles size={18} />,
      shortcut: 'Ctrl+Shift+E',
      action: () => props.onAIExplainCode?.(),
      category: 'AI Assistant',
      keywords: ['ai', 'explain', 'understand', 'code', 'analysis'],
    },
    {
      id: 'ai-generate-tests',
      title: 'AI: Generate Tests',
      description: 'Generate test cases for selected code',
      icon: <TestTube size={18} />,
      shortcut: 'Ctrl+Shift+T',
      action: () => props.onAIGenerateTests?.(),
      category: 'AI Assistant',
      keywords: ['ai', 'test', 'testing', 'generate', 'unit'],
    },
    {
      id: 'ai-refactor',
      title: 'AI: Refactor Code',
      description: 'Refactor selected code for better quality',
      icon: <Wand2 size={18} />,
      shortcut: 'Ctrl+Shift+R',
      action: () => props.onAIRefactor?.(),
      category: 'AI Assistant',
      keywords: ['ai', 'refactor', 'improve', 'clean', 'quality'],
    },
    {
      id: 'ai-fix-bugs',
      title: 'AI: Fix Bugs',
      description: 'AI-powered bug detection and fixes',
      icon: <Bug size={18} />,
      shortcut: 'Ctrl+Shift+F',
      action: () => props.onAIFixBugs?.(),
      category: 'AI Assistant',
      keywords: ['ai', 'fix', 'bug', 'error', 'debug'],
    },
    {
      id: 'ai-optimize',
      title: 'AI: Optimize Performance',
      description: 'Optimize code for better performance',
      icon: <Zap size={18} />,
      action: () => props.onAIOptimize?.(),
      category: 'AI Assistant',
      keywords: ['ai', 'optimize', 'performance', 'speed'],
    },
    {
      id: 'ai-add-comments',
      title: 'AI: Add Comments',
      description: 'Add intelligent code documentation',
      icon: <MessageSquare size={18} />,
      action: () => props.onAIAddComments?.(),
      category: 'AI Assistant',
      keywords: ['ai', 'comment', 'documentation', 'explain'],
    },
    {
      id: 'ai-generate-component',
      title: 'AI: Generate Component',
      description: 'Generate React component from description',
      icon: <Palette size={18} />,
      action: () => props.onAIGenerateComponent?.(),
      category: 'AI Assistant',
      keywords: ['ai', 'generate', 'component', 'react', 'ui'],
    },

    // Editor Commands
    {
      id: 'editor-format',
      title: 'Format Document',
      description: 'Format the current document',
      icon: <Code size={18} />,
      shortcut: 'Shift+Alt+F',
      action: () => props.onFormatDocument?.(),
      category: 'Editor',
      keywords: ['format', 'prettier', 'beautify'],
    },
    {
      id: 'editor-find',
      title: 'Find',
      description: 'Find in current file',
      icon: <Search size={18} />,
      shortcut: 'Ctrl+F',
      action: () => {
        // Will be handled by Monaco editor
        logger.debug('Find triggered');
      },
      category: 'Editor',
      keywords: ['find', 'search'],
    },

    // View Commands
    {
      id: 'view-toggle-sidebar',
      title: 'Toggle Sidebar',
      description: 'Show/hide the file explorer',
      icon: <PanelLeftClose size={18} />,
      shortcut: 'Ctrl+B',
      action: () => props.onToggleSidebar?.(),
      category: 'View',
      keywords: ['toggle', 'sidebar', 'explorer'],
    },
    {
      id: 'view-toggle-ai-chat',
      title: 'Toggle AI Chat',
      description: 'Show/hide the AI assistant panel',
      icon: <Sparkles size={18} />,
      shortcut: 'Ctrl+Shift+L',
      action: () => props.onToggleAIChat?.(),
      category: 'View',
      keywords: ['toggle', 'ai', 'chat', 'assistant'],
    },

    // Settings
    {
      id: 'settings-open',
      title: 'Open Settings',
      description: 'Configure application settings',
      icon: <Settings size={18} />,
      shortcut: 'Ctrl+,',
      action: () => props.onOpenSettings?.(),
      category: 'Settings',
      keywords: ['settings', 'preferences', 'config'],
    },
  ];

  const toggleCommandPalette = useCallback(() => {
    setCommandPaletteOpen((prev) => !prev);
  }, []);

  return {
    commandPaletteOpen,
    setCommandPaletteOpen,
    toggleCommandPalette,
    commands,
  };
};
