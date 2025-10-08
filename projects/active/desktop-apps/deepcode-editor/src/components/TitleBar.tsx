import React, { useState } from 'react';
import { Command, Menu, Minimize2, Settings, Square, X } from 'lucide-react';
import styled from 'styled-components';

import { ElectronService } from '../services/ElectronService';
import { vibeTheme } from '../styles/theme';

const TitleBarContainer = styled.div`
  display: flex;
  align-items: center;
  height: 48px;
  background: linear-gradient(
    135deg,
    ${vibeTheme.colors.primary} 0%,
    ${vibeTheme.colors.secondary} 100%
  );
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  user-select: none;
  -webkit-app-region: drag;
  position: relative;
  z-index: 1000;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${vibeTheme.gradients.border};
    opacity: 0.6;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.md};
  padding: 0 ${vibeTheme.spacing.md};
  -webkit-app-region: no-drag;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};
  font-weight: ${vibeTheme.typography.fontWeight.bold};
  color: ${vibeTheme.colors.text};
  font-size: ${vibeTheme.typography.fontSize.lg};

  &::before {
    content: '⚡';
    font-size: 1.5rem;
    background: ${vibeTheme.gradients.primary};
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const AppTitle = styled.span`
  background: ${vibeTheme.gradients.primary};
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: ${vibeTheme.typography.fontWeight.bold};
`;

const CenterSection = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 ${vibeTheme.spacing.md};
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};
  padding: ${vibeTheme.spacing.xs} ${vibeTheme.spacing.md};
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: ${vibeTheme.borderRadius.full};
  font-size: ${vibeTheme.typography.fontSize.sm};
  color: ${vibeTheme.colors.textSecondary};
  backdrop-filter: blur(10px);
`;

const StatusDot = styled.div<{ $status: 'online' | 'offline' | 'loading' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) => {
    switch (props.$status) {
      case 'online':
        return vibeTheme.colors.success;
      case 'offline':
        return vibeTheme.colors.error;
      case 'loading':
        return vibeTheme.colors.cyan;
      default:
        return vibeTheme.colors.textMuted;
    }
  }};
  box-shadow: 0 0 8px
    ${(props) => {
      switch (props.$status) {
        case 'online':
          return vibeTheme.colors.success;
        case 'offline':
          return vibeTheme.colors.error;
        case 'loading':
          return vibeTheme.colors.cyan;
        default:
          return 'transparent';
      }
    }};
  animation: ${(props) => (props.$status === 'loading' ? 'pulse 2s infinite' : 'none')};

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.xs};
  padding: 0 ${vibeTheme.spacing.md};
  -webkit-app-region: no-drag;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' }>`
  background: transparent;
  border: none;
  color: ${vibeTheme.colors.textSecondary};
  padding: ${vibeTheme.spacing.sm};
  border-radius: ${vibeTheme.borderRadius.small};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${vibeTheme.animation.duration.fast} ease;
  position: relative;

  &:hover {
    background: ${(props) => {
      if (props.$variant === 'danger') {
        return 'rgba(239, 68, 68, 0.2)';
      }
      if (props.$variant === 'primary') {
        return 'rgba(139, 92, 246, 0.2)';
      }
      return 'rgba(255, 255, 255, 0.1)';
    }};
    color: ${(props) => {
      if (props.$variant === 'danger') {
        return vibeTheme.colors.error;
      }
      if (props.$variant === 'primary') {
        return vibeTheme.colors.purple;
      }
      return vibeTheme.colors.text;
    }};
    transform: scale(1.05);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const MenuButton = styled(ActionButton)`
  margin-right: ${vibeTheme.spacing.sm};

  &:hover {
    background: rgba(139, 92, 246, 0.2);
    box-shadow: 0 0 12px rgba(139, 92, 246, 0.3);
  }
`;

interface TitleBarProps {
  onSettingsClick?: () => void;
  children?: React.ReactNode;
}

const TitleBar: React.FC<TitleBarProps> = ({ onSettingsClick, children }) => {
  const [electronService] = useState(() => new ElectronService());

  const handleMenuClick = () => {
    // Open application menu
    // TODO: Implement application menu
  };

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    }
  };

  const handleMinimize = async () => {
    if (electronService.isElectron) {
      await electronService.minimizeWindow();
    } else {
      // Web fallback - minimize to taskbar not possible in browser
    }
  };

  const handleMaximize = async () => {
    if (electronService.isElectron) {
      await electronService.maximizeWindow();
    } else {
      // Web fallback - toggle fullscreen
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleClose = async () => {
    if (electronService.isElectron) {
      await electronService.closeWindow();
    } else {
      // Web fallback - confirm before closing tab
      if (window.confirm('Are you sure you want to close DeepCode Editor?')) {
        window.close();
      }
    }
  };

  return (
    <TitleBarContainer>
      <LeftSection>
        <MenuButton onClick={handleMenuClick}>
          <Menu />
        </MenuButton>
        <Logo>
          <AppTitle>DeepCode Studio</AppTitle>
        </Logo>
      </LeftSection>

      <CenterSection>
        <StatusIndicator>
          <StatusDot $status="online" />
          <span>DeepSeek AI Ready</span>
          <Command size={12} />
        </StatusIndicator>
        {children}
      </CenterSection>

      <RightSection>
        <ActionButton onClick={handleSettingsClick} title="Settings">
          <Settings />
        </ActionButton>
        <ActionButton onClick={handleMinimize}>
          <Minimize2 />
        </ActionButton>
        <ActionButton onClick={handleMaximize}>
          <Square />
        </ActionButton>
        <ActionButton $variant="danger" onClick={handleClose}>
          <X />
        </ActionButton>
      </RightSection>
    </TitleBarContainer>
  );
};

export default TitleBar;
