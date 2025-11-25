import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Replace, X } from 'lucide-react';
import styled from 'styled-components';

import { vibeTheme } from '../styles/theme';

interface FindReplaceProps {
  isOpen: boolean;
  onClose: () => void;
  onFind: (query: string, options: FindOptions) => void;
  onReplace: (query: string, replacement: string, options: FindOptions) => void;
  onReplaceAll: (query: string, replacement: string, options: FindOptions) => void;
  onFindNext: () => void;
  onFindPrevious: () => void;
  currentMatch?: number;
  totalMatches?: number;
}

export interface FindOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
}

const Container = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 0;
  right: 20px;
  z-index: 100;
  background: ${vibeTheme.colors.secondary};
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: ${vibeTheme.borderRadius.medium};
  padding: ${vibeTheme.spacing.md};
  box-shadow: ${vibeTheme.shadows.large};
  display: ${(props) => (props.$isOpen ? 'block' : 'none')};
  min-width: 400px;
  backdrop-filter: blur(10px);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${vibeTheme.gradients.card};
    opacity: 0.1;
    border-radius: ${vibeTheme.borderRadius.medium};
    pointer-events: none;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${vibeTheme.spacing.md};
`;

const Title = styled.h3`
  margin: 0;
  font-size: ${vibeTheme.typography.fontSize.base};
  font-weight: ${vibeTheme.typography.fontWeight.medium};
  color: ${vibeTheme.colors.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${vibeTheme.colors.textMuted};
  cursor: pointer;
  padding: ${vibeTheme.spacing.xs};
  border-radius: ${vibeTheme.borderRadius.small};
  transition: all ${vibeTheme.animation.duration.fast} ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: ${vibeTheme.colors.text};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const InputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.sm};
  margin-bottom: ${vibeTheme.spacing.sm};
`;

const Input = styled.input`
  flex: 1;
  background: ${vibeTheme.colors.primary};
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: ${vibeTheme.borderRadius.small};
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  color: ${vibeTheme.colors.text};
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-family: ${vibeTheme.typography.fontFamily.mono};

  &:focus {
    outline: none;
    border-color: ${vibeTheme.colors.purple};
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
  }

  &::placeholder {
    color: ${vibeTheme.colors.textMuted};
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  background: ${(props) =>
    props.$variant === 'primary' ? vibeTheme.gradients.primary : 'transparent'};
  border: 1px solid
    ${(props) => (props.$variant === 'primary' ? 'transparent' : 'rgba(139, 92, 246, 0.3)')};
  color: ${vibeTheme.colors.text};
  padding: ${vibeTheme.spacing.sm} ${vibeTheme.spacing.md};
  border-radius: ${vibeTheme.borderRadius.small};
  font-size: ${vibeTheme.typography.fontSize.sm};
  cursor: pointer;
  transition: all ${vibeTheme.animation.duration.fast} ease;
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.xs};

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${vibeTheme.shadows.small};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const IconButton = styled.button`
  background: transparent;
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: ${vibeTheme.colors.textSecondary};
  padding: ${vibeTheme.spacing.sm};
  border-radius: ${vibeTheme.borderRadius.small};
  cursor: pointer;
  transition: all ${vibeTheme.animation.duration.fast} ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: rgba(139, 92, 246, 0.1);
    border-color: ${vibeTheme.colors.purple};
    color: ${vibeTheme.colors.text};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const MatchInfo = styled.div`
  font-size: ${vibeTheme.typography.fontSize.xs};
  color: ${vibeTheme.colors.textSecondary};
  padding: 0 ${vibeTheme.spacing.sm};
`;

const Options = styled.div`
  display: flex;
  gap: ${vibeTheme.spacing.md};
  margin-top: ${vibeTheme.spacing.md};
  padding-top: ${vibeTheme.spacing.md};
  border-top: 1px solid rgba(139, 92, 246, 0.1);
`;

const Option = styled.label`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing.xs};
  font-size: ${vibeTheme.typography.fontSize.sm};
  color: ${vibeTheme.colors.textSecondary};
  cursor: pointer;

  input {
    cursor: pointer;
  }

  &:hover {
    color: ${vibeTheme.colors.text};
  }
`;

export const FindReplace: React.FC<FindReplaceProps> = ({
  isOpen,
  onClose,
  onFind,
  onReplace,
  onReplaceAll,
  onFindNext,
  onFindPrevious,
  currentMatch = 0,
  totalMatches = 0,
}) => {
  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [options, setOptions] = useState<FindOptions>({
    caseSensitive: false,
    wholeWord: false,
    regex: false,
  });

  const findInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && findInputRef.current) {
      findInputRef.current.focus();
      findInputRef.current.select();
    }
  }, [isOpen]);

  const handleFind = useCallback(() => {
    if (findQuery) {
      onFind(findQuery, options);
    }
  }, [findQuery, options, onFind]);

  const handleReplace = useCallback(() => {
    if (findQuery) {
      onReplace(findQuery, replaceQuery, options);
    }
  }, [findQuery, replaceQuery, options, onReplace]);

  const handleReplaceAll = useCallback(() => {
    if (findQuery) {
      onReplaceAll(findQuery, replaceQuery, options);
    }
  }, [findQuery, replaceQuery, options, onReplaceAll]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          onFindPrevious();
        } else {
          handleFind();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [handleFind, onFindPrevious, onClose]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Container $isOpen={isOpen}>
      <Header>
        <Title>Find {showReplace && '& Replace'}</Title>
        <CloseButton onClick={onClose} aria-label="Close find and replace">
          <X />
        </CloseButton>
      </Header>

      <InputGroup>
        <Input
          ref={findInputRef}
          type="text"
          id="find-input"
          name="find"
          aria-label="Find text"
          placeholder="Find..."
          value={findQuery}
          onChange={(e) => setFindQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <MatchInfo>{totalMatches > 0 ? `${currentMatch}/${totalMatches}` : 'No results'}</MatchInfo>
        <IconButton onClick={onFindPrevious} disabled={totalMatches === 0} aria-label="Previous match (Shift+Enter)">
          <ChevronUp />
        </IconButton>
        <IconButton onClick={onFindNext} disabled={totalMatches === 0} aria-label="Next match (Enter)">
          <ChevronDown />
        </IconButton>
        <Button onClick={() => setShowReplace(!showReplace)} aria-label="Toggle replace">
          <Replace />
        </Button>
      </InputGroup>

      {showReplace && (
        <>
          <InputGroup>
            <Input
              type="text"
              id="replace-input"
              name="replace"
              aria-label="Replace with text"
              placeholder="Replace with..."
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Button onClick={handleReplace} disabled={totalMatches === 0}>
              Replace
            </Button>
            <Button $variant="primary" onClick={handleReplaceAll} disabled={totalMatches === 0}>
              Replace All
            </Button>
          </InputGroup>
        </>
      )}

      <Options>
        <Option>
          <label htmlFor="match-case-checkbox">
            <input
              type="checkbox"
              id="match-case-checkbox"
              name="matchCase"
              checked={options.caseSensitive}
              onChange={(e) => setOptions({ ...options, caseSensitive: e.target.checked })}
            />
            Match Case
          </label>
        </Option>
        <Option>
          <label htmlFor="whole-word-checkbox">
            <input
              type="checkbox"
              id="whole-word-checkbox"
              name="wholeWord"
              checked={options.wholeWord}
              onChange={(e) => setOptions({ ...options, wholeWord: e.target.checked })}
            />
            Whole Word
          </label>
        </Option>
        <Option>
          <label htmlFor="regex-checkbox">
            <input
              type="checkbox"
              id="regex-checkbox"
              name="regex"
              checked={options.regex}
              onChange={(e) => setOptions({ ...options, regex: e.target.checked })}
            />
            Regex
          </label>
        </Option>
      </Options>
    </Container>
  );
};

export default FindReplace;
