// Mock Monaco Editor for testing
export const editor = {
  create: vi.fn(() => ({
    dispose: vi.fn(),
    getValue: vi.fn(() => ''),
    setValue: vi.fn(),
    getModel: vi.fn(() => ({
      uri: { toString: () => 'mock-uri' },
      getValue: vi.fn(() => ''),
      setValue: vi.fn(),
      onDidChangeContent: vi.fn(() => ({ dispose: vi.fn() })),
    })),
    onDidChangeModelContent: vi.fn(() => ({ dispose: vi.fn() })),
    updateOptions: vi.fn(),
    layout: vi.fn(),
    focus: vi.fn(),
    getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
    setPosition: vi.fn(),
    revealLine: vi.fn(),
    revealLineInCenter: vi.fn(),
    setScrollPosition: vi.fn(),
    getAction: vi.fn(() => ({
      run: vi.fn(),
    })),
  })),
  createModel: vi.fn(() => ({
    uri: { toString: () => 'mock-uri' },
    getValue: vi.fn(() => ''),
    setValue: vi.fn(),
    onDidChangeContent: vi.fn(() => ({ dispose: vi.fn() })),
  })),
  setModelLanguage: vi.fn(),
  setTheme: vi.fn(),
  defineTheme: vi.fn(),
  remeasureFonts: vi.fn(),
}

export const languages = {
  register: vi.fn(),
  setMonarchTokensProvider: vi.fn(),
  setLanguageConfiguration: vi.fn(),
  registerCompletionItemProvider: vi.fn(() => ({ dispose: vi.fn() })),
  registerCodeActionProvider: vi.fn(() => ({ dispose: vi.fn() })),
  registerHoverProvider: vi.fn(() => ({ dispose: vi.fn() })),
  registerSignatureHelpProvider: vi.fn(() => ({ dispose: vi.fn() })),
  CompletionItemKind: {
    Method: 0,
    Function: 1,
    Constructor: 2,
    Field: 3,
    Variable: 4,
    Class: 5,
    Struct: 6,
    Interface: 7,
    Module: 8,
    Property: 9,
    Event: 10,
    Operator: 11,
    Unit: 12,
    Value: 13,
    Constant: 14,
    Enum: 15,
    EnumMember: 16,
    Keyword: 17,
    Text: 18,
    Color: 19,
    File: 20,
    Reference: 21,
    Customcolor: 22,
    Folder: 23,
    TypeParameter: 24,
    Snippet: 25,
  },
}

export const Uri = {
  parse: vi.fn((uri: string) => ({
    toString: () => uri,
    scheme: 'file',
    path: uri,
  })),
  file: vi.fn((path: string) => ({
    toString: () => `file://${path}`,
    scheme: 'file',
    path,
  })),
}

export const Range = vi.fn((startLine, startCol, endLine, endCol) => ({
  startLineNumber: startLine,
  startColumn: startCol,
  endLineNumber: endLine,
  endColumn: endCol,
}))

export const Position = vi.fn((line, column) => ({
  lineNumber: line,
  column,
}))

export const MarkerSeverity = {
  Hint: 1,
  Info: 2,
  Warning: 4,
  Error: 8,
}

export const KeyMod = {
  CtrlCmd: 2048,
  Shift: 1024,
  Alt: 512,
  WinCtrl: 256,
}

export const KeyCode = {
  Enter: 3,
  Escape: 9,
  Space: 10,
  Tab: 2,
  Backspace: 1,
}

export default {
  editor,
  languages,
  Uri,
  Range,
  Position,
  MarkerSeverity,
  KeyMod,
  KeyCode,
}
