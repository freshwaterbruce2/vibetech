import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';

import { vibeTheme } from '../../styles/theme';

// Types
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

// Styled Components
const ContextMenuOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: transparent;
`;

const ContextMenuContent = styled(motion.div) <{ $x: number; $y: number }>`
  position: fixed;
  left: ${(props) => props.$x}px;
  top: ${(props) => props.$y}px;
  z-index: 10000;
  min-width: 200px;
  background: ${vibeTheme.colors.elevated};
  border: 1px solid rgba(139, 92, 246, 0.25);
  border-radius: ${vibeTheme.borderRadius.md};
  box-shadow: ${vibeTheme.shadows.xl}, ${vibeTheme.shadows.glow};
  backdrop-filter: blur(20px);
  overflow: hidden;
  user-select: none;
`;

const MenuItem = styled(motion.div) <{ $disabled?: boolean; $danger?: boolean }>`
  display: flex;
  align-items: center;
  padding: ${vibeTheme.spacing[2]} ${vibeTheme.spacing[3]};
  cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
  font-size: ${vibeTheme.typography.fontSize.sm};
  color: ${(props) => {
    if (props.$disabled) { return vibeTheme.colors.textDisabled; }
    if (props.$danger) { return vibeTheme.colors.error; }
    return vibeTheme.colors.text;
  }};
  background: transparent;
  transition: ${vibeTheme.animation.transition.all};
  gap: ${vibeTheme.spacing[2]};
  opacity: ${(props) => (props.$disabled ? 0.5 : 1)};

  ${(props) =>
    !props.$disabled &&
    `
    &:hover {
      background: ${vibeTheme.colors.hover};
      color: ${props.$danger ? vibeTheme.colors.errorLight : vibeTheme.colors.text};
    }

    &:active {
      background: ${vibeTheme.colors.active};
    }
  `}

  &:focus-visible {
    outline: 2px solid ${vibeTheme.colors.cyan};
    outline-offset: -2px;
  }
`;

const MenuItemIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const MenuItemLabel = styled.span`
  flex: 1;
  white-space: nowrap;
  font-weight: ${vibeTheme.typography.fontWeight.medium};
`;

const MenuItemShortcut = styled.span`
  font-size: ${vibeTheme.typography.fontSize.xs};
  color: ${vibeTheme.colors.textMuted};
  font-family: ${vibeTheme.typography.fontFamily.mono};
  margin-left: ${vibeTheme.spacing[4]};
`;

const MenuDivider = styled.div`
  height: 1px;
  background: ${vibeTheme.borders.divider};
  margin: ${vibeTheme.spacing[1]} 0;
`;

// Component
export const ContextMenu: React.FC<ContextMenuProps> = ({ items, x, y, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x, y });
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      // Adjust horizontal position
      if (x + menuRect.width > viewportWidth) {
        adjustedX = viewportWidth - menuRect.width - 10;
      }

      // Adjust vertical position
      if (y + menuRect.height > viewportHeight) {
        adjustedY = viewportHeight - menuRect.height - 10;
      }

      // Ensure minimum spacing from edges
      adjustedX = Math.max(10, adjustedX);
      adjustedY = Math.max(10, adjustedY);

      setPosition({ x: adjustedX, y: adjustedY });
    }
  }, [x, y]);

  // Handle item click
  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled || item.divider) { return; }

    if (item.onClick) {
      item.onClick();
    }
    onClose();
  };

  // Keyboard navigation
  useEffect(() => {
    const validItems = items.filter((item) => !item.divider && !item.disabled);

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % validItems.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + validItems.length) % validItems.length);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          const focusedItem = validItems[focusedIndex];
          if (focusedItem && !focusedItem.disabled) {
            handleItemClick(focusedItem);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, items, onClose]);

  const content = (
    <ContextMenuOverlay
      initial= {{ opacity: 0 }
}
animate = {{ opacity: 1 }}
exit = {{ opacity: 0 }}
transition = {{ duration: 0.1 }}
onClick = { onClose }
onContextMenu = {(e) => {
  e.preventDefault();
  onClose();
}}
    >
  <ContextMenuContent
        ref={ menuRef }
$x = { position.x }
$y = { position.y }
initial = {{ opacity: 0, scale: 0.95 }}
animate = {{ opacity: 1, scale: 1 }}
exit = {{ opacity: 0, scale: 0.95 }}
transition = {{
  duration: 0.15,
    ease: [0.4, 0, 0.2, 1],
        }}
onClick = {(e) => e.stopPropagation()}
onContextMenu = {(e) => e.preventDefault()}
      >
{
  items.map((item, index) => {
    if (item.divider) {
      return <MenuDivider key={ `divider-${index}` } />;
    }

    const validIndex = items.slice(0, index).filter((i) => !i.divider && !i.disabled).length;
    const isFocused = validIndex === focusedIndex;

    return (
      <MenuItem
              key= { item.id }
    $disabled = { item.disabled }
    $danger = { item.danger }
    onClick = {() => handleItemClick(item)
  }
              tabIndex = { item.disabled ? -1 : 0 }
              role = "menuitem"
              aria-disabled={ item.disabled }
              whileHover = {!item.disabled ? { x: 2 } : undefined}
style = {{
  background: isFocused && !item.disabled ? vibeTheme.colors.hover : undefined,
              }}
            >
  { item.icon && <MenuItemIcon>{ item.icon as any } </MenuItemIcon> }
  < MenuItemLabel > { item.label } </MenuItemLabel>
{ item.shortcut && <MenuItemShortcut>{ item.shortcut } </MenuItemShortcut> }
</MenuItem>
          );
        })}
</ContextMenuContent>
  </ContextMenuOverlay>
  );

// Render using portal to escape DOM hierarchy
return createPortal(content, document.body);
};

// Hook for managing context menu state
export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);

  const showContextMenu = (e: React.MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items,
    });
  };

  const hideContextMenu = () => {
    setContextMenu(null);
  };

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
  };
};

