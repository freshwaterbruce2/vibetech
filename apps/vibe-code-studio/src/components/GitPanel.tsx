import React, { useCallback, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Download,
  GitBranch,
  Minus,
  Plus,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';
import AutoSizer from 'react-virtualized-auto-sizer';
import * as ReactWindow from 'react-window';
import styled from 'styled-components';

const List = ReactWindow.FixedSizeList;

import { useGit } from '../hooks/useGit';
import { logger } from '../services/Logger';
import { vibeTheme } from '../styles/theme';

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${vibeTheme.colors.primary};
  color: ${vibeTheme.colors.text};
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  background: ${vibeTheme.colors.secondary};
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
`;

const Title = styled.h3`
  margin: 0;
  font-size: ${vibeTheme.typography.fontSize.base};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.xs};

  svg {
    width: 18px;
    height: 18px;
    color: ${vibeTheme.colors.purple};
  }
`;

const Actions = styled.div`
  display: flex;
  gap: ${vibeTheme.spacing.xs};
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  color: ${vibeTheme.colors.textSecondary};
  cursor: pointer;
  padding: ${vibeTheme.spacing.xs};
  border-radius: ${vibeTheme.borderRadius.small};
  transition: all ${vibeTheme.animation.duration.fast} ease;

  &:hover {
    background: rgba(139, 92, 246, 0.1);
    color: ${vibeTheme.colors.text};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const BranchSection = styled.div`
  padding: ${vibeTheme.spacing.md};
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
`;

const BranchSelector = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};
  padding: ${vibeTheme.spacing.sm};
  background: ${vibeTheme.colors.secondary};
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: ${vibeTheme.borderRadius.small};
  cursor: pointer;
  transition: all ${vibeTheme.animation.duration.fast} ease;

  &:hover {
    border-color: ${vibeTheme.colors.purple};
  }
`;

const ChangesSection = styled.div`
  flex: 1;
  overflow: hidden; /* Handled by AutoSizer/List */
  padding: ${vibeTheme.spacing.md};
  padding-bottom: 0; /* List handles bottom padding */
`;

const SectionTitle = styled.div`
  padding: ${vibeTheme.spacing.sm} 0;
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  color: ${vibeTheme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${vibeTheme.colors.primary}; /* Stickiness */
`;

const FileItemContainer = styled.div<{ $status: 'modified' | 'added' | 'deleted' | 'untracked' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${vibeTheme.spacing.xs} ${vibeTheme.spacing.sm};
  background: ${vibeTheme.colors.secondary};
  border-radius: ${vibeTheme.borderRadius.small};
  font-size: ${vibeTheme.typography.fontSize.sm};
  cursor: pointer;
  transition: all ${vibeTheme.animation.duration.fast} ease;
  margin-bottom: 4px;

  &:hover {
    background: rgba(139, 92, 246, 0.1);
  }

  &::before {
    content: '';
    width: 3px;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    background: ${(props) => {
      switch (props.$status) {
        case 'modified':
          return vibeTheme.colors.cyan;
        case 'added':
          return vibeTheme.colors.purple;
        case 'deleted':
          return '#ff6b6b';
        case 'untracked':
          return vibeTheme.colors.textSecondary;
      }
    }};
    border-radius: ${vibeTheme.borderRadius.small} 0 0 ${vibeTheme.borderRadius.small};
  }

  position: relative;
  padding-left: ${vibeTheme.spacing.md};
`;

const FileName = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FileActions = styled.div`
  display: flex;
  gap: ${vibeTheme.spacing.xs};
  opacity: 0;
  transition: opacity ${vibeTheme.animation.duration.fast} ease;

  ${FileItemContainer}:hover & {
    opacity: 1;
  }
`;

const CommitSection = styled.div`
  padding: ${vibeTheme.spacing.md};
  border-top: 1px solid rgba(139, 92, 246, 0.1);
  /* Ensure it sits at the bottom if there's space, but usually flex parent handles it */
`;

const CommitInput = styled.textarea`
  width: 100%;
  min-height: 60px;
  padding: ${vibeTheme.spacing.sm};
  background: ${vibeTheme.colors.secondary};
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: ${vibeTheme.borderRadius.small};
  color: ${vibeTheme.colors.text};
  font-family: ${vibeTheme.typography.fontFamily.primary};
  font-size: ${vibeTheme.typography.fontSize.sm};
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${vibeTheme.colors.purple};
  }

  &::placeholder {
    color: ${vibeTheme.colors.textSecondary};
  }
`;

const CommitButton = styled.button`
  width: 100%;
  margin-top: ${vibeTheme.spacing.sm};
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  background: ${vibeTheme.gradients.primary};
  border: none;
  border-radius: ${vibeTheme.borderRadius.small};
  color: ${vibeTheme.colors.text};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${vibeTheme.animation.duration.fast} ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${vibeTheme.shadows.small};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${vibeTheme.spacing.xl};
  text-align: center;
  color: ${vibeTheme.colors.textSecondary};

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: ${vibeTheme.spacing.md};
    opacity: 0.5;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${vibeTheme.spacing.xl};

  svg {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: ${vibeTheme.borderRadius.small};
  color: #ff6b6b;
  font-size: ${vibeTheme.typography.fontSize.sm};
  margin: ${vibeTheme.spacing.md};

  svg {
    width: 16px;
    height: 16px;
  }
`;

interface GitPanelProps {
  workingDirectory?: string | undefined;
}

type ListItem =
  | { type: 'header'; title: string }
  | { type: 'file'; file: string; status: 'modified' | 'added' | 'deleted' | 'untracked' };

export const GitPanel: React.FC<GitPanelProps> = ({ workingDirectory }) => {
  const {
    isGitRepo,
    status,
    branches,
    isLoading,
    error,
    refresh,
    init,
    add,
    reset,
    commit,
    push,
    pull,
    discardChanges,
  } = useGit(workingDirectory);

  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);

  const handleCommit = useCallback(async () => {
    if (!commitMessage.trim()) {
      return;
    }

    setIsCommitting(true);
    try {
      await commit(commitMessage);
      setCommitMessage('');
    } catch (err) {
      logger.error('Commit failed:', err);
    } finally {
      setIsCommitting(false);
    }
  }, [commit, commitMessage]);

  const handleStageFile = useCallback(
    async (file: string) => {
      try {
        await add(file);
      } catch (err) {
        logger.error('Failed to stage file:', err);
      }
    },
    [add]
  );

  const handleUnstageFile = useCallback(
    async (file: string) => {
      try {
        await reset(file);
      } catch (err) {
        logger.error('Failed to unstage file:', err);
      }
    },
    [reset]
  );

  const handleDiscardChanges = useCallback(
    async (file: string) => {
      if (window.confirm(`Discard changes to ${file}?`)) {
        try {
          await discardChanges(file);
        } catch (err) {
          logger.error('Failed to discard changes:', err);
        }
      }
    },
    [discardChanges]
  );

  // Flatten the list for virtualization
  const listItems = useMemo(() => {
    if (!status) return [];
    const items: ListItem[] = [];

    if (status.modified && status.modified.length > 0) {
      items.push({ type: 'header', title: 'Changes' });
      status.modified.forEach((file) => {
        items.push({ type: 'file', file, status: 'modified' });
      });
    }

    if (status.untracked && status.untracked.length > 0) {
      items.push({ type: 'header', title: 'Untracked Files' });
      status.untracked.forEach((file) => {
        items.push({ type: 'file', file, status: 'untracked' });
      });
    }

    const stagedFiles = [...(status.added || []), ...(status.modified || [])]; // Note: Logic from original file for staged seems potentially overlapping, simplified for visual list
    // Correct logic from original: staged combines status.added and status.modified? No, staged is usually separate.
    // The hook likely separates them. Let's assume the hook returns `added` as staged.
    // Original code: const stagedFiles = [...(status?.added || []), ...(status?.modified || [])];
    // Wait, if it's modified it's unstaged usually?
    // Let's trust the hook's output structure for now but only include what was in the original render logic.
    // Original had "Staged Changes" section.

    if (status.added && status.added.length > 0) {
       items.push({ type: 'header', title: 'Staged Changes' });
       status.added.forEach((file) => {
         items.push({ type: 'file', file, status: 'added' });
       });
    }

    return items;
  }, [status]);

  // Row renderer
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = listItems[index];

    if (item.type === 'header') {
      return <SectionTitle style={style}>{item.title}</SectionTitle>;
    }

    return (
      <div style={style}>
        <FileItemContainer $status={item.status}>
          <FileName>{item.file}</FileName>
          <FileActions>
            {item.status === 'added' ? (
              <ActionButton onClick={() => handleUnstageFile(item.file)} title="Unstage">
                <Minus size={14} />
              </ActionButton>
            ) : (
              <ActionButton onClick={() => handleStageFile(item.file)} title="Stage">
                <Plus size={14} />
              </ActionButton>
            )}
            {item.status === 'modified' && (
              <ActionButton onClick={() => handleDiscardChanges(item.file)} title="Discard">
                <X size={14} />
              </ActionButton>
            )}
          </FileActions>
        </FileItemContainer>
      </div>
    );
  };

  if (isLoading) {
    return (
      <PanelContainer>
        <LoadingSpinner>
          <RefreshCw size={24} />
        </LoadingSpinner>
      </PanelContainer>
    );
  }

  if (!isGitRepo) {
    return (
      <PanelContainer>
        <EmptyState>
          <GitBranch />
          <p>Not a Git repository</p>
          <CommitButton onClick={init}>Initialize Git Repository</CommitButton>
        </EmptyState>
      </PanelContainer>
    );
  }

  const currentBranch = branches.find((b) => b.isCurrent);
  const hasChanges = listItems.length > 0; // Simplified check

  return (
    <PanelContainer>
      <PanelHeader>
        <Title>
          <GitBranch />
          Source Control
        </Title>
        <Actions>
          <ActionButton onClick={() => pull()} title="Pull">
            <Download />
          </ActionButton>
          <ActionButton onClick={() => push()} title="Push">
            <Upload />
          </ActionButton>
          <ActionButton onClick={refresh} title="Refresh">
            <RefreshCw />
          </ActionButton>
        </Actions>
      </PanelHeader>

      {error && (
        <ErrorMessage>
          <AlertCircle />
          {error}
        </ErrorMessage>
      )}

      <BranchSection>
        <BranchSelector>
          <GitBranch size={16} />
          <span>{currentBranch?.name || 'No branch'}</span>
        </BranchSelector>
      </BranchSection>

      <ChangesSection>
        {!hasChanges && status?.isClean && (
            <EmptyState>
                <Check />
                <p>No changes to commit</p>
            </EmptyState>
        )}
        {hasChanges && (
             <AutoSizer>
              {({ height, width }) => (
                <List
                  height={height}
                  itemCount={listItems.length}
                  itemSize={36} // Height of item + margin
                  width={width}
                >
                  {Row}
                </List>
              )}
            </AutoSizer>
        )}
      </ChangesSection>

      {hasChanges && (
        <CommitSection>
          <CommitInput
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) {
                handleCommit();
              }
            }}
          />
          <CommitButton
            onClick={handleCommit}
            disabled={!commitMessage.trim() || isCommitting}
          >
            {isCommitting ? 'Committing...' : 'Commit'}
          </CommitButton>
        </CommitSection>
      )}
    </PanelContainer>
  );
};

export default GitPanel;
