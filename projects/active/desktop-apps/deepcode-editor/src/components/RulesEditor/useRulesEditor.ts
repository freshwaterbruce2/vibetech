/**
 * useRulesEditor Hook
 * State and logic for the Rules Editor component
 */
import { useCallback, useEffect, useState } from 'react';

import * as monaco from 'monaco-editor';

import { FileSystemService } from '../../services/FileSystemService';
import { logger } from '../../services/Logger';
import { type ParsedRules, type Rule, RulesParser } from '../../services/RulesParser';
import type { EditorMode, RulesFilename } from './types';

interface UseRulesEditorOptions {
  workspaceRoot: string;
  onSave?: (content: string, filename: string) => Promise<void>;
}

const DEFAULT_CONTENT = `---
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

export function useRulesEditor(options: UseRulesEditorOptions) {
  const { workspaceRoot, onSave } = options;

  const [content, setContent] = useState<string>('');
  const [filename, setFilename] = useState<RulesFilename>('.deepcoderules');
  const [parsedRules, setParsedRules] = useState<ParsedRules | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [testFilePath, setTestFilePath] = useState<string>('');
  const [matchingRules, setMatchingRules] = useState<Rule[]>([]);
  const [editorInstance, setEditorInstance] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [mode, setMode] = useState<EditorMode>('edit');

  const parser = new RulesParser();
  const fileSystem = new FileSystemService();

  const parseRules = useCallback((ruleContent: string) => {
    try {
      const parsed = parser.parse(ruleContent, filename);
      setParsedRules(parsed);
      setParseError(null);
    } catch (error) {
      setParseError((error as Error).message);
      setParsedRules(null);
    }
  }, [filename, parser]);

  const loadRulesFile = useCallback(async () => {
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
    } catch {
      // File doesn't exist yet - that's OK for new rules
      logger.debug('No existing rules file, starting fresh');
      setContent(DEFAULT_CONTENT);
      parseRules(DEFAULT_CONTENT);
    }
  }, [workspaceRoot, filename, editorInstance, parser, fileSystem, parseRules]);

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
  }, [testFilePath, parsedRules, parser]);

  const handleTemplateSelect = useCallback((templateName: string) => {
    setSelectedTemplate(templateName);
    const template = parser.getTemplate(templateName);
    setContent(template);

    if (editorInstance) {
      editorInstance.setValue(template);
    }
  }, [editorInstance, parser]);

  const handleSave = useCallback(async () => {
    if (!onSave) return;

    try {
      await onSave(content, filename);
      alert(`Saved ${filename} successfully!`);
    } catch (error) {
      alert(`Failed to save: ${(error as Error).message}`);
    }
  }, [content, filename, onSave]);

  const templates = parser.getTemplates();

  return {
    // State
    content,
    setContent,
    filename,
    setFilename,
    parsedRules,
    parseError,
    selectedTemplate,
    testFilePath,
    setTestFilePath,
    matchingRules,
    editorInstance,
    mode,
    setMode,

    // Data
    templates,

    // Actions
    handleTemplateSelect,
    handleSave,
    loadRulesFile,
  };
}
