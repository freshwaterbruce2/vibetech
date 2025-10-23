/**
 * RulesEditor Component
 *
 * Visual editor for .deepcoderules and .cursorrules files
 * - YAML editing with Monaco editor
 * - Template library browser
 * - Live preview of rules
 * - File targeting visualization
 */
import { logger } from '../services/Logger';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import * as monaco from 'monaco-editor';
import { RulesParser, type ParsedRules, type Rule } from '../services/RulesParser';
import { FileSystemService } from '../services/FileSystemService';

interface RulesEditorProps {
  workspaceRoot: string;
  onSave?: (content: string, filename: string) => Promise<void>;
  onClose?: () => void;
}

export const RulesEditor: React.FC<RulesEditorProps> = ({
  workspaceRoot,
  onSave,
  onClose,
}) => {
  const [content, setContent] = useState<string>('');
  const [filename, setFilename] = useState<string>('.deepcoderules');
  const [parsedRules, setParsedRules] = useState<ParsedRules | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [testFilePath, setTestFilePath] = useState<string>('');
  const [matchingRules, setMatchingRules] = useState<Rule[]>([]);
  const [editorInstance, setEditorInstance] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [mode, setMode] = useState<'edit' | 'preview' | 'test'>('edit');

  const parser = new RulesParser();
  const fileSystem = new FileSystemService();

  // Initialize Monaco editor
  useEffect(() => {
    const editorElement = document.getElementById('rules-monaco-editor');
    if (!editorElement || editorInstance) return;

    const editor = monaco.editor.create(editorElement, {
      value: content,
      language: filename.endsWith('.cursorrules') ? 'plaintext' : 'yaml',
      theme: 'vs-dark',
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      renderWhitespace: 'boundary',
      scrollBeyondLastLine: false,
      automaticLayout: true,
    });

    editor.onDidChangeModelContent(() => {
      const newContent = editor.getValue();
      setContent(newContent);
      parseRules(newContent);
    });

    setEditorInstance(editor);

    return () => {
      editor.dispose();
    };
  }, [filename]);

  // Update editor language when filename changes
  useEffect(() => {
    if (editorInstance) {
      const model = editorInstance.getModel();
      if (model) {
        monaco.editor.setModelLanguage(
          model,
          filename.endsWith('.cursorrules') ? 'plaintext' : 'yaml'
        );
      }
    }
  }, [filename, editorInstance]);

  // Load existing rules file
  useEffect(() => {
    loadRulesFile();
  }, [workspaceRoot, filename]);

  // Test file path matching
  useEffect(() => {
    if (testFilePath && parsedRules) {
      const matching = parser.mergeRulesForFile(parsedRules.rules, testFilePath);
      setMatchingRules(matching);
    } else {
      setMatchingRules([]);
    }
  }, [testFilePath, parsedRules]);

  const loadRulesFile = async () => {
    try {
      const filePath = `${workspaceRoot}/${filename}`;
      parser.setFileReader(async (path) => {
        return await fileSystem.readFile(path);
      });

      const loaded = await parser.loadFromFile(filePath);
      const loadedContent = editorInstance?.getValue() || '';

      setContent(loadedContent);
      setParsedRules(loaded);
      setParseError(null);
    } catch (error) {
      // File doesn't exist yet - that's OK for new rules
      logger.debug('No existing rules file, starting fresh');
      setContent(getDefaultContent());
      parseRules(getDefaultContent());
    }
  };

  const parseRules = (ruleContent: string) => {
    try {
      const parsed = parser.parse(ruleContent, filename);
      setParsedRules(parsed);
      setParseError(null);
    } catch (error) {
      setParseError((error as Error).message);
      setParsedRules(null);
    }
  };

  const getDefaultContent = (): string => {
    return `---
description: Project coding standards
globs: ["**/*.ts", "**/*.tsx"]
alwaysApply: false
priority: high
tags: ["typescript", "coding-standards"]
---

You are an expert developer working on this project.

**Coding Standards:**
- Use TypeScript strict mode
- Write comprehensive tests
- Follow functional programming principles
- Keep functions small and focused

**Documentation:**
- Add JSDoc comments for public APIs
- Include usage examples
- Document edge cases`;
  };

  const handleTemplateSelect = (templateName: string) => {
    setSelectedTemplate(templateName);
    const template = parser.getTemplate(templateName);
    setContent(template);

    if (editorInstance) {
      editorInstance.setValue(template);
    }
  };

  const handleSave = async () => {
    if (!onSave) return;

    try {
      await onSave(content, filename);
      alert(`Saved ${filename} successfully!`);
    } catch (error) {
      alert(`Failed to save: ${(error as Error).message}`);
    }
  };

  const templates = parser.getTemplates();

  return (
    <Container>
      <Header>
        <Title>Custom Instructions Editor</Title>
        <Controls>
          <ModeSelector>
            <ModeButton active={mode === 'edit'} onClick={() => setMode('edit')}>
              ✏️ Edit
            </ModeButton>
            <ModeButton active={mode === 'preview'} onClick={() => setMode('preview')}>
              👁️ Preview
            </ModeButton>
            <ModeButton active={mode === 'test'} onClick={() => setMode('test')}>
              🧪 Test
            </ModeButton>
          </ModeSelector>

          <FilenameSelector
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
          >
            <option value=".deepcoderules">.deepcoderules (Modern YAML)</option>
            <option value=".cursorrules">.cursorrules (Legacy)</option>
          </FilenameSelector>

          <ActionButton onClick={handleSave}>💾 Save</ActionButton>
          {onClose && (
            <ActionButton onClick={onClose} variant="secondary">
              ✕ Close
            </ActionButton>
          )}
        </Controls>
      </Header>

      <ContentArea>
        {mode === 'edit' && (
          <>
            <Sidebar>
              <SidebarSection>
                <SidebarTitle>📚 Templates</SidebarTitle>
                {Object.keys(templates).map((name) => (
                  <TemplateButton
                    key={name}
                    onClick={() => handleTemplateSelect(name)}
                    active={selectedTemplate === name}
                  >
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </TemplateButton>
                ))}
              </SidebarSection>

              <SidebarSection>
                <SidebarTitle>ℹ️ Quick Reference</SidebarTitle>
                <ReferenceText>
                  <strong>Frontmatter Fields:</strong>
                  <ul>
                    <li><code>description</code>: Rule description</li>
                    <li><code>globs</code>: File patterns (array)</li>
                    <li><code>alwaysApply</code>: Apply to all files</li>
                    <li><code>priority</code>: low | normal | high</li>
                    <li><code>tags</code>: Categories (array)</li>
                  </ul>

                  <strong>Glob Examples:</strong>
                  <ul>
                    <li><code>**/*.ts</code>: All TypeScript files</li>
                    <li><code>src/**/*.tsx</code>: React in src/</li>
                    <li><code>!**/*.test.ts</code>: Exclude tests</li>
                  </ul>
                </ReferenceText>
              </SidebarSection>
            </Sidebar>

            <EditorArea>
              <EditorWrapper id="rules-monaco-editor" />

              {parseError && (
                <ErrorBanner>
                  <strong>❌ Parse Error:</strong> {parseError}
                </ErrorBanner>
              )}

              {parsedRules && !parseError && (
                <StatusBanner>
                  <strong>✅ Valid:</strong> {parsedRules.rules.length} rule(s) defined
                </StatusBanner>
              )}
            </EditorArea>
          </>
        )}

        {mode === 'preview' && parsedRules && (
          <PreviewArea>
            <PreviewTitle>Rule Preview ({parsedRules.type} format)</PreviewTitle>
            {parsedRules.rules.map((rule, index) => (
              <RuleCard key={index}>
                <RuleHeader>
                  <RuleName>
                    {rule.description || `Rule ${index + 1}`}
                  </RuleName>
                  <RulePriority priority={rule.priority || 'normal'}>
                    {rule.priority || 'normal'}
                  </RulePriority>
                </RuleHeader>

                {rule.tags && (
                  <Tags>
                    {rule.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </Tags>
                )}

                <RuleScope>
                  {rule.alwaysApply ? (
                    <ScopeLabel>🌐 Applies to all files</ScopeLabel>
                  ) : rule.globs ? (
                    <div>
                      <ScopeLabel>📁 Applies to:</ScopeLabel>
                      <GlobList>
                        {rule.globs.map((glob) => (
                          <GlobItem key={glob} isNegative={glob.startsWith('!')}>
                            {glob}
                          </GlobItem>
                        ))}
                      </GlobList>
                    </div>
                  ) : (
                    <ScopeLabel>🌍 Global rule</ScopeLabel>
                  )}
                </RuleScope>

                <RuleContent>{rule.content}</RuleContent>
              </RuleCard>
            ))}
          </PreviewArea>
        )}

        {mode === 'test' && (
          <TestArea>
            <TestTitle>Test File Matching</TestTitle>
            <TestInput>
              <label>Enter file path to test:</label>
              <input
                type="text"
                value={testFilePath}
                onChange={(e) => setTestFilePath(e.target.value)}
                placeholder="e.g., src/components/Button.tsx"
              />
            </TestInput>

            {testFilePath && (
              <TestResults>
                <ResultsTitle>
                  Matching Rules: {matchingRules.length}
                </ResultsTitle>
                {matchingRules.length === 0 ? (
                  <NoMatch>No rules match this file path</NoMatch>
                ) : (
                  matchingRules.map((rule, index) => (
                    <MatchCard key={index}>
                      <MatchHeader>
                        {rule.description || `Rule ${index + 1}`}
                      </MatchHeader>
                      <MatchContent>{rule.content.substring(0, 200)}...</MatchContent>
                    </MatchCard>
                  ))
                )}
              </TestResults>
            )}
          </TestArea>
        )}
      </ContentArea>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary, #1e1e1e);
  color: var(--text-primary, #d4d4d4);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: var(--bg-secondary, #252525);
  border-bottom: 1px solid var(--border-color, #3e3e3e);
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const ModeSelector = styled.div`
  display: flex;
  gap: 4px;
  background: var(--bg-tertiary, #2d2d30);
  border-radius: 6px;
  padding: 4px;
`;

const ModeButton = styled.button<{ active?: boolean }>`
  padding: 6px 12px;
  border: none;
  background: ${(props) => (props.active ? 'var(--accent-color, #007acc)' : 'transparent')};
  color: ${(props) => (props.active ? '#fff' : 'var(--text-secondary, #9d9d9d)')};
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    background: ${(props) =>
      props.active ? 'var(--accent-color-hover, #005a9e)' : 'var(--bg-hover, #3a3a3a)'};
  }
`;

const FilenameSelector = styled.select`
  padding: 6px 12px;
  background: var(--bg-tertiary, #2d2d30);
  color: var(--text-primary, #d4d4d4);
  border: 1px solid var(--border-color, #3e3e3e);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 6px 16px;
  border: none;
  background: ${(props) =>
    props.variant === 'secondary' ? 'transparent' : 'var(--accent-color, #007acc)'};
  color: ${(props) => (props.variant === 'secondary' ? 'var(--text-secondary)' : '#fff')};
  border: ${(props) =>
    props.variant === 'secondary' ? '1px solid var(--border-color)' : 'none'};
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const ContentArea = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const Sidebar = styled.aside`
  width: 250px;
  background: var(--bg-secondary, #252525);
  border-right: 1px solid var(--border-color, #3e3e3e);
  overflow-y: auto;
  padding: 16px;
`;

const SidebarSection = styled.div`
  margin-bottom: 24px;
`;

const SidebarTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, #9d9d9d);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TemplateButton = styled.button<{ active?: boolean }>`
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 6px;
  border: none;
  background: ${(props) => (props.active ? 'var(--accent-color, #007acc)' : 'transparent')};
  color: ${(props) => (props.active ? '#fff' : 'var(--text-primary, #d4d4d4)')};
  text-align: left;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    background: ${(props) =>
      props.active ? 'var(--accent-color-hover, #005a9e)' : 'var(--bg-hover, #3a3a3a)'};
  }
`;

const ReferenceText = styled.div`
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary, #9d9d9d);

  strong {
    display: block;
    margin-top: 12px;
    margin-bottom: 6px;
    color: var(--text-primary, #d4d4d4);
  }

  ul {
    margin: 0;
    padding-left: 16px;
  }

  li {
    margin-bottom: 4px;
  }

  code {
    background: var(--bg-tertiary, #2d2d30);
    padding: 2px 4px;
    border-radius: 2px;
    font-family: 'Consolas', 'Monaco', monospace;
  }
`;

const EditorArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const EditorWrapper = styled.div`
  flex: 1;
  min-height: 0;
`;

const ErrorBanner = styled.div`
  padding: 12px;
  background: #5a1e1e;
  border-top: 2px solid #f44747;
  color: #f48771;
  font-size: 13px;
`;

const StatusBanner = styled.div`
  padding: 12px;
  background: #1e3a1e;
  border-top: 2px solid #4ec9b0;
  color: #89d185;
  font-size: 13px;
`;

const PreviewArea = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const PreviewTitle = styled.h3`
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
`;

const RuleCard = styled.div`
  background: var(--bg-secondary, #252525);
  border: 1px solid var(--border-color, #3e3e3e);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const RuleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const RuleName = styled.h4`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
`;

const RulePriority = styled.span<{ priority: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${(props) =>
    props.priority === 'high'
      ? '#5a1e1e'
      : props.priority === 'low'
        ? '#1e3a1e'
        : '#2d2d30'};
  color: ${(props) =>
    props.priority === 'high'
      ? '#f48771'
      : props.priority === 'low'
        ? '#89d185'
        : '#9d9d9d'};
`;

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
`;

const Tag = styled.span`
  padding: 3px 8px;
  background: var(--bg-tertiary, #2d2d30);
  border-radius: 3px;
  font-size: 11px;
  color: var(--text-secondary, #9d9d9d);
`;

const RuleScope = styled.div`
  margin-bottom: 12px;
`;

const ScopeLabel = styled.div`
  font-size: 12px;
  color: var(--text-secondary, #9d9d9d);
  margin-bottom: 6px;
`;

const GlobList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const GlobItem = styled.code<{ isNegative?: boolean }>`
  padding: 4px 8px;
  background: var(--bg-tertiary, #2d2d30);
  border-radius: 3px;
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', monospace;
  color: ${(props) => (props.isNegative ? '#f48771' : '#4ec9b0')};
`;

const RuleContent = styled.pre`
  margin: 0;
  padding: 12px;
  background: var(--bg-tertiary, #2d2d30);
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  font-family: 'Consolas', 'Monaco', monospace;
  color: var(--text-primary, #d4d4d4);
`;

const TestArea = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
`;

const TestTitle = styled.h3`
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
`;

const TestInput = styled.div`
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--text-secondary, #9d9d9d);
  }

  input {
    width: 100%;
    padding: 10px 12px;
    background: var(--bg-secondary, #252525);
    border: 1px solid var(--border-color, #3e3e3e);
    border-radius: 4px;
    color: var(--text-primary, #d4d4d4);
    font-size: 14px;
    font-family: 'Consolas', 'Monaco', monospace;

    &:focus {
      outline: none;
      border-color: var(--accent-color, #007acc);
    }
  }
`;

const TestResults = styled.div`
  margin-top: 20px;
`;

const ResultsTitle = styled.h4`
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary, #9d9d9d);
`;

const NoMatch = styled.div`
  padding: 20px;
  text-align: center;
  color: var(--text-secondary, #9d9d9d);
  font-size: 14px;
`;

const MatchCard = styled.div`
  background: var(--bg-secondary, #252525);
  border-left: 3px solid var(--accent-color, #007acc);
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
`;

const MatchHeader = styled.div`
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--accent-color, #007acc);
`;

const MatchContent = styled.div`
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary, #9d9d9d);
  white-space: pre-wrap;
`;
