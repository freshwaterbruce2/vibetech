export interface EditorFile {
  path: string;
  content: string;
  language: string;
  isModified: boolean;
  lastModified: Date;
}

export interface EditorState {
  activeFile: EditorFile | null;
  openFiles: EditorFile[];
  cursorPosition: CursorPosition;
  selections: Selection[];
}

export interface CursorPosition {
  line: number;
  column: number;
}

export interface Selection {
  start: CursorPosition;
  end: CursorPosition;
}

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  theme: 'light' | 'dark';
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
}

export interface FindReplaceOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
}

export interface EditorModule {
  state: EditorState;
  settings: EditorSettings;
  actions: EditorActions;
}

export interface EditorActions {
  openFile: (file: EditorFile) => void;
  closeFile: (path: string) => void;
  saveFile: (path: string) => Promise<void>;
  updateFileContent: (path: string, content: string) => void;
  setCursorPosition: (position: CursorPosition) => void;
  setSelection: (selection: Selection) => void;
  find: (query: string, options: FindReplaceOptions) => void;
  replace: (query: string, replacement: string, options: FindReplaceOptions) => void;
}
