import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorFallback from '../components/ErrorFallback';

const Container = styled.div`
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  flex-wrap: wrap;
  gap: 20px;
`;

const Title = styled.h1`
  font-size: 32px;
  color: ${props => props.theme.text};
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const CreateButton = styled.button`
  padding: 12px 24px;
  background: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    opacity: 0.9;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ProjectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const ProjectCard = styled.div`
  background: ${props => props.theme.surface};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: ${props => props.theme.primary};
  }
  
  &:active {
    transform: translateY(-2px);
  }
`;

const ProjectName = styled.h3`
  font-size: 20px;
  margin-bottom: 8px;
  color: ${props => props.theme.text};
`;

const ProjectDescription = styled.p`
  font-size: 14px;
  color: ${props => props.theme.textSecondary};
  margin-bottom: 16px;
  line-height: 1.5;
`;

const ProjectMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid ${props => props.theme.border};
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  background: ${props => {
    switch (props.status) {
      case 'active': return props.theme.success;
      case 'completed': return props.theme.primary;
      case 'archived': return props.theme.textSecondary;
      default: return props.theme.border;
    }
  }};
  color: white;
`;

const TaskCount = styled.span`
  font-size: 12px;
  color: ${props => props.theme.textSecondary};
`;

const BackButton = styled.button`
  padding: 12px 24px;
  background: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: ${props => props.theme.background};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const Modal = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'block' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
`;

const ModalContent = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: ${props => props.theme.background};
  padding: 32px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  margin-bottom: 24px;
  color: ${props => props.theme.text};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.text};
`;

const Input = styled.input`
  padding: 12px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  background: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
  }
`;

const TextArea = styled.textarea`
  padding: 12px;
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  background: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  font-size: 16px;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 16px;
`;

const Button = styled.button`
  padding: 12px 24px;
  background: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
  
  &[type="button"] {
    background: ${props => props.theme.surface};
    color: ${props => props.theme.text};
    border: 1px solid ${props => props.theme.border};
    
    &:hover {
      background: ${props => props.theme.background};
    }
  }
`;

const ProjectsPage: React.FC = () => {
  const { projects, tasks, createProject, selectProject, isLoading, error, refreshData } = useApp();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const handleProjectClick = (projectId: string) => {
    selectProject(projectId);
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      await createProject(formData.name, formData.description);
      setShowModal(false);
      setFormData({ name: '', description: '' });
    }
  };

  const getTaskCount = (projectId: string) => {
    return tasks.filter(t => t.project_id === projectId).length;
  };

  return (
    <Container>
      <BackButton onClick={() => navigate('/')}>
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        Back to Chat
      </BackButton>
      
      <Header>
        <Title>Projects</Title>
        <CreateButton onClick={() => setShowModal(true)}>
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          New Project
        </CreateButton>
      </Header>
      
      <ProjectGrid>
        {error ? (
          <ErrorFallback
            title="Failed to load projects"
            message={error}
            onRetry={refreshData}
          />
        ) : isLoading ? (
          <LoadingSkeleton type="card" count={6} height="150px" />
        ) : projects.length === 0 ? (
          <ErrorFallback
            title="No projects yet"
            message="Create your first project to organize your conversations and tasks."
            showRetry={false}
          />
        ) : (
          projects.map((project) => (
            <ProjectCard key={project.id} onClick={() => handleProjectClick(project.id)}>
              <ProjectName>{project.name}</ProjectName>
              {project.description && (
                <ProjectDescription>{project.description}</ProjectDescription>
              )}
              <ProjectMeta>
                <StatusBadge status={project.status}>{project.status}</StatusBadge>
                <TaskCount>{getTaskCount(project.id)} tasks</TaskCount>
              </ProjectMeta>
            </ProjectCard>
          ))
        )}
      </ProjectGrid>
      
      <Modal isOpen={showModal} onClick={() => setShowModal(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalTitle>Create New Project</ModalTitle>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>Project Name</Label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter project name"
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>Description (optional)</Label>
              <TextArea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter project description"
              />
            </FormGroup>
            <ButtonGroup>
              <Button type="submit">Create Project</Button>
              <Button type="button" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
            </ButtonGroup>
          </Form>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default ProjectsPage;