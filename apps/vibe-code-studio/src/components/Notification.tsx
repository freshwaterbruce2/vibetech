import React, { useCallback, useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import styled, { keyframes } from 'styled-components';

import { NotificationItem } from '../hooks/useNotifications';
import { vibeTheme } from '../styles/theme';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationProps {
  id: string;
  type: NotificationType;
  title: string;
  message?: string | undefined;
  duration?: number | undefined;
  onClose: (id: string) => void;
}

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const NotificationWrapper = styled.div<{ $isClosing?: boolean }>`
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: ${vibeTheme.spacing.md};
  padding: ${vibeTheme.spacing.md} ${vibeTheme.spacing.lg};
  margin-bottom: ${vibeTheme.spacing.md};
  background: ${vibeTheme.colors.secondary};
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: ${vibeTheme.borderRadius.medium};
  box-shadow: ${vibeTheme.shadows.medium};
  animation: ${(props) => (props.$isClosing ? slideOut : slideIn)} 0.3s ease-out;
  animation-fill-mode: forwards;
  min-width: 320px;
  max-width: 480px;
`;

const IconWrapper = styled.div<{ $type: NotificationType }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: ${vibeTheme.borderRadius.small};
  background: ${(props) => {
    switch (props.$type) {
      case 'success':
        return 'rgba(34, 197, 94, 0.2)';
      case 'error':
        return 'rgba(239, 68, 68, 0.2)';
      case 'warning':
        return 'rgba(251, 191, 36, 0.2)';
      case 'info':
        return 'rgba(59, 130, 246, 0.2)';
    }
  }};

  svg {
    width: 18px;
    height: 18px;
    color: ${(props) => {
      switch (props.$type) {
        case 'success':
          return vibeTheme.colors.success;
        case 'error':
          return vibeTheme.colors.error;
        case 'warning':
          return vibeTheme.colors.warning;
        case 'info':
          return vibeTheme.colors.cyan;
      }
    }};
  }
`;

const Content = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h4`
  margin: 0 0 ${vibeTheme.spacing.xs} 0;
  font-size: ${vibeTheme.typography.fontSize.base};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  color: ${vibeTheme.colors.text};
`;

const Message = styled.p`
  margin: 0;
  font-size: ${vibeTheme.typography.fontSize.sm};
  color: ${vibeTheme.colors.textSecondary};
  line-height: 1.5;
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${vibeTheme.spacing.md};
  right: ${vibeTheme.spacing.md};
  background: none;
  border: none;
  color: ${vibeTheme.colors.textMuted};
  cursor: pointer;
  padding: ${vibeTheme.spacing.xs};
  border-radius: ${vibeTheme.borderRadius.small};
  transition: all ${vibeTheme.animation.duration.fast} ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: ${vibeTheme.colors.text};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Progress = styled.div<{ $duration: number }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 0 0 ${vibeTheme.borderRadius.medium} ${vibeTheme.borderRadius.medium};
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    background: ${vibeTheme.gradients.primary};
    animation: progress ${(props) => props.$duration}ms linear;
    animation-fill-mode: forwards;
  }

  @keyframes progress {
    from {
      width: 100%;
    }
    to {
      width: 0%;
    }
  }
`;

export const Notification: React.FC<NotificationProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isClosing, setIsClosing] = React.useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  }, [id, onClose]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
    // Return undefined for the case where duration <= 0
    return undefined;
  }, [duration, id, handleClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle />;
      case 'error':
        return <AlertCircle />;
      case 'warning':
        return <AlertTriangle />;
      case 'info':
        return <Info />;
    }
  };

  return (
    <NotificationWrapper $isClosing={isClosing}>
      <IconWrapper $type={type}>{getIcon()}</IconWrapper>

      <Content>
        <Title>{title}</Title>
        {message && <Message>{message}</Message>}
      </Content>

      <CloseButton onClick={handleClose}>
        <X />
      </CloseButton>

      {duration > 0 && <Progress $duration={duration} />}
    </NotificationWrapper>
  );
};

// Notification Container Component
const Container = styled.div`
  position: fixed;
  top: ${vibeTheme.spacing.lg};
  right: ${vibeTheme.spacing.lg};
  z-index: 9999;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
`;

interface NotificationContainerProps {
  notifications: NotificationItem[];
  onClose: (id: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onClose,
}) => {
  return (
    <Container>
      {notifications.map((notification) => (
        <Notification key={notification.id} {...notification} onClose={onClose} />
      ))}
    </Container>
  );
};

export default Notification;
