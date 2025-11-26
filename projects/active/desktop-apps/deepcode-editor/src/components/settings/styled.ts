/**
 * Settings Styled Components
 * All styled components for the Settings panel UI
 */
import styled from 'styled-components';

export const SettingsOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

export const SettingsPanel = styled.div`
  background: #2d2d2d;
  border-radius: 8px;
  width: 600px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: auto;
  border: 1px solid #404040;
`;

export const SettingsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #404040;

  h2 {
    margin: 0;
    color: #d4d4d4;
    font-size: 1.25rem;
  }
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  color: #d4d4d4;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background: #404040;
  }
`;

export const SettingsContent = styled.div`
  padding: 24px;
`;

export const SettingsSection = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const SectionTitle = styled.h3`
  margin: 0 0 16px 0;
  color: #d4d4d4;
  font-size: 1.1rem;
  font-weight: 600;
`;

export const SettingItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const SettingLabel = styled.label`
  color: #d4d4d4;
  font-size: 0.95rem;
  cursor: pointer;
  flex: 1;

  span {
    display: block;
    font-size: 0.85rem;
    color: #888;
    margin-top: 2px;
  }
`;

export const SettingControl = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Toggle = styled.input.attrs({ type: 'checkbox' })`
  width: 16px;
  height: 16px;
  cursor: pointer;
`;

export const NumberInput = styled.input.attrs({ type: 'number' })`
  background: #1e1e1e;
  border: 1px solid #404040;
  border-radius: 4px;
  color: #d4d4d4;
  padding: 6px 8px;
  width: 80px;
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: #61dafb;
  }
`;

export const Select = styled.select`
  background: linear-gradient(135deg, #1e1e1e 0%, #252525 100%);
  border: 2px solid #404040;
  border-radius: 6px;
  color: #d4d4d4;
  padding: 8px 12px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 180px;

  &:hover {
    border-color: #61dafb;
    box-shadow: 0 0 8px rgba(97, 218, 251, 0.2);
  }

  &:focus {
    outline: none;
    border-color: #61dafb;
    box-shadow: 0 0 12px rgba(97, 218, 251, 0.3);
  }

  option {
    background: #2d2d2d;
    color: #d4d4d4;
    padding: 8px;
    font-weight: 400;
  }

  optgroup {
    background: #1e1e1e;
    color: #61dafb;
    font-weight: 700;
    font-size: 0.85rem;
    padding: 6px 0;
    letter-spacing: 0.5px;
  }
`;

export const ModelPricingInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(97, 218, 251, 0.05);
  border: 1px solid rgba(97, 218, 251, 0.2);
  border-radius: 4px;
  font-size: 0.8rem;
  margin-top: 8px;

  .pricing-label {
    color: #61dafb;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .pricing-details {
    display: flex;
    gap: 12px;
    color: #d4d4d4;
    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  }

  .pricing-item {
    display: flex;
    gap: 4px;

    .label {
      color: #888;
    }

    .value {
      color: #61dafb;
      font-weight: 600;
    }
  }
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px 24px;
  border-top: 1px solid #404040;
`;

export const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.2s;

  ${(props) =>
    props.$variant === 'primary'
      ? `
    background: #61dafb;
    color: #1e1e1e;
    border-color: #61dafb;
    
    &:hover {
      background: #4fa8c5;
      border-color: #4fa8c5;
    }
  `
      : `
    background: transparent;
    color: #d4d4d4;
    border-color: #404040;
    
    &:hover {
      background: #404040;
    }
  `}
`;

export const InfoButton = styled.button`
  background: none;
  border: none;
  color: #8b5cf6;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 0.1);
  }
`;
