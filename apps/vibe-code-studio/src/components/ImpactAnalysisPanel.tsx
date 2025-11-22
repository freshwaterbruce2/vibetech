import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, FileText, Info,Target, TrendingUp } from 'lucide-react';
import styled from 'styled-components';

import { vibeTheme } from '../styles/theme';

interface ImpactAnalysis {
  targetFile: string;
  directImpact: string[];
  transitiveImpact: string[];
  totalImpact: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

interface ImpactAnalysisPanelProps {
  analysis: ImpactAnalysis;
  onClose?: () => void;
}

export const ImpactAnalysisPanel: React.FC<ImpactAnalysisPanelProps> = ({
  analysis,
  onClose,
}) => {
  const riskColor = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
  }[analysis.riskLevel];

  const riskIcon = {
    low: Info,
    medium: AlertTriangle,
    high: AlertTriangle,
  }[analysis.riskLevel];

  const RiskIcon = riskIcon;

  return (
    <Container
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <Header>
        <Title>
          <Target size={20} />
          Impact Analysis
        </Title>
        {onClose && <CloseButton onClick={onClose}>×</CloseButton>}
      </Header>

      <TargetFile>
        <FileText size={16} />
        <FileName>{analysis.targetFile}</FileName>
      </TargetFile>

      <RiskBadge $color={riskColor}>
        <RiskIcon size={16} />
        {analysis.riskLevel.toUpperCase()} RISK
      </RiskBadge>

      <Section>
        <SectionTitle>
          <TrendingUp size={16} />
          Impact Summary
        </SectionTitle>
        <MetricsGrid>
          <Metric>
            <MetricLabel>Direct Impact</MetricLabel>
            <MetricValue $color="#60a5fa">{analysis.directImpact.length}</MetricValue>
            <MetricSub>files immediately affected</MetricSub>
          </Metric>
          <Metric>
            <MetricLabel>Transitive Impact</MetricLabel>
            <MetricValue $color="#8b5cf6">{analysis.transitiveImpact.length}</MetricValue>
            <MetricSub>files indirectly affected</MetricSub>
          </Metric>
          <Metric>
            <MetricLabel>Total Impact</MetricLabel>
            <MetricValue $color={riskColor}>{analysis.totalImpact}</MetricValue>
            <MetricSub>total files affected</MetricSub>
          </Metric>
        </MetricsGrid>
      </Section>

      {analysis.directImpact.length > 0 && (
        <Section>
          <SectionTitle>Direct Dependencies ({analysis.directImpact.length})</SectionTitle>
          <FileList>
            {analysis.directImpact.slice(0, 10).map((file, i) => (
              <FileItem key={i}>
                <FileDot $color="#60a5fa" />
                {file.split('/').pop() || file}
              </FileItem>
            ))}
            {analysis.directImpact.length > 10 && (
              <MoreText>+ {analysis.directImpact.length - 10} more files</MoreText>
            )}
          </FileList>
        </Section>
      )}

      {analysis.transitiveImpact.length > 0 && (
        <Section>
          <SectionTitle>
            Transitive Dependencies ({analysis.transitiveImpact.length})
          </SectionTitle>
          <FileList>
            {analysis.transitiveImpact.slice(0, 10).map((file, i) => (
              <FileItem key={i}>
                <FileDot $color="#8b5cf6" />
                {file.split('/').pop() || file}
              </FileItem>
            ))}
            {analysis.transitiveImpact.length > 10 && (
              <MoreText>+ {analysis.transitiveImpact.length - 10} more files</MoreText>
            )}
          </FileList>
        </Section>
      )}

      {analysis.recommendations.length > 0 && (
        <Section>
          <SectionTitle>
            <AlertTriangle size={16} />
            Recommendations
          </SectionTitle>
          <RecommendationList>
            {analysis.recommendations.map((rec, i) => (
              <Recommendation key={i}>{rec}</Recommendation>
            ))}
          </RecommendationList>
        </Section>
      )}

      <ImpactBar>
        <BarSegment
          $width={
            analysis.totalImpact > 0
              ? (analysis.directImpact.length / analysis.totalImpact) * 100
              : 0
          }
          $color="#60a5fa"
        />
        <BarSegment
          $width={
            analysis.totalImpact > 0
              ? (analysis.transitiveImpact.length / analysis.totalImpact) * 100
              : 0
          }
          $color="#8b5cf6"
        />
      </ImpactBar>
      <BarLegend>
        <span>Direct</span>
        <span>Transitive</span>
      </BarLegend>
    </Container>
  );
};

const Container = styled(motion.div)`
  background: ${vibeTheme.colors.secondary};
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
  max-width: 600px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${vibeTheme.colors.text};
  font-size: 16px;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${vibeTheme.colors.textSecondary};
  font-size: 28px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
`;

const TargetFile = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  margin-bottom: 16px;
  color: ${vibeTheme.colors.text};
`;

const FileName = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 600;
`;

const RiskBadge = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: ${(props) => props.$color}22;
  color: ${(props) => props.$color};
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 20px;
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${vibeTheme.colors.text};
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

const Metric = styled.div`
  background: rgba(139, 92, 246, 0.05);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
`;

const MetricLabel = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const MetricValue = styled.div<{ $color: string }>`
  color: ${(props) => props.$color};
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const MetricSub = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 10px;
`;

const FileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(139, 92, 246, 0.5);
    border-radius: 3px;
  }
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${vibeTheme.colors.textSecondary};
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
`;

const FileDot = styled.div<{ $color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${(props) => props.$color};
  flex-shrink: 0;
`;

const MoreText = styled.div`
  color: ${vibeTheme.colors.textSecondary};
  font-size: 11px;
  font-style: italic;
  margin-top: 4px;
  padding-left: 14px;
`;

const RecommendationList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Recommendation = styled.li`
  padding: 10px 12px;
  background: rgba(245, 158, 11, 0.1);
  border-left: 3px solid #f59e0b;
  border-radius: 6px;
  color: ${vibeTheme.colors.text};
  font-size: 13px;

  &:before {
    content: '→ ';
    color: #f59e0b;
    font-weight: 700;
  }
`;

const ImpactBar = styled.div`
  display: flex;
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
`;

const BarSegment = styled.div<{ $width: number; $color: string }>`
  width: ${(props) => props.$width}%;
  background: ${(props) => props.$color};
  transition: width 0.3s ease;
`;

const BarLegend = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${vibeTheme.colors.textSecondary};
  font-size: 11px;
`;
