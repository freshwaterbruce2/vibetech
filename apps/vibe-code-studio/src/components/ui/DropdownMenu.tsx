import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronRight } from 'lucide-react';
import styled from 'styled-components';

import { logger } from '../../services/Logger';
import { vibeTheme } from '../../styles/theme';

// Types
export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  checked?: boolean;
  danger?: boolean;
  divider?: boolean;
  submenu?: DropdownMenuItem[];
}

export interface DropdownMenuProps {
  items: DropdownMenuItem[];
  trigger: React.ReactNode;
  align?: 'left' | 'right';
  width?: string;
  onClose?: () => void;
}

// Styled Components
const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownContent = styled(motion.div) <{ $align: 'left' | 'right'; $width?: string }>`
  position: absolute;
  top: calc(100% + 4px);
  ${(props) => (props.$align === 'right' ? 'right: 0;' : 'left: 0;')}
  z-index: 1000;
  min-width: ${(props) => props.$width || '200px'};
  background: ${vibeTheme.colors.elevated};
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: ${vibeTheme.borderRadius.md};
  box-shadow: ${vibeTheme.shadows.lg}, ${vibeTheme.shadows.glow};
  backdrop-filter: blur(20px);
  overflow: visible;
`;

const MenuItemWrapper = styled(motion.div) <{ $disabled?: boolean; $danger?: boolean }>`
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
  position: relative; /* Required for absolute positioning of submenu */

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
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: ${vibeTheme.typography.fontWeight.medium};
`;

const MenuItemShortcut = styled.span`
  font-size: ${vibeTheme.typography.fontSize.xs};
  color: ${vibeTheme.colors.textMuted};
  font-family: ${vibeTheme.typography.fontFamily.mono};
  margin-left: ${vibeTheme.spacing[4]};
`;

const MenuItemSubmenuIndicator = styled.div`
  display: flex;
  align-items: center;
  margin-left: ${vibeTheme.spacing[2]};

  svg {
    width: 14px;
    height: 14px;
    color: ${vibeTheme.colors.textSecondary};
  }
`;

const MenuDivider = styled.div`
  height: 1px;
  background: ${vibeTheme.borders.divider};
  margin: ${vibeTheme.spacing[1]} 0;
`;

const CheckIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: ${vibeTheme.colors.cyan};

  svg {
    width: 14px;
    height: 14px;
  }
`;

const SubMenuContent = styled(DropdownContent)`
  position: absolute;
  top: -4px;
  left: 100%;
  margin-left: 4px;
  z-index: 10001;
`;

// MenuItem Subcomponent with Submenu Support
interface MenuItemProps {
  item: DropdownMenuItem;
  isFocused: boolean;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, isFocused, onClick }) => {
  const [showSubmenu, setShowSubmenu] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    logger.debug('MenuItem clicked:', item.label, 'Has submenu:', !!item.submenu, 'Current showSubmenu:', showSubmenu);
    if (item.submenu) {
      setShowSubmenu(!showSubmenu);
    } else {
      onClick();
    }
  };

  return (
    <MenuItemWrapper
      $disabled= { item.disabled }
  $danger = { item.danger }
  onClick = { handleClick }
  onMouseEnter = {() => item.submenu && setShowSubmenu(true)}
onMouseLeave = {() => item.submenu && setShowSubmenu(false)}
tabIndex = { item.disabled ? -1 : 0 }
role = "menuitem"
aria-disabled={ item.disabled }
whileHover = {!item.disabled ? { x: 2 } : undefined}
style = {{
  background: isFocused && !item.disabled ? vibeTheme.colors.hover : undefined,
      }}
    >
{
  item.checked !== undefined && (
    <CheckIcon>{
      item.checked && <Check />}</CheckIcon >
      )
    }

      { item.icon && <MenuItemIcon>{ item.icon as any } </MenuItemIcon> }

<MenuItemLabel>{ item.label } </MenuItemLabel>

{ item.shortcut && <MenuItemShortcut>{ item.shortcut } </MenuItemShortcut> }

{
  item.submenu && (
    <>
    <MenuItemSubmenuIndicator>
    <ChevronRight />
    </MenuItemSubmenuIndicator>

    <AnimatePresence>
            {
    showSubmenu && (
      <SubMenuContent
                $align="left"
    initial = {{ opacity: 0, x: -10 }
  }
  animate = {{ opacity: 1, x: 0 }
}
exit = {{ opacity: 0, x: -10 }}
transition = {{ duration: 0.15 }}
              >
  {
    item.submenu.map((subItem, subIndex) =>
      subItem.divider ? (
        <MenuDivider key= {`divider-${subIndex}`} />
                  ) : (
  <MenuItem
                      key= { subItem.id }
item = { subItem }
isFocused = { false}
onClick = {() => subItem.onClick?.()}
                    />
                  )
                )}
</SubMenuContent>
            )}
</AnimatePresence>
  </>
      )}
</MenuItemWrapper>
  );
};

// Component
export const DropdownMenu = forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ items, trigger, align = 'left', width, onClose }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [focusedIndex, setFocusedIndex] = useState(0);

    useEffect(() => {
      logger.debug('DropdownMenu mounted with', items.length, 'top-level items');
    }, []);

    const handleToggle = () => {
      logger.debug('DropdownMenu toggle clicked. Current isOpen:', isOpen);
      setIsOpen(!isOpen);
      if (!isOpen) {
        setFocusedIndex(0);
      }
    };

    const handleClose = () => {
      setIsOpen(false);
      if (onClose) {
        onClose();
      }
    };

    const handleItemClick = (item: DropdownMenuItem) => {
      if (item.disabled || item.submenu) { return; }

      if (item.onClick) {
        item.onClick();
      }
      handleClose();
    };

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          handleClose();
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    // Keyboard navigation
    useEffect(() => {
      if (!isOpen) { return; }

      const validItems = items.filter((item) => !item.divider && !item.disabled);

      const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
          case 'Escape':
            e.preventDefault();
            handleClose();
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
            if (focusedItem && !focusedItem.disabled && !focusedItem.submenu) {
              handleItemClick(focusedItem);
            }
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, focusedIndex, items]);

    return (
      <DropdownContainer ref= { ref || dropdownRef
  }>
<div onClick={ handleToggle } > { trigger } </div>

<AnimatePresence>
          { isOpen && (
    <DropdownContent
              $align={ align }
              $width = { width }
              initial = {{ opacity: 0, y: -10 }}
animate = {{ opacity: 1, y: 0 }}
exit = {{ opacity: 0, y: -10 }}
transition = {{
  duration: 0.15,
    ease: [0.4, 0, 0.2, 1],
              }}
            >
{
  items.map((item, index) => {
    if (item.divider) {
      return <MenuDivider key={ `divider-${index}` } />;
    }

    const validIndex = items
      .slice(0, index)
      .filter((i) => !i.divider && !i.disabled).length;
    const isFocused = validIndex === focusedIndex;

    return (
      <MenuItem
                    key= { item.id }
    item = { item }
    isFocused = { isFocused }
    onClick = {() => handleItemClick(item)
  }
                  />
  );
})}
</DropdownContent>
          )}
</AnimatePresence>
  </DropdownContainer>
    );
  }
);

DropdownMenu.displayName = 'DropdownMenu';

