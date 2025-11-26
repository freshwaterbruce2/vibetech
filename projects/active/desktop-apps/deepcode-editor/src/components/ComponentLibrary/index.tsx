/**
 * ComponentLibrary Component
 * Browse and insert reusable UI components
 */
import React from 'react';

import { AnimatePresence } from 'framer-motion';
import {
  Check,
  Copy,
  Download,
  Eye,
  Filter,
  Package,
  Search,
  Star,
} from 'lucide-react';

import type { ComponentLibraryProps } from './types';
import {
  CategorySection,
  CategoryTitle,
  CodeBlock,
  ComponentActions,
  ComponentBadge,
  ComponentCard,
  ComponentDescription,
  ComponentGrid,
  ComponentHeader,
  ComponentName,
  Content,
  FilterButton,
  Header,
  IconButton,
  LibraryContainer,
  PreviewCard,
  PreviewContent,
  PreviewHeader,
  PreviewModal,
  PreviewTitle,
  SearchBar,
  SearchIcon,
  SearchInput,
  Title,
} from './styled';
import { useComponentLibrary } from './useComponentLibrary';

export const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ onInsertComponent }) => {
  const {
    searchQuery,
    setSearchQuery,
    selectedComponent,
    copiedId,
    groupedComponents,
    handleCopy,
    handleInsert,
    openPreview,
    closePreview,
  } = useComponentLibrary({ onInsertComponent });

  return (
    <LibraryContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Header>
        <Title>
          <Package size={20} />
          Component Library
        </Title>
      </Header>

      <SearchBar>
        <div style={{ position: 'relative', flex: 1 }}>
          <SearchIcon>
            <Search size={16} />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <FilterButton>
          <Filter size={16} />
          Filter
        </FilterButton>
      </SearchBar>

      <Content>
        {Object.entries(groupedComponents).map(([category, components]) => (
          <CategorySection key={category}>
            <CategoryTitle>{category}</CategoryTitle>
            <ComponentGrid>
              {components.map((component) => (
                <ComponentCard
                  key={component.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ComponentHeader>
                    <ComponentName>{component.name}</ComponentName>
                    {component.popular && (
                      <ComponentBadge>
                        <Star size={10} style={{ display: 'inline', marginRight: 4 }} />
                        Popular
                      </ComponentBadge>
                    )}
                  </ComponentHeader>
                  <ComponentDescription>{component.description}</ComponentDescription>
                  <ComponentActions>
                    <IconButton onClick={() => openPreview(component)}>
                      <Eye size={14} />
                      View
                    </IconButton>
                    <IconButton onClick={() => handleCopy(component)}>
                      {copiedId === component.id ? <Check size={14} /> : <Copy size={14} />}
                    </IconButton>
                    {onInsertComponent && (
                      <IconButton onClick={() => handleInsert(component)}>
                        <Download size={14} />
                      </IconButton>
                    )}
                  </ComponentActions>
                </ComponentCard>
              ))}
            </ComponentGrid>
          </CategorySection>
        ))}
      </Content>

      <AnimatePresence>
        {selectedComponent && (
          <PreviewModal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePreview}
          >
            <PreviewCard onClick={(e) => e.stopPropagation()}>
              <PreviewHeader>
                <PreviewTitle>{selectedComponent.name}</PreviewTitle>
                <IconButton onClick={closePreview}>Close</IconButton>
              </PreviewHeader>
              <PreviewContent>
                <ComponentDescription>{selectedComponent.description}</ComponentDescription>
                <CodeBlock>
                  <code>{selectedComponent.code}</code>
                </CodeBlock>
              </PreviewContent>
            </PreviewCard>
          </PreviewModal>
        )}
      </AnimatePresence>
    </LibraryContainer>
  );
};

// Export all types and modules
export * from './types';
export * from './styled';
export * from './data';
export { useComponentLibrary } from './useComponentLibrary';
export default ComponentLibrary;
