/**
 * RulesEditor Component
 * Visual editor for .deepcoderules files with Monaco, templates, preview, and testing
 */
import React from 'react';

import { motion } from 'framer-motion';

import type { RulesEditorProps } from './types';
import {
  Container,
  EditorArea,
  GlobList,
  Header,
  MatchCard,
  ModeSelector,
  PreviewArea,
  PreviewContent,
  RuleCard,
  RuleDescription,
  RulePriority,
  Sidebar,
  Tags,
  TemplateItem,
  TemplateList,
  TestArea,
  TestInput,
} from './styled';
import { useRulesEditor } from './useRulesEditor';

export const RulesEditor: React.FC<RulesEditorProps> = ({ workspaceRoot, onSave }) => {
  const {
    filename,
    setFilename,
    parsedRules,
    parseError,
    selectedTemplate,
    testFilePath,
    setTestFilePath,
    matchingRules,
    mode,
    setMode,
    templates,
    handleTemplateSelect,
    handleSave,
  } = useRulesEditor({ workspaceRoot, onSave });

  const renderPreview = () => {
    if (parseError) {
      return (
        <PreviewContent>
          <h4 style={{ color: '#f44336' }}>Parse Error</h4>
          <pre>{parseError}</pre>
        </PreviewContent>
      );
    }

    if (!parsedRules) {
      return <PreviewContent>Edit your rules to see a preview</PreviewContent>;
    }

    return (
      <PreviewContent>
        <h4>Rules Preview</h4>
        {parsedRules.rules.map((rule, index) => (
          <RuleCard key={index}>
            <RuleDescription>{rule.description}</RuleDescription>
            <RulePriority priority={rule.priority || 'medium'}>
              {rule.priority || 'medium'}
            </RulePriority>
            {rule.tags && rule.tags.length > 0 && (
              <Tags>
                {rule.tags.map((tag, i) => (
                  <span key={i}>{tag}</span>
                ))}
              </Tags>
            )}
            {rule.globs && rule.globs.length > 0 && (
              <GlobList>
                <strong>Applies to:</strong>{' '}
                {rule.globs.join(', ')}
              </GlobList>
            )}
          </RuleCard>
        ))}
      </PreviewContent>
    );
  };

  const renderTestMode = () => (
    <TestArea>
      <h4>Test File Matching</h4>
      <TestInput
        type="text"
        placeholder="Enter file path to test (e.g., src/components/Button.tsx)"
        value={testFilePath}
        onChange={(e) => setTestFilePath(e.target.value)}
      />
      {matchingRules.length > 0 ? (
        <>
          <p>{matchingRules.length} rule(s) match this file:</p>
          {matchingRules.map((rule, index) => (
            <MatchCard key={index}>
              <RuleDescription>{rule.description}</RuleDescription>
              <RulePriority priority={rule.priority || 'medium'}>
                {rule.priority || 'medium'}
              </RulePriority>
            </MatchCard>
          ))}
        </>
      ) : testFilePath ? (
        <p>No rules match this file path</p>
      ) : null}
    </TestArea>
  );

  return (
    <Container
      as={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Header>
        <h2>Rules Editor</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={filename}
            onChange={(e) => setFilename(e.target.value as typeof filename)}
            style={{
              background: '#1e1e1e',
              color: '#fff',
              border: '1px solid #333',
              padding: '6px 10px',
              borderRadius: '4px',
            }}
          >
            <option value=".deepcoderules">.deepcoderules</option>
            <option value=".cursorrules">.cursorrules</option>
          </select>
          <ModeSelector>
            <button
              className={mode === 'edit' ? 'active' : ''}
              onClick={() => setMode('edit')}
            >
              Edit
            </button>
            <button
              className={mode === 'preview' ? 'active' : ''}
              onClick={() => setMode('preview')}
            >
              Preview
            </button>
            <button
              className={mode === 'test' ? 'active' : ''}
              onClick={() => setMode('test')}
            >
              Test
            </button>
          </ModeSelector>
          <button
            onClick={handleSave}
            style={{
              background: '#4caf50',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Save
          </button>
        </div>
      </Header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar>
          <h3>Templates</h3>
          <TemplateList>
            {templates.map((template) => (
              <TemplateItem
                key={template}
                className={selectedTemplate === template ? 'active' : ''}
                onClick={() => handleTemplateSelect(template)}
              >
                {template}
              </TemplateItem>
            ))}
          </TemplateList>
        </Sidebar>

        <EditorArea>
          <div id="rules-monaco-editor" style={{ width: '100%', height: '100%' }} />
        </EditorArea>

        <PreviewArea>
          {mode === 'preview' && renderPreview()}
          {mode === 'test' && renderTestMode()}
          {mode === 'edit' && (
            <PreviewContent>
              <p style={{ color: '#888' }}>
                Switch to Preview mode to see your rules, or Test mode to check file matching.
              </p>
            </PreviewContent>
          )}
        </PreviewArea>
      </div>
    </Container>
  );
};

// Export all types and hook
export * from './types';
export * from './styled';
export { useRulesEditor } from './useRulesEditor';
