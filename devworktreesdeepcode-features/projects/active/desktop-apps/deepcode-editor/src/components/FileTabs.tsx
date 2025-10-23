import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import styled from 'styled-components';

import { vibeTheme } from '../styles/theme';
import { EditorFile } from '../types';

const TabsContainer = styled.div`
  display: flex;
  background: ${vibeTheme.colors.primary};
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
  overflow-x: auto;
  flex-shrink: 0;

  /* Modern scrollbar */
  &::-webkit-scrollbar {
    height: 3px;
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

const Tab = styled(motion.div)<{ active: boolean }>`
  display: flex;
  align-items: center;
  padding: ${vibeTheme.spacing[2]} ${vibeTheme.spacing[4]};
  background: ${(props) =>
    props.active ? vibeTheme.colors.secondary : 'transparent'};
  border-right: 1px solid rgba(139, 92, 246, 0.08);
  cursor: pointer;
  min-width: 120px;
  max-width: 200px;
  position: relative;
  transition: ${vibeTheme.animation.transition.all};
  height: 36px;

  ${(props) =>
    props.active &&
    `
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: ${vibeTheme.colors.cyan};
    }
  `}

  &:hover {
    background: ${(props) =>
      props.active ? vibeTheme.colors.secondary : vibeTheme.colors.hover};
  }

  &:hover .close-button {
    opacity: 1;
  }
`;

const TabLabel = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'modified',
})<{ modified: boolean }>`
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.normal};
  color: ${(props) => (props.modified ? vibeTheme.colors.text : vibeTheme.colors.textSecondary)};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: ${vibeTheme.spacing[2]};

  &:after {
    content: ${(props) => (props.modified ? '"●"' : '""')};
    margin-left: ${vibeTheme.spacing[1]};
    color: ${vibeTheme.colors.cyan};
    font-size: 8px;
  }
`;

const CloseButton = styled(motion.button)`
  background: transparent;
  border: none;
  color: ${vibeTheme.colors.textSecondary};
  cursor: pointer;
  padding: ${vibeTheme.spacing[1]};
  border-radius: ${vibeTheme.borderRadius.sm};
  opacity: 0;
  transition: ${vibeTheme.animation.transition.all};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;

  &:hover {
    background: ${vibeTheme.colors.hover};
    color: ${vibeTheme.colors.error};
  }
`;

const LanguageIcon = styled.span`
  width: 18px;
  height: 18px;
  margin-right: ${vibeTheme.spacing[2]};
  border-radius: ${vibeTheme.borderRadius.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: ${vibeTheme.typography.fontWeight.bold};
  background: #007acc;
  color: ${vibeTheme.colors.text};
  font-family: ${vibeTheme.typography.fontFamily.mono};
  letter-spacing: -0.5px;
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
