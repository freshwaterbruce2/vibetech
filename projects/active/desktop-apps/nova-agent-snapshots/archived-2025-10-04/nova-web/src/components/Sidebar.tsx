import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Project, Memory } from '../types';
import LoadingSkeleton from './LoadingSkeleton';

const SidebarContainer = styled.div<{ isOpen: boolean }>`
  width: ${props => props.isOpen ? '300px' : '0'};
  background: ${props => props.theme.surface};
  border-right: 1px solid ${props => props.theme.border};
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
  box-shadow: inset -1px 0 0 ${props => props.theme.border};
  
  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 99;
    box-shadow: ${props => props.isOpen ? '0 4px 20px rgba(0, 0, 0, 0.15)' : 'none'};
  }
`;

const SidebarHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h2`
  font-size: 24px;
  font-weight: bold;
  color: ${props => props.theme.primary};
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.text};
  cursor: pointer;
  padding: 8px;
  
  &:hover {
    color: ${props => props.theme.primary};
  }
`;

const Section = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.textSecondary};
  margin-bottom: 12px;
  text-transform: uppercase;
`;

const ProjectList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ProjectItem = styled.div<{ isActive: boolean }>`
  padding: 8px 12px;
  background: ${props => props.isActive ? props.theme.primary : 'transparent'};
  color: ${props => props.isActive ? 'white' : props.theme.text};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.isActive ? props.theme.primary : props.theme.background};
  }
  
  .name {
    font-weight: 500;
  }
  
  .status {
    font-size: 12px;
    opacity: 0.7;
  }
`;

const CreateButton = styled.button`
  width: 100%;
  padding: 10px;
  background: ${props => props.theme.background};
  color: ${props => props.theme.primary};
  border: 1px dashed ${props => props.theme.primary};
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: ${props => props.theme.primary};
    color: white;
  }
`;

const MemoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
`;

const MemoryItem = styled.div`
  padding: 8px;
  background: ${props => props.theme.background};
  border-radius: 8px;
  font-size: 14px;
  
  .type {
    font-size: 12px;
    color: ${props => props.theme.primary};
    margin-bottom: 4px;
  }
  
  .content {
    color: ${props => props.theme.text};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.primary};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  
  &:hover {
    background: ${props => props.theme.background};
  }
`;

const MobileBackdrop = styled.div<{ isOpen: boolean }>`
  display: none;
  
  @media (max-width: 768px) {
    display: ${props => props.isOpen ? 'block' : 'none'};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 98;
  }
`;

interface SidebarProps {
  isOpen: boolean;
  projects: Project[];
  memories: Memory[];
  activeProject: string | null;
  onProjectSelect: (projectId: string | null) => void;
  onCreateProject: (name: string, description: string) => void;
  onToggle: () => void;
  isLoading?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  projects,
  memories,
  activeProject,
  onProjectSelect,
  onCreateProject,
  onToggle,
  isLoading = false,
}) => {
  // const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();

  const handleCreateProject = () => {
    const name = prompt('Project name:');
    if (name) {
      const description = prompt('Project description:') || '';
      onCreateProject(name, description);
    }
  };

  return (
    <>
      <MobileBackdrop isOpen={isOpen} onClick={onToggle} />
      <SidebarContainer isOpen={isOpen}>
      <SidebarHeader>
        <Logo>NOVA</Logo>
        <ToggleButton onClick={onToggle}>
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </ToggleButton>
      </SidebarHeader>
      
      <Section>
        <SectionTitle style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Projects
          <IconButton onClick={() => navigate('/projects')} title="View all projects">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
          </IconButton>
        </SectionTitle>
        <ProjectList>
          <ProjectItem
            isActive={activeProject === null}
            onClick={() => onProjectSelect(null)}
          >
            <div className="name">All Conversations</div>
          </ProjectItem>
          {isLoading ? (
            <LoadingSkeleton type="card" count={3} height="60px" />
          ) : (
            projects.map((project) => (
              <ProjectItem
                key={project.id}
                isActive={activeProject === project.id}
                onClick={() => onProjectSelect(project.id)}
              >
                <div className="name">{project.name}</div>
                <div className="status">{project.status}</div>
              </ProjectItem>
            ))
          )}
          <CreateButton onClick={handleCreateProject}>
            + New Project
          </CreateButton>
        </ProjectList>
      </Section>
      
      <Section style={{ flex: 1, overflow: 'auto' }}>
        <SectionTitle>Recent Memories</SectionTitle>
        <MemoryList>
          {isLoading ? (
            <LoadingSkeleton type="text" count={5} height="40px" />
          ) : (
            memories.slice(0, 10).map((memory) => (
              <MemoryItem key={memory.id}>
                <div className="type">{memory.type}</div>
                <div className="content">{memory.content}</div>
              </MemoryItem>
            ))
          )}
        </MemoryList>
      </Section>
    </SidebarContainer>
    </>
  );
};

export default Sidebar;