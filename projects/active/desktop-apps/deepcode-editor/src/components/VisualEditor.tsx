/**
 * VisualEditor - Drag-and-drop visual UI builder
 *
 * Features:
 * - dnd-kit for drag and drop
 * - Canvas with draggable elements
 * - Component palette
 * - Real-time code generation
 * - Lovable.dev-style interface
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, Code2, Copy, Eye, Settings, Save } from 'lucide-react';
import styled from 'styled-components';

import { vibeTheme } from '../styles/theme';

const EditorContainer = styled.div`
  display: grid;
  grid-template-columns: 250px 1fr 300px;
  height: 100%;
  background: ${vibeTheme.colors.secondary};
  overflow: hidden;
`;

const Palette = styled.div`
  background: ${vibeTheme.colors.elevated};
  border-right: 1px solid ${vibeTheme.colors.border};
  overflow-y: auto;
  padding: 16px;
`;

const PaletteTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${vibeTheme.colors.textPrimary};
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const PaletteSection = styled.div`
  margin-bottom: 20px;
`;

const PaletteItem = styled(motion.div)`
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

const Canvas = styled.div`
  position: relative;
  padding: 40px;
  overflow-y: auto;
  background: ${vibeTheme.colors.primary};
`;

const CanvasContent = styled.div`
  min-height: 600px;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const DropZone = styled.div<{ isEmpty: boolean }>`
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

const EmptyState = styled.div`
  text-align: center;
  color: ${vibeTheme.colors.textSecondary};
  font-size: 14px;
`;

const SortableItem = styled.div<{ isDragging: boolean }>`
  padding: 16px;
  border-radius: 8px;
  border: 2px solid ${props => props.isDragging ? vibeTheme.colors.cyan : vibeTheme.colors.border};
  background: ${props => props.isDragging ? vibeTheme.colors.cyan + '10' : 'white'};
  cursor: move;
  position: relative;
  transition: all 0.2s;

  &:hover {
    border-color: ${vibeTheme.colors.cyan};
  }
`;

const ItemActions = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;

  ${SortableItem}:hover & {
    opacity: 1;
  }
`;

const IconButton = styled.button`
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

const PropertiesPanel = styled.div`
  background: ${vibeTheme.colors.elevated};
  border-left: 1px solid ${vibeTheme.colors.border};
  overflow-y: auto;
  padding: 16px;
`;

const PropertiesTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${vibeTheme.colors.textPrimary};
  margin-bottom: 12px;
`;

const PropertyGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 12px;
  color: ${vibeTheme.colors.textSecondary};
  margin-bottom: 6px;
  font-weight: 500;
`;

const Input = styled.input`
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

const Toolbar = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  z-index: 10;
`;

const ToolbarButton = styled(motion.button)`
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

interface UIElement {
  id: string;
  type: 'button' | 'input' | 'text' | 'card' | 'container';
  props: Record<string, any>;
}

interface SortableElementProps {
  element: UIElement;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

// Sortable draggable item component
const SortableElement: React.FC<SortableElementProps> = ({ element, onDelete, onSelect }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <SortableItem
      ref={setNodeRef}
      style={style}
      isDragging={isDragging}
      onClick={() => onSelect(element.id)}
      {...attributes}
      {...listeners}
    >
      <ItemActions>
        <IconButton onClick={(e) => { e.stopPropagation(); onDelete(element.id); }}>
          <Trash2 size={14} />
        </IconButton>
      </ItemActions>
      {renderElement(element)}
    </SortableItem>
  );
};

// Render actual UI element
function renderElement(element: UIElement): React.ReactElement {
  switch (element.type) {
    case 'button':
      return (
        <button style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer' }}>
          {element.props.text || 'Button'}
        </button>
      );
    case 'input':
      return (
        <input type="text" placeholder={element.props.placeholder || 'Enter text...'} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb', width: '100%' }} />
      );
    case 'text':
      return <p style={{ margin: 0, fontSize: '14px', color: '#1f2937' }}>{element.props.content || 'Text content'}</p>;
    case 'card':
      return (
        <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>{element.props.title || 'Card Title'}</h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>{element.props.description || 'Card description'}</p>
        </div>
      );
    case 'container':
      return (
        <div style={{ padding: '16px', borderRadius: '8px', border: '1px dashed #d1d5db', background: '#f3f4f6' }}>
          Container (can nest elements here)
        </div>
      );
    default:
      return <div>Unknown element</div>;
  }
}

// Component palette items
const PALETTE_ITEMS = [
  { type: 'button', label: 'Button', icon: '🔘' },
  { type: 'input', label: 'Input', icon: '📝' },
  { type: 'text', label: 'Text', icon: '📄' },
  { type: 'card', label: 'Card', icon: '🎴' },
  { type: 'container', label: 'Container', icon: '📦' },
];

interface VisualEditorProps {
  onSave?: (elements: UIElement[], code: string) => void;
}

export const VisualEditor: React.FC<VisualEditorProps> = ({ onSave }) => {
  const [elements, setElements] = useState<UIElement[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<UIElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setElements((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  const handleAddElement = (type: UIElement['type']) => {
    const newElement: UIElement = {
      id: `element-${Date.now()}`,
      type,
      props: getDefaultProps(type),
    };
    setElements([...elements, newElement]);
  };

  const handleDeleteElement = (id: string) => {
    setElements(elements.filter((el) => el.id !== id));
    if (selectedElement?.id === id) {
      setSelectedElement(null);
    }
  };

  const handleSelectElement = (id: string) => {
    const element = elements.find((el) => el.id === id);
    setSelectedElement(element || null);
  };

  const handleUpdateProperty = (key: string, value: any) => {
    if (!selectedElement) return;

    setElements(
      elements.map((el) =>
        el.id === selectedElement.id
          ? { ...el, props: { ...el.props, [key]: value } }
          : el
      )
    );

    setSelectedElement({
      ...selectedElement,
      props: { ...selectedElement.props, [key]: value },
    });
  };

  const generateCode = (): string => {
    const imports = `import React from 'react';\n\n`;
    const component = `export function GeneratedComponent() {\n  return (\n    <div style={{ padding: '20px' }}>\n${elements.map(el => generateElementCode(el, 6)).join('\n')}\n    </div>\n  );\n}`;
    return imports + component;
  };

  const handleSave = () => {
    const code = generateCode();
    onSave?.(elements, code);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <EditorContainer>
        {/* Component Palette */}
        <Palette>
          <PaletteSection>
            <PaletteTitle>Components</PaletteTitle>
            {PALETTE_ITEMS.map((item) => (
              <PaletteItem
                key={item.type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAddElement(item.type as UIElement['type'])}
              >
                <span>{item.icon}</span>
                {item.label}
              </PaletteItem>
            ))}
          </PaletteSection>
        </Palette>

        {/* Canvas */}
        <Canvas>
          <Toolbar>
            <ToolbarButton whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Eye size={16} />
              Preview
            </ToolbarButton>
            <ToolbarButton whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSave}>
              <Save size={16} />
              Save
            </ToolbarButton>
            <ToolbarButton whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigator.clipboard.writeText(generateCode())}>
              <Code2 size={16} />
              Export Code
            </ToolbarButton>
          </Toolbar>

          <CanvasContent>
            <SortableContext items={elements.map(el => el.id)} strategy={verticalListSortingStrategy}>
              <DropZone isEmpty={elements.length === 0}>
                {elements.length === 0 ? (
                  <EmptyState>
                    <Plus size={48} style={{ color: vibeTheme.colors.textSecondary, marginBottom: 16 }} />
                    <p>Drag components here to start building</p>
                  </EmptyState>
                ) : (
                  elements.map((element) => (
                    <SortableElement
                      key={element.id}
                      element={element}
                      onDelete={handleDeleteElement}
                      onSelect={handleSelectElement}
                    />
                  ))
                )}
              </DropZone>
            </SortableContext>
          </CanvasContent>
        </Canvas>

        {/* Properties Panel */}
        <PropertiesPanel>
          <PropertiesTitle>Properties</PropertiesTitle>
          {selectedElement ? (
            <>
              <PropertyGroup>
                <Label>Element Type</Label>
                <Input value={selectedElement.type} disabled />
              </PropertyGroup>

              {selectedElement.type === 'button' && (
                <PropertyGroup>
                  <Label>Button Text</Label>
                  <Input
                    value={selectedElement.props.text || ''}
                    onChange={(e) => handleUpdateProperty('text', e.target.value)}
                  />
                </PropertyGroup>
              )}

              {selectedElement.type === 'input' && (
                <PropertyGroup>
                  <Label>Placeholder</Label>
                  <Input
                    value={selectedElement.props.placeholder || ''}
                    onChange={(e) => handleUpdateProperty('placeholder', e.target.value)}
                  />
                </PropertyGroup>
              )}

              {selectedElement.type === 'text' && (
                <PropertyGroup>
                  <Label>Content</Label>
                  <Input
                    value={selectedElement.props.content || ''}
                    onChange={(e) => handleUpdateProperty('content', e.target.value)}
                  />
                </PropertyGroup>
              )}

              {selectedElement.type === 'card' && (
                <>
                  <PropertyGroup>
                    <Label>Card Title</Label>
                    <Input
                      value={selectedElement.props.title || ''}
                      onChange={(e) => handleUpdateProperty('title', e.target.value)}
                    />
                  </PropertyGroup>
                  <PropertyGroup>
                    <Label>Card Description</Label>
                    <Input
                      value={selectedElement.props.description || ''}
                      onChange={(e) => handleUpdateProperty('description', e.target.value)}
                    />
                  </PropertyGroup>
                </>
              )}
            </>
          ) : (
            <EmptyState style={{ marginTop: 40 }}>Select an element to edit properties</EmptyState>
          )}
        </PropertiesPanel>

        <DragOverlay>
          {activeId ? (
            <SortableItem isDragging>
              {renderElement(elements.find(el => el.id === activeId)!)}
            </SortableItem>
          ) : null}
        </DragOverlay>
      </EditorContainer>
    </DndContext>
  );
};

// Helper functions
function getDefaultProps(type: UIElement['type']): Record<string, any> {
  switch (type) {
    case 'button':
      return { text: 'Click me' };
    case 'input':
      return { placeholder: 'Enter text...' };
    case 'text':
      return { content: 'Text content' };
    case 'card':
      return { title: 'Card Title', description: 'Card description' };
    case 'container':
      return {};
    default:
      return {};
  }
}

function generateElementCode(element: UIElement, indent: number): string {
  const spaces = ' '.repeat(indent);

  switch (element.type) {
    case 'button':
      return `${spaces}<button className="px-5 py-2.5 bg-blue-500 text-white rounded-md hover:bg-blue-600">
${spaces}  ${element.props.text || 'Button'}
${spaces}</button>`;
    case 'input':
      return `${spaces}<input
${spaces}  type="text"
${spaces}  placeholder="${element.props.placeholder || 'Enter text...'}"
${spaces}  className="px-3 py-2 border border-gray-300 rounded-md w-full"
${spaces}/>`;
    case 'text':
      return `${spaces}<p className="text-sm text-gray-900">${element.props.content || 'Text content'}</p>`;
    case 'card':
      return `${spaces}<div className="p-5 border border-gray-200 rounded-lg bg-gray-50">
${spaces}  <h3 className="text-base font-semibold mb-2">${element.props.title || 'Card Title'}</h3>
${spaces}  <p className="text-sm text-gray-600">${element.props.description || 'Card description'}</p>
${spaces}</div>`;
    case 'container':
      return `${spaces}<div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-100">
${spaces}  Container
${spaces}</div>`;
    default:
      return `${spaces}<div>Unknown element</div>`;
  }
}

export default VisualEditor;
