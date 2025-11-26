/**
 * useComponentLibrary Hook
 * State and actions for the ComponentLibrary component
 */
import { useCallback, useMemo, useState } from 'react';

import { logger } from '../../services/Logger';
import { SHADCN_COMPONENTS } from './data';
import type { UIComponent } from './types';

interface UseComponentLibraryOptions {
  onInsertComponent?: (code: string) => void;
}

export function useComponentLibrary(options: UseComponentLibraryOptions) {
  const { onInsertComponent } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<UIComponent | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Group components by category
  const groupedComponents = useMemo(() => {
    const filtered = SHADCN_COMPONENTS.filter((comp) => {
      const query = searchQuery.toLowerCase();
      return (
        comp.name.toLowerCase().includes(query) ||
        comp.description.toLowerCase().includes(query) ||
        comp.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });

    return filtered.reduce((acc, comp) => {
      if (!acc[comp.category]) {
        acc[comp.category] = [];
      }
      acc[comp.category].push(comp);
      return acc;
    }, {} as Record<string, UIComponent[]>);
  }, [searchQuery]);

  const handleCopy = useCallback(async (component: UIComponent) => {
    try {
      await navigator.clipboard.writeText(component.code);
      setCopiedId(component.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      logger.error('Failed to copy:', err);
    }
  }, []);

  const handleInsert = useCallback((component: UIComponent) => {
    onInsertComponent?.(component.code);
  }, [onInsertComponent]);

  const openPreview = useCallback((component: UIComponent) => {
    setSelectedComponent(component);
  }, []);

  const closePreview = useCallback(() => {
    setSelectedComponent(null);
  }, []);

  return {
    // State
    searchQuery,
    setSearchQuery,
    selectedComponent,
    copiedId,
    groupedComponents,

    // Actions
    handleCopy,
    handleInsert,
    openPreview,
    closePreview,
  };
}
