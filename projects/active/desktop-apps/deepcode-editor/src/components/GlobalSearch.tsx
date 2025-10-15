import React, { useState, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Search, Replace, ChevronDown, ChevronRight, FileText, X } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';

interface SearchResult {
  file: string;
  line: number;
  column: number;
  text: string;
  match: string;
  before: string;
  after: string;
}

interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
  includeFiles: string;
  excludeFiles: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFile: (file: string, line?: number, column?: number) => void;
  onReplaceInFile: (file: string, searchText: string, replaceText: string, options: SearchOptions) => Promise<void>;
  workspaceFiles: string[];
}

const SearchContainer = styled.div<{ $isOpen: boolean }>`
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

const SearchHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.surface};
`;

const HeaderTitle = styled.div`
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

const CloseButton = styled.button`
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

const SearchInputGroup = styled.div`
  margin-bottom: 12px;
`;

const InputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
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

const InputIcon = styled.div`
  position: absolute;
  left: 12px;
  color: ${props => props.theme.textSecondary};
`;

const OptionsRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
`;

const OptionButton = styled.button<{ $active: boolean }>`
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

const FilterInputs = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const FilterInput = styled.input`
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

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' }>`
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

const ResultsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ResultsHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.surface};
  font-size: 14px;
  color: ${props => props.theme.textSecondary};
`;

const FileGroup = styled.div`
  border-bottom: 1px solid ${props => props.theme.border};
`;

const FileHeader = styled.div`
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

const FileIcon = styled.div`
  color: ${props => props.theme.textSecondary};
`;

const FileName = styled.span`
  font-size: 14px;
  color: ${props => props.theme.text};
  flex: 1;
`;

const ResultCount = styled.span`
  font-size: 12px;
  color: ${props => props.theme.textSecondary};
  padding: 2px 6px;
  background: ${props => props.theme.background};
  border-radius: 10px;
`;

const ResultItem = styled.div`
  padding: 8px 32px;
  border-bottom: 1px solid ${props => props.theme.border}20;
  cursor: pointer;
  
  &:hover {
    background: ${props => props.theme.hover};
  }
`;

const ResultLine = styled.div`
  font-size: 12px;
  color: ${props => props.theme.textSecondary};
  margin-bottom: 4px;
`;

const ResultText = styled.div`
  font-size: 13px;
  font-family: 'Monaco', 'Menlo', monospace;
  color: ${props => props.theme.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HighlightedText = styled.span`
  background: ${props => props.theme.accent}40;
  color: ${props => props.theme.accent};
  font-weight: bold;
`;

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  onOpenFile,
  onReplaceInFile,
  workspaceFiles
}) => {
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    regex: false,
    includeFiles: '',
    excludeFiles: 'node_modules,dist,build'
  });
  const [results, setResults] = useState<Record<string, SearchResult[]>>({});
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useHotkeys('ctrl+shift+f', (e) => {
    e.preventDefault();
    if (!isOpen) return;
    searchInputRef.current?.focus();
  });

  useHotkeys('escape', (e) => {
    if (isOpen) {
      e.preventDefault();
      onClose();
    }
  });

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const performSearch = useCallback(async () => {
    if (!searchText.trim()) {
      setResults({});
      return;
    }

    setIsSearching(true);
    
    try {
      // Simulate search through files
      // In a real implementation, this would use the MCP filesystem server
      const mockResults: Record<string, SearchResult[]> = {};
      
      // Filter files based on include/exclude patterns
      const filteredFiles = workspaceFiles.filter(file => {
        if (options.excludeFiles) {
          const excludePatterns = options.excludeFiles.split(',');
          if (excludePatterns.some(pattern => file.includes(pattern.trim()))) {
            return false;
          }
        }
        
        if (options.includeFiles) {
          const includePatterns = options.includeFiles.split(',');
          return includePatterns.some(pattern => file.includes(pattern.trim()));
        }
        
        return true;
      });

      // Simulate search results
      for (const file of filteredFiles.slice(0, 10)) { // Limit for demo
        const fileResults: SearchResult[] = [];
        
        // Generate mock matches
        const matchCount = Math.floor(Math.random() * 5) + 1;
        for (let i = 0; i < matchCount; i++) {
          const line = Math.floor(Math.random() * 100) + 1;
          const column = Math.floor(Math.random() * 50) + 1;
          
          fileResults.push({
            file,
            line,
            column,
            text: `Sample code line containing ${searchText} here`,
            match: searchText,
            before: 'Sample code line containing ',
            after: ' here'
          });
        }
        
        if (fileResults.length > 0) {
          mockResults[file] = fileResults;
        }
      }
      
      setResults(mockResults);
      
      // Auto-expand first few files
      const fileNames = Object.keys(mockResults);
      setExpandedFiles(new Set(fileNames.slice(0, 3)));
      
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchText, options, workspaceFiles]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [performSearch]);

  const toggleFileExpansion = (file: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(file)) {
      newExpanded.delete(file);
    } else {
      newExpanded.add(file);
    }
    setExpandedFiles(newExpanded);
  };

  const handleResultClick = (result: SearchResult) => {
    onOpenFile(result.file, result.line, result.column);
  };

  const handleReplaceAll = async () => {
    if (!replaceText.trim() || !searchText.trim()) return;
    
    setIsReplacing(true);
    
    try {
      const files = Object.keys(results);
      for (const file of files) {
        await onReplaceInFile(file, searchText, replaceText, options);
      }
      
      // Refresh search after replace
      await performSearch();
    } catch (error) {
      console.error('Replace failed:', error);
    } finally {
      setIsReplacing(false);
    }
  };

  const totalResults = Object.values(results).reduce((sum, fileResults) => sum + fileResults.length, 0);
  const fileCount = Object.keys(results).length;

  return (
    <SearchContainer $isOpen={isOpen}>
      <SearchHeader>
        <HeaderTitle>
          <h3>
            <Search size={16} />
            Search & Replace
          </h3>
          <CloseButton onClick={onClose}>
            <X size={16} />
          </CloseButton>
        </HeaderTitle>

        <SearchInputGroup>
          <InputContainer>
            <InputIcon>
              <Search size={14} />
            </InputIcon>
            <SearchInput
              ref={searchInputRef}
              type="text"
              placeholder="Search text..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </InputContainer>
        </SearchInputGroup>

        <SearchInputGroup>
          <InputContainer>
            <InputIcon>
              <Replace size={14} />
            </InputIcon>
            <SearchInput
              type="text"
              placeholder="Replace with..."
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
            />
          </InputContainer>
        </SearchInputGroup>

        <OptionsRow>
          <OptionButton
            $active={options.caseSensitive}
            onClick={() => setOptions(prev => ({ ...prev, caseSensitive: !prev.caseSensitive }))}
          >
            Aa
          </OptionButton>
          <OptionButton
            $active={options.wholeWord}
            onClick={() => setOptions(prev => ({ ...prev, wholeWord: !prev.wholeWord }))}
          >
            Ab
          </OptionButton>
          <OptionButton
            $active={options.regex}
            onClick={() => setOptions(prev => ({ ...prev, regex: !prev.regex }))}
          >
            .*
          </OptionButton>
        </OptionsRow>

        <FilterInputs>
          <FilterInput
            placeholder="files to include"
            value={options.includeFiles}
            onChange={(e) => setOptions(prev => ({ ...prev, includeFiles: e.target.value }))}
          />
          <FilterInput
            placeholder="files to exclude"
            value={options.excludeFiles}
            onChange={(e) => setOptions(prev => ({ ...prev, excludeFiles: e.target.value }))}
          />
        </FilterInputs>

        <ActionButtons>
          <ActionButton
            $variant="primary"
            onClick={performSearch}
            disabled={isSearching || !searchText.trim()}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </ActionButton>
          <ActionButton
            $variant="danger"
            onClick={handleReplaceAll}
            disabled={isReplacing || !searchText.trim() || !replaceText.trim() || totalResults === 0}
          >
            {isReplacing ? 'Replacing...' : 'Replace All'}
          </ActionButton>
        </ActionButtons>
      </SearchHeader>

      <ResultsContainer>
        {totalResults > 0 && (
          <ResultsHeader>
            {totalResults} results in {fileCount} files
          </ResultsHeader>
        )}

        {Object.entries(results).map(([file, fileResults]) => (
          <FileGroup key={file}>
            <FileHeader onClick={() => toggleFileExpansion(file)}>
              <FileIcon>
                {expandedFiles.has(file) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </FileIcon>
              <FileIcon>
                <FileText size={14} />
              </FileIcon>
              <FileName>{file}</FileName>
              <ResultCount>{fileResults.length}</ResultCount>
            </FileHeader>

            {expandedFiles.has(file) && fileResults.map((result, index) => (
              <ResultItem key={index} onClick={() => handleResultClick(result)}>
                <ResultLine>Line {result.line}, Column {result.column}</ResultLine>
                <ResultText>
                  {result.before}
                  <HighlightedText>{result.match}</HighlightedText>
                  {result.after}
                </ResultText>
              </ResultItem>
            ))}
          </FileGroup>
        ))}

        {searchText.trim() && totalResults === 0 && !isSearching && (
          <ResultsHeader>No results found</ResultsHeader>
        )}
      </ResultsContainer>
    </SearchContainer>
  );
};