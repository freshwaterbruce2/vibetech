import React from 'react';
import { Brain, Code, MessageSquare } from 'lucide-react';
import styled from 'styled-components';

import { vibeTheme } from '../styles/theme';

const ComparisonContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${vibeTheme.spacing.lg};
  padding: ${vibeTheme.spacing.lg} 0;
`;

const ModelCard = styled.div<{ $highlighted?: boolean }>`
  background: ${(props) =>
    props.$highlighted
      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(0, 212, 255, 0.1) 100%)'
      : vibeTheme.colors.secondary};
  border: 2px solid
    ${(props) => (props.$highlighted ? vibeTheme.colors.purple : 'rgba(139, 92, 246, 0.2)')};
  border-radius: ${vibeTheme.borderRadius.medium};
  padding: ${vibeTheme.spacing.lg};
  position: relative;
  transition: all ${vibeTheme.animation.duration.normal} ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${vibeTheme.shadows.large};
    border-color: ${vibeTheme.colors.cyan};
  }
`;

const ModelIcon = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.$color};
  border-radius: ${vibeTheme.borderRadius.medium};
  margin-bottom: ${vibeTheme.spacing.md};

  svg {
    width: 24px;
    height: 24px;
    color: white;
  }
`;

const ModelTitle = styled.h3`
  margin: 0 0 ${vibeTheme.spacing.sm} 0;
  font-size: ${vibeTheme.typography.fontSize.lg};
  font-weight: ${vibeTheme.typography.fontWeight.bold};
  color: ${vibeTheme.colors.text};
`;

const ModelSubtitle = styled.p`
  margin: 0 0 ${vibeTheme.spacing.md} 0;
  font-size: ${vibeTheme.typography.fontSize.sm};
  color: ${vibeTheme.colors.textSecondary};
`;

const FeatureList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Feature = styled.li`
  font-size: ${vibeTheme.typography.fontSize.sm};
  color: ${vibeTheme.colors.textSecondary};
  margin-bottom: ${vibeTheme.spacing.xs};
  padding-left: ${vibeTheme.spacing.md};
  position: relative;

  &::before {
    content: '•';
    position: absolute;
    left: 0;
    color: ${vibeTheme.colors.cyan};
  }
`;

const BestFor = styled.div`
  margin-top: ${vibeTheme.spacing.md};
  padding-top: ${vibeTheme.spacing.md};
  border-top: 1px solid rgba(139, 92, 246, 0.2);
  font-size: ${vibeTheme.typography.fontSize.sm};
  color: ${vibeTheme.colors.text};

  strong {
    color: ${vibeTheme.colors.purple};
  }
`;

interface ModelComparisonProps {
  currentModel?: string | undefined;
}

export const ModelComparison: React.FC<ModelComparisonProps> = ({ currentModel }) => {
  const models = [
    {
      id: 'deepseek-chat',
      title: 'DeepSeek Chat',
      subtitle: 'General Purpose',
      icon: <MessageSquare />,
      color: 'rgba(139, 92, 246, 0.8)',
      features: [
        'Fast responses',
        'Conversational AI',
        'Code explanations',
        'General assistance',
        'Balanced performance',
      ],
      bestFor: 'Daily coding tasks, explanations, and general help',
    },
    {
      id: 'deepseek-coder',
      title: 'DeepSeek Coder',
      subtitle: 'Code Specialist',
      icon: <Code />,
      color: 'rgba(0, 212, 255, 0.8)',
      features: [
        'Advanced code generation',
        'Design patterns expert',
        'Algorithm optimization',
        'Multi-file generation',
        'Best practices focused',
      ],
      bestFor: 'Complex code generation, refactoring, and optimization',
    },
    {
      id: 'deepseek-reasoner',
      title: 'DeepSeek Reasoner',
      subtitle: 'Chain of Thought',
      icon: <Brain />,
      color: 'rgba(34, 197, 94, 0.8)',
      features: [
        'Step-by-step reasoning',
        'Complex problem solving',
        'Detailed analysis',
        'Trade-off evaluation',
        'Visible thought process',
      ],
      bestFor: 'Debugging, system design, and complex logic problems',
    },
  ];

  return (
    <ComparisonContainer>
      {models.map((model) => (
        <ModelCard key={model.id} $highlighted={currentModel === model.id}>
          <ModelIcon $color={model.color}>{model.icon}</ModelIcon>
          <ModelTitle>{model.title}</ModelTitle>
          <ModelSubtitle>{model.subtitle}</ModelSubtitle>
          <FeatureList>
            {model.features.map((feature, index) => (
              <Feature key={index}>{feature}</Feature>
            ))}
          </FeatureList>
          <BestFor>
            <strong>Best for:</strong> {model.bestFor}
          </BestFor>
        </ModelCard>
      ))}
    </ComparisonContainer>
  );
};

export default ModelComparison;
