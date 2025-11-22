import React, { forwardRef } from 'react';
import styled, { css } from 'styled-components';

import { vibeTheme } from '../../styles/theme';

export type TextAreaVariant = 'default' | 'filled' | 'outline';
export type TextAreaSize = 'sm' | 'md' | 'lg';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: TextAreaVariant;
  size?: TextAreaSize;
  error?: boolean;
  helperText?: string;
  label?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  fullWidth?: boolean;
}

// Size configurations
const sizeStyles = {
  sm: css`
    min-height: 80px;
    padding: ${vibeTheme.spacing[2]} ${vibeTheme.spacing[3]};
    font-size: ${vibeTheme.typography.fontSize.sm};
  `,
  md: css`
    min-height: 120px;
    padding: ${vibeTheme.spacing[3]} ${vibeTheme.spacing[4]};
    font-size: ${vibeTheme.typography.fontSize.base};
  `,
  lg: css`
    min-height: 160px;
    padding: ${vibeTheme.spacing[4]} ${vibeTheme.spacing[5]};
    font-size: ${vibeTheme.typography.fontSize.md};
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

const TextAreaWrapper = styled.div<{ $fullWidth?: boolean }>`
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

const StyledTextArea = styled.textarea<{
  $variant: TextAreaVariant;
  $size: TextAreaSize;
  $error: boolean;
  $resize: 'none' | 'vertical' | 'horizontal' | 'both';
  $fullWidth?: boolean;
}>`
  /* Base styles */
  font-family: ${vibeTheme.typography.fontFamily.primary};
  font-weight: ${vibeTheme.typography.fontWeight.normal};
  line-height: ${vibeTheme.typography.lineHeight.relaxed};
  border-radius: ${vibeTheme.borderRadius.md};
  outline: none;
  transition: ${vibeTheme.animation.transition.all};
  resize: ${props => props.$resize};
  width: ${props => props.$fullWidth ? '100%' : 'auto'};

  /* Size styles */
  ${props => sizeStyles[props.$size]}

  /* Variant styles */
  ${props => variantStyles[props.$variant]}

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

  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(139, 92, 246, 0.05);
    border-radius: ${vibeTheme.borderRadius.sm};
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.3);
    border-radius: ${vibeTheme.borderRadius.sm};

    &:hover {
      background: rgba(139, 92, 246, 0.5);
    }
  }
`;

const HelperText = styled.span<{ $error: boolean }>`
  font-size: ${vibeTheme.typography.fontSize.xs};
  color: ${props => props.$error ? vibeTheme.colors.error : vibeTheme.colors.textSecondary};
  margin-top: ${vibeTheme.spacing[1]};
`;

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      variant = 'default',
      size = 'md',
      error = false,
      helperText,
      label,
      resize = 'vertical',
      fullWidth = false,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <TextAreaWrapper $fullWidth={fullWidth}>
        {label && <Label>{label}</Label>}

        <StyledTextArea
          ref={ref}
          $variant={variant}
          $size={size}
          $error={error}
          $resize={resize}
          $fullWidth={fullWidth}
          className={className}
          {...props}
        />

        {helperText && (
          <HelperText $error={error}>{helperText}</HelperText>
        )}
      </TextAreaWrapper>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;
