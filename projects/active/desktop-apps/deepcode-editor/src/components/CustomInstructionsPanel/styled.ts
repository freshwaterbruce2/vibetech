/**
 * CustomInstructionsPanel Styled Components
 * All styled components for the Custom Instructions Panel UI
 */
import { motion } from 'framer-motion';
import styled from 'styled-components';

import { vibeTheme } from '../../styles/theme';

export const Container = styled(motion.div)`
  background: ${vibeTheme.colors.secondary};
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 20px;
  max-width: 900px;
  margin: 16px auto;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

export const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${vibeTheme.colors.text};
  font-size: 18px;
  font-weight: 700;
`;

export const Actions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const IconButton = styled.button`
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.4);
  color: ${vibeTheme.colors.text};
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 0.3);
    transform: translateY(-1px);
  }
`;

export const SaveButton = styled.button`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
`;

export const Info = styled.div`
  display: flex;
  gap: 10px;
  padding: 12px;
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 8px;
  margin-bottom: 20px;
`;

export const InfoIcon = styled.div`
  color: #60a5fa;
  flex-shrink: 0;
`;

export const InfoText = styled.div`
  color: ${vibeTheme.colors.text};
  font-size: 13px;
  line-height: 1.5;
`;

export const Tabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.3);
`;

export const Tab = styled.button<{ $active: boolean }>`
  background: ${(props) =>
    props.$active ? 'rgba(139, 92, 246, 0.3)' : 'transparent'};
  border: none;
  border-bottom: 2px solid
    ${(props) => (props.$active ? '#8b5cf6' : 'transparent')};
  color: ${vibeTheme.colors.text};
  padding: 12px 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 0.2);
  }
`;

export const TabContent = styled(motion.div)``;

export const Section = styled.div`
  margin-bottom: 24px;
`;

export const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${vibeTheme.colors.text};
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 13px;
  font-weight: 600;
`;

export const Input = styled.input`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: ${vibeTheme.colors.text};
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
  }
`;

export const Select = styled.select`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: ${vibeTheme.colors.text};
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
  }
`;

export const Checkbox = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
`;

export const TextArea = styled.textarea`
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: ${vibeTheme.colors.text};
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-family: 'JetBrains Mono', monospace;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #8b5cf6;
  }
`;

export const TemplateList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const TemplateSource = styled.div``;

export const SourceName = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
`;

export const TemplateCard = styled.div<{ $selected: boolean }>`
  background: ${(props) =>
    props.$selected ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.05)'};
  border: 1px solid
    ${(props) =>
      props.$selected ? 'rgba(139, 92, 246, 0.6)' : 'rgba(139, 92, 246, 0.2)'};
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 0.15);
  }
`;

export const TemplateName = styled.div`
  color: ${vibeTheme.colors.text};
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
`;

export const TemplateDescription = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 12px;
  margin-bottom: 8px;
`;

export const TemplateTags = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

export const Tag = styled.div`
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
`;

export const TemplatePreview = styled.div`
  margin-top: 20px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  padding: 16px;
`;

export const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  h3 {
    color: ${vibeTheme.colors.text};
    font-size: 14px;
    margin: 0;
  }
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${vibeTheme.colors.textSecondary};
  font-size: 24px;
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
`;

export const PreviewCode = styled.pre`
  background: rgba(0, 0, 0, 0.5);
  color: ${vibeTheme.colors.text};
  padding: 12px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  overflow-x: auto;
  margin: 0;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: ${vibeTheme.colors.textSecondary};
`;

export const EmptyText = styled.div`
  margin-top: 16px;
  font-size: 16px;
  margin-bottom: 20px;
`;

export const CreateButton = styled.button`
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  }
`;
