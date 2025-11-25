/**
 * Model Selector - UI component for selecting AI models and providers
 */
import React, { useEffect, useRef,useState } from 'react';
import { Check,ChevronDown, DollarSign, Sparkles, Zap } from 'lucide-react';
import styled from 'styled-components';

// import { AIProviderManager } from '../../services/ai/AIProviderManager';
import { AIModel, AIProvider, MODEL_REGISTRY } from '../../services/ai/AIProviderInterface';
import { vibeTheme } from '../../styles/theme';

interface ModelSelectorProps {
  currentModel: string;
  onModelChange: (model: string) => void;
}

const Container = styled.div`
  position: relative;
  margin: 0 16px;
`;

const Selector = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: ${vibeTheme.colors.surface};
  border: ${vibeTheme.borders.thin};
  border-radius: 6px;
  color: ${vibeTheme.colors.text};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${vibeTheme.colors.hover};
    border-color: ${vibeTheme.colors.purple};
  }
  
  &:focus {
    outline: none;
    border-color: ${vibeTheme.colors.purple};
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const ModelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  
  .model-name {
    font-weight: 600;
  }
  
  .provider-badge {
    padding: 2px 6px;
    background: ${vibeTheme.colors.purple}20;
    color: ${vibeTheme.colors.purple};
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
  }
`;

const Dropdown = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  width: 320px;
  background: ${vibeTheme.colors.surface};
  border: ${vibeTheme.borders.thin};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: translateY(${props => props.$isOpen ? 0 : -8}px);
  transition: all 0.2s;
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
`;

const ProviderSection = styled.div`
  border-bottom: ${vibeTheme.borders.thin};
  
  &:last-child {
    border-bottom: none;
  }
`;

const ProviderHeader = styled.div`
  padding: 12px 16px;
  background: ${vibeTheme.colors.primary};
  font-size: 12px;
  font-weight: 600;
  color: ${vibeTheme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ModelOption = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: transparent;
  border: none;
  color: ${vibeTheme.colors.text};
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${vibeTheme.colors.hover};
  }
  
  &.selected {
    background: ${vibeTheme.colors.purple}10;
    color: ${vibeTheme.colors.purple};
  }
`;

const ModelDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  
  .model-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
  }
  
  .model-info {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: ${vibeTheme.colors.textSecondary};
    
    .info-item {
      display: flex;
      align-items: center;
      gap: 4px;
      
      svg {
        width: 12px;
        height: 12px;
      }
    }
  }
`;

const Badge = styled.span<{ $type: 'recommended' | 'fast' | 'smart' }>`
  padding: 2px 6px;
  background: ${props => 
    props.$type === 'recommended' ? `${vibeTheme.colors.success  }20` :
    props.$type === 'fast' ? `${vibeTheme.colors.cyan  }20` :
    `${vibeTheme.colors.purple  }20`
  };
  color: ${props =>
    props.$type === 'recommended' ? vibeTheme.colors.success :
    props.$type === 'fast' ? vibeTheme.colors.cyan :
    vibeTheme.colors.purple
  };
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
`;

const ModelSelector: React.FC<ModelSelectorProps> = ({ currentModel, onModelChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // const [providerManager] = useState(() => new AIProviderManager());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getProviderName = (provider: AIProvider): string => {
    switch (provider) {
      case AIProvider.OPENAI:
        return 'OpenAI';
      case AIProvider.ANTHROPIC:
        return 'Anthropic';
      case AIProvider.DEEPSEEK:
        return 'DeepSeek';
      default:
        return provider;
    }
  };

  const currentModelInfo = MODEL_REGISTRY[currentModel as keyof typeof MODEL_REGISTRY] as AIModel | undefined;
  const currentProviderName = currentModelInfo ? getProviderName(currentModelInfo.provider) : 'Unknown';

  const groupedModels = Object.entries(MODEL_REGISTRY).reduce((acc: Record<string, any[]>, [id, model]) => {
    const provider = model.provider as string;
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push({ ...model, modelId: id });
    return acc;
  }, {} as Record<string, any[]>);

  const getCostIndicator = (model: AIModel) => {
    if (!model.costPerMillionInput && !model.costPerMillionOutput) {return '$';}
    const avgCost = (model.costPerMillionInput + model.costPerMillionOutput) / 2;
    if (avgCost < 1) {return '$';}
    if (avgCost < 5) {return '$$';}
    return '$$$';
  };

  return (
    <Container ref={dropdownRef}>
      <Selector onClick={() => setIsOpen(!isOpen)}>
        <Sparkles />
        <ModelInfo>
          <span className="model-name">{currentModel}</span>
          <span className="provider-badge">{currentProviderName}</span>
        </ModelInfo>
        <ChevronDown size={16} />
      </Selector>

      <Dropdown $isOpen={isOpen}>
        {Object.entries(groupedModels).map(([provider, models]) => {
          const providerKey = provider as AIProvider;
          return (
            <ProviderSection key={provider}>
              <ProviderHeader>{getProviderName(providerKey)}</ProviderHeader>
              {models.map(model => (
                <ModelOption
                  key={model.id}
                  className={model.id === currentModel ? 'selected' : ''}
                  onClick={() => {
                    onModelChange(model.id);
                    setIsOpen(false);
                  }}
                >
                  <ModelDetails>
                    <div className="model-title">
                      <span>{model.name}</span>
                      {model.recommended && <Badge $type="recommended">Recommended</Badge>}
                      {model.contextWindow >= 100000 && <Badge $type="smart">Long Context</Badge>}
                      {model.name.includes('mini') && <Badge $type="fast">Fast</Badge>}
                    </div>
                    <div className="model-info">
                      <div className="info-item">
                        <Zap />
                        {model.contextWindow.toLocaleString()} tokens
                      </div>
                      <div className="info-item">
                        <DollarSign />
                        {getCostIndicator(model)}
                      </div>
                    </div>
                  </ModelDetails>
                  {model.id === currentModel && (
                    <Check size={16} color={currentModelInfo?.recommended ? vibeTheme.colors.success : undefined} />
                  )}
                </ModelOption>
              ))}
            </ProviderSection>
          );
        })}
      </Dropdown>
    </Container>
  );
};

export default ModelSelector;