/**
 * Editor Styled Components
 * Styled components for the Editor component
 */
import styled from 'styled-components';

export const EditorContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.background};
  overflow: hidden;
  position: relative;
`;

export const MonacoContainer = styled.div<{ $hasOpenFiles: boolean }>`
  flex: 1;
  position: relative;
  opacity: ${({ $hasOpenFiles }) => ($hasOpenFiles ? 1 : 0.5)};

  .monaco-editor {
    .cursor {
      background-color: ${({ theme }) => theme.colors.accent} !important;
      border-color: ${({ theme }) => theme.colors.accent} !important;
    }

    .selected-text {
      background-color: ${({ theme }) => `${theme.colors.accent}30`} !important;
    }

    .current-line {
      background-color: ${({ theme }) => `${theme.colors.background}80`} !important;
      border: none !important;
    }

    .minimap-slider {
      background-color: ${({ theme }) => `${theme.colors.accent}20`} !important;
    }
  }
`;

export const StatusOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background: ${({ theme }) => `${theme.colors.surface}E0`};
  border-radius: 8px;
  border: 1px solid ${({ theme }) => `${theme.colors.border}40`};
  pointer-events: none;
  z-index: 100;
`;

export const StatusText = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
`;

export const AiIndicator = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: ${({ theme }) => `${theme.colors.accent}20`};
  border: 1px solid ${({ theme }) => `${theme.colors.accent}40`};
  border-radius: 4px;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.2s ease;
  pointer-events: none;
  z-index: 10;

  span {
    color: ${({ theme }) => theme.colors.accent};
    font-size: 11px;
    font-weight: 500;
  }
`;

export const PrefetchIndicator = styled.div<{ $status: 'idle' | 'active' | 'learning' }>`
  position: absolute;
  top: 8px;
  right: 140px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: ${({ theme, $status }) =>
    $status === 'learning'
      ? `${theme.colors.warning}20`
      : $status === 'active'
        ? `${theme.colors.success}20`
        : `${theme.colors.textSecondary}15`};
  border: 1px solid
    ${({ theme, $status }) =>
      $status === 'learning'
        ? `${theme.colors.warning}40`
        : $status === 'active'
          ? `${theme.colors.success}40`
          : `${theme.colors.textSecondary}30`};
  border-radius: 3px;
  font-size: 10px;
  color: ${({ theme, $status }) =>
    $status === 'learning'
      ? theme.colors.warning
      : $status === 'active'
        ? theme.colors.success
        : theme.colors.textSecondary};
  z-index: 10;
`;

export const StatsOverlay = styled.div`
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 8px 12px;
  background: ${({ theme }) => `${theme.colors.surface}F0`};
  border: 1px solid ${({ theme }) => `${theme.colors.border}60`};
  border-radius: 6px;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  z-index: 10;
  max-width: 280px;

  h4 {
    margin: 0 0 6px 0;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text};
  }

  p {
    margin: 2px 0;
    display: flex;
    justify-content: space-between;
    gap: 12px;

    span:last-child {
      color: ${({ theme }) => theme.colors.accent};
      font-weight: 500;
    }
  }
`;
