import React from "react";
import { Routes, Route } from "react-router-dom";
import styled, { createGlobalStyle } from "styled-components";
import Layout from "./components/Layout";
import CapabilitiesPage from "./pages/CapabilitiesPage";
import ProjectsPage from "./pages/ProjectsPage";

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: ${props => props.theme.background};
    color: ${props => props.theme.text};
  }
  
  #root {
    height: 100vh;
  }
  
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: ${props => props.theme.background};
  }
  
  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.textSecondary};
  }
  
  /* Accessibility improvements */
  *:focus-visible {
    outline: 2px solid ${props => props.theme.primary};
    outline-offset: 2px;
  }
  
  button:focus-visible {
    outline: 2px solid ${props => props.theme.primary};
    outline-offset: 2px;
  }
  
  input:focus-visible, textarea:focus-visible {
    outline: 2px solid ${props => props.theme.primary};
    outline-offset: 2px;
  }
`;

const AppContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PageContainer = styled.div`
  height: 100vh;
  overflow-y: auto;
  background: ${props => props.theme.background};
`;

function App() {
  return (
    <AppContainer>
      <GlobalStyle />
      <Routes>
        <Route path="/" element={<Layout />} />
        <Route 
          path="/capabilities" 
          element={
            <PageContainer>
              <CapabilitiesPage />
            </PageContainer>
          } 
        />
        <Route 
          path="/projects" 
          element={
            <PageContainer>
              <ProjectsPage />
            </PageContainer>
          } 
        />
      </Routes>
    </AppContainer>
  );
}

export default App;
