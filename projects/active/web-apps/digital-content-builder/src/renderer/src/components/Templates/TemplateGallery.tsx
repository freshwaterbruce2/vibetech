import { sanitizeHtml } from '../../utils/htmlSanitizer';
import React from 'react';
import { getTemplateContent, listTemplates, TemplateMeta } from '../../services/templateService';

export function TemplateGallery(): JSX.Element {
  const [category, setCategory] = React.useState<'landing' | 'blog'>('landing');
  const templates = listTemplates(category);
  const [selected, setSelected] = React.useState<TemplateMeta | null>(templates[0] ?? null);
  const content = selected ? getTemplateContent(selected) : '';

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 600 }}>Templates</div>
        <select value={category} onChange={(e) => setCategory(e.target.value as any)}>
          <option value="landing">Landing Pages</option>
          <option value="blog">Blogs</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ minWidth: 260 }}>
          {templates.map(t => (
            <div
              key={t.id}
              onClick={() => setSelected(t)}
              style={{
                padding: 12,
                borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.08)',
                background: selected?.id === t.id ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.65)',
                cursor: 'pointer',
                marginBottom: 8
              }}
            >
              {t.name}
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <iframe
            sandbox="allow-same-origin"
            style={{ width: '100%', height: 480, borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)' }}
            srcDoc={sanitizeHtml(content)}
            title="template-preview"
          />
        </div>
      </div>
    </div>
  );
}
