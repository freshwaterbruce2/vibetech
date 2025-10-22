import React from 'react';
import styled from 'styled-components';

const MenuButton = styled.button`
  display: none;
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 56px;
  height: 56px;
  background: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  z-index: 100;
  
  svg {
    width: 24px;
    height: 24px;
  }
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

interface MobileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onToggle }) => {
  return (
    <MenuButton onClick={onToggle}>
      {isOpen ? (
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      ) : (
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
        </svg>
      )}
    </MenuButton>
  );
};

export default MobileMenu;