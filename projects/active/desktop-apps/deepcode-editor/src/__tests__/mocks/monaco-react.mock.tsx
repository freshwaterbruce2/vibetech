/**
 * @monaco-editor/react Mock for Tests
 * Provides a simple div replacement for Monaco Editor React component
 */
import React from 'react';

export interface EditorProps {
  value?: string;
  language?: string;
  theme?: string;
  onChange?: (value: string | undefined) => void;
  onMount?: (editor: any, monaco: any) => void;
  beforeMount?: (monaco: any) => void;
  options?: any;
  [key: string]: any;
}

const Editor: React.FC<EditorProps> = ({ value, onChange, ...props }) => {
  return (
    <div data-testid="monaco-editor" data-value={value} {...props}>
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        data-testid="monaco-editor-textarea"
      />
    </div>
  );
};

export default Editor;
export { Editor };
