/**
 * MultiFileEditApprovalPanel - UI for approving/rejecting multi-file changes
 * Shows diff preview, allows selective file approval
 */
import React, { useState } from 'react';
import type { FileChange, MultiFileEditPlan } from '@vibetech/types/multifile';
import { motion } from 'framer-motion';
import { Check, ChevronRight, FileText, Minus,Plus, X } from 'lucide-react';
import styled from 'styled-components';

import { vibeTheme } from '../styles/theme';

const PanelContainer = styled(motion.div)`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 600px;
  background: ${vibeTheme.colors.secondary};
  border-left: 1px solid ${vibeTheme.colors.border};
  display: flex;
  flex-direction: column;
  z-index: 100;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.2);
`;

const Header = styled.div`
  padding: 16px 20px;
  background: ${vibeTheme.colors.elevated};
  border-bottom: 1px solid ${vibeTheme.colors.border};
`;

const Title = styled.h3`
  margin: 0 0 8px 0;
  color: ${vibeTheme.colors.text};
  font-size: ${vibeTheme.typography.fontSize.lg};
  font-weight: ${vibeTheme.typography.fontWeight.semibold};
`;

const Description = styled.p`
  margin: 0;
  color: ${vibeTheme.colors.textSecondary};
  font-size: ${vibeTheme.typography.fontSize.sm};
`;

const FileList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
`;

const FileItem = styled.div<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: ${props => props.$selected
    ? 'rgba(139, 92, 246, 0.1)'
    : vibeTheme.colors.elevated};
  border: 1px solid ${props => props.$selected
    ? 'rgba(139, 92, 246, 0.3)'
    : vibeTheme.colors.border};
  border-radius: ${vibeTheme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(139, 92, 246, 0.15);
    border-color: rgba(139, 92, 246, 0.4);
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: ${vibeTheme.accent};
`;

const FileName = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${vibeTheme.colors.text};
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-family: ${vibeTheme.typography.fontFamily.mono};
`;

const DiffStats = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-family: ${vibeTheme.typography.fontFamily.mono};
`;

const DiffAdded = styled.span`
  color: #22c55e;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DiffRemoved = styled.span`
  color: #ef4444;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const DiffPreview = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: ${vibeTheme.colors.primary};
  border-top: 1px solid ${vibeTheme.colors.border};
  font-family: ${vibeTheme.typography.fontFamily.mono};
  font-size: ${vibeTheme.typography.fontSize.sm};
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const DiffLine = styled.div<{ $type: 'add' | 'remove' | 'context' }>`
  padding: 2px 8px;
  background: ${props =>
    props.$type === 'add' ? 'rgba(34, 197, 94, 0.1)' :
    props.$type === 'remove' ? 'rgba(239, 68, 68, 0.1)' :
    'transparent'
  };
  color: ${props =>
    props.$type === 'add' ? '#22c55e' :
    props.$type === 'remove' ? '#ef4444' :
    vibeTheme.colors.textSecondary
  };
  border-left: 3px solid ${props =>
    props.$type === 'add' ? '#22c55e' :
    props.$type === 'remove' ? '#ef4444' :
    'transparent'
  };
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: ${vibeTheme.colors.elevated};
  border-top: 1px solid ${vibeTheme.colors.border};
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 12px 24px;
  background: ${props => props.$variant === 'primary'
    ? vibeTheme.gradients.primary
    : 'transparent'};
  color: ${props => props.$variant === 'primary'
    ? vibeTheme.colors.text
    : vibeTheme.colors.textSecondary};
  border: 1px solid ${props => props.$variant === 'primary'
    ? 'transparent'
    : vibeTheme.colors.border};
  border-radius: ${vibeTheme.borderRadius.md};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const EmptyState = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: ${vibeTheme.colors.textSecondary};
`;

interface MultiFileEditApprovalPanelProps {
  plan: MultiFileEditPlan;
  changes: FileChange[];
  onApply: (selectedFiles: string[]) => void;
  onReject: () => void;
}

export const MultiFileEditApprovalPanel: React.FC<MultiFileEditApprovalPanelProps> = ({
  plan,
  changes,
  onApply,
  onReject,
}) => {
  // All files selected by default
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(
    new Set(changes.map(c => c.path))
  );
  const [previewFile, setPreviewFile] = useState<string | null>(
    changes.length > 0 ? changes[0].path : null
  );

  const toggleFile = (path: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(path)) {
      newSelected.delete(path);
    } else {
      newSelected.add(path);
    }
    setSelectedFiles(newSelected);
  };

  const calculateDiffStats = (change: FileChange) => {
    const lines = change.diff?.split('\n') || [];
    const added = lines.filter(l => l.startsWith('+')).length;
    const removed = lines.filter(l => l.startsWith('-')).length;
    return { added, removed };
  };

  const renderDiff = (diff: string | undefined) => {
    if (!diff) {
      return <EmptyState>No diff available</EmptyState>;
    }

    return diff.split('\n').map((line, i) => {
      const type = line.startsWith('+') ? 'add' :
                   line.startsWith('-') ? 'remove' :
                   'context';
      return <DiffLine key={i} $type={type}>{line}</DiffLine>;
    });
  };

  const previewChange = changes.find(c => c.path === previewFile);

  return (
    <PanelContainer
      initial={{ x: 600 }}
      animate={{ x: 0 }}
      exit={{ x: 600 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <Header>
        <Title>Multi-File Changes ({changes.length} files)</Title>
        <Description>{plan.description}</Description>
      </Header>

      <FileList>
        {changes.map(change => {
          const { added, removed } = calculateDiffStats(change);
          const isSelected = selectedFiles.has(change.path);

          return (
            <FileItem
              key={change.path}
              $selected={isSelected}
              onClick={() => setPreviewFile(change.path)}
            >
              <Checkbox
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleFile(change.path)}
                onClick={(e) => e.stopPropagation()}
              />
              <FileName>
                <FileText size={16} />
                {change.path}
              </FileName>
              <DiffStats>
                {added > 0 && (
                  <DiffAdded>
                    <Plus size={14} />
                    {added}
                  </DiffAdded>
                )}
                {removed > 0 && (
                  <DiffRemoved>
                    <Minus size={14} />
                    {removed}
                  </DiffRemoved>
                )}
              </DiffStats>
              <ChevronRight size={16} opacity={0.5} />
            </FileItem>
          );
        })}
      </FileList>

      {previewChange && (
        <DiffPreview>
          {renderDiff(previewChange.diff)}
        </DiffPreview>
      )}

      <Actions>
        <Button $variant="secondary" onClick={onReject}>
          <X size={18} />
          Reject All
        </Button>
        <Button
          $variant="primary"
          onClick={() => onApply(Array.from(selectedFiles))}
          disabled={selectedFiles.size === 0}
        >
          <Check size={18} />
          Apply Selected ({selectedFiles.size})
        </Button>
      </Actions>
    </PanelContainer>
  );
};
