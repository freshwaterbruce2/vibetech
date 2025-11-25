import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle,Code, Eye, EyeOff, RefreshCw } from 'lucide-react';
import styled from 'styled-components';

import { vibeTheme } from '../styles/theme';

import { IconButton } from './ui/IconButton';

const PreviewContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  background: ${vibeTheme.colors.secondary};
  border-left: 1px solid rgba(139, 92, 246, 0.15);
  height: 100%;
  position: relative;
`;

const PreviewHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${vibeTheme.spacing[3]} ${vibeTheme.spacing[4]};
  background: ${vibeTheme.colors.primary};
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
`;

const PreviewTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing[2]};
  font-size: ${vibeTheme.typography.fontSize.sm};
  font-weight: ${vibeTheme.typography.fontWeight.semibold};
  color: ${vibeTheme.colors.text};

  svg {
    color: ${vibeTheme.colors.cyan};
  }
`;

const PreviewActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${vibeTheme.spacing[2]};
`;

const PreviewContent = styled.div`
  flex: 1;
  overflow: auto;
  padding: ${vibeTheme.spacing[4]};
  background: ${vibeTheme.colors.primary};

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.2);
    border-radius: ${vibeTheme.borderRadius.full};

    &:hover {
      background: rgba(139, 92, 246, 0.4);
    }
  }
`;

const PreviewFrame = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  background: white;
  border-radius: ${vibeTheme.borderRadius.md};
  box-shadow: ${vibeTheme.shadows.lg};
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: ${vibeTheme.spacing[8]};
  text-align: center;
  color: ${vibeTheme.colors.textMuted};

  svg {
    width: 48px;
    height: 48px;
    color: ${vibeTheme.colors.error};
    margin-bottom: ${vibeTheme.spacing[4]};
  }

  h3 {
    font-size: ${vibeTheme.typography.fontSize.lg};
    font-weight: ${vibeTheme.typography.fontWeight.semibold};
    color: ${vibeTheme.colors.text};
    margin-bottom: ${vibeTheme.spacing[2]};
  }

  p {
    font-size: ${vibeTheme.typography.fontSize.sm};
    color: ${vibeTheme.colors.textSecondary};
    margin-bottom: ${vibeTheme.spacing[4]};
  }
`;

const CodePreview = styled.pre`
  background: ${vibeTheme.colors.tertiary};
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: ${vibeTheme.borderRadius.md};
  padding: ${vibeTheme.spacing[4]};
  overflow: auto;
  font-family: ${vibeTheme.typography.fontFamily.mono};
  font-size: ${vibeTheme.typography.fontSize.sm};
  color: ${vibeTheme.colors.text};
  line-height: 1.5;
  max-height: 400px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: ${vibeTheme.spacing[8]};
  text-align: center;
  color: ${vibeTheme.colors.textMuted};

  svg {
    width: 64px;
    height: 64px;
    color: ${vibeTheme.colors.textDisabled};
    margin-bottom: ${vibeTheme.spacing[4]};
    opacity: 0.5;
  }

  h3 {
    font-size: ${vibeTheme.typography.fontSize.lg};
    font-weight: ${vibeTheme.typography.fontWeight.semibold};
    color: ${vibeTheme.colors.textSecondary};
    margin-bottom: ${vibeTheme.spacing[2]};
  }

  p {
    font-size: ${vibeTheme.typography.fontSize.sm};
    color: ${vibeTheme.colors.textMuted};
  }
`;

interface PreviewPanelProps {
  code: string;
  fileName?: string;
  language?: string;
  onClose?: () => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  code,
  fileName = 'Component',
  language = 'javascript',
  onClose,
}) => {
  const [previewMode, setPreviewMode] = useState<'render' | 'code'>('render');
  const [error, setError] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    generatePreview();
  }, [code, previewMode]);

  const generatePreview = () => {
    try {
      setError(null);

      if (previewMode === 'code') {
        setPreviewContent(code);
        return;
      }

      // Check if it's an HTML file - render directly
      const isHTMLFile = fileName?.endsWith('.html') || language === 'html';
      if (isHTMLFile) {
        setPreviewContent(code);
        return;
      }

      // Check if it's a React component
      const isReactComponent =
        code.includes('import React') ||
        code.includes('from \'react\'') ||
        code.includes('from "react"') ||
        code.includes('export default function') ||
        code.includes('export const');

      if (!isReactComponent) {
        setError('Not a React component or HTML file');
        return;
      }

      // Generate preview HTML
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Preview</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      padding: 20px;
      background: #ffffff;
    }
    #root {
      min-height: 100vh;
    }
    .error {
      background: #fee;
      border: 1px solid #fcc;
      padding: 16px;
      border-radius: 8px;
      color: #c00;
      font-family: monospace;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useCallback, useMemo, useRef } = React;

    try {
      ${code}

      // Find the default export or first component
      const Component = typeof window.default !== 'undefined'
        ? window.default
        : Object.values(window).find(val =>
            typeof val === 'function' && val.name && /^[A-Z]/.test(val.name)
          );

      if (Component) {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<Component />);
      } else {
        throw new Error('No React component found. Make sure to export a component.');
      }
    } catch (error) {
      document.getElementById('root').innerHTML =
        '<div class="error">Error rendering component:\\n\\n' + error.message + '</div>';
    }
  </script>
</body>
</html>`;

      setPreviewContent(html);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
    }
  };

  const handleRefresh = () => {
    generatePreview();
  };

  const togglePreviewMode = () => {
    setPreviewMode(prev => (prev === 'render' ? 'code' : 'render'));
  };

  if (!code || code.trim().length === 0) {
    return (
      <PreviewContainer
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.2 }}
      >
        <PreviewHeader>
          <PreviewTitle>
            <Eye size={16} />
            Preview
          </PreviewTitle>
          <PreviewActions>
            {onClose && (
              <IconButton
                variant="ghost"
                size="sm"
                icon={<EyeOff size={16} />}
                onClick={onClose}
                aria-label="Close preview"
              />
            )}
          </PreviewActions>
        </PreviewHeader>
        <PreviewContent>
          <EmptyState>
            <Code />
            <h3>No Content</h3>
            <p>Start editing a file to see the preview</p>
          </EmptyState>
        </PreviewContent>
      </PreviewContainer>
    );
  }

  return (
    <PreviewContainer
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
    >
      <PreviewHeader>
        <PreviewTitle>
          <Eye size={16} />
          {fileName}
        </PreviewTitle>
        <PreviewActions>
          <IconButton
            variant="ghost"
            size="sm"
            icon={previewMode === 'render' ? <Code size={16} /> : <Eye size={16} />}
            onClick={togglePreviewMode}
            aria-label={previewMode === 'render' ? 'Show code' : 'Show preview'}
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={16} />}
            onClick={handleRefresh}
            aria-label="Refresh preview"
          />
          {onClose && (
            <IconButton
              variant="ghost"
              size="sm"
              icon={<EyeOff size={16} />}
              onClick={onClose}
              aria-label="Close preview"
            />
          )}
        </PreviewActions>
      </PreviewHeader>

      <PreviewContent>
        {error ? (
          <ErrorContainer>
            <AlertCircle />
            <h3>Preview Error</h3>
            <p>{error}</p>
            <CodePreview>{code}</CodePreview>
          </ErrorContainer>
        ) : previewMode === 'code' ? (
          <CodePreview>{code}</CodePreview>
        ) : (
          <PreviewFrame
            ref={iframeRef}
            srcDoc={previewContent}
            title="Component Preview"
            sandbox="allow-scripts"
          />
        )}
      </PreviewContent>
    </PreviewContainer>
  );
};
