import React from 'react';

interface QuickType { key: string; label: string }
const TYPES: QuickType[] = [
  { key: 'landing', label: 'Landing' },
  { key: 'blog', label: 'Blog' },
  { key: 'social', label: 'Social' },
  { key: 'email', label: 'Email' },
  { key: 'more', label: 'More…' }
];

export function QuickCreate(props: { onSelect?: (type: string) => void }): JSX.Element {
  const { onSelect } = props;
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'linear-gradient(180deg, rgba(139,92,246,0.08), rgba(6,182,212,0.08))',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 12 }}>Quick Create</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {TYPES.map(t => (
          <button
            key={t.key}
            onClick={() => onSelect?.(t.key)}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.08)',
              background:
                'linear-gradient(90deg, rgba(139,92,246,0.18), rgba(6,182,212,0.18))',
              cursor: 'pointer'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
