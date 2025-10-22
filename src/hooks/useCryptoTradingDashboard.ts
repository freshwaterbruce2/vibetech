import { useState, useEffect, useCallback } from 'react';
import CryptoTradingApi from '@/services/cryptoTradingApi';
import {
  DashboardSummary,
  PositionSummary,
  RiskMetrics,
  Balance,
  TradingActivity,
  ConnectionStatus
} from '@/types/crypto-trading';

interface UseCryptoTradingDashboardOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseCryptoTradingDashboardReturn {
  // Data
  dashboardSummary: DashboardSummary | null;
  positions: PositionSummary[];
  riskMetrics: RiskMetrics | null;
  balances: Balance[];
  recentActivity: TradingActivity[];
  connectionStatus: ConnectionStatus;

  // State
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Actions
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useCryptoTradingDashboard(
  options: UseCryptoTradingDashboardOptions = {}
): UseCryptoTradingDashboardReturn {
  const { autoRefresh = true, refreshInterval = 30000 } = options;

  // Data state
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [positions, setPositions] = useState<PositionSummary[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [recentActivity, setRecentActivity] = useState<TradingActivity[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    reconnectAttempts: 0
  });

  /**
   * Fetch all dashboard data
   */
  const fetchDashboardData = useCallback(async () => {
    const startTime = Date.now();

    try {
      setIsRefreshing(true);
      setError(null);

      // Check API health first
      const health = await CryptoTradingApi.checkHealth();

      if (health.status !== 'healthy' && health.status !== 'degraded') {
        throw new Error(`API is ${health.status}`);
      }

      // Fetch all data in parallel
      const [
        summaryData,
        riskData,
        balanceData,
        positionData,
        activityData
      ] = await Promise.all([
        CryptoTradingApi.getDashboardSummary(),
        CryptoTradingApi.getRiskMetrics(),
        CryptoTradingApi.getBalances(),
        CryptoTradingApi.getPositionSummaries(),
        CryptoTradingApi.getRecentActivity(50)
      ]);

      // Update state
      setDashboardSummary(summaryData);
      setRiskMetrics(riskData);
      setBalances(balanceData);
      setPositions(positionData);
      setRecentActivity(activityData);

      // Update connection status
      const latency = Date.now() - startTime;
      setConnectionStatus({
        connected: true,
        lastHeartbeat: new Date().toISOString(),
        reconnectAttempts: 0,
        latency
      });

      setLastUpdated(new Date());
      setIsLoading(false);

    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);

      setConnectionStatus(prev => ({
        ...prev,
        connected: false,
        reconnectAttempts: prev.reconnectAttempts + 1
      }));

      // Keep isLoading true only on first load
      if (dashboardSummary === null) {
        setIsLoading(false);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [dashboardSummary]);

  /**
   * Manual refresh
   */
  const refresh = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Initial load and auto-refresh
   */
  useEffect(() => {
    fetchDashboardData();

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchDashboardData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchDashboardData]);

  return {
    // Data
    dashboardSummary,
    positions,
    riskMetrics,
    balances,
    recentActivity,
    connectionStatus,

    // State
    isLoading,
    isRefreshing,
    error,
    lastUpdated,

    // Actions
    refresh,
    clearError
  };
}
