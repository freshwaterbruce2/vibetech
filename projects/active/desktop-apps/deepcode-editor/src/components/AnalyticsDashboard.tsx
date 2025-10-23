/**
 * Analytics Dashboard Component
 * Displays inline completion metrics and performance analytics
 *
 * Features:
 * - Real-time acceptance rate tracking
 * - Latency metrics (firstVisible, complete)
 * - Language-specific performance
 * - Variation preference analysis
 * - Cache hit rate monitoring
 * - Date range filtering
 * - Export functionality
 *
 * Based on 2025 best practices:
 * - Zero external chart dependencies (pure CSS)
 * - Responsive design
 * - Privacy-first (local data only)
 */
import { logger } from '../services/Logger';

import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { X, Download, RefreshCw, TrendingUp, Zap, Target, Clock } from 'lucide-react';
import { getAnalyticsInstance } from '../services/ai/CompletionAnalytics';
import type { AnalyticsSummary, LanguageMetrics, VariationMetrics, DailyMetrics } from '../types/analytics';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const DashboardOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const DashboardContainer = styled.div`
  background: #1e1e1e;
  border: 1px solid #3c3c3c;
  border-radius: 12px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #252525;
  }

  &::-webkit-scrollbar-thumb {
    background: #3c3c3c;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #4c4c4c;
  }
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #3c3c3c;
  position: sticky;
  top: 0;
  background: #1e1e1e;
  z-index: 10;
`;

const Title = styled.h2`
  margin: 0;
  color: #e0e0e0;
  font-size: 24px;
  font-weight: 600;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
`;

const IconButton = styled.button`
  background: #2d2d2d;
  border: 1px solid #3c3c3c;
  border-radius: 6px;
  padding: 8px;
  color: #e0e0e0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: #3c3c3c;
    border-color: #4c4c4c;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const DashboardContent = styled.div`
  padding: 24px;
`;

const DateRangeSelector = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  align-items: center;
`;

const DateButton = styled.button<{ $active?: boolean }>`
  background: ${(props) => (props.$active ? '#007acc' : '#2d2d2d')};
  border: 1px solid ${(props) => (props.$active ? '#007acc' : '#3c3c3c')};
  border-radius: 6px;
  padding: 8px 16px;
  color: #e0e0e0;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.$active ? '#0086e6' : '#3c3c3c')};
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const MetricCard = styled.div<{ $color?: string }>`
  background: #252525;
  border: 1px solid #3c3c3c;
  border-radius: 8px;
  padding: 20px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${(props) => props.$color || '#007acc'};
  }
`;

const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #888;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const MetricValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #e0e0e0;
  margin-bottom: 4px;
`;

const MetricLabel = styled.div`
  font-size: 12px;
  color: #888;
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h3`
  color: #e0e0e0;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
`;

const ChartContainer = styled.div`
  background: #252525;
  border: 1px solid #3c3c3c;
  border-radius: 8px;
  padding: 20px;
`;

const BarChartRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
`;

const BarLabel = styled.div`
  min-width: 120px;
  color: #e0e0e0;
  font-size: 14px;
`;

const BarTrack = styled.div`
  flex: 1;
  height: 24px;
  background: #1e1e1e;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

const BarFill = styled.div<{ $percentage: number; $color?: string }>`
  height: 100%;
  width: ${(props) => props.$percentage}%;
  background: ${(props) => props.$color || '#007acc'};
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  color: white;
  font-size: 12px;
  font-weight: 600;
`;

const BarValue = styled.div`
  min-width: 60px;
  text-align: right;
  color: #888;
  font-size: 13px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #888;
`;

const EmptyStateTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #aaa;
`;

const EmptyStateText = styled.div`
  font-size: 14px;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #888;
  font-size: 16px;
`;

type DateRange = '24h' | '7d' | '30d' | 'all';

export default function AnalyticsDashboard({ isOpen, onClose }: AnalyticsDashboardProps) {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [loading, setLoading] = useState(false);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const analytics = getAnalyticsInstance();
      const now = Date.now();
      let startTime: number;

      switch (dateRange) {
        case '24h':
          startTime = now - 24 * 60 * 60 * 1000;
          break;
        case '7d':
          startTime = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case '30d':
          startTime = now - 30 * 24 * 60 * 60 * 1000;
          break;
        case 'all':
          startTime = 0;
          break;
      }

      const data = await analytics.getSummary(startTime, now);
      setSummary(data);
    } catch (error) {
      logger.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    if (isOpen) {
      loadAnalytics();
    }
  }, [isOpen, loadAnalytics]);

  const handleExport = async () => {
    try {
      const analytics = getAnalyticsInstance();
      const exportData = await analytics.exportData();

      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Failed to export analytics:', error);
    }
  };

  if (!isOpen) return null;

  const hasData = summary && summary.totalShown > 0;

  return (
    <DashboardOverlay $isOpen={isOpen} onClick={onClose}>
      <DashboardContainer onClick={(e) => e.stopPropagation()}>
        <DashboardHeader>
          <Title>Completion Analytics</Title>
          <HeaderActions>
            <IconButton onClick={loadAnalytics} disabled={loading}>
              <RefreshCw size={18} />
              Refresh
            </IconButton>
            <IconButton onClick={handleExport} disabled={!hasData}>
              <Download size={18} />
              Export
            </IconButton>
            <IconButton onClick={onClose}>
              <X size={18} />
            </IconButton>
          </HeaderActions>
        </DashboardHeader>

        <DashboardContent>
          <DateRangeSelector>
            <DateButton $active={dateRange === '24h'} onClick={() => setDateRange('24h')}>
              Last 24 Hours
            </DateButton>
            <DateButton $active={dateRange === '7d'} onClick={() => setDateRange('7d')}>
              Last 7 Days
            </DateButton>
            <DateButton $active={dateRange === '30d'} onClick={() => setDateRange('30d')}>
              Last 30 Days
            </DateButton>
            <DateButton $active={dateRange === 'all'} onClick={() => setDateRange('all')}>
              All Time
            </DateButton>
          </DateRangeSelector>

          {loading && <LoadingState>Loading analytics...</LoadingState>}

          {!loading && !hasData && (
            <EmptyState>
              <EmptyStateTitle>No Data Yet</EmptyStateTitle>
              <EmptyStateText>
                Start coding to collect completion analytics. Metrics will appear here once you accept your first
                suggestion.
              </EmptyStateText>
            </EmptyState>
          )}

          {!loading && hasData && summary && (
            <>
              <MetricsGrid>
                <MetricCard $color="#10b981">
                  <MetricHeader>
                    <Target />
                    Acceptance Rate
                  </MetricHeader>
                  <MetricValue>{summary.acceptanceRate.toFixed(1)}%</MetricValue>
                  <MetricLabel>
                    {summary.totalAccepted} / {summary.totalShown} completions
                  </MetricLabel>
                </MetricCard>

                <MetricCard $color="#3b82f6">
                  <MetricHeader>
                    <Clock />
                    Avg Latency
                  </MetricHeader>
                  <MetricValue>{summary.avgFirstVisible.toFixed(0)}ms</MetricValue>
                  <MetricLabel>First visible • {summary.avgComplete.toFixed(0)}ms complete</MetricLabel>
                </MetricCard>

                <MetricCard $color="#f59e0b">
                  <MetricHeader>
                    <Zap />
                    Cache Hit Rate
                  </MetricHeader>
                  <MetricValue>{summary.cacheHitRate.toFixed(1)}%</MetricValue>
                  <MetricLabel>Instant from cache</MetricLabel>
                </MetricCard>

                <MetricCard $color="#8b5cf6">
                  <MetricHeader>
                    <TrendingUp />
                    Time Saved
                  </MetricHeader>
                  <MetricValue>{(summary.totalTimeSaved / 60).toFixed(1)}m</MetricValue>
                  <MetricLabel>Estimated typing time saved</MetricLabel>
                </MetricCard>
              </MetricsGrid>

              <Section>
                <SectionTitle>By Language</SectionTitle>
                <ChartContainer>
                  {summary.byLanguage.slice(0, 5).map((lang) => (
                    <BarChartRow key={lang.language}>
                      <BarLabel>{lang.language}</BarLabel>
                      <BarTrack>
                        <BarFill $percentage={lang.acceptanceRate} $color="#10b981">
                          {lang.acceptanceRate >= 15 && `${lang.acceptanceRate.toFixed(0)}%`}
                        </BarFill>
                      </BarTrack>
                      <BarValue>
                        {lang.totalAccepted}/{lang.totalShown}
                      </BarValue>
                    </BarChartRow>
                  ))}
                </ChartContainer>
              </Section>

              <Section>
                <SectionTitle>By Variation Type</SectionTitle>
                <ChartContainer>
                  {summary.byVariation.map((variation) => (
                    <BarChartRow key={variation.type}>
                      <BarLabel style={{ textTransform: 'capitalize' }}>{variation.type}</BarLabel>
                      <BarTrack>
                        <BarFill $percentage={variation.acceptanceRate} $color="#3b82f6">
                          {variation.acceptanceRate >= 15 && `${variation.acceptanceRate.toFixed(0)}%`}
                        </BarFill>
                      </BarTrack>
                      <BarValue>
                        {variation.totalAccepted}/{variation.totalShown}
                      </BarValue>
                    </BarChartRow>
                  ))}
                </ChartContainer>
              </Section>

              {summary.dailyTrend.length > 0 && (
                <Section>
                  <SectionTitle>Daily Trend</SectionTitle>
                  <ChartContainer>
                    {summary.dailyTrend.slice(-7).map((day) => (
                      <BarChartRow key={day.date}>
                        <BarLabel>{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</BarLabel>
                        <BarTrack>
                          <BarFill $percentage={day.acceptanceRate} $color="#8b5cf6">
                            {day.acceptanceRate >= 15 && `${day.acceptanceRate.toFixed(0)}%`}
                          </BarFill>
                        </BarTrack>
                        <BarValue>
                          {day.totalAccepted}/{day.totalShown}
                        </BarValue>
                      </BarChartRow>
                    ))}
                  </ChartContainer>
                </Section>
              )}
            </>
          )}
        </DashboardContent>
      </DashboardContainer>
    </DashboardOverlay>
  );
}
