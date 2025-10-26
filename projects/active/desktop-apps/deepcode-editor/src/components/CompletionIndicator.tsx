/**
 * Completion Indicator Component
 * Shows visual feedback when AI completions are available
 *
 * October 2025 - Week 3 Implementation
 */

import React, { useEffect, useState } from 'react';
import { Bot, Brain, ChevronRight, Gauge, X,Zap } from 'lucide-react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(139, 92, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(139, 92, 246, 0);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Container = styled.div<{ visible: boolean }>`
  position: fixed;
  bottom: 80px;
  right: 20px;
  background: linear-gradient(135deg, #1a1b26 0%, #24283b 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  display: ${props => props.visible ? 'flex' : 'none'};
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  animation: ${slideIn} 0.3s ease-out;
  z-index: 1000;
  max-width: 320px;
`;

const IconWrapper = styled.div<{ isActive: boolean; color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${props => props.isActive
    ? `linear-gradient(135deg, ${props.color}20, ${props.color}10)`
    : 'transparent'};
  color: ${props => props.color};
  animation: ${props => props.isActive ? pulse : 'none'} 2s infinite;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.div`
  color: #c9d1d9;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Description = styled.div`
  color: #8b949e;
  font-size: 11px;
  line-height: 1.4;
`;

const ModelBadge = styled.span<{ color: string }>`
  background: ${props => props.color}20;
  color: ${props => props.color};
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
`;

const KeyHint = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
`;

const Key = styled.kbd`
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 10px;
  font-family: 'JetBrains Mono', monospace;
  color: #8b92f6;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #8b949e;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 0.1);
    color: #c9d1d9;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

interface CompletionIndicatorProps {
  isActive: boolean;
  model?: string;
  strategy?: 'fast' | 'balanced' | 'accurate' | 'adaptive';
  hasCompletion: boolean;
  onDismiss?: () => void;
}

const CompletionIndicator: React.FC<CompletionIndicatorProps> = ({
  isActive,
  model = 'deepseek-chat',
  strategy = 'fast',
  hasCompletion,
  onDismiss
}) => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (hasCompletion && !dismissed) {
      setVisible(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [hasCompletion, dismissed]);

  const getModelInfo = () => {
    const modelLower = model.toLowerCase();
    if (modelLower.includes('haiku')) {
      return { name: 'Haiku 4.5', color: '#00d4ff' };
    }
    if (modelLower.includes('sonnet')) {
      return { name: 'Sonnet 4.5', color: '#8b92f6' };
    }
    if (modelLower.includes('deepseek')) {
      return { name: 'DeepSeek', color: '#10b981' };
    }
    return { name: 'AI', color: '#6b7280' };
  };

  const getStrategyIcon = () => {
    switch (strategy) {
      case 'fast': return <Zap />;
      case 'balanced': return <Gauge />;
      case 'accurate': return <Brain />;
      case 'adaptive': return <Bot />;
      default: return <Bot />;
    }
  };

  const getStrategyColor = () => {
    switch (strategy) {
      case 'fast': return '#10b981';
      case 'balanced': return '#00d4ff';
      case 'accurate': return '#8b92f6';
      case 'adaptive': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
    onDismiss?.();
  };

  const modelInfo = getModelInfo();
  const strategyColor = getStrategyColor();

  return (
    <Container visible={visible && isActive}>
      <IconWrapper isActive={hasCompletion} color={strategyColor}>
        {getStrategyIcon()}
      </IconWrapper>

      <Content>
        <Title>
          AI Completion Ready
          <ModelBadge color={modelInfo.color}>
            {modelInfo.name}
          </ModelBadge>
        </Title>

        <Description>
          {strategy === 'adaptive'
            ? 'AI is choosing the best model for your code'
            : `Using ${strategy} strategy for quick suggestions`}
        </Description>

        <KeyHint>
          <Key>Tab</Key>
          <span style={{ color: '#8b949e', fontSize: '11px' }}>to accept</span>
          <Key>Esc</Key>
          <span style={{ color: '#8b949e', fontSize: '11px' }}>to dismiss</span>
          <Key>Alt + ]</Key>
          <span style={{ color: '#8b949e', fontSize: '11px' }}>for next</span>
        </KeyHint>
      </Content>

      <CloseButton onClick={handleDismiss} title="Dismiss">
        <X />
      </CloseButton>
    </Container>
  );
};

// Ghost text overlay component
const GhostTextOverlay = styled.div<{ visible: boolean }>`
  position: absolute;
  pointer-events: none;
  opacity: ${props => props.visible ? 0.5 : 0};
  font-style: italic;
  color: #8b949e;
  transition: opacity 0.2s ease-in-out;
  white-space: pre;
  overflow: hidden;
  z-index: 1;
`;

// Completion stats widget
const StatsWidget = styled.div`
  position: fixed;
  top: 80px;
  right: 20px;
  background: rgba(26, 27, 38, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 11px;
  color: #8b949e;
  min-width: 150px;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  span:first-child {
    color: #6b7280;
  }

  span:last-child {
    color: #c9d1d9;
    font-weight: 500;
  }
`;

interface CompletionStatsProps {
  totalSuggestions: number;
  accepted: number;
  rejected: number;
  avgLatency: number;
  currentModel: string;
}

export const CompletionStats: React.FC<CompletionStatsProps> = ({
  totalSuggestions,
  accepted,
  rejected,
  avgLatency,
  currentModel
}) => {
  const acceptRate = totalSuggestions > 0
    ? Math.round((accepted / totalSuggestions) * 100)
    : 0;

  return (
    <StatsWidget>
      <StatRow>
        <span>Suggestions:</span>
        <span>{totalSuggestions}</span>
      </StatRow>
      <StatRow>
        <span>Accept Rate:</span>
        <span>{acceptRate}%</span>
      </StatRow>
      <StatRow>
        <span>Avg Latency:</span>
        <span>{avgLatency}ms</span>
      </StatRow>
      <StatRow>
        <span>Model:</span>
        <span>{currentModel}</span>
      </StatRow>
    </StatsWidget>
  );
};

export { GhostTextOverlay };
export default CompletionIndicator;