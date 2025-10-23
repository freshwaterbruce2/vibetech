/**
 * Composer Mode - Multi-file editing interface inspired by Cursor's Composer
 */
import { logger } from '../../services/Logger';
import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import {
  Plus,
  X,
  Send,
  Sparkles,
  Check,
  FileText,
  Code,
  GitBranch,
  ChevronRight,
  ChevronDown,
  Layers,
  Zap,
  Clock,
  FileSearch,
} from 'lucide-react';
import { vibeTheme } from '../../styles/theme';
import { UnifiedAIService } from '../../services/ai/UnifiedAIService';

interface ComposerFile {
  id: string;
  path: string;
  content: string;
  originalContent: string;
  language: string;
  isDirty: boolean;
  isNew: boolean;
}

interface ComposerModeProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyChanges: (files: ComposerFile[]) => void;
  initialFiles?: ComposerFile[];
  workspaceContext?: {
    recentFiles: string[];
    openFiles: string[];
    gitBranch?: string;
  };
  currentModel?: string;
  aiService?: UnifiedAIService;
}

const ComposerBackdrop = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9998;
  display: flex;
  align-items: flex-end;
  justify-content: center;
`;

const ComposerContainer = styled(motion.div)<{ $expanded?: boolean }>`
  width: 100%;
  max-width: 1400px;
  height: ${props => props.$expanded ? '85vh' : '600px'};
  background: ${vibeTheme.colors.secondary};
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-bottom: none;
  display: flex;
  flex-direction: column;
  z-index: 9999;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
  margin: 0 20px 0 20px;
`;

const ComposerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: ${vibeTheme.colors.primary};
  border-bottom: ${vibeTheme.borders.thin};
`;

const ComposerTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  svg {
    color: ${vibeTheme.colors.purple};
  }
  
  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
`;

const ComposerActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ActionButton = styled(motion.button)<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: ${props => props.$primary ? vibeTheme.colors.purple : 'transparent'};
  color: ${props => props.$primary ? 'white' : vibeTheme.colors.text};
  border: 1px solid ${props => props.$primary ? 'transparent' : vibeTheme.borders.thin};
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$primary ? 
      vibeTheme.colors.purple + 'dd' : 
      vibeTheme.colors.hover};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ComposerBody = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const FileList = styled.div`
  width: 300px;
  background: ${vibeTheme.colors.primary};
  border-right: ${vibeTheme.borders.thin};
  overflow-y: auto;
`;

const FileListHeader = styled.div`
  padding: 12px 16px;
  border-bottom: ${vibeTheme.borders.thin};
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: ${vibeTheme.colors.textSecondary};
  }
`;

const FileItem = styled(motion.div)<{ $selected?: boolean; $isDirty?: boolean }>`
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  background: ${props => props.$selected ? vibeTheme.colors.hover : 'transparent'};
  
  &:hover {
    background: ${vibeTheme.colors.hover};
  }
  
  svg {
    width: 16px;
    height: 16px;
    color: ${vibeTheme.colors.textSecondary};
  }
  
  .file-name {
    flex: 1;
    font-size: 14px;
    color: ${vibeTheme.colors.text};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .file-status {
    display: flex;
    align-items: center;
    gap: 4px;
    
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${props => props.$isDirty ? vibeTheme.colors.warning : vibeTheme.colors.success};
    }
  }
`;

const EditorSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const EditorHeader = styled.div`
  padding: 12px 20px;
  background: ${vibeTheme.colors.tertiary};
  border-bottom: ${vibeTheme.borders.thin};
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .file-path {
    font-size: 14px;
    color: ${vibeTheme.colors.textSecondary};
    font-family: 'Monaco', 'Consolas', monospace;
  }
`;

const EditorContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: ${vibeTheme.colors.primary};
  border-radius: 8px;
  margin: 8px;
  overflow: hidden;
  border: 1px solid rgba(139, 92, 246, 0.2);
  
  .monaco-editor {
    .margin {
      background-color: ${vibeTheme.colors.primary} !important;
    }
  }
`;

const EditorToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: ${vibeTheme.colors.secondary};
  border-bottom: 1px solid rgba(139, 92, 246, 0.1);
  font-size: 12px;
  
  .editor-info {
    display: flex;
    align-items: center;
    gap: 12px;
    color: ${vibeTheme.colors.textSecondary};
  }
  
  .editor-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const PromptSection = styled.div`
  padding: 16px 20px;
  background: ${vibeTheme.colors.primary};
  border-top: ${vibeTheme.borders.thin};
`;

const PromptInput = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 12px;
  
  textarea {
    flex: 1;
    min-height: 60px;
    max-height: 120px;
    padding: 12px 16px;
    background: ${vibeTheme.colors.secondary};
    border: ${vibeTheme.borders.thin};
    border-radius: 8px;
    font-size: 14px;
    resize: vertical;
    color: ${vibeTheme.colors.text};
    
    &:focus {
      outline: none;
      border-color: ${vibeTheme.colors.purple};
    }
  }
`;

const ContextTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
`;

const ContextTag = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: ${vibeTheme.colors.tertiary};
  border: ${vibeTheme.borders.thin};
  border-radius: 16px;
  font-size: 12px;
  color: ${vibeTheme.colors.textSecondary};
  cursor: pointer;
  
  &:hover {
    background: ${vibeTheme.colors.hover};
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`;

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 20px;
  background: ${vibeTheme.colors.tertiary};
  border-top: ${vibeTheme.borders.thin};
  font-size: 12px;
  color: ${vibeTheme.colors.textSecondary};
  
  .status-item {
    display: flex;
    align-items: center;
    gap: 6px;
    
    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

export const ComposerMode: React.FC<ComposerModeProps> = ({
  isOpen,
  onClose,
  onApplyChanges,
  initialFiles = [],
  workspaceContext,
  // currentModel,
  aiService,
}) => {
  const [files, setFiles] = useState<ComposerFile[]>(initialFiles);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedFile = files.find(f => f.id === selectedFileId);

  const handleAddFile = () => {
    const newFile: ComposerFile = {
      id: Date.now().toString(),
      path: 'untitled.ts',
      content: '',
      originalContent: '',
      language: 'typescript',
      isDirty: true,
      isNew: true,
    };
    setFiles([...files, newFile]);
    setSelectedFileId(newFile.id);
  };

  const handleLoadWorkspaceFiles = () => {
    if (!workspaceContext?.openFiles) return;
    
    const workspaceFiles = workspaceContext.openFiles.slice(0, 5).map(filePath => ({
      id: filePath,
      path: filePath.split('/').pop() || filePath,
      content: `// Content from ${filePath}\n// This is a placeholder - in a real implementation,\n// this would load the actual file content`,
      originalContent: `// Content from ${filePath}\n// This is a placeholder - in a real implementation,\n// this would load the actual file content`,
      language: getLanguageFromPath(filePath),
      isDirty: false,
      isNew: false,
    }));
    
    setFiles([...files, ...workspaceFiles]);
    if (workspaceFiles.length > 0) {
      setSelectedFileId(workspaceFiles[0]?.id || null);
    }
  };

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'javascript',
      tsx: 'typescript',
      py: 'python',
      css: 'css',
      html: 'html',
      json: 'json',
      md: 'markdown',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles(files.filter(f => f.id !== fileId));
    if (selectedFileId === fileId) {
      setSelectedFileId(files[0]?.id || null);
    }
  };

  const handleSendPrompt = async () => {
    if (!prompt.trim() || !aiService) return;

    setIsProcessing(true);

    try {
      // Build context from current files
      const fileContext = files.map(f => `File: ${f.path}\n\`\`\`${f.language}\n${f.content}\n\`\`\``).join('\n\n');

      const enhancedPrompt = `You are an AI assistant helping with multi-file code editing.
The user will describe changes they want to make across multiple files.
Analyze the request and generate the modified code for each file.

Current files context:
${fileContext}

User request: ${prompt}

Please provide the updated code for each file in separate code blocks with the language specified.`;

      // Get AI response using UnifiedAIService
      const response = await aiService.sendContextualMessage({
        userQuery: enhancedPrompt,
        currentFile: undefined,
        relatedFiles: [],
        workspaceContext: {
          rootPath: '',
          totalFiles: files.length,
          languages: [...new Set(files.map(f => f.language))],
          testFiles: 0,
          projectStructure: {},
          dependencies: {},
          exports: {},
          symbols: {},
          lastIndexed: new Date(),
          summary: `Composer Mode: ${files.length} files being edited`
        },
        conversationHistory: []
      });
      
      // Parse response to extract file changes
      // Simple parsing - in production would use more sophisticated parsing
      const codeBlocks = response.content.match(/```[\s\S]*?```/g) || [];
      
      if (codeBlocks.length > 0) {
        const updatedFiles = files.map((file, index) => {
          if (index < codeBlocks.length) {
            const newContent = codeBlocks[index]!
              .replace(/```\w*\n?/, '')
              .replace(/```$/, '')
              .trim();
            
            return {
              ...file,
              content: newContent,
              isDirty: newContent !== file.originalContent
            };
          }
          return file;
        });
        
        setFiles(updatedFiles);
      }
      
      // Add a new file if the AI suggests creating one
      if (response.content.includes('create new file') || response.content.includes('add a new file')) {
        handleAddFile();
      }
      
    } catch (error) {
      logger.error('Error processing AI request:', error);
    } finally {
      setIsProcessing(false);
      setPrompt('');
    }
  };

  const handleApplyChanges = () => {
    onApplyChanges(files.filter(f => f.isDirty));
    onClose();
  };

  const dirtyFileCount = files.filter(f => f.isDirty).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <ComposerBackdrop
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <ComposerContainer
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            $expanded={isExpanded}
            onClick={(e) => e.stopPropagation()}
          >
          <ComposerHeader>
            <ComposerTitle>
              <Layers />
              <h2>Composer Mode</h2>
              {dirtyFileCount > 0 && (
                <span style={{ color: vibeTheme.colors.warning, fontSize: '14px' }}>
                  {dirtyFileCount} file{dirtyFileCount > 1 ? 's' : ''} modified
                </span>
              )}
            </ComposerTitle>
            <ComposerActions>
              <ActionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronDown /> : <ChevronRight />}
                {isExpanded ? 'Collapse' : 'Expand'}
              </ActionButton>
              <ActionButton
                $primary
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleApplyChanges}
                disabled={dirtyFileCount === 0}
              >
                <Check />
                Apply Changes
              </ActionButton>
              <ActionButton
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
              >
                <X />
              </ActionButton>
            </ComposerActions>
          </ComposerHeader>

          <ComposerBody>
            <FileList>
              <FileListHeader>
                <h3>FILES ({files.length})</h3>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {workspaceContext?.openFiles && workspaceContext.openFiles.length > 0 && (
                    <ActionButton 
                      onClick={handleLoadWorkspaceFiles}
                      title="Load workspace files"
                    >
                      <Code size={16} />
                    </ActionButton>
                  )}
                  <ActionButton onClick={handleAddFile} title="Add new file">
                    <Plus size={16} />
                  </ActionButton>
                </div>
              </FileListHeader>
              {files.map(file => (
                <FileItem
                  key={file.id}
                  $selected={selectedFileId === file.id}
                  $isDirty={file.isDirty}
                  onClick={() => setSelectedFileId(file.id)}
                  whileHover={{ x: 4 }}
                >
                  <FileText />
                  <span className="file-name">{file.path}</span>
                  <div className="file-status">
                    {file.isDirty && <div className="dot" />}
                    {file.isNew && (
                      <span style={{ fontSize: '11px', color: vibeTheme.colors.success }}>NEW</span>
                    )}
                  </div>
                </FileItem>
              ))}
            </FileList>

            <EditorSection>
              {selectedFile ? (
                <>
                  <EditorHeader>
                    <span className="file-path">{selectedFile.path}</span>
                    <ActionButton onClick={() => handleRemoveFile(selectedFile.id)}>
                      <X size={16} />
                    </ActionButton>
                  </EditorHeader>
                  <EditorContainer>
                    <EditorToolbar>
                      <div className="editor-info">
                        <span>{selectedFile.language.toUpperCase()}</span>
                        <span>•</span>
                        <span>{selectedFile.content.split('\n').length} lines</span>
                        <span>•</span>
                        <span>{selectedFile.content.length} chars</span>
                        {selectedFile.isDirty && (
                          <>
                            <span>•</span>
                            <span style={{ color: vibeTheme.colors.warning }}>Modified</span>
                          </>
                        )}
                      </div>
                      <div className="editor-actions">
                        <ActionButton onClick={() => {
                          const updatedFiles = files.map(f => 
                            f.id === selectedFile.id 
                              ? { ...f, content: f.originalContent, isDirty: false }
                              : f
                          );
                          setFiles(updatedFiles);
                        }}>
                          Reset
                        </ActionButton>
                      </div>
                    </EditorToolbar>
                    <div style={{ flex: 1 }}>
                      <MonacoEditor
                        language={selectedFile.language}
                        value={selectedFile.content}
                        onChange={(value) => {
                          const updatedFiles = files.map(f => 
                            f.id === selectedFile.id 
                              ? { ...f, content: value || '', isDirty: value !== f.originalContent }
                              : f
                          );
                          setFiles(updatedFiles);
                        }}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          wordWrap: 'on',
                          automaticLayout: true,
                          folding: true,
                          renderWhitespace: 'selection',
                          bracketPairColorization: { enabled: true },
                          tabSize: 2,
                          insertSpaces: true,
                        }}
                      />
                    </div>
                  </EditorContainer>
                </>
              ) : (
                <div style={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: vibeTheme.colors.textSecondary
                }}>
                  Select a file or add a new one to begin editing
                </div>
              )}
            </EditorSection>
          </ComposerBody>

          <PromptSection>
            <ContextTags>
              {workspaceContext?.gitBranch && (
                <ContextTag whileHover={{ scale: 1.05 }}>
                  <GitBranch />
                  {workspaceContext.gitBranch}
                </ContextTag>
              )}
              <ContextTag whileHover={{ scale: 1.05 }}>
                <Code />
                {files.length} files
              </ContextTag>
              <ContextTag whileHover={{ scale: 1.05 }}>
                <Clock />
                Real-time editing
              </ContextTag>
            </ContextTags>
            <PromptInput>
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={files.length === 0 
                  ? "Add files first, then describe what you want to build or change across multiple files..."
                  : "Describe the changes you want to make across multiple files...\n\nExamples:\n• Add TypeScript types to all files\n• Refactor components to use hooks\n• Add error handling to API calls\n• Create tests for all functions"
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleSendPrompt();
                  }
                }}
                style={{ minHeight: '80px' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <ActionButton
                  $primary
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendPrompt}
                  disabled={!prompt.trim() || isProcessing || files.length === 0}
                >
                  {isProcessing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles size={16} />
                    </motion.div>
                  ) : (
                    <Send size={16} />
                  )}
                </ActionButton>
                <div style={{ fontSize: '11px', color: vibeTheme.colors.textMuted, textAlign: 'center' }}>
                  Ctrl+Enter
                </div>
              </div>
            </PromptInput>
          </PromptSection>

          <StatusBar>
            <div className="status-item">
              <Zap />
              Ready
            </div>
            <div className="status-item">
              <FileSearch />
              Context aware
            </div>
            <div className="status-item">
              <Sparkles />
              AI powered
            </div>
          </StatusBar>
          </ComposerContainer>
        </ComposerBackdrop>
      )}
    </AnimatePresence>
  );
};

export default ComposerMode;