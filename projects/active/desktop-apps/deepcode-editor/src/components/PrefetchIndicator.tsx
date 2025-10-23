/**
 * Prefetch Indicator Component
 * Shows predictive prefetching status and analytics
 *
 * October 2025 - Week 4 Implementation
 */

import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  Brain,
  Zap,
  TrendingUp,
  Database,
  Activity,
  Clock,
  Target,
  BarChart3,
  Cpu,
  HardDrive
} from 'lucide-react';

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.95);
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Container = styled.div<{ expanded: boolean }>`
  position: fixed;
  bottom: 100px;
  left: 20px;
  background: linear-gradient(135deg, #1a1b26 0%, #24283b 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: ${props => props.expanded ? '16px' : '12px'};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease-out;
  z-index: 999;
  min-width: ${props => props.expanded ? '320px' : '180px'};
  max-width: 400px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  cursor: pointer;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #c9d1d9;
  font-size: 13px;
  font-weight: 600;
`;

const IconWrapper = styled.div<{ isActive: boolean; color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: ${props => props.isActive
    ? `linear-gradient(135deg, ${props.color}30, ${props.color}20)`
    : 'transparent'};
  color: ${props => props.color};
  animation: ${props => props.isActive ? pulse : 'none'} 2s infinite;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const StatusBadge = styled.span<{ status: 'idle' | 'active' | 'learning' }>`
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${props => {
    switch(props.status) {
      case 'active': return 'rgba(16, 185, 129, 0.2)';
      case 'learning': return 'rgba(245, 158, 11, 0.2)';
      default: return 'rgba(107, 114, 128, 0.2)';
    }
  }};
  color: ${props => {
    switch(props.status) {
      case 'active': return '#10b981';
      case 'learning': return '#f59e0b';
      default: return '#6b7280';
    }
  }};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 12px;
`;

const StatCard = styled.div`
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StatLabel = styled.div`
  color: #8b949e;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 4px;

  svg {
    width: 10px;
    height: 10px;
  }
`;

const StatValue = styled.div`
  color: #c9d1d9;
  font-size: 16px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
`;

const StatChange = styled.span<{ positive: boolean }>`
  color: ${props => props.positive ? '#10b981' : '#ef4444'};
  font-size: 10px;
  margin-left: 4px;
`;

const ProgressBar = styled.div<{ progress: number; color: string }>`
  width: 100%;
  height: 4px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 8px;

  &::after {
    content: '';
    display: block;
    width: ${props => props.progress}%;
    height: 100%;
    background: linear-gradient(90deg, ${props => props.color}80, ${props => props.color});
    transition: width 0.3s ease;
  }
`;

const PredictionList = styled.div`
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const PredictionItem = styled.div<{ confidence: number }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: rgba(139, 92, 246, ${props => props.confidence * 0.1});
  border: 1px solid rgba(139, 92, 246, ${props => props.confidence * 0.3});
  border-radius: 6px;
  font-size: 11px;
  color: #c9d1d9;
`;

const PredictionText = styled.span`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ConfidenceBadge = styled.span<{ level: 'high' | 'medium' | 'low' }>`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
  background: ${props => {
    switch(props.level) {
      case 'high': return 'rgba(16, 185, 129, 0.2)';
      case 'medium': return 'rgba(245, 158, 11, 0.2)';
      default: return 'rgba(107, 114, 128, 0.2)';
    }
  }};
  color: ${props => {
    switch(props.level) {
      case 'high': return '#10b981';
      case 'medium': return '#f59e0b';
      default: return '#6b7280';
    }
  }};
`;

const LoadingSpinner = styled.div`
  width: 12px;
  height: 12px;
  border: 2px solid rgba(139, 92, 246, 0.2);
  border-top-color: #8b92f6;
  border-radius: 50%;
  animation: ${rotate} 0.6s linear infinite;
`;

const MemoryIndicator = styled.div<{ usage: number }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(139, 92, 246, 0.05);
  border-radius: 6px;
  font-size: 10px;
  color: ${props => props.usage > 80 ? '#ef4444' : props.usage > 60 ? '#f59e0b' : '#10b981'};

  svg {
    width: 12px;
    height: 12px;
  }
`;

interface PrefetchIndicatorProps {
  stats?: {
    cacheSize: number;
    queueSize: number;
    activeCount: number;
    hitRate: number;
    avgLatency: number;
    memoryUsageMB: number;
  };
  predictions?: Array<{
    position: string;
    confidence: number;
    pattern: string;
  }>;
  learningStats?: {
    patternsLearned: number;
    accuracy: number;
  };
  isActive?: boolean;
  status?: 'idle' | 'active' | 'learning';
}

const PrefetchIndicator: React.FC<PrefetchIndicatorProps> = ({
  stats = {
    cacheSize: 0,
    queueSize: 0,
    activeCount: 0,
    hitRate: 0,
    avgLatency: 0,
    memoryUsageMB: 0,
  },
  predictions = [],
  learningStats = {
    patternsLearned: 0,
    accuracy: 0,
  },
  isActive = false,
  status = 'idle',
}) => {
  const [expanded, setExpanded] = useState(false);
  const [prevHitRate, setPrevHitRate] = useState(0);

  useEffect(() => {
    setPrevHitRate(stats.hitRate);
  }, [stats.hitRate]);

  const getConfidenceLevel = (confidence: number): 'high' | 'medium' | 'low' => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  };

  const memoryUsagePercent = (stats.memoryUsageMB / 50) * 100; // Assuming 50MB max

  return (
    <Container expanded={expanded}>
      <Header onClick={() => setExpanded(!expanded)}>
        <Title>
          <IconWrapper isActive={isActive} color="#8b92f6">
            <Brain />
          </IconWrapper>
          <span>Predictive Prefetch</span>
          {stats.activeCount > 0 && <LoadingSpinner />}
        </Title>
        <StatusBadge status={status}>{status}</StatusBadge>
      </Header>

      {expanded && (
        <>
          <StatsGrid>
            <StatCard>
              <StatLabel>
                <Target />
                Hit Rate
              </StatLabel>
              <StatValue>
                {(stats.hitRate * 100).toFixed(1)}%
                {stats.hitRate !== prevHitRate && (
                  <StatChange positive={stats.hitRate > prevHitRate}>
                    {stats.hitRate > prevHitRate ? '↑' : '↓'}
                  </StatChange>
                )}
              </StatValue>
            </StatCard>

            <StatCard>
              <StatLabel>
                <Clock />
                Avg Latency
              </StatLabel>
              <StatValue>{stats.avgLatency}ms</StatValue>
            </StatCard>

            <StatCard>
              <StatLabel>
                <Database />
                Cache Size
              </StatLabel>
              <StatValue>{stats.cacheSize}</StatValue>
            </StatCard>

            <StatCard>
              <StatLabel>
                <Activity />
                Queue
              </StatLabel>
              <StatValue>{stats.queueSize}</StatValue>
            </StatCard>
          </StatsGrid>

          <MemoryIndicator usage={memoryUsagePercent}>
            <HardDrive />
            <span>{stats.memoryUsageMB.toFixed(1)}MB</span>
            <ProgressBar progress={memoryUsagePercent} color="#8b92f6" />
          </MemoryIndicator>

          {learningStats.patternsLearned > 0 && (
            <StatCard style={{ marginTop: '8px' }}>
              <StatLabel>
                <BarChart3 />
                Learning Progress
              </StatLabel>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div>
                  <StatValue style={{ fontSize: '14px' }}>
                    {learningStats.patternsLearned}
                  </StatValue>
                  <span style={{ fontSize: '9px', color: '#8b949e' }}>Patterns</span>
                </div>
                <div>
                  <StatValue style={{ fontSize: '14px' }}>
                    {(learningStats.accuracy * 100).toFixed(0)}%
                  </StatValue>
                  <span style={{ fontSize: '9px', color: '#8b949e' }}>Accuracy</span>
                </div>
              </div>
            </StatCard>
          )}

          {predictions.length > 0 && (
            <PredictionList>
              <StatLabel style={{ marginBottom: '4px' }}>
                <Zap />
                Next Predictions
              </StatLabel>
              {predictions.slice(0, 3).map((pred, index) => (
                <PredictionItem key={index} confidence={pred.confidence}>
                  <PredictionText>
                    {pred.position} - {pred.pattern}
                  </PredictionText>
                  <ConfidenceBadge level={getConfidenceLevel(pred.confidence)}>
                    {(pred.confidence * 100).toFixed(0)}%
                  </ConfidenceBadge>
                </PredictionItem>
              ))}
            </PredictionList>
          )}
        </>
      )}
    </Container>
  );
};

// Mini indicator for status bar
const MiniIndicator = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: ${props => props.isActive
    ? 'rgba(139, 92, 246, 0.1)'
    : 'transparent'};
  border-radius: 6px;
  font-size: 11px;
  color: ${props => props.isActive ? '#8b92f6' : '#6b7280'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(139, 92, 246, 0.15);
    color: #8b92f6;
  }

  svg {
    width: 14px;
    height: 14px;
    animation: ${props => props.isActive ? pulse : 'none'} 2s infinite;
  }
`;

export const PrefetchMiniIndicator: React.FC<{
  cacheHits: number;
  isActive: boolean;
  onClick?: () => void;
}> = ({ cacheHits, isActive, onClick }) => {
  return (
    <MiniIndicator isActive={isActive} onClick={onClick} title="Predictive Prefetch Status">
      <Brain />
      <span>{cacheHits} hits</span>
      {isActive && <LoadingSpinner />}
    </MiniIndicator>
  );
};

export default PrefetchIndicator;