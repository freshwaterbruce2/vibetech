import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import styled, { css } from 'styled-components';

import { vibeTheme } from '../../styles/theme';

export type CardVariant = 'default' | 'elevated' | 'outline' | 'glass';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  clickable?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

// Padding configurations
const paddingStyles = {
  none: css`
    padding: 0;
  `,
  sm: css`
    padding: ${vibeTheme.spacing[3]};
  `,
  md: css`
    padding: ${vibeTheme.spacing[4]};
  `,
  lg: css`
    padding: ${vibeTheme.spacing[6]};
  `,
  xl: css`
    padding: ${vibeTheme.spacing[8]};
  `,
};

// Variant styles
const variantStyles = {
  default: css`
    background: ${vibeTheme.colors.tertiary};
    border: 1px solid rgba(139, 92, 246, 0.15);
    box-shadow: ${vibeTheme.shadows.sm};
  `,

  elevated: css`
    background: ${vibeTheme.colors.elevated};
    border: 1px solid rgba(139, 92, 246, 0.2);
    box-shadow: ${vibeTheme.shadows.md}, ${vibeTheme.shadows.glow};
  `,

  outline: css`
    background: transparent;
    border: 1px solid rgba(139, 92, 246, 0.3);
  `,

  glass: css`
    background: linear-gradient(
      135deg,
      rgba(139, 92, 246, 0.05) 0%,
      rgba(0, 212, 255, 0.03) 100%
    );
    border: 1px solid rgba(139, 92, 246, 0.2);
    backdrop-filter: blur(20px);
    box-shadow: ${vibeTheme.shadows.sm};
  `,
};

const StyledCard = styled(motion.div)<{
  $variant: CardVariant;
  $padding: CardPadding;
  $hoverable: boolean;
  $clickable: boolean;
  $hasHeader: boolean;
  $hasFooter: boolean;
}>`
  /* Base styles */
  border-radius: ${vibeTheme.borderRadius.lg};
  transition: ${vibeTheme.animation.transition.all};
  position: relative;
  overflow: hidden;

  /* Variant styles */
  ${props => variantStyles[props.$variant]}

  /* Padding - only apply to content area if no header/footer */
  ${props => !props.$hasHeader && !props.$hasFooter && paddingStyles[props.$padding]}

  /* Hoverable state */
  ${props => props.$hoverable && css`
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${vibeTheme.shadows.lg}, ${vibeTheme.shadows.glowStrong};
      border-color: rgba(139, 92, 246, 0.4);
    }
  `}

  /* Clickable state */
  ${props => props.$clickable && css`
    cursor: pointer;

    &:active {
      transform: translateY(0);
    }
  `}

  /* Focus visible */
  &:focus-visible {
    outline: 2px solid ${vibeTheme.colors.focus};
    outline-offset: 2px;
  }
`;

export const CardHeader = styled.div<{ $padding?: CardPadding }>`
  ${props => paddingStyles[props.$padding || 'md']}
  border-bottom: 1px solid rgba(139, 92, 246, 0.15);
`;

export const CardTitle = styled.h3`
  margin: 0;
  font-size: ${vibeTheme.typography.fontSize.lg};
  font-weight: ${vibeTheme.typography.fontWeight.semibold};
  color: ${vibeTheme.colors.text};
`;

export const CardDescription = styled.p`
  margin: ${vibeTheme.spacing[1]} 0 0 0;
  font-size: ${vibeTheme.typography.fontSize.sm};
  color: ${vibeTheme.colors.textSecondary};
  line-height: ${vibeTheme.typography.lineHeight.relaxed};
`;

export const CardContent = styled.div<{ $padding?: CardPadding }>`
  ${props => paddingStyles[props.$padding || 'md']}
  flex: 1;
`;

export const CardFooter = styled.div<{ $padding?: CardPadding }>`
  ${props => paddingStyles[props.$padding || 'md']}
  border-top: 1px solid rgba(139, 92, 246, 0.15);
`;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hoverable = false,
      clickable = false,
      header,
      footer,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const hasHeader = !!header;
    const hasFooter = !!footer;

    return (
      <StyledCard
        ref={ref}
        $variant={variant}
        $padding={padding}
        $hoverable={hoverable}
        $clickable={clickable}
        $hasHeader={hasHeader}
        $hasFooter={hasFooter}
        className={className}
        tabIndex={clickable ? 0 : undefined}
        role={clickable ? 'button' : undefined}
        whileHover={hoverable ? { scale: 1.01 } : undefined}
        whileTap={clickable ? { scale: 0.99 } : undefined}
        {...props}
      >
        {hasHeader && (
          <CardHeader>
            {header}
          </CardHeader>
        )}

        <CardContent>
          {children}
        </CardContent>

        {hasFooter && (
          <CardFooter>
            {footer}
          </CardFooter>
        )}
      </StyledCard>
    );
  }
);

Card.displayName = 'Card';

export default Card;
