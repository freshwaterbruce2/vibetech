import React from 'react';
import styled from 'styled-components';
import Header from './Header';
import Sidebar from './Sidebar';
import Chat from './Chat';
import ErrorNotification from './ErrorNotification';
import MobileMenu from './MobileMenu';
import { useApp } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  overflow: hidden;
`;

const MainContainer = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const ContentArea = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
`;

 
const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

const Layout: React.FC = () => {
  const {
    messages,
    projects,
    memories,
    capabilities,
    activeProject,
    isLoading,
    error,
    isListening,
    sidebarOpen,
    sendMessage,
    selectProject,
    createProject,
    newChat,
    toggleVoice,
    toggleSidebar,
    clearError,
  } = useApp();
  
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <LayoutContainer>
      <Header
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onNewChat={newChat}
        capabilities={capabilities}
      />
      
      <MainContainer>
        <Sidebar
          isOpen={sidebarOpen}
          projects={projects}
          memories={memories}
          activeProject={activeProject}
          onProjectSelect={selectProject}
          onCreateProject={createProject}
          onToggle={toggleSidebar}
          isLoading={isLoading}
        />
        
        <ContentArea>
          <Chat
            messages={messages}
            onSendMessage={sendMessage}
            isListening={isListening}
            onToggleVoice={toggleVoice}
            isLoading={isLoading}
          />
        </ContentArea>
      </MainContainer>
      
      <MobileMenu isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      {error && <ErrorNotification error={error} onClose={clearError} />}
    </LayoutContainer>
  );
};

export default Layout;