/**
 * ComponentLibrary Styled Components
 */
import { motion } from 'framer-motion';
import styled from 'styled-components';

import { vibeTheme } from '../../styles/theme';

export const LibraryContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${vibeTheme.colors.secondary};
  border-radius: 12px;
  overflow: hidden;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: ${vibeTheme.colors.elevated};
  border-bottom: 1px solid ${vibeTheme.colors.border};
`;

export const Title = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: ${vibeTheme.colors.textPrimary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: ${vibeTheme.colors.primary};
  border-bottom: 1px solid ${vibeTheme.colors.border};
`;

export const SearchInput = styled.input`
  flex: 1;
  padding: 10px 12px 10px 36px;
  border-radius: 8px;
  border: 1px solid ${vibeTheme.colors.border};
  background: ${vibeTheme.colors.secondary};
  color: ${vibeTheme.colors.textPrimary};
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: ${vibeTheme.colors.cyan};
  }

  &::placeholder {
    color: ${vibeTheme.colors.textSecondary};
  }
`;

export const SearchIcon = styled.div`
  position: absolute;
  left: 32px;
  color: ${vibeTheme.colors.textSecondary};
  pointer-events: none;
`;

export const FilterButton = styled.button`
  padding: 10px;
  border-radius: 8px;
  border: 1px solid ${vibeTheme.colors.border};
  background: ${vibeTheme.colors.secondary};
  color: ${vibeTheme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;

  &:hover {
    border-color: ${vibeTheme.colors.cyan};
    color: ${vibeTheme.colors.cyan};
  }
`;

export const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

export const CategorySection = styled.div`
  margin-bottom: 24px;
`;

export const CategoryTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${vibeTheme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
`;

export const ComponentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
`;

export const ComponentCard = styled(motion.div)`
  padding: 16px;
  border-radius: 8px;
  border: 1px solid ${vibeTheme.colors.border};
  background: ${vibeTheme.colors.primary};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${vibeTheme.colors.cyan};
    background: ${vibeTheme.colors.elevated};
  }
`;

export const ComponentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

export const ComponentName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${vibeTheme.colors.textPrimary};
`;

export const ComponentBadge = styled.span`
  padding: 4px 8px;
  border-radius: 4px;
  background: ${vibeTheme.colors.cyan}20;
  color: ${vibeTheme.colors.cyan};
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
`;

export const ComponentDescription = styled.p`
  font-size: 12px;
  color: ${vibeTheme.colors.textSecondary};
  line-height: 1.4;
  margin-bottom: 12px;
`;

export const ComponentActions = styled.div`
  display: flex;
  gap: 8px;
`;

export const IconButton = styled.button`
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid ${vibeTheme.colors.border};
  background: transparent;
  color: ${vibeTheme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  transition: all 0.2s;

  &:hover {
    border-color: ${vibeTheme.colors.cyan};
    background: ${vibeTheme.colors.cyan}10;
    color: ${vibeTheme.colors.cyan};
  }
`;

export const PreviewModal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 40px;
`;

export const PreviewCard = styled.div`
  background: ${vibeTheme.colors.secondary};
  border-radius: 12px;
  max-width: 900px;
  max-height: 90vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

export const PreviewHeader = styled.div`
  padding: 20px;
  background: ${vibeTheme.colors.elevated};
  border-bottom: 1px solid ${vibeTheme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const PreviewTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${vibeTheme.colors.textPrimary};
`;

export const PreviewContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

export const CodeBlock = styled.pre`
  padding: 16px;
  border-radius: 8px;
  background: ${vibeTheme.colors.primary};
  border: 1px solid ${vibeTheme.colors.border};
  overflow-x: auto;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: ${vibeTheme.colors.textPrimary};

  code {
    font-family: inherit;
  }
`;
