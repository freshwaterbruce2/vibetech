import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  text-align: center;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 20px 16px;
    justify-content: flex-start;
    padding-top: 40px;
  }
`;

const Logo = styled.div`
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, ${props => props.theme.primary}, #7c3aed);
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  box-shadow: 0 10px 40px rgba(37, 99, 235, 0.3);
  
  svg {
    width: 60px;
    height: 60px;
    color: white;
  }
  
  @media (max-width: 768px) {
    width: 80px;
    height: 80px;
    border-radius: 20px;
    margin-bottom: 24px;
    
    svg {
      width: 40px;
      height: 40px;
    }
  }
`;

const Title = styled.h1`
  font-size: 48px;
  font-weight: 700;
  color: ${props => props.theme.text};
  margin-bottom: 16px;
  
  @media (max-width: 768px) {
    font-size: 36px;
  }
`;

const Subtitle = styled.p`
  font-size: 20px;
  color: ${props => props.theme.textSecondary};
  margin-bottom: 48px;
  max-width: 600px;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  max-width: 800px;
  width: 100%;
  margin-bottom: 48px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 32px;
  }
`;

const FeatureCard = styled.div`
  background: ${props => props.theme.surface};
  padding: 24px;
  border-radius: 12px;
  border: 1px solid ${props => props.theme.border};
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: ${props => props.theme.primary};
  }
  
  svg {
    width: 32px;
    height: 32px;
    color: ${props => props.theme.primary};
    margin-bottom: 12px;
  }
  
  h3 {
    font-size: 16px;
    margin-bottom: 8px;
    color: ${props => props.theme.text};
    font-weight: 600;
  }
  
  p {
    font-size: 14px;
    color: ${props => props.theme.textSecondary};
    line-height: 1.5;
  }
`;

const SuggestionTitle = styled.h2`
  font-size: 18px;
  color: ${props => props.theme.text};
  margin-bottom: 16px;
`;

const Suggestions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  max-width: 600px;
`;

const Suggestion = styled.button`
  padding: 8px 16px;
  background: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.theme.primary};
    color: white;
    border-color: ${props => props.theme.primary};
  }
  
  &:focus-visible {
    outline: 2px solid ${props => props.theme.primary};
    outline-offset: 2px;
  }
  
  @media (max-width: 768px) {
    padding: 10px 16px;
    font-size: 14px;
    flex: 1;
    min-width: fit-content;
  }
`;

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSuggestionClick }) => {
  const suggestions = [
    "What can you help me with?",
    "Create a new project",
    "Show me my recent tasks",
    "Search my memories",
    "Explain your capabilities",
  ];

  return (
    <Container>
      <Logo>
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      </Logo>
      
      <Title>Welcome to NOVA</Title>
      <Subtitle>
        Your intelligent AI assistant with memory, project management, and learning capabilities.
        I'm here to help you be more productive and organized.
      </Subtitle>
      
      <FeatureGrid>
        <FeatureCard>
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <h3>Memory System</h3>
          <p>I remember our conversations and learn from your preferences</p>
        </FeatureCard>
        
        <FeatureCard>
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
          <h3>Project Management</h3>
          <p>Organize your work with projects and track tasks efficiently</p>
        </FeatureCard>
        
        <FeatureCard>
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
          </svg>
          <h3>Smart Assistant</h3>
          <p>Execute code, search the web, and help with complex tasks</p>
        </FeatureCard>
      </FeatureGrid>
      
      <SuggestionTitle>Try asking me:</SuggestionTitle>
      <Suggestions>
        {suggestions.map((suggestion, index) => (
          <Suggestion key={index} onClick={() => onSuggestionClick(suggestion)}>
            {suggestion}
          </Suggestion>
        ))}
      </Suggestions>
    </Container>
  );
};

export default WelcomeScreen;