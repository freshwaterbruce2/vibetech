import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  Search,
  Settings,
  Zap,
} from 'lucide-react';
import styled from 'styled-components';

import { vibeTheme } from '../styles/theme';
import { FileSystemItem } from '../types';
import { FileSystemService } from '../services/FileSystemService';

const SidebarContainer = styled.div`
  width: 280px;
  background: ${vibeTheme.colors.secondary};
  border-right: 2px solid rgba(139, 92, 246, 0.2);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 2px;
    height: 100%;
    background: ${vibeTheme.gradients.border};
    opacity: 0.6;
  }
`;

const SidebarSection = styled.div`
  flex: 1;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${vibeTheme.colors.primary};
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: ${vibeTheme.borderRadius.small};

    &:hover {
      background: rgba(139, 92, 246, 0.5);
    }
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  padding: ${vibeTheme.spacing.md} ${vibeTheme.spacing.md};
  background: linear-gradient(
    135deg,
    ${vibeTheme.colors.primary} 0%,
    ${vibeTheme.colors.secondary} 100%
  );
  border-bottom: 2px solid rgba(139, 92, 246, 0.2);
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.bold};
  color: ${vibeTheme.colors.text};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${vibeTheme.gradients.border};
    opacity: 0.6;
  }

  svg {
    margin-right: ${vibeTheme.spacing.sm};
    color: ${vibeTheme.colors.cyan};
  }
`;

const FileExplorer = styled.div`
  padding: ${vibeTheme.spacing.sm} 0;
`;

const FileItem = styled(motion.div)<{ level: number; selected?: boolean }>`
  display: flex;
  align-items: center;
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md} ${vibeTheme.spacing.sm}
    ${(props) => parseInt(vibeTheme.spacing.md.replace('px', '')) + props.level * 20}px;
  cursor: pointer;
  font-size: ${vibeTheme.typography.fontSize.sm};
  color: ${(props) => (props.selected ? vibeTheme.colors.text : vibeTheme.colors.textSecondary)};
  background: ${(props) =>
    props.selected
      ? 'linear-gradient(90deg, rgba(139, 92, 246, 0.2) 0%, rgba(0, 212, 255, 0.1) 100%)'
      : 'transparent'};
  border-radius: ${vibeTheme.borderRadius.small};
  margin: 2px ${vibeTheme.spacing.sm};
  transition: all ${vibeTheme.animation.duration.fast} ${vibeTheme.animation.easing.default};
  position: relative;

  ${(props) =>
    props.selected &&
    `
    border-left: 3px solid ${vibeTheme.colors.cyan};
    box-shadow: ${vibeTheme.shadows.small};
  `}

  &:hover {
    background: ${(props) =>
      props.selected
        ? 'linear-gradient(90deg, rgba(139, 92, 246, 0.3) 0%, rgba(0, 212, 255, 0.15) 100%)'
        : 'rgba(139, 92, 246, 0.1)'};
    color: ${vibeTheme.colors.text};
    transform: translateX(4px);
  }
`;

const FileIcon = styled.div<{ type: 'file' | 'directory'; expanded?: boolean }>`
  margin-right: ${vibeTheme.spacing.sm};
  display: flex;
  align-items: center;
  color: ${(props) => {
    if (props.type === 'directory') {
      return vibeTheme.colors.cyan;
    }
    return vibeTheme.colors.purple;
  }};
  transition: all ${vibeTheme.animation.duration.fast} ease;

  svg {
    filter: drop-shadow(
      0 0 4px
        ${(props) =>
          props.type === 'directory' ? vibeTheme.colors.cyan : vibeTheme.colors.purple}30
    );
  }
`;

const FileName = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: ${vibeTheme.typography.fontWeight.medium};
`;

const SearchContainer = styled.div`
  padding: ${vibeTheme.spacing.md};
  border-bottom: 2px solid rgba(139, 92, 246, 0.1);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: ${vibeTheme.gradients.border};
    opacity: 0.4;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  background: rgba(26, 26, 46, 0.8);
  border: 2px solid rgba(139, 92, 246, 0.2);
  color: ${vibeTheme.colors.text};
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  border-radius: ${vibeTheme.borderRadius.medium};
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-family: ${vibeTheme.typography.fontFamily.primary};
  backdrop-filter: blur(10px);
  transition: all ${vibeTheme.animation.duration.normal} ease;

  &:focus {
    outline: none;
    border-color: ${vibeTheme.colors.cyan};
    background: rgba(26, 26, 46, 1);
    box-shadow: 0 0 12px rgba(0, 212, 255, 0.3);
    transform: scale(1.02);
  }

  &::placeholder {
    color: ${vibeTheme.colors.textMuted};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  border-top: 2px solid rgba(139, 92, 246, 0.2);
  background: linear-gradient(
    135deg,
    ${vibeTheme.colors.primary} 0%,
    ${vibeTheme.colors.secondary} 100%
  );
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${vibeTheme.gradients.border};
    opacity: 0.6;
  }
`;

const ActionButton = styled(motion.button)<{ active?: boolean }>`
  background: ${(props) =>
    props.active
      ? 'linear-gradient(90deg, rgba(139, 92, 246, 0.3) 0%, rgba(0, 212, 255, 0.2) 100%)'
      : 'transparent'};
  border: none;
  color: ${(props) => (props.active ? vibeTheme.colors.text : vibeTheme.colors.textSecondary)};
  padding: ${vibeTheme.spacing.md};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
  transition: all ${vibeTheme.animation.duration.normal} ease;
  position: relative;

  ${(props) =>
    props.active &&
    `
    box-shadow: inset 0 0 12px rgba(139, 92, 246, 0.3);
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: ${vibeTheme.gradients.primary};
    }
  `}

  &:hover {
    background: ${(props) =>
      props.active
        ? 'linear-gradient(90deg, rgba(139, 92, 246, 0.4) 0%, rgba(0, 212, 255, 0.3) 100%)'
        : 'rgba(139, 92, 246, 0.1)'};
    color: ${vibeTheme.colors.text};
    transform: scale(1.05);
  }

  &:last-child {
    border-bottom: none;
  }

  svg {
    filter: drop-shadow(
      0 0 4px ${(props) => (props.active ? vibeTheme.colors.cyan : 'transparent')}
    );
  }
`;

const EmptyState = styled.div`
  padding: ${vibeTheme.spacing['2xl']};
  text-align: center;
  color: ${vibeTheme.colors.textMuted};
  font-size: ${vibeTheme.typography.fontSize.sm};

  p {
    margin-bottom: ${vibeTheme.spacing.lg};
    font-weight: ${vibeTheme.typography.fontWeight.medium};
  }
`;

const OpenFolderButton = styled(motion.button)`
  background: ${vibeTheme.gradients.primary};
  border: 2px solid transparent;
  color: ${vibeTheme.colors.text};
  padding: ${vibeTheme.spacing.md} ${vibeTheme.spacing.xl};
  border-radius: ${vibeTheme.borderRadius.medium};
  cursor: pointer;
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  margin: ${vibeTheme.spacing.sm};
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};
  transition: all ${vibeTheme.animation.duration.normal} ease;
  box-shadow: ${vibeTheme.shadows.medium};

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      ${vibeTheme.shadows.large},
      0 0 20px rgba(139, 92, 246, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

interface SidebarProps {
  workspaceFolder: string | null;
  onOpenFile: (path: string) => void;
  onToggleAIChat: () => void;
  aiChatOpen: boolean;
  fileSystemService?: FileSystemService;
}

const Sidebar: React.FC<SidebarProps> = ({
  workspaceFolder,
  onOpenFile,
  onToggleAIChat,
  aiChatOpen,
  fileSystemService,
}) => {
  const [fileTree, setFileTree] = useState<FileSystemItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

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
      console.error('Failed to load file tree:', error);
      // Fallback to empty tree
      setFileTree([]);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleFileClick = (item: FileSystemItem) => {
    if (item.type === 'directory') {
      toggleFolder(item.path);
    } else {
      setSelectedFile(item.path);
      onOpenFile(item.path);
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FileIcon type={item.type} expanded={expandedFolders.has(item.path)}>
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

          {item.type === 'directory' && expandedFolders.has(item.path) && item.children && (
            <div>{renderFileTree(item.children, level + 1)}</div>
          )}
        </div>
      ));
  };

  const handleOpenFolder = async () => {
    try {
      // For now, use a demo folder path
      // In a real Electron app, this would use the dialog API
      const demoPath = '/demo/project';
      console.log('Opening folder:', demoPath);

      // Call the onOpenFolder callback from App
      if (typeof workspaceFolder === 'function') {
        // workspaceFolder is actually onOpenFolder callback
        await (workspaceFolder as (path: string) => Promise<void>)(demoPath);
      } else {
        // Otherwise just load the tree
        loadFileTree();
      }
    } catch (error) {
      console.error('Failed to open folder:', error);
    }
  };

  return (
    <SidebarContainer>
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
        <ActionButton title="Search" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Search size={16} />
        </ActionButton>

        <ActionButton
          active={aiChatOpen}
          onClick={onToggleAIChat}
          title="AI Assistant"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Zap size={16} />
        </ActionButton>

        <ActionButton title="Settings" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Settings size={16} />
        </ActionButton>
      </ActionButtons>
    </SidebarContainer>
  );
};

export default Sidebar;
