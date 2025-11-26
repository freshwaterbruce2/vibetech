/**
 * VisualEditor Types
 */

export interface UIElement {
  id: string;
  type: 'button' | 'input' | 'text' | 'card' | 'container';
  props: Record<string, unknown>;
}

export interface VisualEditorProps {
  onSave?: (elements: UIElement[], code: string) => void;
}

export interface SortableElementProps {
  element: UIElement;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

export interface PaletteItem {
  type: string;
  label: string;
  icon: string;
}

export interface VisualEditorState {
  elements: UIElement[];
  activeId: string | null;
  selectedElement: UIElement | null;
}
