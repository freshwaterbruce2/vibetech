import React, { forwardRef, useEffect,useRef, useState } from 'react';
import { AnimatePresence,motion } from 'framer-motion';
import { Check,ChevronDown } from 'lucide-react';
import styled, { css } from 'styled-components';

import { vibeTheme } from '../../styles/theme';

export type SelectVariant = 'default' | 'filled' | 'outline';
export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  variant?: SelectVariant;
  size?: SelectSize;
  error?: boolean;
  helperText?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  disabled?: boolean;
  fullWidth?: boolean;
}

// Size configurations
const sizeStyles = {
  sm: css`
    height: 32px;
    padding: 0 ${vibeTheme.spacing[3]};
    font-size: ${vibeTheme.typography.fontSize.sm};

    svg {
      width: 16px;
      height: 16px;
    }
  `,
  md: css`
    height: 38px;
    padding: 0 ${vibeTheme.spacing[4]};
    font-size: ${vibeTheme.typography.fontSize.base};

    svg {
      width: 18px;
      height: 18px;
    }
  `,
  lg: css`
    height: 44px;
    padding: 0 ${vibeTheme.spacing[5]};
    font-size: ${vibeTheme.typography.fontSize.md};

    svg {
      width: 20px;
      height: 20px;
    }
  `,
};

// Variant styles
const variantStyles = {
  default: css`
    background: ${vibeTheme.colors.tertiary};
    border: 1px solid rgba(139, 92, 246, 0.2);
    color: ${vibeTheme.colors.text};

    &:hover:not([data-disabled="true"]) {
      border-color: rgba(139, 92, 246, 0.3);
      background: ${vibeTheme.colors.elevated};
    }
  `,

  filled: css`
    background: ${vibeTheme.colors.elevated};
    border: 1px solid transparent;
    color: ${vibeTheme.colors.text};

    &:hover:not([data-disabled="true"]) {
      background: ${vibeTheme.colors.tertiary};
    }
  `,

  outline: css`
    background: transparent;
    border: 1px solid rgba(139, 92, 246, 0.3);
    color: ${vibeTheme.colors.text};

    &:hover:not([data-disabled="true"]) {
      border-color: rgba(139, 92, 246, 0.5);
      background: ${vibeTheme.colors.hover};
    }
  `,
};

const SelectWrapper = styled.div<{ $fullWidth?: boolean }>`
  display: inline-flex;
  flex-direction: column;
  gap: ${vibeTheme.spacing[1]};
  width: ${props => props.$fullWidth ? '100%' : 'auto'};
  position: relative;
`;

const Label = styled.label`
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  color: ${vibeTheme.colors.text};
  user-select: none;
`;

const SelectTrigger = styled.div<{
  $variant: SelectVariant;
  $size: SelectSize;
  $error: boolean;
  $isOpen: boolean;
  $fullWidth?: boolean;
}>`
  /* Base styles */
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${vibeTheme.spacing[2]};
  font-family: ${vibeTheme.typography.fontFamily.primary};
  font-weight: ${vibeTheme.typography.fontWeight.normal};
  line-height: ${vibeTheme.typography.lineHeight.none};
  border-radius: ${vibeTheme.borderRadius.md};
  cursor: pointer;
  user-select: none;
  transition: ${vibeTheme.animation.transition.all};
  width: ${props => props.$fullWidth ? '100%' : 'auto'};

  /* Size styles */
  ${props => sizeStyles[props.$size]}

  /* Variant styles */
  ${props => variantStyles[props.$variant]}

  /* Open state */
  ${props => props.$isOpen && css`
    border-color: ${vibeTheme.colors.cyan};
    box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
  `}

  /* Error state */
  ${props => props.$error && css`
    border-color: ${vibeTheme.colors.error};

    &:hover {
      border-color: ${vibeTheme.colors.errorLight};
    }
  `}

  /* Disabled state */
  &[data-disabled="true"] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Focus visible */
  &:focus-visible {
    outline: 2px solid ${vibeTheme.colors.focus};
    outline-offset: 2px;
  }
`;

const SelectedValue = styled.span<{ $isPlaceholder: boolean }>`
  flex: 1;
  text-align: left;
  color: ${props => props.$isPlaceholder ? vibeTheme.colors.textMuted : vibeTheme.colors.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ChevronIcon = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${vibeTheme.colors.textSecondary};
`;

const DropdownMenu = styled(motion.div)<{ $size: SelectSize }>`
  position: absolute;
  top: calc(100% + ${vibeTheme.spacing[1]});
  left: 0;
  right: 0;
  z-index: 1000;
  background: ${vibeTheme.colors.tertiary};
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: ${vibeTheme.borderRadius.md};
  box-shadow: ${vibeTheme.shadows.lg}, ${vibeTheme.shadows.glow};
  overflow: hidden;
  max-height: 300px;
  overflow-y: auto;

  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(139, 92, 246, 0.05);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: ${vibeTheme.borderRadius.sm};

    &:hover {
      background: rgba(139, 92, 246, 0.5);
    }
  }
`;

const Option = styled.div<{ $size: SelectSize; $isSelected: boolean; $isDisabled: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${vibeTheme.spacing[2]};
  cursor: ${props => props.$isDisabled ? 'not-allowed' : 'pointer'};
  user-select: none;
  transition: ${vibeTheme.animation.transition.all};
  color: ${props => props.$isDisabled ? vibeTheme.colors.textDisabled : vibeTheme.colors.text};

  /* Size-specific padding */
  ${props => props.$size === 'sm' && css`
    padding: ${vibeTheme.spacing[2]} ${vibeTheme.spacing[3]};
    font-size: ${vibeTheme.typography.fontSize.sm};
  `}

  ${props => props.$size === 'md' && css`
    padding: ${vibeTheme.spacing[2]} ${vibeTheme.spacing[4]};
    font-size: ${vibeTheme.typography.fontSize.base};
  `}

  ${props => props.$size === 'lg' && css`
    padding: ${vibeTheme.spacing[3]} ${vibeTheme.spacing[5]};
    font-size: ${vibeTheme.typography.fontSize.md};
  `}

  /* Selected state */
  ${props => props.$isSelected && css`
    background: ${vibeTheme.colors.hover};
    color: ${vibeTheme.colors.cyan};
  `}

  /* Hover state */
  &:hover:not([data-disabled="true"]) {
    background: ${props => props.$isSelected ? vibeTheme.colors.hoverStrong : vibeTheme.colors.hover};
  }
`;

const CheckIcon = styled(Check)`
  color: ${vibeTheme.colors.cyan};
  flex-shrink: 0;
`;

const HelperText = styled.span<{ $error: boolean }>`
  font-size: ${vibeTheme.typography.fontSize.xs};
  color: ${props => props.$error ? vibeTheme.colors.error : vibeTheme.colors.textSecondary};
  margin-top: ${vibeTheme.spacing[1]};
`;

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      variant = 'default',
      size = 'md',
      error = false,
      helperText,
      label,
      placeholder = 'Select an option',
      value,
      options,
      onChange,
      disabled = false,
      fullWidth = false,
      className,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }, [isOpen]);

    const handleToggle = () => {
      if (!disabled) {
        setIsOpen(!isOpen);
      }
    };

    const handleSelect = (optionValue: string) => {
      if (!disabled) {
        onChange?.(optionValue);
        setIsOpen(false);
      }
    };

    return (
      <SelectWrapper ref={wrapperRef} $fullWidth={fullWidth} className={className}>
        {label && <Label>{label}</Label>}

        <SelectTrigger
          ref={ref}
          $variant={variant}
          $size={size}
          $error={error}
          $isOpen={isOpen}
          $fullWidth={fullWidth}
          data-disabled={disabled}
          onClick={handleToggle}
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          {...props}
        >
          <SelectedValue $isPlaceholder={!selectedOption}>
            {selectedOption ? selectedOption.label : placeholder}
          </SelectedValue>

          <ChevronIcon
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown />
          </ChevronIcon>
        </SelectTrigger>

        <AnimatePresence>
          {isOpen && (
            <DropdownMenu
              $size={size}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              role="listbox"
            >
              {options.map((option) => (
                <Option
                  key={option.value}
                  $size={size}
                  $isSelected={option.value === value}
                  $isDisabled={!!option.disabled}
                  data-disabled={option.disabled}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  role="option"
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled}
                >
                  {option.label}
                  {option.value === value && <CheckIcon size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />}
                </Option>
              ))}
            </DropdownMenu>
          )}
        </AnimatePresence>

        {helperText && (
          <HelperText $error={error}>{helperText}</HelperText>
        )}
      </SelectWrapper>
    );
  }
);

Select.displayName = 'Select';

export default Select;
