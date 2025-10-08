import React from 'react';
import { FileCode, Lightbulb, RefreshCw, Wrench } from 'lucide-react';
import styled from 'styled-components';

import { vibeTheme } from '../styles/theme';

interface CodeAction {
  id: string;
  title: string;
  kind: 'quickfix' | 'refactor' | 'source';
  description?: string;
  execute: () => Promise<void>;
}

interface CodeActionsProps {
  actions: CodeAction[];
  position: { x: number; y: number };
  onClose: () => void;
}

const Container = styled.div<{ $x: number; $y: number }>`
  position: absolute;
  top: ${(props) => props.$y}px;
  left: ${(props) => props.$x}px;
  z-index: 1000;
  background: ${vibeTheme.colors.secondary};
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: ${vibeTheme.borderRadius.medium};
  box-shadow: ${vibeTheme.shadows.large};
  min-width: 250px;
  max-width: 400px;
  overflow: hidden;
  backdrop-filter: blur(10px);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  background: rgba(139, 92, 246, 0.1);
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);

  svg {
    width: 16px;
    height: 16px;
    color: ${vibeTheme.colors.purple};
  }
`;

const Title = styled.span`
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  color: ${vibeTheme.colors.text};
`;

const ActionList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 300px;
  overflow-y: auto;
`;

const ActionItem = styled.li`
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  cursor: pointer;
  transition: all ${vibeTheme.animation.duration.fast} ease;
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};

  &:hover {
    background: rgba(139, 92, 246, 0.1);
  }

  &:active {
    background: rgba(139, 92, 246, 0.2);
  }
`;

const ActionIcon = styled.div<{ $kind: 'quickfix' | 'refactor' | 'source' }>`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 14px;
    height: 14px;
    color: ${(props) => {
      switch (props.$kind) {
        case 'quickfix':
          return vibeTheme.colors.warning;
        case 'refactor':
          return vibeTheme.colors.cyan;
        case 'source':
          return vibeTheme.colors.success;
      }
    }};
  }
`;

const ActionContent = styled.div`
  flex: 1;
`;

const ActionTitle = styled.div`
  font-size: ${vibeTheme.typography.fontSize.sm};
  color: ${vibeTheme.colors.text};
`;

const ActionDescription = styled.div`
  font-size: ${vibeTheme.typography.fontSize.xs};
  color: ${vibeTheme.colors.textSecondary};
  margin-top: 2px;
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
`;

export const CodeActions: React.FC<CodeActionsProps> = ({ actions, position, onClose }) => {
  const getIcon = (kind: CodeAction['kind']) => {
    switch (kind) {
      case 'quickfix':
        return <Wrench />;
      case 'refactor':
        return <RefreshCw />;
      case 'source':
        return <FileCode />;
    }
  };

  const handleAction = async (action: CodeAction) => {
    try {
      await action.execute();
      onClose();
    } catch (error) {
      console.error('Failed to execute code action:', error);
    }
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <>
      <Backdrop onClick={onClose} />
      <Container $x={position.x} $y={position.y}>
        <Header>
          <Lightbulb />
          <Title>Quick Actions</Title>
        </Header>
        <ActionList>
          {actions.map((action) => (
            <ActionItem key={action.id} onClick={() => handleAction(action)}>
              <ActionIcon $kind={action.kind}>{getIcon(action.kind)}</ActionIcon>
              <ActionContent>
                <ActionTitle>{action.title}</ActionTitle>
                {action.description && <ActionDescription>{action.description}</ActionDescription>}
              </ActionContent>
            </ActionItem>
          ))}
        </ActionList>
      </Container>
    </>
  );
};

export default CodeActions;
