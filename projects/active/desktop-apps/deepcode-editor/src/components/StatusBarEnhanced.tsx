import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  GitBranch,
  Layers,
  MessageCircle,
  Sidebar,
  Sparkles,
  Terminal,
  Zap,
  Activity,
  Bot,
  Cpu,
  Brain,
  Gauge
} from 'lucide-react';
import styled from 'styled-components';

import { useGit } from '../hooks/useGit';
import { vibeTheme } from '../styles/theme';
import { EditorFile } from '../types';

const StatusBarContainer = styled.div`
  display: flex;
  align-items: center;
  height: 28px;
  background: ${vibeTheme.colors.primary};
  border-top: 1px solid rgba(139, 92, 246, 0.1);
  color: ${vibeTheme.colors.textSecondary};
  font-size: ${vibeTheme.typography.fontSize.xs};
  padding: 0 ${vibeTheme.spacing[4]};
  justify-content: space-between;
  flex-shrink: 0;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing[3]};
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing[2]};
`;

const StatusItem = styled(motion.div)<{ clickable?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing[1]};
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  padding: ${vibeTheme.spacing[1]} ${vibeTheme.spacing[2]};
  border-radius: ${vibeTheme.borderRadius.sm};
  background: transparent;
  transition: ${vibeTheme.animation.transition.all};
  font-weight: ${vibeTheme.typography.fontWeight.normal};
  color: ${vibeTheme.colors.textSecondary};

  &:hover {
    background: ${props => props.clickable ? vibeTheme.colors.hover : 'transparent'};
    color: ${props => props.clickable ? vibeTheme.colors.text : 'inherit'};
  }

  svg {
    color: inherit;
    width: 14px;
    height: 14px;
  }
`;

const ModelIndicator = styled(StatusItem)`
  background: ${vibeTheme.colors.hoverStrong};
  border: 1px solid rgba(0, 212, 255, 0.2);
  color: ${vibeTheme.colors.cyan};

  &:hover {
    background: ${vibeTheme.colors.active};
    border-color: rgba(0, 212, 255, 0.4);
  }

  svg {
    color: ${vibeTheme.colors.cyan};
  }
`;

const StrategyBadge = styled.span`
  padding: 2px 6px;
  border-radius: ${vibeTheme.borderRadius.xs};
  background: rgba(139, 92, 246, 0.2);
  color: ${vibeTheme.colors.purple};
  font-size: 10px;
  text-transform: uppercase;
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  margin-left: 4px;
`;

const ToggleButton = styled(motion.button).withConfig({
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>`
  background: ${(props) =>
    props.active ? vibeTheme.colors.hoverStrong : 'transparent'};
  border: 1px solid ${(props) =>
    props.active ? 'rgba(0, 212, 255, 0.3)' : 'transparent'};
  color: ${(props) =>
    props.active ? vibeTheme.colors.text : vibeTheme.colors.textSecondary};
  cursor: pointer;
  padding: ${vibeTheme.spacing[1]} ${vibeTheme.spacing[2]};
  border-radius: ${vibeTheme.borderRadius.sm};
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing[1]};
  font-size: ${vibeTheme.typography.fontSize.xs};
  font-weight: ${vibeTheme.typography.fontWeight.normal};
  font-family: ${vibeTheme.typography.fontFamily.primary};
  transition: ${vibeTheme.animation.transition.all};

  &:hover {
    background: ${(props) =>
      props.active ? vibeTheme.colors.active : vibeTheme.colors.hover};
    color: ${vibeTheme.colors.text};
  }

  svg {
    color: ${(props) =>
      props.active ? vibeTheme.colors.cyan : 'inherit'};
    width: 14px;
    height: 14px;
  }
`;

const Separator = styled.div`
  width: 1px;
  height: 16px;
  background: rgba(139, 92, 246, 0.2);
  border-radius: ${vibeTheme.borderRadius.full};
`;

// Model strategy type
type ModelStrategy = 'fast' | 'balanced' | 'accurate' | 'adaptive';

interface StatusBarEnhancedProps {
  currentFile: EditorFile | null;
  aiChatOpen: boolean;
  backgroundPanelOpen?: boolean;
  onToggleSidebar: () => void;
  onToggleAIChat: () => void;
  onToggleBackgroundPanel?: () => void;
  onOpenAgentMode?: () => void;
  onOpenComposerMode?: () => void;
  onOpenTerminal?: () => void;
  currentAIModel?: string;
  modelStrategy?: ModelStrategy;
  hasAnthropicKey?: boolean;
  onModelStrategyClick?: () => void;
}

const StatusBarEnhanced: React.FC<StatusBarEnhancedProps> = ({
  currentFile,
  aiChatOpen,
  backgroundPanelOpen,
  onToggleSidebar,
  onToggleAIChat,
  onToggleBackgroundPanel,
  onOpenAgentMode,
  onOpenComposerMode,
  onOpenTerminal,
  currentAIModel = 'DeepSeek Chat',
  modelStrategy = 'fast',
  hasAnthropicKey = false,
  onModelStrategyClick,
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

  // Get the model display name based on current model
  const getModelDisplayName = () => {
    if (currentAIModel.includes('haiku')) return 'Haiku 4.5';
    if (currentAIModel.includes('sonnet')) return 'Sonnet 4.5';
    if (currentAIModel.includes('deepseek')) return 'DeepSeek';
    return currentAIModel;
  };

  // Get strategy icon
  const getStrategyIcon = () => {
    switch (modelStrategy) {
      case 'fast': return <Zap size={14} />;
      case 'balanced': return <Gauge size={14} />;
      case 'accurate': return <Cpu size={14} />;
      case 'adaptive': return <Brain size={14} />;
      default: return <Bot size={14} />;
    }
  };

  // Get strategy color
  const getStrategyColor = () => {
    switch (modelStrategy) {
      case 'fast': return vibeTheme.colors.green;
      case 'balanced': return vibeTheme.colors.cyan;
      case 'accurate': return vibeTheme.colors.purple;
      case 'adaptive': return vibeTheme.colors.orange;
      default: return vibeTheme.colors.textSecondary;
    }
  };

  return (
    <StatusBarContainer>
      <LeftSection>
        {isGitRepo && (
          <StatusItem
            clickable
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

        <StatusItem clickable whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
          <CheckCircle size={14} />
          No errors
        </StatusItem>

        {currentFile && (
          <>
            <Separator />
            <StatusItem clickable whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
              {currentFile.language.toUpperCase()}
            </StatusItem>

            {fileInfo && (
              <StatusItem clickable whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
                Ln {fileInfo.lines}, Col 1 | {fileInfo.characters} chars | {fileInfo.words} words
              </StatusItem>
            )}

            {currentFile.isModified && (
              <StatusItem clickable whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.95 }}>
                <AlertCircle size={14} />
                Unsaved changes
              </StatusItem>
            )}
          </>
        )}
      </LeftSection>

      <RightSection>
        {/* Enhanced AI Model Indicator */}
        <ModelIndicator
          clickable
          onClick={onModelStrategyClick}
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          title={`Current AI: ${getModelDisplayName()} | Strategy: ${modelStrategy} | Click to change strategy`}
          style={{ color: getStrategyColor() }}
        >
          {getStrategyIcon()}
          <span>{getModelDisplayName()}</span>
          <StrategyBadge>{modelStrategy}</StrategyBadge>
          {!hasAnthropicKey && (
            <span style={{
              fontSize: '10px',
              color: vibeTheme.colors.orange,
              marginLeft: '4px'
            }}>
              (DeepSeek only)
            </span>
          )}
        </ModelIndicator>

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

        {onToggleBackgroundPanel && (
          <ToggleButton
            active={backgroundPanelOpen || false}
            onClick={onToggleBackgroundPanel}
            title="Toggle Background Tasks"
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Activity size={14} />
            Tasks
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

export default StatusBarEnhanced;