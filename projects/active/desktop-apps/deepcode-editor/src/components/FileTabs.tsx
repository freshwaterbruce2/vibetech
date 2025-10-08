import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import styled from 'styled-components';

import { vibeTheme } from '../styles/theme';
import { EditorFile } from '../types';

const TabsContainer = styled.div`
  display: flex;
  background: linear-gradient(
    135deg,
    ${vibeTheme.colors.primary} 0%,
    ${vibeTheme.colors.secondary} 100%
  );
  border-bottom: 2px solid rgba(139, 92, 246, 0.2);
  overflow-x: auto;
  flex-shrink: 0;
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

  &::-webkit-scrollbar {
    height: 4px;
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

const Tab = styled(motion.div)<{ active: boolean }>`
  display: flex;
  align-items: center;
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  background: ${(props) =>
    props.active
      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(0, 212, 255, 0.2) 100%)'
      : 'transparent'};
  border-right: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: ${vibeTheme.borderRadius.small} ${vibeTheme.borderRadius.small} 0 0;
  cursor: pointer;
  min-width: 140px;
  max-width: 220px;
  position: relative;
  transition: all ${vibeTheme.animation.duration.fast} ease;

  ${(props) =>
    props.active &&
    `
    border-bottom: 2px solid ${vibeTheme.colors.cyan};
    box-shadow: 0 0 12px rgba(0, 212, 255, 0.3);
  `}

  &:hover {
    background: ${(props) =>
      props.active
        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(0, 212, 255, 0.3) 100%)'
        : 'rgba(139, 92, 246, 0.1)'};
    transform: translateY(-2px);
  }

  &:hover .close-button {
    opacity: 1;
  }
`;

const TabLabel = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'modified',
})<{ modified: boolean }>`
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  color: ${(props) => (props.modified ? vibeTheme.colors.text : vibeTheme.colors.textSecondary)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: ${vibeTheme.spacing.xs};

  &:after {
    content: ${(props) => (props.modified ? '"●"' : '""')};
    margin-left: ${vibeTheme.spacing.xs};
    color: ${vibeTheme.colors.cyan};
    filter: drop-shadow(0 0 4px ${vibeTheme.colors.cyan});
  }
`;

const CloseButton = styled(motion.button)`
  background: transparent;
  border: none;
  color: ${vibeTheme.colors.textSecondary};
  cursor: pointer;
  padding: ${vibeTheme.spacing.xs};
  border-radius: ${vibeTheme.borderRadius.small};
  opacity: 0;
  transition: all ${vibeTheme.animation.duration.fast} ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    color: ${vibeTheme.colors.error};
    transform: scale(1.1);
  }
`;

const LanguageIcon = styled.span`
  width: 20px;
  height: 20px;
  margin-right: ${vibeTheme.spacing.sm};
  border-radius: ${vibeTheme.borderRadius.small};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${vibeTheme.typography.fontSize.xs};
  font-weight: ${vibeTheme.typography.fontWeight.bold};
  background: #007acc;
  color: ${vibeTheme.colors.text};
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: ${vibeTheme.shadows.small};
  font-family: ${vibeTheme.typography.fontFamily.mono};
`;

interface FileTabsProps {
  files: EditorFile[];
  activeFile: EditorFile;
  onFileSelect: (file: EditorFile) => void;
  onCloseFile: (path: string) => void;
}

const FileTabs: React.FC<FileTabsProps> = ({ files, activeFile, onFileSelect, onCloseFile }) => {
  const getLanguageIcon = (language: string): string => {
    const icons: Record<string, string> = {
      javascript: 'JS',
      typescript: 'TS',
      python: 'PY',
      java: 'JA',
      cpp: 'C+',
      c: 'C',
      csharp: 'C#',
      php: 'PH',
      ruby: 'RB',
      go: 'GO',
      rust: 'RS',
      html: 'HT',
      css: 'CS',
      scss: 'SC',
      json: 'JS',
      xml: 'XM',
      yaml: 'YM',
      markdown: 'MD',
      shell: 'SH',
      sql: 'SQ',
    };
    return icons[language] || 'TX';
  };

  const getLanguageColor = (language: string): string => {
    const colors: Record<string, string> = {
      javascript: '#f7df1e',
      typescript: '#3178c6',
      python: '#3776ab',
      java: '#ed8b00',
      cpp: '#00599c',
      c: '#a8b9cc',
      csharp: '#239120',
      php: '#777bb4',
      ruby: '#cc342d',
      go: '#00add8',
      rust: '#dea584',
      html: '#e34f26',
      css: '#1572b6',
      scss: '#cf649a',
      json: '#000000',
      xml: '#0060ac',
      yaml: '#cb171e',
      markdown: '#083fa1',
      shell: '#89e051',
      sql: '#e38c00',
    };
    return colors[language] || '#007acc';
  };

  const handleCloseFile = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    onCloseFile(path);
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <TabsContainer>
      {files.map((file) => (
        <Tab
          key={file.path}
          active={file.path === activeFile.path}
          onClick={() => onFileSelect(file)}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <LanguageIcon style={{ background: getLanguageColor(file.language) }}>
            {getLanguageIcon(file.language)}
          </LanguageIcon>
          <TabLabel modified={file.isModified}>{file.name}</TabLabel>
          <CloseButton
            className="close-button"
            onClick={(e) => handleCloseFile(e, file.path)}
            title="Close file"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={12} />
          </CloseButton>
        </Tab>
      ))}
    </TabsContainer>
  );
};

export default FileTabs;
