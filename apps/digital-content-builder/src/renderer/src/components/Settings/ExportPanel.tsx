import React from 'react';

export function ExportPanel(props: { htmlSource?: string }): JSX.Element {
  const html = props.htmlSource ?? '<!-- no content provided -->';
  const [result, setResult] = React.useState<string>('');

  const exportHtml = async () => {
    // @ts-ignore
    const res = await window.electronAPI.exportHtml({ content: html, name: 'content' });
    setResult(res?.filePath ?? '');
  };
  const exportMarkdown = async () => {
    // very naive conversion
    const md = '```\n' + html + '\n```';
    // @ts-ignore
    const res = await window.electronAPI.exportMarkdown({ content: md, name: 'content' });
    setResult(res?.filePath ?? '');
  };
  const exportJson = async () => {
    // @ts-ignore
    const res = await window.electronAPI.exportJson({ data: { html }, name: 'content' });
    setResult(res?.filePath ?? '');
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Export</div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={exportHtml}>Export HTML</button>
        <button onClick={exportMarkdown}>Export Markdown</button>
        <button onClick={exportJson}>Export JSON</button>
      </div>
      {result && <div style={{ marginTop: 8, color: '#047857' }}>Saved: {result}</div>}
    </div>
  );
}
