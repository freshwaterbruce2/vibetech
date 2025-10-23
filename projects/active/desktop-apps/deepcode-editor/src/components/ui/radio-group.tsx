import React, { forwardRef, createContext, useContext } from 'react';
import styled from 'styled-components';
import { vibeTheme } from '../../styles/theme';

interface RadioGroupContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  name?: string;
}

const RadioGroupContext = createContext<RadioGroupContextValue>({});

export interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  name?: string;
  className?: string;
  children?: React.ReactNode;
}

const StyledRadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${vibeTheme.spacing[2]};
`;

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ value, onValueChange, defaultValue, disabled, name, className, children }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || '');
    const currentValue = value !== undefined ? value : internalValue;

    const handleValueChange = (newValue: string) => {
      if (disabled) return;
      if (value === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(newValue);
    };

    return (
      <RadioGroupContext.Provider
        value={{
          value: currentValue,
          onValueChange: handleValueChange,
          disabled,
          name,
        }}
      >
        <StyledRadioGroup ref={ref} className={className} role="radiogroup">
          {children}
        </StyledRadioGroup>
      </RadioGroupContext.Provider>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

export interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: string;
  id?: string;
  children?: React.ReactNode;
}

const RadioItemContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing[2]};
  cursor: pointer;

  &:hover:not(:has(input:disabled)) {
    .radio-custom {
      border-color: ${vibeTheme.colors.purple};
      background: rgba(139, 92, 246, 0.1);
    }
  }

  input:disabled ~ * {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HiddenRadio = styled.input.attrs({ type: 'radio' })`
  position: absolute;
  opacity: 0;
  pointer-events: none;
`;

const CustomRadio = styled.div<{ $checked: boolean; $disabled?: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid ${props => props.$checked ? vibeTheme.colors.purple : vibeTheme.colors.border};
  background: ${props => props.$checked ? vibeTheme.colors.purple : 'transparent'};
  position: relative;
  transition: all ${vibeTheme.animation.duration.fast} ${vibeTheme.animation.easing.default};
  flex-shrink: 0;

  ${props => props.$checked && `
    box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
  `}

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: white;
    opacity: ${props => props.$checked ? 1 : 0};
    transition: opacity ${vibeTheme.animation.duration.fast} ${vibeTheme.animation.easing.default};
  }
`;

const RadioLabel = styled.label`
  font-size: ${vibeTheme.typography.fontSize.sm};
  color: ${vibeTheme.colors.text};
  cursor: pointer;
  user-select: none;
  flex: 1;
`;

export const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ value, id, disabled, children, ...props }, ref) => {
    const context = useContext(RadioGroupContext);
    const isChecked = context.value === value;
    const isDisabled = disabled || context.disabled;
    const inputId = id || `radio-${value}`;

    const handleChange = () => {
      if (!isDisabled) {
        context.onValueChange?.(value);
      }
    };

    return (
      <RadioItemContainer>
        <HiddenRadio
          ref={ref}
          id={inputId}
          name={context.name}
          value={value}
          checked={isChecked}
          disabled={isDisabled}
          onChange={handleChange}
          {...props}
        />
        <CustomRadio
          className="radio-custom"
          $checked={isChecked}
          $disabled={isDisabled}
          onClick={handleChange}
        />
        {children && (
          <RadioLabel htmlFor={inputId} onClick={handleChange}>
            {children}
          </RadioLabel>
        )}
      </RadioItemContainer>
    );
  }
);

RadioGroupItem.displayName = 'RadioGroupItem';

export default RadioGroup;
