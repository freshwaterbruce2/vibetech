import React, { useState } from 'react';
import { AnimatePresence,motion } from 'framer-motion';
import { AlertTriangle,CheckCircle2, ChevronDown, ChevronRight, FileEdit, XCircle } from 'lucide-react';
import styled from 'styled-components';

import { vibeTheme } from '../styles/theme';
import { FileChange } from '@vibetech/types/multifile';

interface MultiFileDiffViewProps {
  changes: FileChange[];
  onApprove: () => void;
  onReject: () => void;
  estimatedImpact: 'low' | 'medium' | 'high';
}

export const MultiFileDiffView: React.FC<MultiFileDiffViewProps> = ({
  changes,
  onApprove,
  onReject,
  estimatedImpact,
}) => {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const toggleFile = (path: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFiles(newExpanded);
  };

  const impactColor = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  }[estimatedImpact];

  return (
    <Container
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Header>
        <Title>
          <FileEdit size={20} />
          Multi-File Changes ({changes.length} files)
        </Title>
        <ImpactBadge $color={impactColor}>
          {estimatedImpact.toUpperCase()} IMPACT
        </ImpactBadge>
      </Header>

      <FileList>
        {changes.map((change) => (
          <FileCard key={change.path}>
            <FileHeader onClick={() => toggleFile(change.path)}>
              <FileInfo>
                {expandedFiles.has(change.path) ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                <FileName>{change.path}</FileName>
                <ChangeType>{change.changeType}</ChangeType>
              </FileInfo>
              {change.reason && <Reason>{change.reason}</Reason>}
            </FileHeader>

            <AnimatePresence>
              {expandedFiles.has(change.path) && (
                <DiffContainer
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <DiffContent>{change.diff || 'No changes'}</DiffContent>
                </DiffContainer>
              )}
            </AnimatePresence>
          </FileCard>
        ))}
      </FileList>

      <Actions>
        <RejectButton onClick={onReject}>
          <XCircle size={18} />
          Reject All
        </RejectButton>
        <ApproveButton onClick={onApprove}>
          <CheckCircle2 size={18} />
          Apply All Changes
        </ApproveButton>
      </Actions>

      {estimatedImpact === 'high' && (
        <Warning>
          <AlertTriangle size={16} />
          High impact changes - Review carefully before applying
        </Warning>
      )}
    </Container>
  );
};

const Container = styled(motion.div)`
  background: ${vibeTheme.colors.secondary};
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${vibeTheme.colors.text};
  font-size: 16px;
  font-weight: 600;
`;

const ImpactBadge = styled.div<{ $color: string }>`
  background: ${props => props.$color}22;
  color: ${props => props.$color};
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const FileCard = styled.div`
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  overflow: hidden;
`;

const FileHeader = styled.div`
  padding: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 4px;

  &:hover {
    background: rgba(139, 92, 246, 0.1);
  }
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${vibeTheme.colors.text};
`;

const FileName = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  flex: 1;
`;

const ChangeType = styled.span`
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 600;
`;

const Reason = styled.div`
  font-size: 12px;
  color: ${vibeTheme.colors.textSecondary};
  margin-left: 24px;
`;

const DiffContainer = styled(motion.div)`
  overflow: hidden;
`;

const DiffContent = styled.pre`
  background: rgba(0, 0, 0, 0.3);
  padding: 12px;
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: ${vibeTheme.colors.textSecondary};
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.5);
    border-radius: 4px;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const ApproveButton = styled(Button)`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;

  &:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
  }
`;

const RejectButton = styled(Button)`
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;

  &:hover {
    background: rgba(239, 68, 68, 0.3);
  }
`;

const Warning = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  color: #fbbf24;
  font-size: 13px;
`;
