import React, { forwardRef } from 'react';
import { Check, Minus } from 'lucide-react';
import styled, { css } from 'styled-components';

import { vibeTheme } from '../../styles/theme';

export type CheckboxSize = 'sm' | 'md' | 'lg';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: CheckboxSize;
  label?: string;
  helperText?: string;
  error?: boolean;
  indeterminate?: boolean;
}

// Size configurations
const sizeStyles = {
  sm: css`
    width: 16px;
    height: 16px;

    svg {
      width: 12px;
      height: 12px;
    }
  `,
  md: css`
    width: 20px;
    height: 20px;

    svg {
      width: 14px;
      height: 14px;
    }
  `,
  lg: css`
    width: 24px;
    height: 24px;

    svg {
      width: 16px;
      height: 16px;
    }
  `,
};

const CheckboxWrapper = styled.label`
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

const HiddenCheckbox = styled.input.attrs({ type: 'checkbox' })`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
`;

const StyledCheckbox = styled.div<{ $size: CheckboxSize; $checked: boolean; $error: boolean; $indeterminate: boolean }>`
  /* Base styles */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: ${vibeTheme.borderRadius.sm};
  transition: ${vibeTheme.animation.transition.all};
  position: relative;
  margin-top: 2px; /* Align with text baseline */

  /* Size styles */
  ${props => sizeStyles[props.$size]}

  /* Default state */
  background: ${vibeTheme.colors.tertiary};
  border: 2px solid rgba(139, 92, 246, 0.3);
  color: transparent;

  /* Hover state */
  ${CheckboxWrapper}:hover &:not(:disabled) {
    border-color: rgba(139, 92, 246, 0.5);
    background: ${vibeTheme.colors.elevated};
  }

  /* Checked state */
  ${props => (props.$checked || props.$indeterminate) && css`
    background: ${vibeTheme.gradients.primary};
    border-color: transparent;
    color: ${vibeTheme.colors.text};
    box-shadow: ${vibeTheme.shadows.glow};
  `}

  /* Focus state */
  ${HiddenCheckbox}:focus-visible + & {
    outline: 2px solid ${vibeTheme.colors.focus};
    outline-offset: 2px;
  }

  /* Error state */
  ${props => props.$error && css`
    border-color: ${vibeTheme.colors.error};

    ${CheckboxWrapper}:hover & {
      border-color: ${vibeTheme.colors.errorLight};
    }
  `}

  /* Icon */
  svg {
    transition: transform ${vibeTheme.animation.duration.fast} ${vibeTheme.animation.easing.spring};
    transform: ${props => (props.$checked || props.$indeterminate) ? 'scale(1)' : 'scale(0)'};
  }
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

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      size = 'md',
      label,
      helperText,
      error = false,
      indeterminate = false,
      checked,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    // Handle indeterminate state
    const checkboxRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => checkboxRef.current!);

    React.useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    return (
      <CheckboxWrapper className={className}>
        <HiddenCheckbox
          ref={checkboxRef}
          checked={checked}
          disabled={disabled}
          {...props}
        />

        <StyledCheckbox
          $size={size}
          $checked={!!checked}
          $error={error}
          $indeterminate={indeterminate}
        >
          {indeterminate ? <Minus /> : <Check />}
        </StyledCheckbox>

        {(label || helperText) && (
          <LabelContent>
            {label && <LabelText>{label}</LabelText>}
            {helperText && <HelperText $error={error}>{helperText}</HelperText>}
          </LabelContent>
        )}
      </CheckboxWrapper>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
