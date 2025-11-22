import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import styled, { css } from 'styled-components';

import { vibeTheme } from '../../styles/theme';

export type ToggleSize = 'sm' | 'md' | 'lg';

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: ToggleSize;
  label?: string;
  helperText?: string;
  error?: boolean;
}

// Size configurations
const sizeConfig = {
  sm: {
    width: 32,
    height: 18,
    thumbSize: 14,
    padding: 2,
  },
  md: {
    width: 44,
    height: 24,
    thumbSize: 20,
    padding: 2,
  },
  lg: {
    width: 56,
    height: 30,
    thumbSize: 26,
    padding: 2,
  },
};

const ToggleWrapper = styled.label`
  display: inline-flex;
  align-items: flex-start;
  gap: ${vibeTheme.spacing[2]};
  cursor: pointer;
  user-select: none;
  position: relative;

  &:has(input:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HiddenInput = styled.input.attrs({ type: 'checkbox' })`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
`;

const Track = styled.div<{ $size: ToggleSize; $checked: boolean; $error: boolean }>`
  position: relative;
  flex-shrink: 0;
  margin-top: 2px; /* Align with text baseline */
  border-radius: ${vibeTheme.borderRadius.full};
  transition: ${vibeTheme.animation.transition.all};

  /* Size */
  width: ${props => sizeConfig[props.$size].width}px;
  height: ${props => sizeConfig[props.$size].height}px;

  /* Default state */
  background: ${vibeTheme.colors.tertiary};
  border: 2px solid rgba(139, 92, 246, 0.3);

  /* Hover state */
  ${ToggleWrapper}:hover &:not(:disabled) {
    border-color: rgba(139, 92, 246, 0.5);
    background: ${vibeTheme.colors.elevated};
  }

  /* Checked state */
  ${props => props.$checked && css`
    background: ${vibeTheme.gradients.primary};
    border-color: transparent;
    box-shadow: ${vibeTheme.shadows.glow};
  `}

  /* Focus state */
  ${HiddenInput}:focus-visible + & {
    outline: 2px solid ${vibeTheme.colors.focus};
    outline-offset: 2px;
  }

  /* Error state */
  ${props => props.$error && css`
    border-color: ${vibeTheme.colors.error};

    ${ToggleWrapper}:hover & {
      border-color: ${vibeTheme.colors.errorLight};
    }
  `}
`;

const Thumb = styled(motion.div)<{ $size: ToggleSize }>`
  position: absolute;
  top: ${props => sizeConfig[props.$size].padding}px;
  left: ${props => sizeConfig[props.$size].padding}px;
  width: ${props => sizeConfig[props.$size].thumbSize}px;
  height: ${props => sizeConfig[props.$size].thumbSize}px;
  border-radius: ${vibeTheme.borderRadius.full};
  background: ${vibeTheme.colors.text};
  box-shadow: ${vibeTheme.shadows.sm};
`;

const LabelContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${vibeTheme.spacing[1]};
`;

const LabelText = styled.span`
  font-size: ${vibeTheme.typography.fontSize.base};
  font-weight: ${vibeTheme.typography.fontWeight.normal};
  color: ${vibeTheme.colors.text};
  line-height: ${vibeTheme.typography.lineHeight.tight};
`;

const HelperText = styled.span<{ $error: boolean }>`
  font-size: ${vibeTheme.typography.fontSize.xs};
  color: ${props => props.$error ? vibeTheme.colors.error : vibeTheme.colors.textSecondary};
  line-height: ${vibeTheme.typography.lineHeight.tight};
`;

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      size = 'md',
      label,
      helperText,
      error = false,
      checked,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const config = sizeConfig[size];
    const thumbOffset = config.width - config.thumbSize - (config.padding * 2);

    return (
      <ToggleWrapper className={className}>
        <HiddenInput
          ref={ref}
          checked={checked}
          disabled={disabled}
          {...props}
        />

        <Track
          $size={size}
          $checked={!!checked}
          $error={error}
        >
          <Thumb
            $size={size}
            animate={{
              x: checked ? thumbOffset : 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
            }}
          />
        </Track>

        {(label || helperText) && (
          <LabelContent>
            {label && <LabelText>{label}</LabelText>}
            {helperText && <HelperText $error={error}>{helperText}</HelperText>}
          </LabelContent>
        )}
      </ToggleWrapper>
    );
  }
);

Toggle.displayName = 'Toggle';

export default Toggle;
