/**
 * Monaco Editor Mock for Tests
 * Provides minimal mock implementation to prevent resolution errors
 */

export const editor = {
  create: () => ({
    updateOptions: () => {},
    dispose: () => {},
    getModel: () => null,
    getValue: () => '',
    setValue: () => {},
    getPosition: () => ({ lineNumber: 1, column: 1 }),
    setPosition: () => {},
    getSelection: () => null,
    setSelection: () => {},
    focus: () => {},
    onDidChangeCursorPosition: () => ({ dispose: () => {} }),
    onDidChangeModelContent: () => ({ dispose: () => {} }),
    deltaDecorations: () => [],
    revealRangeInCenter: () => {},
    executeEdits: () => true,
    getAction: () => ({ run: () => {} }),
    addCommand: () => ({ dispose: () => {} }),
  }),
  createModel: () => ({}),
  setTheme: () => {},
  setModelLanguage: () => {},
  defineTheme: () => {},
  remeasureFonts: () => {},
  onDidCreateModel: () => {},
  onDidChangeModelLanguage: () => {},
  OverviewRulerLane: {
    Left: 1,
    Center: 2,
    Right: 4,
    Full: 7,
  },
};

export const languages = {
  register: () => {},
  registerCompletionItemProvider: () => ({ dispose: () => {} }),
  setMonarchTokensProvider: () => {},
  setLanguageConfiguration: () => {},
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

export class Range {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;

  constructor(startLine: number, startCol: number, endLine: number, endCol: number) {
    this.startLineNumber = startLine;
    this.startColumn = startCol;
    this.endLineNumber = endLine;
    this.endColumn = endCol;
  }
}

export class Selection {}

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
