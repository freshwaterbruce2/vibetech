import React from 'react';
import styled from 'styled-components';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  min-height: 200px;
`;

const ErrorIcon = styled.div`
  width: 64px;
  height: 64px;
  background: ${props => props.theme.error};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  
  svg {
    width: 32px;
    height: 32px;
    color: white;
  }
`;

const ErrorTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.text};
  margin-bottom: 8px;
`;

const ErrorMessage = styled.p`
  font-size: 14px;
  color: ${props => props.theme.textSecondary};
  margin-bottom: 24px;
  max-width: 400px;
  line-height: 1.5;
`;

const RetryButton = styled.button`
  padding: 12px 24px;
  background: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:focus-visible {
    outline: 2px solid ${props => props.theme.primary};
    outline-offset: 2px;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  showRetry?: boolean;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  title = "Something went wrong",
  message = "We encountered an error while loading this content. Please try again.",
  onRetry,
  retryText = "Try Again",
  showRetry = true
}) => {
  return (
    <ErrorContainer>
      <ErrorIcon>
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      </ErrorIcon>
      <ErrorTitle>{title}</ErrorTitle>
      <ErrorMessage>{message}</ErrorMessage>
      {showRetry && onRetry && (
        <RetryButton onClick={onRetry}>
          {retryText}
        </RetryButton>
      )}
    </ErrorContainer>
  );
};

export default ErrorFallback;