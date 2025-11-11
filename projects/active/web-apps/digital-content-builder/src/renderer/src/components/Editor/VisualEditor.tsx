import { sanitizeHtml } from '../../utils/htmlSanitizer';
import React from 'react';

export function VisualEditor(): JSX.Element {
  const [code, setCode] = React.useState<string>(`<!doctype html>
<html><head><meta charset="UTF-8"><title>Live Preview</title></head>
<body style="font-family:Inter,system-ui,Arial,sans-serif;padding:24px">
  <h1>Live Preview</h1>
  <p>Edit the HTML in the editor to the left (Monaco will load if available).</p>
</body></html>`);
  const editorRef = React.useRef<HTMLDivElement | null>(null);
  const monacoRef = React.useRef<any>(null);
  const monacoEditorRef = React.useRef<any>(null);
  const projectIdRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const monaco = await import('monaco-editor');
        if (disposed) return;
        monacoRef.current = monaco;
        if (editorRef.current) {
          monacoEditorRef.current = monaco.editor.create(editorRef.current, {
            value: code,
            language: 'html',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false }
          });
          monacoEditorRef.current.onDidChangeModelContent(() => {
            const val = monacoEditorRef.current.getValue();
            setCode(val);
          });
        }
      } catch {
        // Monaco not installed yet; fallback to textarea
      }
    })();
    return () => {
      disposed = true;
      try { monacoEditorRef.current?.dispose?.(); } catch {}
    };
  }, []);

  // Auto-save every 10s
  React.useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // @ts-ignore
        const res = await window.electronAPI.saveProject({
          id: projectIdRef.current,
          name: 'Editor Scratch',
          type: 'landing',
          content: code
        });
        projectIdRef.current = res?.id ?? projectIdRef.current;
      } catch {
        // ignore
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [code]);

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Visual Editor</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ minHeight: 420, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 12 }}>
          <div ref={editorRef} style={{ width: '100%', height: 420 }} />
          {!monacoRef.current && (
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={18}
              style={{ width: '100%', height: 420, boxSizing: 'border-box', padding: 12, border: 'none' }}
            />
          )}
        </div>
        <iframe
          sandbox="allow-same-origin"
          style={{ width: '100%', height: 420, borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)' }}
          srcDoc={sanitizeHtml(code)}
          title="live-preview"
        />
      </div>
      {/* Lightweight export shortcuts */}
      <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
        <button
          onClick={async () => {
            // @ts-ignore
            await window.electronAPI.exportHtml({ content: code, name: 'editor-export' });
          }}
        >
          Export HTML
        </button>
        <button
          onClick={async () => {
            // @ts-ignore
            await window.electronAPI.exportJson({ data: { html: code }, name: 'editor-export' });
          }}
        >
          Export JSON
        </button>
        <button
          onClick={async () => {
            // @ts-ignore
            await window.electronAPI.exportPdf({ html: code, name: 'editor-export' });
          }}
        >
          Export PDF
        </button>
      </div>
    </div>
  );
}
