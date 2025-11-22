import React from 'react';
import { useProjectStore } from '../../stores/projectStore';

export function ProjectGrid(): JSX.Element {
  const { items, search, setSearch, refresh } = useProjectStore();

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = items.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <input
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', width: '100%', maxWidth: 420 }}
        />
      </div>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {filtered.map(card => (
          <div
            key={card.id}
            style={{
              padding: 16,
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.08)',
              background: 'rgba(255,255,255,0.7)'
            }}
          >
            <div style={{ fontWeight: 600 }}>{card.name}</div>
            <div style={{ color: '#666', fontSize: 12, marginTop: 6 }}>
              {card.type} • {new Date(card.updatedAt).toLocaleDateString()}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ color: '#6b7280' }}>No projects yet.</div>}
      </div>
    </div>
  );
}
