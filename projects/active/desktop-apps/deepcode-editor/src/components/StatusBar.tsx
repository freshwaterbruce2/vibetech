import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, GitBranch, Layers, MessageCircle, Sidebar, Sparkles, Terminal,Zap } from 'lucide-react';
import styled from 'styled-components';

import { useGit } from '../hooks/useGit';
import { vibeTheme } from '../styles/theme';
import { EditorFile } from '../types';

const StatusBarContainer = styled.div`
  display: flex;
  align-items: center;
  height: 32px;
  background: linear-gradient(
    135deg,
    ${vibeTheme.colors.primary} 0%,
    ${vibeTheme.colors.secondary} 100%
  );
  border-top: 2px solid rgba(139, 92, 246, 0.2);
  color: ${vibeTheme.colors.text};
  font-size: ${vibeTheme.typography.fontSize.xs};
  padding: 0 ${vibeTheme.spacing.md};
  justify-content: space-between;
  flex-shrink: 0;
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

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.md};
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.md};
`;

const StatusItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.xs};
  cursor: pointer;
  padding: ${vibeTheme.spacing.xs} ${vibeTheme.spacing.sm};
  border-radius: ${vibeTheme.borderRadius.small};
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  transition: all ${vibeTheme.animation.duration.fast} ease;
  font-weight: ${vibeTheme.typography.fontWeight.medium};

  &:hover {
    background: rgba(139, 92, 246, 0.2);
    border-color: ${vibeTheme.colors.cyan};
    transform: translateY(-1px);
  }

  svg {
    color: ${vibeTheme.colors.cyan};
    filter: drop-shadow(0 0 4px ${vibeTheme.colors.cyan}50);
  }
`;

const ToggleButton = styled(motion.button).withConfig({
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>`
  background: ${(props) =>
    props.active
      ? 'linear-gradient(90deg, rgba(139, 92, 246, 0.3) 0%, rgba(0, 212, 255, 0.2) 100%)'
      : 'rgba(139, 92, 246, 0.1)'};
  border: 2px solid ${(props) => (props.active ? vibeTheme.colors.cyan : 'rgba(139, 92, 246, 0.2)')};
  color: ${vibeTheme.colors.text};
  cursor: pointer;
  padding: ${vibeTheme.spacing.xs} ${vibeTheme.spacing.sm};
  border-radius: ${vibeTheme.borderRadius.small};
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.xs};
  font-size: ${vibeTheme.typography.fontSize.xs};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  transition: all ${vibeTheme.animation.duration.normal} ease;

  ${(props) =>
    props.active &&
    `
    box-shadow: 0 0 12px rgba(0, 212, 255, 0.3);
  `}

  &:hover {
    background: ${(props) =>
      props.active
        ? 'linear-gradient(90deg, rgba(139, 92, 246, 0.4) 0%, rgba(0, 212, 255, 0.3) 100%)'
        : 'rgba(139, 92, 246, 0.2)'};
    border-color: ${vibeTheme.colors.cyan};
    transform: translateY(-1px);
    box-shadow: 0 0 16px rgba(0, 212, 255, 0.4);
  }

  svg {
    color: ${(props) => (props.active ? vibeTheme.colors.cyan : vibeTheme.colors.textSecondary)};
    filter: drop-shadow(
      0 0 4px ${(props) => (props.active ? vibeTheme.colors.cyan : 'transparent')}
    );
  }
`;

const Separator = styled.div`
  width: 2px;
  height: 20px;
  background: ${vibeTheme.gradients.border};
  border-radius: ${vibeTheme.borderRadius.full};
  opacity: 0.6;
`;

interface StatusBarProps {
  currentFile: EditorFile | null;
  aiChatOpen: boolean;
  onToggleSidebar: () => void;
  onToggleAIChat: () => void;
  onOpenAgentMode?: () => void;
  onOpenComposerMode?: () => void;
  onOpenTerminal?: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({
  currentFile,
  aiChatOpen,
  onToggleSidebar,
  onToggleAIChat,
  onOpenAgentMode,
  onOpenComposerMode,
  onOpenTerminal,
}) => {
  const { isGitRepo, status, branches } = useGit();

  const getFileInfo = () => {
    if (!currentFile) {
      return null;
    }

    const lines = currentFile.content.split('\n').length;
    const characters = currentFile.content.length;
    const words = currentFile.content.split(/\s+/).filter((word) => word.length > 0).length;

    return { lines, characters, words };
  };

  const fileInfo = getFileInfo();
  const currentBranch = branches.find((b) => b.isCurrent);
  const gitChanges =
    (status?.modified.length || 0) +
    (status?.added.length || 0) +
    (status?.deleted.length || 0) +
    (status?.untracked.length || 0);

  return (
    <StatusBarContainer>
      <LeftSection>
        {isGitRepo && (
          <StatusItem
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
            title={`Current branch: ${currentBranch?.name || 'detached'}`}
          >
            <GitBranch size={14} />
            {currentBranch?.name || 'detached'}
            {gitChanges > 0 && (
              <span style={{ marginLeft: '4px', color: vibeTheme.colors.cyan }}>+{gitChanges}</span>
            )}
          </StatusItem>
        )}

        <StatusItem whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
          <CheckCircle size={14} />
          No errors
        </StatusItem>

        {currentFile && (
          <>
            <Separator />
            <StatusItem whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
              {currentFile.language.toUpperCase()}
            </StatusItem>

            {fileInfo && (
              <StatusItem whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
                Ln {fileInfo.lines}, Col 1 | {fileInfo.characters} chars | {fileInfo.words} words
              </StatusItem>
            )}

            {currentFile.isModified && (
              <StatusItem whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
                <AlertCircle size={14} />
                Unsaved changes
              </StatusItem>
            )}
          </>
        )}
      </LeftSection>

      <RightSection>
        <StatusItem whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
          <Zap size={14} />
          DeepSeek AI Ready
        </StatusItem>

        <Separator />
        
        {onOpenAgentMode && (
          <ToggleButton
            active={false}
            onClick={onOpenAgentMode}
            title="Open Agent Mode"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles size={14} />
            Agent
          </ToggleButton>
        )}
        
        {onOpenComposerMode && (
          <ToggleButton
            active={false}
            onClick={onOpenComposerMode}
            title="Open Composer Mode"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Layers size={14} />
            Composer
          </ToggleButton>
        )}

        {onOpenTerminal && (
          <ToggleButton
            active={false}
            onClick={onOpenTerminal}
            title="Open Terminal"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Terminal size={14} />
            Terminal
          </ToggleButton>
        )}

        <ToggleButton
          active={aiChatOpen}
          onClick={onToggleAIChat}
          title="Toggle AI Chat"
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
        >
          <MessageCircle size={14} />
          AI Chat
        </ToggleButton>

        <ToggleButton
          active={true}
          onClick={onToggleSidebar}
          title="Toggle Sidebar"
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Sidebar size={14} />
        </ToggleButton>
      </RightSection>
    </StatusBarContainer>
  );
};

export default StatusBar;
