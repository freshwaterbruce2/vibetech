import React from 'react';

import Settings from '../components/Settings';
import { useEditorStore } from '../stores/useEditorStore';

const SettingsPage: React.FC = () => {
  const settings = useEditorStore((state) => state.settings);
  const settingsOpen = useEditorStore((state) => state.settingsOpen);
  const { updateSettings, toggleSettings } = useEditorStore((state) => state.actions);

  return (
    <Settings
      isOpen={settingsOpen}
      onClose={toggleSettings}
      settings={settings}
      onSettingsChange={updateSettings}
    />
  );
};

export default SettingsPage;
