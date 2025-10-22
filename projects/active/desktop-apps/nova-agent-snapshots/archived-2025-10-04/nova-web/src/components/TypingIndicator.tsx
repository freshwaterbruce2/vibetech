import React from 'react';
import styled, { keyframes } from 'styled-components';

const bounce = keyframes`
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
`;

const TypingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: ${props => props.theme.background};
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  max-width: 70%;
  margin-bottom: 16px;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, ${props => props.theme.primary}, #00a6ff);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  svg {
    width: 16px;
    height: 16px;
    color: white;
  }
`;

const DotsContainer = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const Dot = styled.div<{ delay: number }>`
  width: 8px;
  height: 8px;
  background: ${props => props.theme.textSecondary};
  border-radius: 50%;
  animation: ${bounce} 1.4s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
`;

const TypingText = styled.span`
  font-size: 14px;
  color: ${props => props.theme.textSecondary};
  margin-left: 8px;
`;

interface TypingIndicatorProps {
  text?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  text = "NOVA is thinking..." 
}) => {
  return (
    <TypingContainer>
      <Avatar>
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      </Avatar>
      <DotsContainer>
        <Dot delay={0} />
        <Dot delay={0.2} />
        <Dot delay={0.4} />
      </DotsContainer>
      <TypingText>{text}</TypingText>
    </TypingContainer>
  );
};

export default TypingIndicator;