import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const slideIn = keyframes`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const NotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: ${props => props.theme.error};
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 400px;
  animation: ${slideIn} 0.3s ease-out;
  z-index: 1000;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  opacity: 0.8;
  
  &:hover {
    opacity: 1;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

interface ErrorNotificationProps {
  error: string;
  onClose: () => void;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({ error, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <NotificationContainer>
      <div style={{ flex: 1 }}>{error}</div>
      <CloseButton onClick={onClose}>
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </CloseButton>
    </NotificationContainer>
  );
};

export default ErrorNotification;