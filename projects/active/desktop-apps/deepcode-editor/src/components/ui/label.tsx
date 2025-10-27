import React, { forwardRef } from 'react';
import styled from 'styled-components';

import { vibeTheme } from '../../styles/theme';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  children?: React.ReactNode;
}

const StyledLabel = styled.label<{ $required?: boolean; $disabled?: boolean; $error?: boolean }>`
  display: inline-block;
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  color: ${props => {
    if (props.$error) {return vibeTheme.colors.error;}
    if (props.$disabled) {return vibeTheme.colors.textDisabled;}
    return vibeTheme.colors.text;
  }};
  margin-bottom: ${vibeTheme.spacing[1]};
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  user-select: none;
  transition: color ${vibeTheme.animation.duration.fast} ${vibeTheme.animation.easing.default};

  ${props => props.$required && `
    &::after {
      content: ' *';
      color: ${vibeTheme.colors.error};
      margin-left: 2px;
    }
  `}

  &:hover {
    color: ${props => !props.$disabled && !props.$error && vibeTheme.colors.purple};
  }
`;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ required, disabled, error, children, ...props }, ref) => {
    return (
      <StyledLabel
        ref={ref}
        $required={required}
        $disabled={disabled}
        $error={error}
        {...props}
      >
        {children}
      </StyledLabel>
    );
  }
);

Label.displayName = 'Label';

export default Label;
