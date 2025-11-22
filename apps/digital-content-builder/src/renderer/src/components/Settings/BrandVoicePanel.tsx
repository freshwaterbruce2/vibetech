import React from 'react';

export function BrandVoicePanel(): JSX.Element {
  const [name, setName] = React.useState<string>('Default Brand');
  const [sample, setSample] = React.useState<string>('');
  const [status, setStatus] = React.useState<string>('');
  const [profiles, setProfiles] = React.useState<any[]>([]);

  const load = React.useCallback(async () => {
    try {
      // @ts-ignore
      const rows = await window.electronAPI.listBrandProfiles();
      setProfiles(rows ?? []);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    try {
      // @ts-ignore
      const res = await window.electronAPI.saveBrandProfile({ name, sample });
      setStatus(`Saved profile: ${res?.id} (tone: ${res?.tone})`);
      await load();
    } catch (e: any) {
      setStatus(`Error: ${String(e?.message ?? e)}`);
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Brand Voice</div>
      <div style={{ display: 'grid', gap: 8, maxWidth: 640 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Profile name" />
        <textarea
          value={sample}
          onChange={(e) => setSample(e.target.value)}
          rows={5}
          placeholder="Paste a sample of your brand content here..."
        />
        <button onClick={save}>Analyze & Save</button>
        {status && <div style={{ color: '#047857' }}>{status}</div>}
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Saved Profiles</div>
        <ul>
          {profiles.map(p => (
            <li key={p.id}>{p.name} — {p.tone} — {new Date(p.createdAt).toLocaleString()}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
