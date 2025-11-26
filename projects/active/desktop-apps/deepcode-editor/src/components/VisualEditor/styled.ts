/**
 * VisualEditor Styled Components
 */
import { motion } from 'framer-motion';
import styled from 'styled-components';

import { vibeTheme } from '../../styles/theme';

export const EditorContainer = styled.div`
  display: grid;
  grid-template-columns: 250px 1fr 300px;
  height: 100%;
  background: ${vibeTheme.colors.secondary};
  overflow: hidden;
`;

export const Palette = styled.div`
  background: ${vibeTheme.colors.elevated};
  border-right: 1px solid ${vibeTheme.colors.border};
  overflow-y: auto;
  padding: 16px;
`;

export const PaletteTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${vibeTheme.colors.textPrimary};
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const PaletteSection = styled.div`
  margin-bottom: 20px;
`;

export const PaletteItem = styled(motion.div)`
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  border: 1px solid ${vibeTheme.colors.border};
  background: ${vibeTheme.colors.primary};
  cursor: grab;
  font-size: 13px;
  color: ${vibeTheme.colors.textPrimary};
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    border-color: ${vibeTheme.colors.cyan};
    background: ${vibeTheme.colors.elevated};
  }

  &:active {
    cursor: grabbing;
  }
`;

export const Canvas = styled.div`
  position: relative;
  padding: 40px;
  overflow-y: auto;
  background: ${vibeTheme.colors.primary};
`;

export const CanvasContent = styled.div`
  min-height: 600px;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

export const DropZone = styled.div<{ isEmpty: boolean }>`
  min-height: ${props => props.isEmpty ? '400px' : 'auto'};
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: ${props => props.isEmpty ? '40px' : '0'};
  border: ${props => props.isEmpty ? `2px dashed ${vibeTheme.colors.border}` : 'none'};
  border-radius: 8px;
  align-items: ${props => props.isEmpty ? 'center' : 'stretch'};
  justify-content: ${props => props.isEmpty ? 'center' : 'flex-start'};
`;

export const EmptyState = styled.div`
  text-align: center;
  color: ${vibeTheme.colors.textSecondary};
  font-size: 14px;
`;

export const SortableItemStyled = styled.div<{ isDragging: boolean }>`
  padding: 16px;
  border-radius: 8px;
  border: 2px solid ${props => props.isDragging ? vibeTheme.colors.cyan : vibeTheme.colors.border};
  background: ${props => props.isDragging ? `${vibeTheme.colors.cyan}10` : 'white'};
  cursor: move;
  position: relative;
  transition: all 0.2s;

  &:hover {
    border-color: ${vibeTheme.colors.cyan};
  }
`;

export const ItemActions = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;

  ${SortableItemStyled}:hover & {
    opacity: 1;
  }
`;

export const IconButton = styled.button`
  padding: 6px;
  border-radius: 4px;
  border: none;
  background: ${vibeTheme.colors.primary};
  color: ${vibeTheme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${vibeTheme.colors.danger};
    color: white;
  }
`;

export const PropertiesPanel = styled.div`
  background: ${vibeTheme.colors.elevated};
  border-left: 1px solid ${vibeTheme.colors.border};
  overflow-y: auto;
  padding: 16px;
`;

export const PropertiesTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${vibeTheme.colors.textPrimary};
  margin-bottom: 12px;
`;

export const PropertyGroup = styled.div`
  margin-bottom: 16px;
`;

export const Label = styled.label`
  display: block;
  font-size: 12px;
  color: ${vibeTheme.colors.textSecondary};
  margin-bottom: 6px;
  font-weight: 500;
`;

export const Input = styled.input`
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid ${vibeTheme.colors.border};
  background: ${vibeTheme.colors.primary};
  color: ${vibeTheme.colors.textPrimary};
  font-size: 13px;

  &:focus {
    outline: none;
    border-color: ${vibeTheme.colors.cyan};
  }
`;

export const Toolbar = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  z-index: 10;
`;

export const ToolbarButton = styled(motion.button)`
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  background: ${vibeTheme.colors.elevated};
  color: ${vibeTheme.colors.textPrimary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background: ${vibeTheme.colors.cyan};
    color: white;
  }
`;
