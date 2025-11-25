import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  ClipboardCopy,
  File,
  Folder,
  FolderOpen,
  Search,
  Settings,
  Trash2,
  Zap,
} from 'lucide-react';
import styled from 'styled-components';

import { FileSystemService } from '../services/FileSystemService';
import { logger } from '../services/Logger';
import { vibeTheme } from '../styles/theme';
import { FileSystemItem } from '../types';

import { ContextMenu, ContextMenuItem, useContextMenu } from './ui/ContextMenu';
import { Dialog } from './ui/Dialog';
import { IconButton } from './ui/IconButton';

const SidebarContainer = styled.div`
  width: 280px;
  background: ${vibeTheme.colors.secondary};
  border-right: 1px solid rgba(139, 92, 246, 0.15);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
`;

const SidebarSection = styled.div`
  flex: 1;
  overflow-y: auto;

  /* Modern scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.2);
    border-radius: ${vibeTheme.borderRadius.full};

    &:hover {
      background: rgba(139, 92, 246, 0.4);
    }
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  padding: ${vibeTheme.spacing[4]} ${vibeTheme.spacing[4]};
  background: ${vibeTheme.colors.primary};
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
  font-size: ${vibeTheme.typography.fontSize.xs};
  font-weight: ${vibeTheme.typography.fontWeight.semibold};
  color: ${vibeTheme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: ${vibeTheme.typography.letterSpacing.wider};

  svg {
    margin-right: ${vibeTheme.spacing[2]};
    color: ${vibeTheme.colors.cyan};
    width: 14px;
    height: 14px;
  }
`;

const FileExplorer = styled.div`
  padding: ${vibeTheme.spacing[2]} 0;
`;

const FileItem = styled(motion.div)<{ level: number; selected?: boolean }>`
  display: flex;
  align-items: center;
  padding: ${vibeTheme.spacing[2]} ${vibeTheme.spacing[3]} ${vibeTheme.spacing[2]}
    ${(props) => 12 + props.level * 16}px;
  cursor: pointer;
  font-size: ${vibeTheme.typography.fontSize.sm};
  color: ${(props) => (props.selected ? vibeTheme.colors.text : vibeTheme.colors.textSecondary)};
  background: ${(props) =>
    props.selected ? vibeTheme.colors.hover : 'transparent'};
  border-radius: ${vibeTheme.borderRadius.sm};
  margin: 1px ${vibeTheme.spacing[2]};
  transition: ${vibeTheme.animation.transition.all};
  position: relative;

  ${(props) =>
    props.selected &&
    `
    background: ${vibeTheme.colors.hoverStrong};
    box-shadow: ${vibeTheme.shadows.xs};

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 2px;
      background: ${vibeTheme.colors.cyan};
      border-radius: 0 ${vibeTheme.borderRadius.xs} ${vibeTheme.borderRadius.xs} 0;
    }
  `}

  &:hover {
    background: ${(props) =>
      props.selected ? vibeTheme.colors.active : vibeTheme.colors.hover};
    color: ${vibeTheme.colors.text};
  }
`;

const FileIcon = styled.div<{ type: 'file' | 'directory'; $expanded?: boolean }>`
  margin-right: ${vibeTheme.spacing[2]};
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing[1]};
  color: ${(props) => {
    if (props.type === 'directory') {
      return vibeTheme.colors.cyan;
    }
    return vibeTheme.colors.textSecondary;
  }};
  transition: ${vibeTheme.animation.transition.colors};

  svg {
    width: 16px;
    height: 16px;
  }
`;

const FileName = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: ${vibeTheme.typography.fontWeight.normal};
`;

const SearchContainer = styled.div`
  padding: ${vibeTheme.spacing[3]};
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
`;

const SearchInput = styled.input`
  width: 100%;
  background: ${vibeTheme.colors.tertiary};
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: ${vibeTheme.colors.text};
  padding: ${vibeTheme.spacing[2]} ${vibeTheme.spacing[3]};
  border-radius: ${vibeTheme.borderRadius.md};
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-family: ${vibeTheme.typography.fontFamily.primary};
  transition: ${vibeTheme.animation.transition.all};
  height: 32px;

  &:hover {
    border-color: rgba(139, 92, 246, 0.3);
    background: ${vibeTheme.colors.elevated};
  }

  &:focus {
    outline: none;
    border-color: ${vibeTheme.colors.cyan};
    background: ${vibeTheme.colors.tertiary};
    box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
  }

  &::placeholder {
    color: ${vibeTheme.colors.textMuted};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${vibeTheme.spacing[2]};
  padding: ${vibeTheme.spacing[3]};
  border-top: 1px solid rgba(139, 92, 246, 0.1);
  background: ${vibeTheme.colors.primary};
`;

const EmptyState = styled.div`
  padding: ${vibeTheme.spacing[16]};
  text-align: center;
  color: ${vibeTheme.colors.textMuted};
  font-size: ${vibeTheme.typography.fontSize.sm};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${vibeTheme.spacing[4]};

  p {
    margin: 0;
    font-weight: ${vibeTheme.typography.fontWeight.medium};
    color: ${vibeTheme.colors.textSecondary};
  }
`;

const OpenFolderButton = styled(motion.button)`
  background: ${vibeTheme.gradients.primary};
  border: none;
  color: ${vibeTheme.colors.text};
  padding: ${vibeTheme.spacing[3]} ${vibeTheme.spacing[6]};
  border-radius: ${vibeTheme.borderRadius.md};
  cursor: pointer;
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing[2]};
  transition: ${vibeTheme.animation.transition.all};
  box-shadow: ${vibeTheme.shadows.sm}, ${vibeTheme.shadows.glow};

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${vibeTheme.shadows.md}, ${vibeTheme.shadows.glowStrong};
  }

  &:active {
    transform: translateY(0);
    box-shadow: ${vibeTheme.shadows.sm};
  }
`;

interface SidebarProps {
  workspaceFolder: string | null;
  onOpenFile: (path: string) => void;
  onToggleAIChat: () => void;
  aiChatOpen: boolean;
  fileSystemService?: FileSystemService;
  onDeleteFile?: (path: string) => Promise<void>;
  onOpenFolder?: () => void;
  /** Settings handler - required for core UI functionality */
  onShowSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  workspaceFolder,
  onOpenFile,
  onToggleAIChat,
  aiChatOpen,
  fileSystemService,
  onDeleteFile,
  onOpenFolder,
  onShowSettings,
}) => {
  const [fileTree, setFileTree] = useState<FileSystemItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Context menu and dialog state
  const { contextMenu, showContextMenu, hideContextMenu } = useContextMenu();
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    fileName: string;
    filePath: string;
  }>({
    isOpen: false,
    fileName: '',
    filePath: '',
  });

  // Store loaded children for each folder (lazy loading)
  const [folderChildren, setFolderChildren] = useState<Map<string, FileSystemItem[]>>(new Map());

  useEffect(() => {
    if (workspaceFolder && fileSystemService) {
      loadFileTree();
    }
  }, [workspaceFolder, fileSystemService]);

  const loadFileTree = async () => {
    if (!workspaceFolder || !fileSystemService) {
      return;
    }

    try {
      const files = await fileSystemService.listDirectory(workspaceFolder);
      setFileTree(files);
      // No expanded folders by default for the demo files
    } catch (error) {
      logger.error('Failed to load file tree:', error);
      // Fallback to empty tree
      setFileTree([]);
    }
  };

  const toggleFolder = async (path: string) => {
    const isCurrentlyExpanded = expandedFolders.has(path);

    // Toggle expansion state
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlyExpanded) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });

    // Load children if expanding and not already loaded
    if (!isCurrentlyExpanded && !folderChildren.has(path) && fileSystemService) {
      try {
        logger.debug('[Sidebar] Loading children for folder:', path);
        const children = await fileSystemService.listDirectory(path);
        logger.debug('[Sidebar] Loaded', children.length, 'items');
        setFolderChildren((prev) => new Map(prev).set(path, children));
      } catch (error) {
        logger.error('[Sidebar] Failed to load folder children:', error);
      }
    }
  };

  const handleFileClick = (item: FileSystemItem) => {
    if (item.type === 'directory') {
      toggleFolder(item.path);
    } else {
      setSelectedFile(item.path);
      onOpenFile(item.path);
    }
  };

  const handleFileContextMenu = (e: React.MouseEvent, item: FileSystemItem) => {
    e.preventDefault();
    e.stopPropagation();

    logger.debug('Right-click detected on file:', item.name, 'path:', item.path);

    const contextMenuItems: ContextMenuItem[] = [
      {
        id: 'copy-path',
        label: 'Copy Path',
        icon: <ClipboardCopy size={16} />,
        onClick: () => {
          navigator.clipboard.writeText(item.path);
          logger.debug('Copied path:', item.path);
        },
      },
      { id: 'divider-1', label: '', divider: true },
      {
        id: 'delete',
        label: `Delete ${item.type === 'directory' ? 'Folder' : 'File'}`,
        icon: <Trash2 size={16} />,
        danger: true,
        onClick: () => {
          logger.debug('Delete clicked for:', item.name);
          setDeleteDialog({
            isOpen: true,
            fileName: item.name,
            filePath: item.path,
          });
        },
      },
    ];

    logger.debug('Showing context menu with', contextMenuItems.length, 'items');
    showContextMenu(e, contextMenuItems);
  };

  const handleDeleteConfirm = async () => {
    if (!onDeleteFile) {return;}

    try {
      await onDeleteFile(deleteDialog.filePath);
      // Reload file tree after successful deletion
      await loadFileTree();
      // Close the file if it was open
      if (selectedFile === deleteDialog.filePath) {
        setSelectedFile(null);
      }
    } catch (error) {
      logger.error('Failed to delete file:', error);
      // TODO: Show error toast/notification
    } finally {
      setDeleteDialog({ isOpen: false, fileName: '', filePath: '' });
    }
  };

  const renderFileTree = (items: FileSystemItem[], level = 0): React.ReactNode => {
    return items
      .filter(
        (item) => searchTerm === '' || item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .map((item) => (
        <div key={item.path}>
          <FileItem
            level={level}
            selected={selectedFile === item.path}
            onClick={() => handleFileClick(item)}
            onContextMenu={(e) => handleFileContextMenu(e, item)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FileIcon type={item.type} $expanded={expandedFolders.has(item.path)}>
              {item.type === 'directory' ? (
                <>
                  {expandedFolders.has(item.path) ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                  <Folder size={16} />
                </>
              ) : (
                <File size={16} />
              )}
            </FileIcon>
            <FileName>{item.name}</FileName>
          </FileItem>

          {item.type === 'directory' && expandedFolders.has(item.path) && (
            <div>{renderFileTree(folderChildren.get(item.path) || [], level + 1)}</div>
          )}
        </div>
      ));
  };

  const handleOpenFolder = () => {
    // Use the provided onOpenFolder callback from App.tsx
    // which will trigger the file picker dialog
    if (onOpenFolder) {
      onOpenFolder();
    }
  };

  return (
    <SidebarContainer role="complementary" aria-label="Sidebar navigation">
      <SidebarSection>
        <SectionHeader>
          <FolderOpen size={14} style={{ marginRight: 8 }} />
          Explorer
        </SectionHeader>

        {workspaceFolder || fileTree.length > 0 ? (
          <>
            <SearchContainer>
              <SearchInput
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchContainer>

            <FileExplorer>{renderFileTree(fileTree)}</FileExplorer>
          </>
        ) : (
          <EmptyState>
            <p>No folder opened</p>
            <OpenFolderButton
              onClick={handleOpenFolder}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FolderOpen size={16} />
              Open Folder
            </OpenFolderButton>
          </EmptyState>
        )}
      </SidebarSection>

      <ActionButtons>
        <IconButton
          variant="ghost"
          size="md"
          icon={<Search size={18} />}
          aria-label="Search"
        />

        <IconButton
          variant={aiChatOpen ? 'primary' : 'ghost'}
          size="md"
          icon={<Zap size={18} />}
          aria-label="AI Assistant"
          onClick={onToggleAIChat}
        />

        <IconButton
          variant="ghost"
          size="md"
          icon={<Settings size={18} />}
          aria-label="Settings"
          onClick={onShowSettings}
        />
      </ActionButtons>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          items={contextMenu.items}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={hideContextMenu}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, fileName: '', filePath: '' })}
        title="Delete File"
        message={`Are you sure you want to delete "${deleteDialog.fileName}"? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        showCancel={true}
      />
    </SidebarContainer>
  );
};

export default Sidebar;
