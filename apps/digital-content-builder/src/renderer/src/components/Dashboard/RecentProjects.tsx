import React from 'react';

export function RecentProjects(): JSX.Element {
  return (
    <div>
      <div style={{ marginBottom: 8, fontWeight: 600 }}>Recent Projects</div>
      <div style={{ display: 'flex', gap: 12 }}>
        {['SaaS LP', 'Tech Blog', 'LinkedIn'].map((n, i) => (
          <div
            key={i}
            style={{
              padding: 12,
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.65)'
            }}
          >
            {n}
          </div>
        ))}
      </div>
    </div>
  );
}
