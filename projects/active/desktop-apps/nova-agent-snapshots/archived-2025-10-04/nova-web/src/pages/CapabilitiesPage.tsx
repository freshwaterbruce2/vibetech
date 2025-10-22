import React from 'react';
import styled from 'styled-components';
import { useApp } from '../contexts/AppContext';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorFallback from '../components/ErrorFallback';

const Container = styled.div`
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 32px;
  margin-bottom: 24px;
  color: ${props => props.theme.text};
`;

const Description = styled.p`
  font-size: 16px;
  color: ${props => props.theme.textSecondary};
  margin-bottom: 40px;
  line-height: 1.6;
`;

const CapabilityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CapabilityCard = styled.div`
  background: ${props => props.theme.surface};
  padding: 24px;
  border-radius: 12px;
  border: 1px solid ${props => props.theme.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const CapabilityInfo = styled.div`
  flex: 1;
`;

const CapabilityName = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: ${props => props.theme.text};
`;

const CapabilityDescription = styled.p`
  font-size: 14px;
  color: ${props => props.theme.textSecondary};
  line-height: 1.5;
`;

const Toggle = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 32px;
  margin-left: 20px;
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: ${props => props.theme.primary};
  }
  
  &:checked + span:before {
    transform: translateX(28px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.theme.border};
  transition: 0.4s;
  border-radius: 34px;
  
  &:before {
    position: absolute;
    content: "";
    height: 24px;
    width: 24px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
`;

const BackButton = styled.button`
  padding: 12px 24px;
  background: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 24px;
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

const CapabilitiesPage: React.FC = () => {
  const { capabilities, toggleCapability, isLoading, error, refreshData } = useApp();

  const handleToggle = async (name: string, currentEnabled: boolean) => {
    await toggleCapability(name, !currentEnabled);
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <Container>
      <BackButton onClick={handleBack}>
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        Back to Chat
      </BackButton>
      
      <Title>NOVA Capabilities</Title>
      <Description>
        Configure which features NOVA can use. Enabling more capabilities gives NOVA more power
        but may affect performance. Customize based on your needs.
      </Description>
      
      <CapabilityList>
        {error ? (
          <ErrorFallback
            title="Failed to load capabilities"
            message={error}
            onRetry={refreshData}
          />
        ) : isLoading ? (
          <LoadingSkeleton type="card" count={5} height="80px" />
        ) : (
          capabilities.map((capability) => (
            <CapabilityCard key={capability.name}>
              <CapabilityInfo>
                <CapabilityName>{capability.name}</CapabilityName>
                <CapabilityDescription>{capability.description}</CapabilityDescription>
              </CapabilityInfo>
              
              <Toggle>
                <ToggleInput
                  type="checkbox"
                  checked={capability.enabled}
                  onChange={() => handleToggle(capability.name, capability.enabled)}
                  disabled={isLoading}
                />
                <ToggleSlider />
              </Toggle>
            </CapabilityCard>
          ))
        )}
      </CapabilityList>
    </Container>
  );
};

export default CapabilitiesPage;