/**
 * Code Quality Panel Component
 *
 * Displays code quality metrics and issues for the current file or project
 */
import React, { useEffect,useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, FileText,Info, TrendingUp } from 'lucide-react';
import styled from 'styled-components';

import { CodeQualityAnalyzer, FileQuality, QualityReport } from '../services/CodeQualityAnalyzer';
import { logger } from '../services/Logger';

interface CodeQualityPanelProps {
  analyzer: CodeQualityAnalyzer;
  currentFile?: {
    path: string;
    content: string;
  };
  workspaceRoot?: string;
  onIssueClick?: (filePath: string, line?: number) => void;
}

export const CodeQualityPanel: React.FC<CodeQualityPanelProps> = ({
  analyzer,
  currentFile,
  workspaceRoot,
  onIssueClick,
}) => {
  const [fileQuality, setFileQuality] = useState<FileQuality | null>(null);
  const [projectQuality, setProjectQuality] = useState<QualityReport | null>(null);
  const [view, setView] = useState<'file' | 'project'>('file');
  const [loading, setLoading] = useState(false);

  // Analyze current file
  useEffect(() => {
    if (currentFile && view === 'file') {
      analyzeCurrentFile();
    }
  }, [currentFile, view]);

  const analyzeCurrentFile = async () => {
    if (!currentFile) {return;}

    setLoading(true);
    try {
      const result = await analyzer.analyzeFile(currentFile.path, currentFile.content);
      setFileQuality(result);
    } catch (error) {
      logger.error('Failed to analyze file:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeProject = async () => {
    if (!workspaceRoot) {return;}

    setLoading(true);
    try {
      const result = await analyzer.analyzeProject(workspaceRoot);
      setProjectQuality(result);
    } catch (error) {
      logger.error('Failed to analyze project:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQualityColor = (score: number): string => {
    if (score >= 80) {return '#10b981';} // Green
    if (score >= 60) {return '#f59e0b';} // Orange
    return '#ef4444'; // Red
  };

  const getComplexityColor = (rating: string): string => {
    if (rating === 'simple') {return '#10b981';}
    if (rating === 'moderate') {return '#f59e0b';}
    if (rating === 'complex') {return '#fb923c';}
    return '#ef4444'; // very-complex
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle size={16} color="#ef4444" />;
      case 'warning':
        return <AlertTriangle size={16} color="#f59e0b" />;
      default:
        return <Info size={16} color="#3b82f6" />;
    }
  };

  return (
    <Container>
      <Header>
        <Title>Code Quality</Title>
        <ViewToggle>
          <ViewButton active={view === 'file'} onClick={() => setView('file')}>
            <FileText size={16} />
            File
          </ViewButton>
          <ViewButton
            active={view === 'project'}
            onClick={() => {
              setView('project');
              if (!projectQuality) {analyzeProject();}
            }}
          >
            <TrendingUp size={16} />
            Project
          </ViewButton>
        </ViewToggle>
      </Header>

      {loading && <LoadingText>Analyzing...</LoadingText>}

      {/* File View */}
      {view === 'file' && fileQuality && !loading && (
        <Content>
          {/* Quality Score */}
          <ScoreCard>
            <ScoreCircle color={getQualityColor(fileQuality.quality)}>
              <ScoreValue>{Math.round(fileQuality.quality)}</ScoreValue>
              <ScoreLabel>Quality Score</ScoreLabel>
            </ScoreCircle>
          </ScoreCard>

          {/* Metrics Grid */}
          <MetricsGrid>
            <Metric>
              <MetricLabel>Lines of Code</MetricLabel>
              <MetricValue>{fileQuality.linesOfCode}</MetricValue>
            </Metric>
            <Metric>
              <MetricLabel>Comments</MetricLabel>
              <MetricValue>{fileQuality.commentLines}</MetricValue>
            </Metric>
            <Metric>
              <MetricLabel>Complexity</MetricLabel>
              <MetricValue style={{ color: getComplexityColor(analyzer.getComplexityRating(fileQuality.complexity)) }}>
                {fileQuality.complexity}
              </MetricValue>
            </Metric>
            <Metric>
              <MetricLabel>Maintainability</MetricLabel>
              <MetricValue
                style={{
                  color: fileQuality.maintainability === 'high' ? '#10b981' : fileQuality.maintainability === 'medium' ? '#f59e0b' : '#ef4444',
                }}
              >
                {fileQuality.maintainability}
              </MetricValue>
            </Metric>
          </MetricsGrid>

          {/* Issues List */}
          {fileQuality.issues.length > 0 && (
            <IssuesSection>
              <SectionTitle>
                Issues ({fileQuality.issues.length})
              </SectionTitle>
              <IssuesList>
                {fileQuality.issues.map((issue, idx) => (
                  <IssueItem
                    key={idx}
                    onClick={() => issue.line && onIssueClick?.(fileQuality.filePath, issue.line)}
                  >
                    <IssueHeader>
                      {getSeverityIcon(issue.severity)}
                      <IssueType>{issue.type}</IssueType>
                      <IssueSeverity severity={issue.severity}>
                        {issue.severity}
                      </IssueSeverity>
                    </IssueHeader>
                    <IssueMessage>{issue.message}</IssueMessage>
                    {issue.suggestion && (
                      <IssueSuggestion>
                        <CheckCircle size={14} color="#10b981" />
                        {issue.suggestion}
                      </IssueSuggestion>
                    )}
                  </IssueItem>
                ))}
              </IssuesList>
            </IssuesSection>
          )}

          {fileQuality.issues.length === 0 && (
            <NoIssues>
              <CheckCircle size={48} color="#10b981" />
              <NoIssuesText>No quality issues detected!</NoIssuesText>
            </NoIssues>
          )}
        </Content>
      )}

      {/* Project View */}
      {view === 'project' && projectQuality && !loading && (
        <Content>
          <ProjectStats>
            <StatCard>
              <StatValue>{projectQuality.totalFiles}</StatValue>
              <StatLabel>Files Analyzed</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{projectQuality.totalLinesOfCode.toLocaleString()}</StatValue>
              <StatLabel>Lines of Code</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue style={{ color: getQualityColor(projectQuality.averageQuality) }}>
                {Math.round(projectQuality.averageQuality)}
              </StatValue>
              <StatLabel>Avg Quality</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{projectQuality.filesWithIssues}</StatValue>
              <StatLabel>Files with Issues</StatLabel>
            </StatCard>
          </ProjectStats>

          {/* Files with Issues */}
          {projectQuality.filesWithIssues > 0 && (
            <IssuesSection>
              <SectionTitle>
                Files Needing Attention ({projectQuality.filesWithIssues})
              </SectionTitle>
              <FilesList>
                {projectQuality.fileReports
                  .filter(f => f.issues.length > 0)
                  .sort((a, b) => a.quality - b.quality)
                  .slice(0, 10)
                  .map((file, idx) => (
                    <FileItem key={idx} onClick={() => onIssueClick?.(file.filePath)}>
                      <FileName>{file.filePath.split('/').pop()}</FileName>
                      <FileMetrics>
                        <FileMetric>
                          Quality: <span style={{ color: getQualityColor(file.quality) }}>{Math.round(file.quality)}</span>
                        </FileMetric>
                        <FileMetric>Issues: {file.issues.length}</FileMetric>
                        <FileMetric>Complexity: {file.complexity}</FileMetric>
                      </FileMetrics>
                    </FileItem>
                  ))}
              </FilesList>
            </IssuesSection>
          )}
        </Content>
      )}

      {!currentFile && view === 'file' && !loading && (
        <EmptyState>
          <FileText size={48} color="#6b7280" />
          <EmptyStateText>Open a file to see quality metrics</EmptyStateText>
        </EmptyState>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${p => p.theme.background || p.theme.colors.primary};
  color: ${p => p.theme.text || p.theme.colors.text};
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid ${p => p.theme.border || (p.theme.borders?.divider) || 'rgba(255, 255, 255, 0.08)'};
`;

const Title = styled.h2`
  font-size: 16px;
  font-weight: 600;
  margin: 0;
`;

const ViewToggle = styled.div`
  display: flex;
  gap: 4px;
  background: ${p => p.theme.colors.secondary || '#1a1a22'};
  border-radius: 6px;
  padding: 2px;
`;

const ViewButton = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: ${p => (p.active ? p.theme.primary || p.theme.colors.purple : 'transparent')};
  color: ${p => (p.active ? '#fff' : p.theme.textSecondary || p.theme.colors.textSecondary)};
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${p => (p.active ? p.theme.primary || p.theme.colors.purple : p.theme.hover || p.theme.colors.hover)};
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const LoadingText = styled.div`
  text-align: center;
  padding: 32px;
  color: ${p => p.theme.textSecondary || p.theme.colors.textSecondary};
`;

const ScoreCard = styled.div`
  display: flex;
  justify-content: center;
  padding: 24px 0;
`;

const ScoreCircle = styled.div<{ color: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 8px solid ${p => p.color};
  background: ${p => p.theme.colors.secondary || '#1a1a22'};
`;

const ScoreValue = styled.div`
  font-size: 36px;
  font-weight: 700;
`;

const ScoreLabel = styled.div`
  font-size: 12px;
  color: ${p => p.theme.textSecondary || p.theme.colors.textSecondary};
  margin-top: 4px;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 24px;
`;

const Metric = styled.div`
  padding: 16px;
  background: ${p => p.theme.colors.secondary || '#1a1a22'};
  border-radius: 8px;
`;

const MetricLabel = styled.div`
  font-size: 12px;
  color: ${p => p.theme.textSecondary || p.theme.colors.textSecondary};
  margin-bottom: 8px;
`;

const MetricValue = styled.div`
  font-size: 24px;
  font-weight: 600;
`;

const IssuesSection = styled.div`
  margin-top: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px 0;
`;

const IssuesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const IssueItem = styled.div`
  padding: 12px;
  background: ${p => p.theme.colors.secondary || '#1a1a22'};
  border-radius: 6px;
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${p => p.theme.hover || p.theme.colors.hover};
    border-left-color: ${p => p.theme.primary || p.theme.colors.purple};
  }
`;

const IssueHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
`;

const IssueType = styled.span`
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
`;

const IssueSeverity = styled.span<{ severity: string }>`
  margin-left: auto;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  background: ${p =>
    p.severity === 'error' ? '#fee2e2' : p.severity === 'warning' ? '#fef3c7' : '#dbeafe'};
  color: ${p => (p.severity === 'error' ? '#991b1b' : p.severity === 'warning' ? '#92400e' : '#1e40af')};
`;

const IssueMessage = styled.div`
  font-size: 13px;
  margin-bottom: 8px;
`;

const IssueSuggestion = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${p => p.theme.textSecondary || p.theme.colors.textSecondary};
  font-style: italic;
`;

const NoIssues = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  gap: 16px;
`;

const NoIssuesText = styled.div`
  font-size: 16px;
  color: ${p => p.theme.textSecondary || p.theme.colors.textSecondary};
`;

const ProjectStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  padding: 16px;
  background: ${p => p.theme.colors.secondary || '#1a1a22'};
  border-radius: 8px;
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: ${p => p.theme.textSecondary || p.theme.colors.textSecondary};
`;

const FilesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FileItem = styled.div`
  padding: 12px;
  background: ${p => p.theme.colors.secondary || '#1a1a22'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${p => p.theme.hover || p.theme.colors.hover};
  }
`;

const FileName = styled.div`
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const FileMetrics = styled.div`
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: ${p => p.theme.textSecondary || p.theme.colors.textSecondary};
`;

const FileMetric = styled.div`
  span {
    font-weight: 600;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
`;

const EmptyStateText = styled.div`
  font-size: 14px;
  color: ${p => p.theme.textSecondary || p.theme.colors.textSecondary};
`;
