import React, { forwardRef } from 'react';
import { motion, MotionProps } from 'framer-motion';
import styled, { css } from 'styled-components';
import { Loader2 } from 'lucide-react';

import { vibeTheme } from '../../styles/theme';

// Button Variants
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

// Size configurations
const sizeStyles = {
  xs: css`
    height: 28px;
    padding: 0 ${vibeTheme.spacing[2]};
    font-size: ${vibeTheme.typography.fontSize.xs};
    gap: ${vibeTheme.spacing[1]};

    svg {
      width: 14px;
      height: 14px;
    }
  `,
  sm: css`
    height: 32px;
    padding: 0 ${vibeTheme.spacing[3]};
    font-size: ${vibeTheme.typography.fontSize.sm};
    gap: ${vibeTheme.spacing[1]};

    svg {
      width: 16px;
      height: 16px;
    }
  `,
  md: css`
    height: 38px;
    padding: 0 ${vibeTheme.spacing[4]};
    font-size: ${vibeTheme.typography.fontSize.base};
    gap: ${vibeTheme.spacing[2]};

    svg {
      width: 18px;
      height: 18px;
    }
  `,
  lg: css`
    height: 44px;
    padding: 0 ${vibeTheme.spacing[6]};
    font-size: ${vibeTheme.typography.fontSize.md};
    gap: ${vibeTheme.spacing[2]};

    svg {
      width: 20px;
      height: 20px;
    }
  `,
  xl: css`
    height: 52px;
    padding: 0 ${vibeTheme.spacing[8]};
    font-size: ${vibeTheme.typography.fontSize.lg};
    gap: ${vibeTheme.spacing[3]};

    svg {
      width: 22px;
      height: 22px;
    }
  `,
};

// Variant styles
const variantStyles = {
  primary: css`
    background: ${vibeTheme.gradients.primary};
    color: ${vibeTheme.colors.text};
    border: 1px solid transparent;
    box-shadow: ${vibeTheme.shadows.sm}, ${vibeTheme.shadows.glow};

    &:hover:not(:disabled) {
      box-shadow: ${vibeTheme.shadows.md}, ${vibeTheme.shadows.glowStrong};
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: ${vibeTheme.shadows.sm};
    }
  `,

  secondary: css`
    background: ${vibeTheme.colors.tertiary};
    color: ${vibeTheme.colors.text};
    border: 1px solid ${vibeTheme.colors.purple};
    box-shadow: ${vibeTheme.shadows.sm};

    &:hover:not(:disabled) {
      background: ${vibeTheme.colors.elevated};
      border-color: ${vibeTheme.colors.cyan};
      box-shadow: ${vibeTheme.shadows.md};
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      background: ${vibeTheme.colors.tertiary};
      transform: translateY(0);
    }
  `,

  ghost: css`
    background: transparent;
    color: ${vibeTheme.colors.textSecondary};
    border: 1px solid transparent;

    &:hover:not(:disabled) {
      background: ${vibeTheme.colors.hover};
      color: ${vibeTheme.colors.text};
    }

    &:active:not(:disabled) {
      background: ${vibeTheme.colors.active};
    }
  `,

  danger: css`
    background: ${vibeTheme.colors.error};
    color: ${vibeTheme.colors.text};
    border: 1px solid transparent;
    box-shadow: ${vibeTheme.shadows.sm};

    &:hover:not(:disabled) {
      background: ${vibeTheme.colors.errorLight};
      box-shadow: ${vibeTheme.shadows.md}, 0 0 16px rgba(239, 68, 68, 0.3);
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      background: ${vibeTheme.colors.error};
      transform: translateY(0);
    }
  `,

  outline: css`
    background: transparent;
    color: ${vibeTheme.colors.text};
    border: 1px solid rgba(139, 92, 246, 0.3);

    &:hover:not(:disabled) {
      background: ${vibeTheme.colors.hover};
      border-color: ${vibeTheme.colors.cyan};
    }

    &:active:not(:disabled) {
      background: ${vibeTheme.colors.active};
    }
  `,
};

const StyledButton = styled(motion.button)<{
  $variant: ButtonVariant;
  $size: ButtonSize;
  $fullWidth?: boolean;
}>`
  /* Base styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  font-family: ${vibeTheme.typography.fontFamily.primary};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  line-height: ${vibeTheme.typography.lineHeight.none};
  border-radius: ${vibeTheme.borderRadius.md};
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: ${vibeTheme.animation.transition.all};
  outline: none;

  /* Full width */
  ${props => props.$fullWidth && css`
    width: 100%;
  `}

  /* Size styles */
  ${props => sizeStyles[props.$size]}

  /* Variant styles */
  ${props => variantStyles[props.$variant]}

  /* Disabled state */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  /* Focus visible (keyboard navigation) */
  &:focus-visible {
    outline: 2px solid ${vibeTheme.colors.focus};
    outline-offset: 2px;
  }

  /* Loading state */
  &[data-loading="true"] {
    cursor: wait;

    > * {
      opacity: 0;
    }
  }
`;

const LoadingSpinner = styled(motion.div)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const ButtonContent = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: inherit;
`;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      children,
      className,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <StyledButton
        ref={ref}
        type={type}
        disabled={isDisabled}
        data-loading={loading}
        $variant={variant}
        $size={size}
        $fullWidth={fullWidth}
        className={className}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        {...props}
      >
        <ButtonContent>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </ButtonContent>

        {loading && (
          <LoadingSpinner
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 size={size === 'xs' ? 14 : size === 'sm' ? 16 : 18} />
          </LoadingSpinner>
        )}
      </StyledButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;
