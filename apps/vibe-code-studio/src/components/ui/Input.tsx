import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import styled, { css } from 'styled-components';

import { vibeTheme } from '../../styles/theme';

export type InputVariant = 'default' | 'filled' | 'outline';
export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  size?: InputSize;
  error?: boolean;
  helperText?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
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

    &:hover:not(:disabled) {
      border-color: rgba(139, 92, 246, 0.3);
      background: ${vibeTheme.colors.elevated};
    }

    &:focus {
      border-color: ${vibeTheme.colors.cyan};
      background: ${vibeTheme.colors.tertiary};
      box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
    }
  `,

  filled: css`
    background: ${vibeTheme.colors.elevated};
    border: 1px solid transparent;
    color: ${vibeTheme.colors.text};

    &:hover:not(:disabled) {
      background: ${vibeTheme.colors.tertiary};
    }

    &:focus {
      border-color: ${vibeTheme.colors.cyan};
      background: ${vibeTheme.colors.tertiary};
      box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
    }
  `,

  outline: css`
    background: transparent;
    border: 1px solid rgba(139, 92, 246, 0.3);
    color: ${vibeTheme.colors.text};

    &:hover:not(:disabled) {
      border-color: rgba(139, 92, 246, 0.5);
      background: ${vibeTheme.colors.hover};
    }

    &:focus {
      border-color: ${vibeTheme.colors.cyan};
      background: ${vibeTheme.colors.hover};
      box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
    }
  `,
};

const InputWrapper = styled.div<{ $fullWidth?: boolean }>`
  display: inline-flex;
  flex-direction: column;
  gap: ${vibeTheme.spacing[1]};
  width: ${props => props.$fullWidth ? '100%' : 'auto'};
`;

const Label = styled.label`
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  color: ${vibeTheme.colors.text};
  user-select: none;
`;

const InputContainer = styled.div<{ $fullWidth?: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  width: ${props => props.$fullWidth ? '100%' : 'auto'};
`;

const StyledInput = styled.input<{
  $variant: InputVariant;
  $size: InputSize;
  $hasLeftIcon: boolean;
  $hasRightIcon: boolean;
  $error: boolean;
  $fullWidth?: boolean;
}>`
  /* Base styles */
  font-family: ${vibeTheme.typography.fontFamily.primary};
  font-weight: ${vibeTheme.typography.fontWeight.normal};
  line-height: ${vibeTheme.typography.lineHeight.none};
  border-radius: ${vibeTheme.borderRadius.md};
  outline: none;
  transition: ${vibeTheme.animation.transition.all};
  width: ${props => props.$fullWidth ? '100%' : 'auto'};

  /* Size styles */
  ${props => sizeStyles[props.$size]}

  /* Variant styles */
  ${props => variantStyles[props.$variant]}

  /* Icon padding adjustments */
  ${props => props.$hasLeftIcon && css`
    padding-left: ${props.$size === 'sm' ? '36px' : props.$size === 'md' ? '40px' : '44px'};
  `}

  ${props => props.$hasRightIcon && css`
    padding-right: ${props.$size === 'sm' ? '36px' : props.$size === 'md' ? '40px' : '44px'};
  `}

  /* Error state */
  ${props => props.$error && css`
    border-color: ${vibeTheme.colors.error};

    &:focus {
      border-color: ${vibeTheme.colors.errorLight};
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  `}

  /* Disabled state */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: ${vibeTheme.colors.disabled};
  }

  /* Placeholder */
  &::placeholder {
    color: ${vibeTheme.colors.textMuted};
  }

  /* Remove autofill styles */
  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus {
    -webkit-text-fill-color: ${vibeTheme.colors.text};
    -webkit-box-shadow: 0 0 0px 1000px ${vibeTheme.colors.tertiary} inset;
    transition: background-color 5000s ease-in-out 0s;
  }
` as any;

const IconWrapper = styled.div<{ $position: 'left' | 'right'; $size: InputSize }>`
  position: absolute;
  ${props => props.$position}: ${props =>
    props.$size === 'sm' ? '12px' :
      props.$size === 'md' ? '14px' :
        '16px'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${vibeTheme.colors.textSecondary};
  pointer-events: none;

  svg {
    width: ${props =>
    props.$size === 'sm' ? '16px' :
      props.$size === 'md' ? '18px' :
        '20px'
  };
    height: ${props =>
    props.$size === 'sm' ? '16px' :
      props.$size === 'md' ? '18px' :
        '20px'
  };
  }
`;

const ActionButton = styled.button<{ $size: InputSize }>`
  position: absolute;
  right: ${props =>
    props.$size === 'sm' ? '8px' :
      props.$size === 'md' ? '10px' :
        '12px'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${vibeTheme.spacing[1]};
  background: transparent;
  border: none;
  border-radius: ${vibeTheme.borderRadius.sm};
  color: ${vibeTheme.colors.textSecondary};
  cursor: pointer;
  transition: ${vibeTheme.animation.transition.all};
  pointer-events: auto;

  &:hover {
    color: ${vibeTheme.colors.text};
    background: ${vibeTheme.colors.hover};
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: ${props =>
    props.$size === 'sm' ? '14px' :
      props.$size === 'md' ? '16px' :
        '18px'
  };
    height: ${props =>
    props.$size === 'sm' ? '14px' :
      props.$size === 'md' ? '16px' :
        '18px'
  };
  }
`;

const HelperText = styled.span<{ $error: boolean }>`
  font-size: ${vibeTheme.typography.fontSize.xs};
  color: ${props => props.$error ? vibeTheme.colors.error : vibeTheme.colors.textSecondary};
  margin-top: ${vibeTheme.spacing[1]};
`;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      error = false,
      helperText,
      label,
      leftIcon,
      rightIcon,
      clearable = false,
      onClear,
      fullWidth = false,
      type = 'text',
      value,
      className,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [internalValue, setInternalValue] = useState(value || '');

    const currentValue = value !== undefined ? value : internalValue;
    const isPassword = type === 'password';
    const showClearButton = clearable && currentValue && !props.disabled;
    const showPasswordToggle = isPassword && !props.disabled;

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else {
        setInternalValue('');
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value);
      }
      props.onChange?.(e);
    };

    return (
      <InputWrapper $fullWidth= { fullWidth } >
      { label && <Label>{ label } </Label>
  }

        <InputContainer $fullWidth={ fullWidth } >
{ leftIcon && (
  <IconWrapper $position="left" $size = { size } >
  { leftIcon }
  </IconWrapper>
)}

<StyledInput
            ref={ ref }
type = { isPassword && !showPassword ? 'password' : 'text'}
value = { currentValue }
onChange = { handleChange }
$variant = { variant }
$size = { size }
$hasLeftIcon = {!!leftIcon}
$hasRightIcon = {!!rightIcon || showClearButton || showPasswordToggle}
$error = { error }
$fullWidth = { fullWidth }
className = { className }
{...props }
          />

{
  rightIcon && !showClearButton && !showPasswordToggle && (
    <IconWrapper $position="right" $size = { size } >
      { rightIcon }
      </IconWrapper>
          )
}

{
  showPasswordToggle && (
    <ActionButton
              type="button"
  onClick = {() => setShowPassword(!showPassword)
}
$size = { size }
aria - label={ showPassword ? 'Hide password' : 'Show password' }
            >
  { showPassword?<EyeOff /> : <Eye />}
</ActionButton>
          )}

{
  showClearButton && !showPasswordToggle && (
    <ActionButton
              type="button"
  onClick = { handleClear }
  $size = { size }
  aria - label="Clear input"
    >
    <X />
    </ActionButton>
          )
}
</InputContainer>

{
  helperText && (
    <HelperText $error={ error }> { helperText } </HelperText>
        )
}
</InputWrapper>
    );
  }
);

Input.displayName = 'Input';

export default Input;

