/**
 * InlineEditDialog - Cmd+K inline code editing
 * Shows input for AI instruction, generates modified code, displays diff
 */
import React, { useEffect, useRef,useState } from 'react';
import { AnimatePresence,motion } from 'framer-motion';
import { ArrowRight,Check, Loader2, Wand2, X } from 'lucide-react';
import styled from 'styled-components';

import { vibeTheme } from '../styles/theme';

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DialogContainer = styled(motion.div)`
  background: ${vibeTheme.colors.secondary};
  border: 1px solid ${vibeTheme.colors.border};
  border-radius: ${vibeTheme.borderRadius.lg};
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  width: 90%;
  max-width: 900px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  padding: 20px 24px;
  background: ${vibeTheme.colors.elevated};
  border-bottom: 1px solid ${vibeTheme.colors.border};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Title = styled.h3`
  margin: 0;
  flex: 1;
  color: ${vibeTheme.colors.text};
  font-size: ${vibeTheme.typography.fontSize.lg};
  font-weight: ${vibeTheme.typography.fontWeight.semibold};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InstructionSection = styled.div`
  padding: 20px 24px;
  background: ${vibeTheme.colors.secondary};
  border-bottom: 1px solid ${vibeTheme.colors.border};
`;

const InstructionInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: ${vibeTheme.colors.elevated};
  border: 1px solid ${vibeTheme.colors.border};
  border-radius: ${vibeTheme.borderRadius.md};
  color: ${vibeTheme.colors.text};
  font-size: ${vibeTheme.typography.fontSize.md};
  font-family: ${vibeTheme.fontFamily};
  outline: none;
  transition: all 0.2s ease;

  &:focus {
    border-color: ${vibeTheme.accent};
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }

  &::placeholder {
    color: ${vibeTheme.colors.textSecondary};
  }
`;

const DiffSection = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  background: ${vibeTheme.colors.primary};
`;

const DiffContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  font-family: ${vibeTheme.typography.fontFamily.mono};
  font-size: ${vibeTheme.typography.fontSize.sm};
`;

const DiffPane = styled.div`
  background: ${vibeTheme.colors.elevated};
  border: 1px solid ${vibeTheme.colors.border};
  border-radius: ${vibeTheme.borderRadius.md};
  overflow: hidden;
`;

const DiffHeader = styled.div`
  padding: 8px 12px;
  background: ${vibeTheme.colors.secondary};
  border-bottom: 1px solid ${vibeTheme.colors.border};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  color: ${vibeTheme.colors.textSecondary};
  font-size: ${vibeTheme.typography.fontSize.sm};
`;

const DiffContent = styled.pre`
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.6;
  color: ${vibeTheme.colors.text};
`;

const DiffLine = styled.div<{ $type?: 'add' | 'remove' }>`
  padding: 2px 8px;
  background: ${props =>
    props.$type === 'add' ? 'rgba(34, 197, 94, 0.1)' :
    props.$type === 'remove' ? 'rgba(239, 68, 68, 0.1)' :
    'transparent'
  };
  color: ${props =>
    props.$type === 'add' ? '#22c55e' :
    props.$type === 'remove' ? '#ef4444' :
    vibeTheme.colors.text
  };
  border-left: 3px solid ${props =>
    props.$type === 'add' ? '#22c55e' :
    props.$type === 'remove' ? '#ef4444' :
    'transparent'
  };
`;

const LoadingState = styled.div`
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: ${vibeTheme.colors.textSecondary};
`;

const Actions = styled.div`
  padding: 16px 24px;
  background: ${vibeTheme.colors.elevated};
  border-top: 1px solid ${vibeTheme.colors.border};
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 10px 20px;
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
  font-size: ${vibeTheme.typography.fontSize.sm};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const Shortcut = styled.span`
  padding: 4px 8px;
  background: ${vibeTheme.colors.secondary};
  border: 1px solid ${vibeTheme.colors.border};
  border-radius: ${vibeTheme.borderRadius.sm};
  font-family: ${vibeTheme.typography.fontFamily.mono};
  font-size: ${vibeTheme.typography.fontSize.xs};
  color: ${vibeTheme.colors.textSecondary};
`;

export interface InlineEditDialogProps {
  isOpen: boolean;
  selectedCode: string;
  language: string;
  onClose: () => void;
  onApply: (modifiedCode: string) => void;
  onGenerateEdit: (instruction: string, code: string, language: string) => Promise<string>;
}

export const InlineEditDialog: React.FC<InlineEditDialogProps> = ({
  isOpen,
  selectedCode,
  language,
  onClose,
  onApply,
  onGenerateEdit,
}) => {
  const [instruction, setInstruction] = useState('');
  const [modifiedCode, setModifiedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setInstruction('');
      setModifiedCode('');
      setError('');
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!instruction.trim()) {
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const result = await onGenerateEdit(instruction, selectedCode, language);
      setModifiedCode(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate edit');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleApply = () => {
    if (modifiedCode) {
      onApply(modifiedCode);
      onClose();
    }
  };

  if (!isOpen) {return null;}

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <DialogContainer
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Header>
            <Title>
              <Wand2 size={20} />
              Edit with AI
            </Title>
            <Shortcut>Cmd+K</Shortcut>
          </Header>

          <InstructionSection>
            <InstructionInput
              ref={inputRef}
              type="text"
              placeholder="Describe what you want to change... (e.g., 'add error handling', 'convert to async/await')"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
            />
          </InstructionSection>

          <DiffSection>
            {isGenerating && (
              <LoadingState>
                <Loader2 size={32} className="animate-spin" />
                <div>Generating modified code...</div>
              </LoadingState>
            )}

            {error && (
              <LoadingState>
                <X size={32} color="#ef4444" />
                <div style={{ color: '#ef4444' }}>{error}</div>
              </LoadingState>
            )}

            {!isGenerating && !error && modifiedCode && (
              <DiffContainer>
                <DiffPane>
                  <DiffHeader>Original</DiffHeader>
                  <DiffContent>{selectedCode}</DiffContent>
                </DiffPane>
                <DiffPane>
                  <DiffHeader>Modified</DiffHeader>
                  <DiffContent>{modifiedCode}</DiffContent>
                </DiffPane>
              </DiffContainer>
            )}

            {!isGenerating && !error && !modifiedCode && selectedCode && (
              <DiffPane>
                <DiffHeader>Selected Code</DiffHeader>
                <DiffContent>{selectedCode}</DiffContent>
              </DiffPane>
            )}
          </DiffSection>

          <Actions>
            <Button onClick={onClose}>
              <X size={16} />
              Cancel
            </Button>
            {!modifiedCode && (
              <Button
                $variant="primary"
                onClick={handleGenerate}
                disabled={!instruction.trim() || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ArrowRight size={16} />
                    Generate
                  </>
                )}
              </Button>
            )}
            {modifiedCode && (
              <Button $variant="primary" onClick={handleApply}>
                <Check size={16} />
                Accept Changes
              </Button>
            )}
          </Actions>
        </DialogContainer>
      </Overlay>
    </AnimatePresence>
  );
};
