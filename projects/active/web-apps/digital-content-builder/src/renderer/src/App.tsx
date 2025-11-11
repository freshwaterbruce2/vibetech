import React from 'react';
import { QuickCreate } from './components/Dashboard/QuickCreate';
import { RecentProjects } from './components/Dashboard/RecentProjects';
import { ProjectGrid } from './components/Dashboard/ProjectGrid';
import { SimpleGenerator } from './components/Generator/SimpleGenerator';
import { TemplateGallery } from './components/Templates/TemplateGallery';
import { VisualEditor } from './components/Editor/VisualEditor';
import { BrandVoicePanel } from './components/Settings/BrandVoicePanel';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export function App(): JSX.Element {
  const [pingResult, setPingResult] = React.useState<string>('...');
  const [hasKey, setHasKey] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        // @ts-ignore - exposed by preload
        const res = await window.electronAPI?.ping?.();
        setPingResult(res?.ok ? `OK (${new Date(res.ts).toLocaleTimeString()})` : 'N/A');
        setHasKey(Boolean(res?.hasKey));
      } catch {
        setPingResult('Unavailable');
        setHasKey(null);
      }
    })();
  }, []);

  return (
    <ErrorBoundary>
      <div style={{ padding: 24, fontFamily: 'Inter, system-ui, Arial, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0 }}>Digital Content Builder</h1>
          <div style={{ color: '#666' }}>Health: {pingResult}</div>
        </div>

        {hasKey === false && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.5)' }}>
            DeepSeek API key not detected. Set DEEPSEEK_API_KEY in your environment before generating content.
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <QuickCreate onSelect={(t) => console.log('Create type:', t)} />
        </div>

        <div style={{ marginTop: 24 }}>
          <RecentProjects />
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>All Projects</div>
          <ProjectGrid />
        </div>

        <SimpleGenerator />
        <TemplateGallery />
        <VisualEditor />
        <BrandVoicePanel />
      </div>
    </ErrorBoundary>
  );
}
