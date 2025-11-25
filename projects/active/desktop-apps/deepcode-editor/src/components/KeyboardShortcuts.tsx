import React, { useCallback,useMemo, useState } from 'react';
import { 
  ChevronDown,
  ChevronRight,
  Filter,
  Keyboard, 
  Search, 
  X} from 'lucide-react';
import styled from 'styled-components';

export interface ShortcutCategory {
  name: string;
  shortcuts: KeyboardShortcut[];
}

export interface KeyboardShortcut {
  id: string;
  description: string;
  keys: string[];
  category: string;
  command?: string;
  when?: string;
}

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts?: KeyboardShortcut[];
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const Modal = styled.div`
  background: ${props => props.theme.surface || '#1a1a1a'};
  border: 1px solid ${props => props.theme.border || '#333'};
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
`;

const Header = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme.border || '#333'};
  display: flex;
  align-items: center;
  justify-content: between;
  gap: 12px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.text || '#fff'};
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.textSecondary || '#888'};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.hover || '#333'};
    color: ${props => props.theme.text || '#fff'};
  }
`;

const SearchContainer = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid ${props => props.theme.border || '#333'};
`;

const SearchInput = styled.input`
  width: 100%;
  background: ${props => props.theme.input || '#2a2a2a'};
  border: 1px solid ${props => props.theme.border || '#444'};
  border-radius: 8px;
  padding: 10px 16px 10px 40px;
  color: ${props => props.theme.text || '#fff'};
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: ${props => props.theme.accent || '#00d2ff'};
  }

  &::placeholder {
    color: ${props => props.theme.textSecondary || '#888'};
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 36px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.textSecondary || '#888'};
  pointer-events: none;
`;

const FilterContainer = styled.div`
  padding: 12px 24px;
  border-bottom: 1px solid ${props => props.theme.border || '#333'};
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
`;

const FilterButton = styled.button<{ active: boolean }>`
  background: ${props => props.active ? (props.theme.accent || '#00d2ff') : 'transparent'};
  border: 1px solid ${props => props.active ? (props.theme.accent || '#00d2ff') : (props.theme.border || '#444')};
  border-radius: 6px;
  padding: 4px 8px;
  color: ${props => props.active ? '#000' : (props.theme.textSecondary || '#888')};
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: ${props => props.active ? (props.theme.accent || '#00d2ff') : (props.theme.hover || '#333')};
    color: ${props => props.active ? '#000' : (props.theme.text || '#fff')};
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
`;

const CategorySection = styled.div`
  margin-bottom: 24px;
`;

const CategoryHeader = styled.div`
  padding: 8px 24px;
  background: ${props => props.theme.surface || '#1a1a1a'};
  border-bottom: 1px solid ${props => props.theme.border || '#333'};
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;

  &:hover {
    background: ${props => props.theme.hover || '#252525'};
  }
`;

const CategoryTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.text || '#fff'};
  flex: 1;
`;

const CategoryCount = styled.span`
  font-size: 12px;
  color: ${props => props.theme.textSecondary || '#888'};
  background: ${props => props.theme.surface || '#2a2a2a'};
  padding: 2px 6px;
  border-radius: 4px;
`;

const ShortcutsList = styled.div<{ collapsed: boolean }>`
  display: ${props => props.collapsed ? 'none' : 'block'};
`;

const ShortcutItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-bottom: 1px solid ${props => props.theme.border || '#333'};
  transition: background 0.2s ease;

  &:hover {
    background: ${props => props.theme.hover || '#252525'};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ShortcutDescription = styled.div`
  flex: 1;
`;

const ShortcutTitle = styled.div`
  font-size: 14px;
  color: ${props => props.theme.text || '#fff'};
  margin-bottom: 2px;
`;

const ShortcutCommand = styled.div`
  font-size: 12px;
  color: ${props => props.theme.textSecondary || '#888'};
  font-family: 'JetBrains Mono', monospace;
`;

const KeyCombination = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const KeyChip = styled.span`
  background: ${props => props.theme.surface || '#2a2a2a'};
  border: 1px solid ${props => props.theme.border || '#444'};
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: ${props => props.theme.text || '#fff'};
  min-width: 20px;
  text-align: center;
`;

const defaultShortcuts: KeyboardShortcut[] = [
  // File Operations
  { id: 'new-file', description: 'New File', keys: ['Ctrl', 'N'], category: 'File', command: 'file.new' },
  { id: 'open-file', description: 'Open File', keys: ['Ctrl', 'O'], category: 'File', command: 'file.open' },
  { id: 'save-file', description: 'Save File', keys: ['Ctrl', 'S'], category: 'File', command: 'file.save' },
  { id: 'save-as', description: 'Save As...', keys: ['Ctrl', 'Shift', 'S'], category: 'File', command: 'file.saveAs' },
  { id: 'close-file', description: 'Close File', keys: ['Ctrl', 'W'], category: 'File', command: 'file.close' },
  { id: 'close-all', description: 'Close All Files', keys: ['Ctrl', 'K', 'W'], category: 'File', command: 'file.closeAll' },

  // Edit Operations
  { id: 'undo', description: 'Undo', keys: ['Ctrl', 'Z'], category: 'Edit', command: 'edit.undo' },
  { id: 'redo', description: 'Redo', keys: ['Ctrl', 'Y'], category: 'Edit', command: 'edit.redo' },
  { id: 'cut', description: 'Cut', keys: ['Ctrl', 'X'], category: 'Edit', command: 'edit.cut' },
  { id: 'copy', description: 'Copy', keys: ['Ctrl', 'C'], category: 'Edit', command: 'edit.copy' },
  { id: 'paste', description: 'Paste', keys: ['Ctrl', 'V'], category: 'Edit', command: 'edit.paste' },
  { id: 'select-all', description: 'Select All', keys: ['Ctrl', 'A'], category: 'Edit', command: 'edit.selectAll' },
  { id: 'duplicate-line', description: 'Duplicate Line', keys: ['Ctrl', 'D'], category: 'Edit', command: 'editor.action.copyLinesDown' },
  { id: 'move-line-up', description: 'Move Line Up', keys: ['Alt', '↑'], category: 'Edit', command: 'editor.action.moveLinesUp' },
  { id: 'move-line-down', description: 'Move Line Down', keys: ['Alt', '↓'], category: 'Edit', command: 'editor.action.moveLinesDown' },
  { id: 'toggle-comment', description: 'Toggle Comment', keys: ['Ctrl', '/'], category: 'Edit', command: 'editor.action.commentLine' },

  // Search & Navigation
  { id: 'find', description: 'Find', keys: ['Ctrl', 'F'], category: 'Search', command: 'actions.find' },
  { id: 'find-replace', description: 'Find and Replace', keys: ['Ctrl', 'H'], category: 'Search', command: 'editor.action.startFindReplaceAction' },
  { id: 'find-in-files', description: 'Find in Files', keys: ['Ctrl', 'Shift', 'F'], category: 'Search', command: 'workbench.action.findInFiles' },
  { id: 'go-to-line', description: 'Go to Line', keys: ['Ctrl', 'G'], category: 'Navigation', command: 'workbench.action.gotoLine' },
  { id: 'go-to-file', description: 'Go to File', keys: ['Ctrl', 'P'], category: 'Navigation', command: 'workbench.action.quickOpen' },

  // Multi-cursor
  { id: 'add-cursor-above', description: 'Add Cursor Above', keys: ['Ctrl', 'Alt', '↑'], category: 'Multi-cursor', command: 'editor.action.insertCursorAbove' },
  { id: 'add-cursor-below', description: 'Add Cursor Below', keys: ['Ctrl', 'Alt', '↓'], category: 'Multi-cursor', command: 'editor.action.insertCursorBelow' },
  { id: 'select-all-occurrences', description: 'Select All Occurrences', keys: ['Ctrl', 'Shift', 'L'], category: 'Multi-cursor', command: 'editor.action.selectHighlights' },
  { id: 'select-next-occurrence', description: 'Select Next Occurrence', keys: ['Ctrl', 'D'], category: 'Multi-cursor', command: 'editor.action.addSelectionToNextFindMatch' },
  { id: 'clear-cursors', description: 'Clear Multiple Cursors', keys: ['Escape'], category: 'Multi-cursor', command: 'cancelSelection' },

  // View
  { id: 'toggle-sidebar', description: 'Toggle Sidebar', keys: ['Ctrl', 'B'], category: 'View', command: 'workbench.action.toggleSidebarVisibility' },
  { id: 'toggle-terminal', description: 'Toggle Terminal', keys: ['Ctrl', '`'], category: 'View', command: 'workbench.action.terminal.toggleTerminal' },
  { id: 'split-editor', description: 'Split Editor', keys: ['Ctrl', '\\'], category: 'View', command: 'workbench.action.splitEditor' },
  { id: 'zen-mode', description: 'Toggle Zen Mode', keys: ['Ctrl', 'K', 'Z'], category: 'View', command: 'workbench.action.toggleZenMode' },

  // AI & Commands
  { id: 'command-palette', description: 'Command Palette', keys: ['Ctrl', 'Shift', 'P'], category: 'Commands', command: 'workbench.action.showCommands' },
  { id: 'agent-mode', description: 'Open Agent Mode', keys: ['Ctrl', 'Shift', 'A'], category: 'AI', command: 'workbench.action.openAgentMode' },
  { id: 'composer-mode', description: 'Open Composer Mode', keys: ['Ctrl', 'Shift', 'M'], category: 'AI', command: 'workbench.action.openComposerMode' },
  { id: 'ai-completion', description: 'Trigger AI Completion', keys: ['Ctrl', 'Space'], category: 'AI', command: 'editor.action.triggerSuggest' },

  // Git
  { id: 'git-panel', description: 'Toggle Git Panel', keys: ['Ctrl', 'Shift', 'G'], category: 'Git', command: 'workbench.view.scm' },

  // Settings
  { id: 'settings', description: 'Open Settings', keys: ['Ctrl', ','], category: 'Settings', command: 'workbench.action.openSettings' },
  { id: 'theme-select', description: 'Select Color Theme', keys: ['Ctrl', 'K', 'Ctrl', 'T'], category: 'Settings', command: 'workbench.action.selectTheme' },
  { id: 'increase-font', description: 'Increase Font Size', keys: ['Ctrl', '+'], category: 'Settings', command: 'editor.action.fontZoomIn' },
  { id: 'decrease-font', description: 'Decrease Font Size', keys: ['Ctrl', '-'], category: 'Settings', command: 'editor.action.fontZoomOut' },
];

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  isOpen,
  onClose,
  shortcuts = defaultShortcuts
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const categories = useMemo(() => {
    const categoryMap = new Map<string, KeyboardShortcut[]>();
    
    shortcuts.forEach(shortcut => {
      if (!categoryMap.has(shortcut.category)) {
        categoryMap.set(shortcut.category, []);
      }
      categoryMap.get(shortcut.category)!.push(shortcut);
    });

    return Array.from(categoryMap.entries()).map(([name, shortcuts]) => ({
      name,
      shortcuts
    }));
  }, [shortcuts]);

  const filteredShortcuts = useMemo(() => {
    let filtered = shortcuts;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(shortcut =>
        shortcut.description.toLowerCase().includes(query) ||
        shortcut.keys.some(key => key.toLowerCase().includes(query)) ||
        shortcut.command?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(shortcut => shortcut.category === selectedCategory);
    }

    return filtered;
  }, [shortcuts, searchQuery, selectedCategory]);

  const groupedShortcuts = useMemo(() => {
    const groups = new Map<string, KeyboardShortcut[]>();
    
    filteredShortcuts.forEach(shortcut => {
      if (!groups.has(shortcut.category)) {
        groups.set(shortcut.category, []);
      }
      groups.get(shortcut.category)!.push(shortcut);
    });

    return Array.from(groups.entries()).map(([name, shortcuts]) => ({
      name,
      shortcuts
    }));
  }, [filteredShortcuts]);

  const toggleCategory = useCallback((categoryName: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  }, []);

  const formatKey = (key: string) => {
    const keyMap: Record<string, string> = {
      'Ctrl': '⌃',
      'Cmd': '⌘',
      'Alt': '⌥',
      'Shift': '⇧',
      'Tab': '⇥',
      'Enter': '↵',
      'Space': '␣',
      'Backspace': '⌫',
      'Delete': '⌦',
      'Escape': '⎋',
      '↑': '↑',
      '↓': '↓',
      '←': '←',
      '→': '→'
    };
    
    return keyMap[key] || key;
  };

  if (!isOpen) {return null;}

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Modal>
        <Header>
          <Title>
            <Keyboard size={20} />
            Keyboard Shortcuts
          </Title>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </Header>

        <SearchContainer style={{ position: 'relative' }}>
          <SearchIcon>
            <Search size={16} />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </SearchContainer>

        <FilterContainer>
          <Filter size={14} />
          <FilterButton
            active={selectedCategory === 'all'}
            onClick={() => setSelectedCategory('all')}
          >
            All ({shortcuts.length})
          </FilterButton>
          {categories.map(category => (
            <FilterButton
              key={category.name}
              active={selectedCategory === category.name}
              onClick={() => setSelectedCategory(category.name)}
            >
              {category.name} ({category.shortcuts.length})
            </FilterButton>
          ))}
        </FilterContainer>

        <Content>
          {groupedShortcuts.map(category => {
            const isCollapsed = collapsedCategories.has(category.name);
            
            return (
              <CategorySection key={category.name}>
                <CategoryHeader onClick={() => toggleCategory(category.name)}>
                  {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  <CategoryTitle>{category.name}</CategoryTitle>
                  <CategoryCount>{category.shortcuts.length}</CategoryCount>
                </CategoryHeader>
                
                <ShortcutsList collapsed={isCollapsed}>
                  {category.shortcuts.map(shortcut => (
                    <ShortcutItem key={shortcut.id}>
                      <ShortcutDescription>
                        <ShortcutTitle>{shortcut.description}</ShortcutTitle>
                        {shortcut.command && (
                          <ShortcutCommand>{shortcut.command}</ShortcutCommand>
                        )}
                      </ShortcutDescription>
                      
                      <KeyCombination>
                        {shortcut.keys.map((key, index) => (
                          <KeyChip key={index}>{formatKey(key)}</KeyChip>
                        ))}
                      </KeyCombination>
                    </ShortcutItem>
                  ))}
                </ShortcutsList>
              </CategorySection>
            );
          })}
          
          {groupedShortcuts.length === 0 && (
            <div style={{ 
              padding: '40px 24px', 
              textAlign: 'center', 
              color: '#888' 
            }}>
              No shortcuts found matching your search.
            </div>
          )}
        </Content>
      </Modal>
    </Overlay>
  );
};