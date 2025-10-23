import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import styled, { keyframes } from 'styled-components';

import { vibeTheme } from '../styles/theme';

/**
 * InputDialog - A custom modal dialog for text input
 * Replaces browser's prompt() which doesn't work in Electron
 *
 * Features:
 * - Vibe theme styling (purple/cyan)
 * - Escape key to cancel
 * - Enter key to submit
 * - Auto-focus on input
 * - Validation support
 */

interface InputDialogProps {
  isOpen: boolean;
  title: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  validate?: (value: string) => string | null; // Returns error message or null
}

// Animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

// Styled Components
const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: ${fadeIn} ${vibeTheme.animation.duration.normal} ease;
  padding: ${vibeTheme.spacing.lg};
`;

const DialogBox = styled.div`
  background: ${vibeTheme.colors.secondary};
  border: 2px solid transparent;
  border-radius: ${vibeTheme.borderRadius.xl};
  padding: ${vibeTheme.spacing.xl};
  min-width: 400px;
  max-width: 500px;
  width: 100%;
  box-shadow: ${vibeTheme.shadows.xl}, ${vibeTheme.shadows.glow};
  position: relative;
  animation: ${slideIn} ${vibeTheme.animation.duration.normal} ${vibeTheme.animation.easing.spring};

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    padding: 2px;
    background: ${vibeTheme.gradients.border};
    border-radius: ${vibeTheme.borderRadius.xl};
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: xor;
    -webkit-mask-composite: xor;
    pointer-events: none;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${vibeTheme.spacing.lg};
`;

const Title = styled.h2`
  font-size: ${vibeTheme.typography.fontSize['2xl']};
  font-weight: ${vibeTheme.typography.fontWeight.semibold};
  color: ${vibeTheme.colors.text};
  margin: 0;
  background: ${vibeTheme.gradients.primary};
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${vibeTheme.colors.textMuted};
  cursor: pointer;
  padding: ${vibeTheme.spacing.xs};
  border-radius: ${vibeTheme.borderRadius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${vibeTheme.animation.duration.fast} ease;

  &:hover {
    background: ${vibeTheme.colors.hover};
    color: ${vibeTheme.colors.text};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const Input = styled.input<{ $hasError?: boolean }>`
  width: 100%;
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  background: ${vibeTheme.colors.primary};
  border: 2px solid ${(props) =>
    props.$hasError ? vibeTheme.colors.error : 'rgba(139, 92, 246, 0.3)'};
  border-radius: ${vibeTheme.borderRadius.md};
  color: ${vibeTheme.colors.text};
  font-size: ${vibeTheme.typography.fontSize.base};
  font-family: ${vibeTheme.typography.fontFamily.primary};
  outline: none;
  transition: all ${vibeTheme.animation.duration.fast} ease;
  margin-bottom: ${vibeTheme.spacing.sm};

  &:focus {
    border-color: ${(props) => (props.$hasError ? vibeTheme.colors.error : vibeTheme.colors.cyan)};
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.$hasError
          ? 'rgba(239, 68, 68, 0.2)'
          : 'rgba(0, 212, 255, 0.2)'};
  }

  &::placeholder {
    color: ${vibeTheme.colors.textMuted};
  }
`;

const ErrorMessage = styled.div`
  color: ${vibeTheme.colors.error};
  font-size: ${vibeTheme.typography.fontSize.sm};
  margin-top: ${vibeTheme.spacing.xs};
  margin-bottom: ${vibeTheme.spacing.sm};
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.xs};

  &::before {
    content: '⚠';
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${vibeTheme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${vibeTheme.spacing.lg};
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.lg};
  border-radius: ${vibeTheme.borderRadius.md};
  font-size: ${vibeTheme.typography.fontSize.base};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${vibeTheme.animation.duration.fast} ease;
  border: none;
  font-family: ${vibeTheme.typography.fontFamily.primary};

  ${(props) =>
    props.$variant === 'primary'
      ? `
    background: ${vibeTheme.gradients.primary};
    color: ${vibeTheme.colors.text};
    box-shadow: ${vibeTheme.shadows.sm};

    &:hover {
      box-shadow: ${vibeTheme.shadows.md}, ${vibeTheme.shadows.glow};
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  `
      : `
    background: ${vibeTheme.colors.elevated};
    color: ${vibeTheme.colors.text};
    border: 1px solid rgba(139, 92, 246, 0.2);

    &:hover {
      background: ${vibeTheme.colors.hover};
      border-color: rgba(139, 92, 246, 0.4);
    }

    &:active {
      transform: scale(0.98);
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
`;

export const InputDialog: React.FC<InputDialogProps> = ({
  isOpen,
  title,
  placeholder = 'Enter value...',
  defaultValue = '',
  onConfirm,
  onCancel,
  validate,
}) => {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError(null);
    }
  }, [isOpen, defaultValue]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, value]);

  const handleConfirm = () => {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      setError('This field cannot be empty');
      return;
    }

    if (validate) {
      const validationError = validate(trimmedValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    onConfirm(trimmedValue);
    setValue('');
    setError(null);
  };

  const handleCancel = () => {
    onCancel();
    setValue('');
    setError(null);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking the overlay itself, not the dialog
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <Overlay $isOpen={isOpen} onClick={handleOverlayClick}>
      <DialogBox>
        <Header>
          <Title>{title}</Title>
          <CloseButton onClick={handleCancel} aria-label="Close dialog">
            <X size={20} />
          </CloseButton>
        </Header>

        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null); // Clear error on input change
          }}
          placeholder={placeholder}
          $hasError={!!error}
        />

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <ButtonGroup>
          <Button $variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button $variant="primary" onClick={handleConfirm}>
            Confirm
          </Button>
        </ButtonGroup>
      </DialogBox>
    </Overlay>
  );
};

export default InputDialog;
