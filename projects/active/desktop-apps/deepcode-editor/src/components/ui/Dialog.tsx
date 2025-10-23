import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import styled from 'styled-components';

import { vibeTheme } from '../../styles/theme';
import { Button } from './Button';
import { IconButton } from './IconButton';

// Types
export type DialogVariant = 'info' | 'warning' | 'danger' | 'success';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: DialogVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
}

// Styled Components
const DialogOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${vibeTheme.spacing[4]};
`;

const DialogContent = styled(motion.div)`
  background: ${vibeTheme.colors.elevated};
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: ${vibeTheme.borderRadius.xl};
  box-shadow: ${vibeTheme.shadows.xl}, ${vibeTheme.shadows.glowStrong};
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const DialogHeader = styled.div<{ $variant: DialogVariant }>`
  display: flex;
  align-items: flex-start;
  gap: ${vibeTheme.spacing[3]};
  padding: ${vibeTheme.spacing[6]} ${vibeTheme.spacing[6]} ${vibeTheme.spacing[4]};
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
  position: relative;

  ${(props) => {
    const colors = {
      info: vibeTheme.colors.info,
      warning: vibeTheme.colors.warning,
      danger: vibeTheme.colors.error,
      success: vibeTheme.colors.success,
    };
    return `
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: ${colors[props.$variant]};
      }
    `;
  }}
`;

const DialogIcon = styled.div<{ $variant: DialogVariant }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: ${vibeTheme.borderRadius.md};
  flex-shrink: 0;

  ${(props) => {
    const config = {
      info: { bg: 'rgba(59, 130, 246, 0.15)', color: vibeTheme.colors.info },
      warning: { bg: 'rgba(245, 158, 11, 0.15)', color: vibeTheme.colors.warning },
      danger: { bg: 'rgba(239, 68, 68, 0.15)', color: vibeTheme.colors.error },
      success: { bg: 'rgba(16, 185, 129, 0.15)', color: vibeTheme.colors.success },
    };
    const { bg, color } = config[props.$variant];
    return `
      background: ${bg};
      color: ${color};
    `;
  }}

  svg {
    width: 24px;
    height: 24px;
  }
`;

const DialogTitleSection = styled.div`
  flex: 1;
`;

const DialogTitle = styled.h2`
  font-size: ${vibeTheme.typography.fontSize.xl};
  font-weight: ${vibeTheme.typography.fontWeight.semibold};
  color: ${vibeTheme.colors.text};
  margin: 0 0 ${vibeTheme.spacing[1]} 0;
  line-height: ${vibeTheme.typography.lineHeight.tight};
`;

const DialogCloseButton = styled.div`
  position: absolute;
  top: ${vibeTheme.spacing[4]};
  right: ${vibeTheme.spacing[4]};
`;

const DialogBody = styled.div`
  padding: ${vibeTheme.spacing[4]} ${vibeTheme.spacing[6]};
  overflow-y: auto;
  flex: 1;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
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

const DialogMessage = styled.p`
  font-size: ${vibeTheme.typography.fontSize.base};
  color: ${vibeTheme.colors.textSecondary};
  line-height: ${vibeTheme.typography.lineHeight.relaxed};
  margin: 0;
`;

const DialogFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${vibeTheme.spacing[3]};
  padding: ${vibeTheme.spacing[4]} ${vibeTheme.spacing[6]} ${vibeTheme.spacing[6]};
  border-top: 1px solid rgba(139, 92, 246, 0.1);
`;

// Component
export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  showCancel = true,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && onConfirm) {
        e.preventDefault();
        onConfirm();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const getIcon = () => {
    switch (variant) {
      case 'info':
        return <Info />;
      case 'warning':
        return <AlertTriangle />;
      case 'danger':
        return <XCircle />;
      case 'success':
        return <CheckCircle />;
      default:
        return <Info />;
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  if (!isOpen) return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <DialogOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <DialogContent
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              duration: 0.25,
              ease: [0.4, 0, 0.2, 1],
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-message"
          >
            <DialogHeader $variant={variant}>
              <DialogIcon $variant={variant}>{getIcon()}</DialogIcon>
              <DialogTitleSection>
                <DialogTitle id="dialog-title">{title}</DialogTitle>
              </DialogTitleSection>
              <DialogCloseButton>
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={<X size={18} />}
                  aria-label="Close dialog"
                  onClick={onClose}
                />
              </DialogCloseButton>
            </DialogHeader>

            <DialogBody>
              <DialogMessage id="dialog-message">{message}</DialogMessage>
            </DialogBody>

            <DialogFooter>
              {showCancel && (
                <Button variant="ghost" size="md" onClick={onClose}>
                  {cancelLabel}
                </Button>
              )}
              <Button
                variant={variant === 'danger' ? 'danger' : 'primary'}
                size="md"
                onClick={handleConfirm}
              >
                {confirmLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </DialogOverlay>
      )}
    </AnimatePresence>
  );

  // Render using portal
  return createPortal(content, document.body);
};

// Hook for managing dialog state
export const useDialog = () => {
  const [dialog, setDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: DialogVariant;
    confirmLabel?: string;
    onConfirm?: () => void;
  } | null>(null);

  const showDialog = (
    title: string,
    message: string,
    options?: {
      variant?: DialogVariant;
      confirmLabel?: string;
      onConfirm?: () => void;
    }
  ) => {
    setDialog({
      isOpen: true,
      title,
      message,
      variant: options?.variant || 'info',
      confirmLabel: options?.confirmLabel || 'Confirm',
      onConfirm: options?.onConfirm,
    });
  };

  const hideDialog = () => {
    setDialog(null);
  };

  return {
    dialog,
    showDialog,
    hideDialog,
  };
};
