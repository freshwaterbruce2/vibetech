/**
 * AIChat StepCard Component
 * Memoized component for rendering agent task steps
 */
import { memo } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Shield, XCircle } from 'lucide-react';

import type { ApprovalRequest, StepStatus } from '../../types';
import { vibeTheme } from '../../styles/theme';
import {
  ApprovalButton,
  ApprovalPromptCompact,
  CompactStepCard,
  StepDescriptionCompact,
  StepHeaderCompact,
  StepIconCompact,
  StepTitleCompact,
} from './styled';
import type { MemoizedStepCardProps } from './types';

export function getStepIcon(status: StepStatus): React.ReactElement {
  switch (status) {
    case 'in_progress':
      return <Loader2 size={14} className="animate-spin" />;
    case 'completed':
      return <CheckCircle2 size={14} />;
    case 'failed':
      return <XCircle size={14} />;
    case 'awaiting_approval':
      return <Shield size={14} />;
    default:
      return <AlertCircle size={14} />;
  }
}

function StepCardComponent({ step, pendingApproval, handleApproval }: MemoizedStepCardProps) {
  return (
    <CompactStepCard
      key={step.id}
      $status={step.status}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      data-testid="step-card"
      data-status={step.status}
    >
      <StepHeaderCompact>
        <StepIconCompact $status={step.status} data-testid="step-status" data-status={step.status}>
          {getStepIcon(step.status)}
        </StepIconCompact>
        <StepTitleCompact>{step.title}</StepTitleCompact>
      </StepHeaderCompact>
      {step.description && <StepDescriptionCompact>{step.description}</StepDescriptionCompact>}
      {pendingApproval && pendingApproval.stepId === step.id && handleApproval && (
        <ApprovalPromptCompact initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <div style={{ fontSize: '12px', marginBottom: '8px', color: vibeTheme.colors.text }}>
            <strong>Approval Required</strong>
            <div style={{ marginTop: '4px' }}>
              Risk: {pendingApproval.impact.riskLevel} | Affected: {pendingApproval.impact.filesAffected.length} files
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <ApprovalButton onClick={() => handleApproval(step.id, true)} $variant="approve">Approve</ApprovalButton>
            <ApprovalButton onClick={() => handleApproval(step.id, false)} $variant="reject">Reject</ApprovalButton>
          </div>
        </ApprovalPromptCompact>
      )}
    </CompactStepCard>
  );
}

export const MemoizedStepCard = memo<MemoizedStepCardProps>(
  StepCardComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.step.id === nextProps.step.id &&
      prevProps.step.status === nextProps.step.status &&
      prevProps.step.result === nextProps.step.result &&
      prevProps.pendingApproval?.stepId === nextProps.pendingApproval?.stepId
    );
  }
);

MemoizedStepCard.displayName = 'MemoizedStepCard';
export default MemoizedStepCard;
