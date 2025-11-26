/**
 * ComponentLibrary Types
 */

export interface UIComponent {
  id: string;
  name: string;
  category: string;
  description: string;
  code: string;
  tags: string[];
  popular?: boolean;
}

export interface ComponentLibraryProps {
  onInsertComponent?: (code: string) => void;
}

export interface ComponentLibraryState {
  searchQuery: string;
  selectedComponent: UIComponent | null;
  copiedId: string | null;
}
