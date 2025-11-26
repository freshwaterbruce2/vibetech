/**
 * GlobalSearch Styled Components
 */
import styled from 'styled-components';

export const SearchContainer = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: ${props => props.$isOpen ? '0' : '-500px'};
  width: 500px;
  height: 100vh;
  background: ${props => props.theme.background};
  border-left: 1px solid ${props => props.theme.border};
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
`;

export const SearchHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.surface};
`;

export const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  
  h3 {
    margin: 0;
    color: ${props => props.theme.text};
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background: ${props => props.theme.hover};
    color: ${props => props.theme.text};
  }
`;

export const SearchInputGroup = styled.div`
  margin-bottom: 12px;
`;

export const InputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

export const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  padding-left: 36px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.accent};
  }
  
  &::placeholder {
    color: ${props => props.theme.textSecondary};
  }
`;

export const InputIcon = styled.div`
  position: absolute;
  left: 12px;
  color: ${props => props.theme.textSecondary};
`;

export const OptionsRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
`;

export const OptionButton = styled.button<{ $active: boolean }>`
  padding: 4px 8px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 3px;
  background: ${props => props.$active ? props.theme.accent : props.theme.background};
  color: ${props => props.$active ? 'white' : props.theme.text};
  font-size: 12px;
  cursor: pointer;

  &:hover {
    background: ${props => props.$active ? props.theme.accent : props.theme.hover};
  }
`;

export const FilterInputs = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

export const FilterInput = styled.input`
  padding: 6px 8px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 3px;
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-size: 12px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.accent};
  }
  
  &::placeholder {
    color: ${props => props.theme.textSecondary};
  }
`;

export const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

export const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' }>`
  padding: 6px 12px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 3px;
  background: ${props =>
    props.$variant === 'primary' ? props.theme.accent :
    props.$variant === 'danger' ? '#dc3545' :
    props.theme.background
  };
  color: ${props =>
    props.$variant === 'primary' || props.$variant === 'danger' ? 'white' : props.theme.text
  };
  font-size: 12px;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ResultsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`;

export const ResultsHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.surface};
  font-size: 14px;
  color: ${props => props.theme.textSecondary};
`;

export const FileGroup = styled.div`
  border-bottom: 1px solid ${props => props.theme.border};
`;

export const FileHeader = styled.div`
  padding: 8px 16px;
  background: ${props => props.theme.surface};
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  
  &:hover {
    background: ${props => props.theme.hover};
  }
`;

export const FileIcon = styled.div`
  color: ${props => props.theme.textSecondary};
`;

export const FileName = styled.span`
  font-size: 14px;
  color: ${props => props.theme.text};
  flex: 1;
`;

export const ResultCount = styled.span`
  font-size: 12px;
  color: ${props => props.theme.textSecondary};
  padding: 2px 6px;
  background: ${props => props.theme.background};
  border-radius: 10px;
`;

export const ResultItem = styled.div`
  padding: 8px 32px;
  border-bottom: 1px solid ${props => props.theme.border}20;
  cursor: pointer;
  
  &:hover {
    background: ${props => props.theme.hover};
  }
`;

export const ResultLine = styled.div`
  font-size: 12px;
  color: ${props => props.theme.textSecondary};
  margin-bottom: 4px;
`;

export const ResultText = styled.div`
  font-size: 13px;
  font-family: 'Monaco', 'Menlo', monospace;
  color: ${props => props.theme.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const HighlightedText = styled.span`
  background: ${props => props.theme.accent}40;
  color: ${props => props.theme.accent};
  font-weight: bold;
`;
