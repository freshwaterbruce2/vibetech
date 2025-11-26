import React, { useState } from 'react';
import {
  Command,
  Eye,
  FileText,
  FolderOpen,
  HelpCircle,
  Image,
  Info,
  ListTodo,
  Menu,
  Minimize2,
  Search,
  Settings,
  Square,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import styled from 'styled-components';

import { ElectronService } from '../services/ElectronService';
import { logger } from '../services/Logger';
import { vibeTheme } from '../styles/theme';

import { DropdownMenu, DropdownMenuItem } from './ui/dropdown-menu';

const TitleBarContainer = styled.div`
  display: flex;
  align-items: center;
  height: 44px;
  background: ${vibeTheme.colors.primary};
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
  user-select: none;
  -webkit-app-region: drag;
  position: relative;
  z-index: 1000;
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
  font-weight: ${vibeTheme.typography.fontWeight.extrabold};
  letter-spacing: ${vibeTheme.typography.letterSpacing.tight};
  font-size: ${vibeTheme.typography.fontSize.md};
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
  onNewFile?: () => void;
  onOpenFolder?: () => void;
  onSaveAll?: () => void;
  onCloseFolder?: () => void;
  onScreenshotToCode?: () => void;
  onToggleSidebar?: () => void;
  onToggleAIChat?: () => void;
  onTogglePreview?: () => void;
  onToggleBackgroundPanel?: () => void;
  previewOpen?: boolean;
  children?: React.ReactNode;
}

const TitleBar: React.FC<TitleBarProps> = ({
  onSettingsClick,
  onNewFile,
  onOpenFolder,
  onSaveAll,
  onCloseFolder,
  onScreenshotToCode,
  onToggleSidebar,
  onToggleAIChat,
  onTogglePreview,
  onToggleBackgroundPanel,
  previewOpen,
  children,
}) => {
  const [electronService] = useState(() => new ElectronService());

  const menuItems: DropdownMenuItem[] = [
    {
      id: 'file',
      label: 'File',
      icon: <FileText size={ 16} />,
    submenu: [
      {
        id: 'file-new',
        label: 'New File',
        icon: <FileText size={ 16} />,
      shortcut: 'Ctrl+N',
      onClick: onNewFile,
        },
  {
    id: 'file-open',
    label: 'Open Folder',
    icon: <FolderOpen size={ 16 } />,
shortcut: 'Ctrl+O',
  onClick: onOpenFolder,
        },
{ id: 'divider-1', label: '', divider: true },
{
  id: 'file-save-all',
    label: 'Save All',
      shortcut: 'Ctrl+Shift+S',
        onClick: onSaveAll,
        },
{ id: 'divider-2', label: '', divider: true },
{
  id: 'file-close-folder',
    label: 'Close Folder',
      onClick: onCloseFolder,
        },
      ],
    },
{
  id: 'edit',
    label: 'Edit',
      submenu: [
        {
          id: 'edit-find',
          label: 'Find',
          icon: <Search size={ 16} />,
        shortcut: 'Ctrl+F',
        onClick: () => logger.debug('Find'),
        },
{
  id: 'edit-replace',
    label: 'Replace',
      shortcut: 'Ctrl+H',
        onClick: () => logger.debug('Replace'),
        },
{ id: 'divider-3', label: '', divider: true },
{
  id: 'edit-preferences',
    label: 'Preferences',
      icon: <Settings size={ 16 } />,
  shortcut: 'Ctrl+,',
    onClick: onSettingsClick,
        },
      ],
    },
{
  id: 'view',
    label: 'View',
      submenu: [
        {
          id: 'view-sidebar',
          label: 'Toggle Sidebar',
          shortcut: 'Ctrl+B',
          onClick: onToggleSidebar,
        },
        {
          id: 'view-ai-chat',
          label: 'Toggle AI Chat',
          shortcut: 'Ctrl+Shift+L',
          onClick: onToggleAIChat,
        },
        {
          id: 'view-preview',
          label: 'Toggle Preview Panel',
          icon: <Eye size={ 16} />,
        shortcut: 'Ctrl+Shift+V',
        onClick: onTogglePreview,
        },
{
  id: 'view-screenshot-to-code',
    label: 'Screenshot to Code',
      icon: <Image size={ 16 } />,
  shortcut: 'Ctrl+Shift+I',
    onClick: onScreenshotToCode,
        },
{
  id: 'view-background-tasks',
    label: 'Background Tasks',
      icon: <ListTodo size={ 16 } />,
  shortcut: 'Ctrl+Shift+T',
    onClick: onToggleBackgroundPanel,
        },
{ id: 'divider-4', label: '', divider: true },
{
  id: 'view-zoom-in',
    label: 'Zoom In',
      icon: <ZoomIn size={ 16 } />,
  shortcut: 'Ctrl++',
    onClick: () => logger.debug('Zoom In'),
        },
{
  id: 'view-zoom-out',
    label: 'Zoom Out',
      icon: <ZoomOut size={ 16 } />,
  shortcut: 'Ctrl+-',
    onClick: () => logger.debug('Zoom Out'),
        },
      ],
    },
{
  id: 'help',
    label: 'Help',
      icon: <HelpCircle size={ 16 } />,
  submenu: [
    {
      id: 'help-docs',
      label: 'Documentation',
      onClick: () => window.open('https://vibecodestudio.dev/docs', '_blank'),
    },
    { id: 'divider-5', label: '', divider: true },
    {
      id: 'help-about',
      label: 'About Vibe Code Studio',
      icon: <Info size={ 16} />,
    onClick: () => logger.debug('About'),
        },
      ],
    },
  ];

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
    if (window.confirm('Are you sure you want to close Vibe Code Studio?')) {
      window.close();
    }
  }
};

return (
  <TitleBarContainer>
  <LeftSection>
  <DropdownMenu
          items= { menuItems }
trigger = {
            < MenuButton >
  <Menu />
  </MenuButton>
          }
align = "left"
width = "220px"
  />
  <Logo>
  <AppTitle>Vibe Code Studio </AppTitle>
    </Logo>
    </LeftSection>

    < CenterSection >
    <StatusIndicator>
    <StatusDot $status="online" />
      <span>DeepSeek AI Ready </span>
        < Command size = { 12} />
          </StatusIndicator>
{ children }
</CenterSection>

  <RightSection>
{
  onTogglePreview && (
    <ActionButton
            onClick={ onTogglePreview }
  title = "Toggle Preview Panel (Ctrl+Shift+V)"
  style = {{
    background: previewOpen ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
      color: previewOpen ? vibeTheme.colors.purple : vibeTheme.colors.textSecondary,
            }
}
          >
  <Eye />
  </ActionButton>
        )}
<ActionButton onClick={ handleSettingsClick } title = "Settings" >
  <Settings />
  </ActionButton>
  < ActionButton onClick = { handleMinimize } >
    <Minimize2 />
    </ActionButton>
    < ActionButton onClick = { handleMaximize } >
      <Square />
      </ActionButton>
      < ActionButton $variant = "danger" onClick = { handleClose } >
        <X />
        </ActionButton>
        </RightSection>
        </TitleBarContainer>
  );
};

export default TitleBar;
