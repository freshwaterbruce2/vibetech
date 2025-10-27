import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import styled, { css } from 'styled-components';

import { vibeTheme } from '../../styles/theme';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  loading?: boolean;
  icon: React.ReactNode;
  'aria-label': string; // Required for accessibility
}

// Size configurations - square buttons
const sizeStyles = {
  xs: css`
    width: 28px;
    height: 28px;

    svg {
      width: 14px;
      height: 14px;
    }
  `,
  sm: css`
    width: 32px;
    height: 32px;

    svg {
      width: 16px;
      height: 16px;
    }
  `,
  md: css`
    width: 38px;
    height: 38px;

    svg {
      width: 18px;
      height: 18px;
    }
  `,
  lg: css`
    width: 44px;
    height: 44px;

    svg {
      width: 20px;
      height: 20px;
    }
  `,
};

// Variant styles
const variantStyles = {
  primary: css`
    background: ${vibeTheme.gradients.primary};
    color: ${vibeTheme.colors.text};
    border: 1px solid transparent;

    &:hover:not(:disabled) {
      box-shadow: ${vibeTheme.shadows.glow};
      transform: scale(1.05);
    }

    &:active:not(:disabled) {
      transform: scale(0.95);
    }
  `,

  secondary: css`
    background: ${vibeTheme.colors.tertiary};
    color: ${vibeTheme.colors.text};
    border: 1px solid rgba(139, 92, 246, 0.2);

    &:hover:not(:disabled) {
      background: ${vibeTheme.colors.elevated};
      border-color: ${vibeTheme.colors.cyan};
      transform: scale(1.05);
    }

    &:active:not(:disabled) {
      transform: scale(0.95);
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

    &:hover:not(:disabled) {
      background: ${vibeTheme.colors.errorLight};
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.3);
      transform: scale(1.05);
    }

    &:active:not(:disabled) {
      transform: scale(0.95);
    }
  `,
};

const StyledIconButton = styled(motion.button)<{
  $variant: IconButtonVariant;
  $size: IconButtonSize;
}>`
  /* Base styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: ${vibeTheme.borderRadius.md};
  cursor: pointer;
  user-select: none;
  transition: ${vibeTheme.animation.transition.all};
  outline: none;
  flex-shrink: 0;

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

    > svg:not([data-loader]) {
      opacity: 0;
    }
  }
`;

const LoadingSpinner = styled(motion.div)`
  position: absolute;
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

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'ghost',
      size = 'md',
      loading = false,
      disabled = false,
      icon,
      className,
      type = 'button',
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <StyledIconButton
        ref={ref}
        type={type}
        disabled={isDisabled}
        data-loading={loading}
        $variant={variant}
        $size={size}
        className={className}
        aria-label={ariaLabel}
        whileTap={!isDisabled ? { scale: 0.9 } : undefined}
        {...props}
      >
        {icon}

        {loading && (
          <LoadingSpinner
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2
              data-loader
              size={size === 'xs' ? 14 : size === 'sm' ? 16 : size === 'md' ? 18 : 20}
            />
          </LoadingSpinner>
        )}
      </StyledIconButton>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
