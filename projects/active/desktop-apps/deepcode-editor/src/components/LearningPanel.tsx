/**
 * Learning Panel Component
 *
 * Displays mistakes and knowledge from the shared learning database (D:\databases\agent_learning.db)
 * Shows data from both NOVA Agent and Vibe Code Studio
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../services/Logger';

const PanelContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => props.theme.background || '#1e1e1e'};
  color: ${props => props.theme.foreground || '#d4d4d4'};
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Header = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme.border || '#3e3e3e'};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme.foreground || '#d4d4d4'};
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  padding: 0 16px;
  border-bottom: 1px solid ${props => props.theme.border || '#3e3e3e'};
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  background: ${props => props.active ? props.theme.accent || '#007acc' : 'transparent'};
  color: ${props => props.active ? '#fff' : props.theme.foreground || '#d4d4d4'};
  border: none;
  border-bottom: 2px solid ${props => props.active ? props.theme.accent || '#007acc' : 'transparent'};
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.active ? props.theme.accent || '#007acc' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const RefreshButton = styled.button`
  padding: 6px 12px;
  background: ${props => props.theme.accent || '#007acc'};
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;

  &:hover {
    background: ${props => props.theme.accentHover || '#005a9e'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MistakeCard = styled.div<{ severity: string }>`
  padding: 12px;
  margin-bottom: 12px;
  background: ${props => {
    const severity = props.severity?.toLowerCase();
    if (severity === 'critical') return 'rgba(255, 0, 0, 0.1)';
    if (severity === 'high') return 'rgba(255, 165, 0, 0.1)';
    if (severity === 'medium') return 'rgba(255, 255, 0, 0.1)';
    return 'rgba(128, 128, 128, 0.1)';
  }};
  border-left: 3px solid ${props => {
    const severity = props.severity?.toLowerCase();
    if (severity === 'critical') return '#ff0000';
    if (severity === 'high') return '#ffa500';
    if (severity === 'medium') return '#ffff00';
    return '#808080';
  }};
  border-radius: 4px;
`;

const KnowledgeCard = styled.div`
  padding: 12px;
  margin-bottom: 12px;
  background: rgba(0, 122, 204, 0.1);
  border-left: 3px solid #007acc;
  border-radius: 4px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 8px;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.foreground || '#d4d4d4'};
`;

const Badge = styled.span<{ type?: string }>`
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  background: ${props => {
    if (props.type === 'nova') return 'rgba(138, 43, 226, 0.3)';
    if (props.type === 'vibe') return 'rgba(0, 122, 204, 0.3)';
    return 'rgba(128, 128, 128, 0.3)';
  }};
  color: ${props => props.theme.foreground || '#d4d4d4'};
`;

const CardContent = styled.div`
  font-size: 13px;
  line-height: 1.5;
  color: ${props => props.theme.foreground || '#d4d4d4'};
  margin-bottom: 8px;
`;

const CardMeta = styled.div`
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: ${props => props.theme.foregroundSecondary || '#888'};
  flex-wrap: wrap;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 16px;
  color: ${props => props.theme.foregroundSecondary || '#888'};
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 48px 16px;
  color: ${props => props.theme.foregroundSecondary || '#888'};
`;

interface LearningPanelProps {
  databaseService: DatabaseService;
  onClose?: () => void;
}

type TabType = 'mistakes' | 'knowledge';

export const LearningPanel: React.FC<LearningPanelProps> = ({ databaseService, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('mistakes');
  const [mistakes, setMistakes] = useState<any[]>([]);
  const [knowledge, setKnowledge] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMistakes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await databaseService.getMistakes({ limit: 50 });
      setMistakes(data);
      logger.debug(`[LearningPanel] Loaded ${data.length} mistakes`);
    } catch (err) {
      logger.error('[LearningPanel] Failed to load mistakes:', err);
      setError('Failed to load mistakes');
    } finally {
      setLoading(false);
    }
  }, [databaseService]);

  const loadKnowledge = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await databaseService.getKnowledge({ limit: 50 });
      setKnowledge(data);
      logger.debug(`[LearningPanel] Loaded ${data.length} knowledge entries`);
    } catch (err) {
      logger.error('[LearningPanel] Failed to load knowledge:', err);
      setError('Failed to load knowledge');
    } finally {
      setLoading(false);
    }
  }, [databaseService]);

  const refresh = useCallback(() => {
    if (activeTab === 'mistakes') {
      loadMistakes();
    } else {
      loadKnowledge();
    }
  }, [activeTab, loadMistakes, loadKnowledge]);

  useEffect(() => {
    if (activeTab === 'mistakes') {
      loadMistakes();
    } else {
      loadKnowledge();
    }
  }, [activeTab, loadMistakes, loadKnowledge]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'Unknown';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <PanelContainer>
      <Header>
        <Title>Learning System</Title>
        <RefreshButton onClick={refresh} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </RefreshButton>
      </Header>

      <Tabs>
        <Tab active={activeTab === 'mistakes'} onClick={() => setActiveTab('mistakes')}>
          Mistakes ({mistakes.length})
        </Tab>
        <Tab active={activeTab === 'knowledge'} onClick={() => setActiveTab('knowledge')}>
          Knowledge ({knowledge.length})
        </Tab>
      </Tabs>

      <Content>
        {error && (
          <div style={{ padding: '16px', background: 'rgba(255, 0, 0, 0.1)', borderRadius: '4px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {loading && activeTab === 'mistakes' && mistakes.length === 0 && (
          <LoadingState>Loading mistakes...</LoadingState>
        )}

        {loading && activeTab === 'knowledge' && knowledge.length === 0 && (
          <LoadingState>Loading knowledge...</LoadingState>
        )}

        {!loading && activeTab === 'mistakes' && mistakes.length === 0 && (
          <EmptyState>No mistakes recorded yet</EmptyState>
        )}

        {!loading && activeTab === 'knowledge' && knowledge.length === 0 && (
          <EmptyState>No knowledge entries yet</EmptyState>
        )}

        {activeTab === 'mistakes' && mistakes.map((mistake) => (
          <MistakeCard key={mistake.id} severity={mistake.impactSeverity}>
            <CardHeader>
              <CardTitle>{mistake.description}</CardTitle>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Badge type={mistake.app_source}>{mistake.app_source?.toUpperCase() || 'UNKNOWN'}</Badge>
                <Badge>{mistake.impactSeverity}</Badge>
                {mistake.resolved && <Badge style={{ background: 'rgba(0, 255, 0, 0.3)' }}>RESOLVED</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              {mistake.rootCauseAnalysis && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Root Cause:</strong> {mistake.rootCauseAnalysis}
                </div>
              )}
              {mistake.preventionStrategy && (
                <div>
                  <strong>Prevention:</strong> {mistake.preventionStrategy}
                </div>
              )}
            </CardContent>
            <CardMeta>
              {mistake.mistakeType && <span>Type: {mistake.mistakeType}</span>}
              {mistake.platform && <span>Platform: {mistake.platform}</span>}
              {mistake.identified_at && <span>Date: {formatDate(mistake.identified_at)}</span>}
              {mistake.tags && mistake.tags.length > 0 && (
                <span>Tags: {mistake.tags.join(', ')}</span>
              )}
            </CardMeta>
          </MistakeCard>
        ))}

        {activeTab === 'knowledge' && knowledge.map((entry) => (
          <KnowledgeCard key={entry.id}>
            <CardHeader>
              <CardTitle>{entry.title}</CardTitle>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Badge type={entry.app_source}>{entry.app_source?.toUpperCase() || 'UNKNOWN'}</Badge>
                {entry.category && <Badge>{entry.category}</Badge>}
              </div>
            </CardHeader>
            <CardContent>{entry.content}</CardContent>
            <CardMeta>
              {entry.updated_at && <span>Updated: {formatDate(entry.updated_at)}</span>}
              {entry.created_at && <span>Created: {formatDate(entry.created_at)}</span>}
              {entry.tags && entry.tags.length > 0 && (
                <span>Tags: {entry.tags.join(', ')}</span>
              )}
            </CardMeta>
          </KnowledgeCard>
        ))}
      </Content>
    </PanelContainer>
  );
};
