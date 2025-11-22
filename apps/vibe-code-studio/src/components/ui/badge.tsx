import React, { forwardRef } from 'react';
import styled, { css } from 'styled-components';

import { vibeTheme } from '../../styles/theme';

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children?: React.ReactNode;
}

const sizeStyles = {
  sm: css`
    padding: 2px 8px;
    font-size: ${vibeTheme.typography.fontSize.xs};
    height: 20px;
  `,
  md: css`
    padding: 4px 12px;
    font-size: ${vibeTheme.typography.fontSize.sm};
    height: 24px;
  `,
  lg: css`
    padding: 6px 14px;
    font-size: ${vibeTheme.typography.fontSize.base};
    height: 28px;
  `,
};

const variantStyles = {
  default: css`
    background: ${vibeTheme.colors.surface};
    color: ${vibeTheme.colors.text};
    border: 1px solid ${vibeTheme.colors.border};
  `,
  primary: css`
    background: rgba(139, 92, 246, 0.15);
    color: ${vibeTheme.colors.purple};
    border: 1px solid rgba(139, 92, 246, 0.3);
  `,
  secondary: css`
    background: rgba(0, 212, 255, 0.15);
    color: ${vibeTheme.colors.cyan};
    border: 1px solid rgba(0, 212, 255, 0.3);
  `,
  success: css`
    background: rgba(16, 185, 129, 0.15);
    color: ${vibeTheme.colors.success};
    border: 1px solid rgba(16, 185, 129, 0.3);
  `,
  warning: css`
    background: rgba(245, 158, 11, 0.15);
    color: ${vibeTheme.colors.warning};
    border: 1px solid rgba(245, 158, 11, 0.3);
  `,
  error: css`
    background: rgba(239, 68, 68, 0.15);
    color: ${vibeTheme.colors.error};
    border: 1px solid rgba(239, 68, 68, 0.3);
  `,
  info: css`
    background: rgba(59, 130, 246, 0.15);
    color: ${vibeTheme.colors.info};
    border: 1px solid rgba(59, 130, 246, 0.3);
  `,
  outline: css`
    background: transparent;
    color: ${vibeTheme.colors.text};
    border: 1px solid ${vibeTheme.colors.border};
  `,
};

const StyledBadge = styled.span<{ $variant: BadgeVariant; $size: BadgeSize }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${vibeTheme.borderRadius.full};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  white-space: nowrap;
  transition: all ${vibeTheme.animation.duration.fast} ${vibeTheme.animation.easing.default};
  user-select: none;
  line-height: 1;

  ${props => sizeStyles[props.$size]}
  ${props => variantStyles[props.$variant]}
`;

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', size = 'md', children, className, ...props }, ref) => {
    return (
      <StyledBadge
        ref={ref}
        $variant={variant}
        $size={size}
        className={className}
        {...props}
      >
        {children}
      </StyledBadge>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
