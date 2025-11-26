import { sanitizeHtml } from '../../utils/htmlSanitizer';
import React from 'react';

interface Props {
  initialType?: string;
}

export function SimpleGenerator(props: Props): JSX.Element {
  const [type, setType] = React.useState<string>(props.initialType ?? 'landing');
  const [prompt, setPrompt] = React.useState<string>('');
  const [tone, setTone] = React.useState<string>('professional');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [content, setContent] = React.useState<string>('');

  const onGenerate = async () => {
    setLoading(true);
    setError(null);
    setContent('');
    try {
      // @ts-ignore - exposed by preload
      const res = await window.electronAPI.generateContent({ prompt, type, tone });
      if (res?.error) {
        setError(res.error);
      } else {
        setContent(res?.content ?? '');
      }
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="landing">Landing</option>
          <option value="blog">Blog</option>
          <option value="social">Social</option>
          <option value="email">Email</option>
          <option value="course">Course</option>
          <option value="ebook">Ebook</option>
          <option value="code">Code</option>
          <option value="article">Article</option>
          <option value="general">General</option>
        </select>
        <select value={tone} onChange={(e) => setTone(e.target.value)}>
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="technical">Technical</option>
          <option value="creative">Creative</option>
        </select>
      </div>
      <textarea
        placeholder="Describe what you want to generate..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        style={{
          marginTop: 12,
          width: '100%',
          padding: 12,
          borderRadius: 10,
          border: '1px solid rgba(0,0,0,0.12)'
        }}
      />
      <div style={{ marginTop: 12 }}>
        <button
          onClick={onGenerate}
          disabled={loading || !prompt.trim()}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid rgba(0,0,0,0.08)',
            background:
              'linear-gradient(90deg, rgba(139,92,246,0.18), rgba(6,182,212,0.18))',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Generating…' : 'Generate'}
        </button>
      </div>
      {error && (
        <div style={{ marginTop: 12, color: '#b91c1c' }}>
          Error: {error}
        </div>
      )}
      {content && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Preview</div>
          <iframe
            sandbox="allow-same-origin"
            style={{ width: '100%', height: 480, borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)' }}
            srcDoc={sanitizeHtml(content)}
            title="preview"
          />
        </div>
      )}
    </div>
  );
}
