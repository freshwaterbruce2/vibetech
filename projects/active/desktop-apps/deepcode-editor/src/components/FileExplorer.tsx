import React, { useCallback, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileCode,
  FileJson,
  FileText,
  Folder,
  Image,
  Search,
} from 'lucide-react';
import styled from 'styled-components';

import { logger } from '../services/Logger';
import { vibeTheme } from '../styles/theme';

import { VirtualList } from './VirtualList';

/**
 * File Explorer with Virtual Scrolling - 2025 Pattern
 *
 * Features:
 * - Virtual scrolling for performance
 * - File search/filtering
 * - Collapsible directories
 * - File type icons
 * - Zustand integration
 */

// Types
interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  level: number;
}

interface FileExplorerProps {
  rootPath: string;
  files: FileNode[];
  height?: number;
  onFileSelect?: (path: string) => void;
}

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${vibeTheme.colors.primary};
  border-radius: ${vibeTheme.borderRadius.medium};
  overflow: hidden;
`;

const SearchContainer = styled.div`
  padding: ${vibeTheme.spacing.sm};
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  background: ${vibeTheme.colors.secondary};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${vibeTheme.spacing.xs} ${vibeTheme.spacing.sm};
  padding-left: 32px;
  background: ${vibeTheme.colors.primary};
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: ${vibeTheme.borderRadius.small};
  color: ${vibeTheme.colors.text};
  font-size: ${vibeTheme.typography.fontSize.sm};
  outline: none;
  transition: all ${vibeTheme.animation.duration.fast} ease;

  &:focus {
    border-color: ${vibeTheme.colors.purple};
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
  }

  &::placeholder {
    color: ${vibeTheme.colors.textMuted};
  }
`;

const SearchIconWrapper = styled.div`
  position: absolute;
  left: ${vibeTheme.spacing.sm};
  top: 50%;
  transform: translateY(-50%);
  color: ${vibeTheme.colors.textMuted};
  pointer-events: none;
`;

const FileItem = styled.div<{
  $level: number;
  $selected?: boolean;
}>`
  display: flex;
  align-items: center;
  padding: ${vibeTheme.spacing.xs} ${vibeTheme.spacing.sm};
  padding-left: ${(props) => `${props.$level * 20 + 12}px`};
  cursor: pointer;
  user-select: none;
  transition: all ${vibeTheme.animation.duration.fast} ease;
  background: ${(props) => (props.$selected ? 'rgba(139, 92, 246, 0.2)' : 'transparent')};

  &:hover {
    background: ${(props) =>
      props.$selected ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.1)'};
  }
`;

const FileIcon = styled.div<{ $isDirectory?: boolean }>`
  margin-right: ${vibeTheme.spacing.xs};
  color: ${(props) =>
    props.$isDirectory ? vibeTheme.colors.purple : vibeTheme.colors.textSecondary};
  flex-shrink: 0;
  display: flex;
  align-items: center;
`;

const FileName = styled.span<{ $highlighted?: boolean }>`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${vibeTheme.typography.fontSize.sm};
  color: ${(props) => (props.$highlighted ? vibeTheme.colors.cyan : vibeTheme.colors.text)};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: ${vibeTheme.colors.textMuted};
  font-size: ${vibeTheme.typography.fontSize.sm};

  svg {
    margin-bottom: ${vibeTheme.spacing.sm};
    opacity: 0.5;
  }
`;

// Helper functions
const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();

  const iconMap: Record<string, typeof FileCode> = {
    js: FileCode,
    jsx: FileCode,
    ts: FileCode,
    tsx: FileCode,
    json: FileJson,
    yaml: FileJson,
    yml: FileJson,
    png: Image,
    jpg: Image,
    jpeg: Image,
    gif: Image,
    svg: Image,
  };

  return iconMap[ext || ''] || FileText;
};

export const FileExplorer: React.FC<FileExplorerProps> = ({
  rootPath: _rootPath,
  files,
  height = 400,
  onFileSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Toggle directory expansion
  const toggleDirectory = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  // Handle file selection
  const handleFileClick = useCallback(
    (node: FileNode) => {
      if (node.type === 'directory') {
        toggleDirectory(node.path);
      } else {
        setSelectedPath(node.path);
        // Let parent handle file loading with proper content reading
        onFileSelect?.(node.path);
      }
    },
    [toggleDirectory, onFileSelect]
  );

  // Flatten file tree for virtual list
  const flattenedFiles = useMemo(() => {
    const result: FileNode[] = [];

    const traverse = (nodes: FileNode[]) => {
      nodes.forEach((node) => {
        // Filter by search
        if (searchQuery && !node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return;
        }

        result.push(node);

        if (node.type === 'directory' && node.children && expandedPaths.has(node.path)) {
          traverse(node.children);
        }
      });
    };

    traverse(files);
    return result;
  }, [files, expandedPaths, searchQuery]);

  // Render file item
  const renderFileItem = useCallback(
    (node: FileNode, _index: number) => {
      const isDirectory = node.type === 'directory';
      const isExpanded = expandedPaths.has(node.path);
      const isSelected = selectedPath === node.path;
      const Icon = isDirectory ? Folder : getFileIcon(node.name);

      return (
        <FileItem $level={node.level} $selected={isSelected} onClick={() => handleFileClick(node)}>
          {isDirectory && (
            <FileIcon>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </FileIcon>
          )}
          <FileIcon $isDirectory={isDirectory}>
            <Icon size={16} />
          </FileIcon>
          <FileName $highlighted={isSelected}>{node.name}</FileName>
        </FileItem>
      );
    },
    [expandedPaths, selectedPath, handleFileClick]
  );

  return (
    <Container>
      <SearchContainer>
        <div style={{ position: 'relative' }}>
          <SearchIconWrapper>
            <Search size={14} />
          </SearchIconWrapper>
          <SearchInput
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </SearchContainer>

      {flattenedFiles.length > 0 ? (
        <VirtualList
          items={flattenedFiles}
          height={height - 48} // Subtract search bar height
          itemHeight={28}
          renderItem={renderFileItem}
          overscan={5}
        />
      ) : (
        <EmptyState>
          <FileText size={32} />
          {searchQuery ? 'No files match your search' : 'No files in this directory'}
        </EmptyState>
      )}
    </Container>
  );
};

// Example usage with mock data
export const FileExplorerDemo: React.FC = () => {
  const mockFiles: FileNode[] = [
    {
      id: '1',
      name: 'src',
      path: '/src',
      type: 'directory',
      level: 0,
      children: [
        {
          id: '2',
          name: 'components',
          path: '/src/components',
          type: 'directory',
          level: 1,
          children: [
            {
              id: '3',
              name: 'Button.tsx',
              path: '/src/components/Button.tsx',
              type: 'file',
              level: 2,
            },
            {
              id: '4',
              name: 'Card.tsx',
              path: '/src/components/Card.tsx',
              type: 'file',
              level: 2,
            },
          ],
        },
        {
          id: '5',
          name: 'App.tsx',
          path: '/src/App.tsx',
          type: 'file',
          level: 1,
        },
      ],
    },
    {
      id: '6',
      name: 'package.json',
      path: '/package.json',
      type: 'file',
      level: 0,
    },
  ];

  return (
    <FileExplorer
      rootPath="/"
      files={mockFiles}
      height={600}
      onFileSelect={(path) => logger.debug('Selected:', path)}
    />
  );
};

export default FileExplorer;
