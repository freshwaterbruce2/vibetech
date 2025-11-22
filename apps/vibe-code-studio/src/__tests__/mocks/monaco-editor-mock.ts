import { vi } from 'vitest';

export const editor = {
  create: vi.fn(),
  createModel: vi.fn(),
  setTheme: vi.fn(),
  setModelLanguage: vi.fn(),
  defineTheme: vi.fn(),
  remeasureFonts: vi.fn(),
  onDidCreateModel: vi.fn(),
  onDidChangeModelLanguage: vi.fn(),
  OverviewRulerLane: {
    Left: 1,
    Center: 2,
    Right: 4,
    Full: 7,
  },
};

export const languages = {
  register: vi.fn(),
  registerCompletionItemProvider: vi.fn(() => ({ dispose: vi.fn() })),
  setMonarchTokensProvider: vi.fn(),
  setLanguageConfiguration: vi.fn(),
  CompletionItemKind: {
    Text: 0,
    Method: 1,
    Function: 2,
    Constructor: 3,
    Field: 4,
    Variable: 5,
    Class: 6,
    Struct: 7,
    Interface: 8,
    Module: 9,
    Property: 10,
    Event: 11,
    Operator: 12,
    Unit: 13,
    Value: 14,
    Constant: 15,
    Enum: 16,
    EnumMember: 17,
    Keyword: 18,
    Color: 20,
    File: 21,
    Reference: 22,
    Customcolor: 23,
    Folder: 24,
    TypeParameter: 25,
    User: 26,
    Issue: 27,
    Snippet: 28,
  },
  CompletionItemInsertTextRule: {
    KeepWhitespace: 1,
    InsertAsSnippet: 4,
  },
};

export const Range = vi.fn().mockImplementation((startLine, startCol, endLine, endCol) => ({
  startLineNumber: startLine,
  startColumn: startCol,
  endLineNumber: endLine,
  endColumn: endCol,
}));

export const Selection = vi.fn();

export const KeyMod = {
  CtrlCmd: 2048,
  Shift: 1024,
  Alt: 512,
  WinCtrl: 256,
};

export const KeyCode = {
  KeyK: 41,
  KeyS: 49,
  KeyF: 36,
  KeyH: 38,
  KeyD: 34,
};

export default {
  editor,
  languages,
  Range,
  Selection,
  KeyMod,
  KeyCode,
};
