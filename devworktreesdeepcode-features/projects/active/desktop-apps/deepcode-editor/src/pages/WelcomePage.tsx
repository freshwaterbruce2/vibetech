import React from 'react';

import WelcomeScreen from '../components/WelcomeScreen';
import { useEditorStore } from '../stores/useEditorStore';

const WelcomePage: React.FC = () => {
  const workspaceContext = useEditorStore((state) => state.workspaceContext);
  const isIndexing = useEditorStore((state) => state.isIndexing);
  const indexingProgress = useEditorStore((state) => state.indexingProgress);
  const { setWorkspaceFolder } = useEditorStore((state) => state.actions);

  const handleOpenFolder = (folder: string) => {
    setWorkspaceFolder(folder);
    // Navigate to editor page
    window.location.href = '/editor';
  };

  const handleCreateFile = (name: string) => {
    // Handle file creation
    console.log('Create file:', name);
  };

  return (
    <WelcomeScreen
      onOpenFolder={handleOpenFolder}
      onCreateFile={handleCreateFile}
      workspaceContext={workspaceContext}
      isIndexing={isIndexing}
      indexingProgress={indexingProgress}
    />
  );
};

export default WelcomePage;
