import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Capability } from '../types';

const HeaderContainer = styled.header`
  padding: 16px 24px;
  background: ${props => props.theme.surface};
  border-bottom: 1px solid ${props => props.theme.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    padding: 12px 16px;
  }
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 600;
  color: ${props => props.theme.text};
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.text};
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  
  &:hover {
    background: ${props => props.theme.background};
  }
  
  &:focus-visible {
    outline: 2px solid ${props => props.theme.primary};
    outline-offset: 2px;
  }
  
  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
  
  @media (max-width: 768px) {
    padding: 6px;
    font-size: 14px;
    
    /* Hide text on small screens, keep only icons */
    span {
      display: none;
    }
  }
`;

const CapabilityBadge = styled.span`
  background: ${props => props.theme.primary};
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
`;

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNewChat: () => void;
  capabilities: Capability[];
}

const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onNewChat,
  capabilities,
}) => {
  const navigate = useNavigate();
  const enabledCapabilities = capabilities.filter(c => c.enabled).length;

  return (
    <HeaderContainer>
      <Title>NOVA Assistant</Title>
      
      <Controls>
        <IconButton onClick={onNewChat} title="New chat">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          <span>New Chat</span>
        </IconButton>
        
        <IconButton onClick={() => navigate('/capabilities')} title="Capabilities">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <CapabilityBadge>{enabledCapabilities}</CapabilityBadge>
        </IconButton>
        
        <IconButton onClick={onToggleDarkMode} title="Toggle theme">
          {darkMode ? (
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
            </svg>
          ) : (
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 2c-1.05 0-2.05.16-3 .46 4.06 1.27 7 5.06 7 9.54 0 4.48-2.94 8.27-7 9.54.95.3 1.95.46 3 .46 5.52 0 10-4.48 10-10S14.52 2 9 2z" />
            </svg>
          )}
        </IconButton>
      </Controls>
    </HeaderContainer>
  );
};

export default Header;