/**
 * Crypto Trading API Service Tests (TDD RED Phase)
 *
 * Tests for CryptoTradingApi that connects to Python FastAPI backend:
 * - Health checks
 * - Balance queries
 * - Position management
 * - Dashboard metrics
 * - Risk analytics
 * - Trading activity
 *
 * Based on REST API integration with snake_case → camelCase transformation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CryptoTradingApi } from '../../services/cryptoTradingApi';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CryptoTradingApi', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should check API health', async () => {
      const mockHealth = { status: 'healthy', database: 'connected', timestamp: '2025-01-01T00:00:00Z' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth,
      });

      const health = await CryptoTradingApi.checkHealth();

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/health'), expect.any(Object));
      expect(health.status).toBe('healthy');
      expect(health.database).toBe('connected');
    });

    it('should handle health check failures', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({ detail: 'Database offline' }),
      });

      await expect(CryptoTradingApi.checkHealth()).rejects.toThrow();
    });
  });

  describe('Balance Operations', () => {
    it('should fetch account balances', async () => {
      const mockBalances = [
        { currency: 'USD', amount: 1000.50, available: 900.50, held: 100.00 },
        { currency: 'XLM', amount: 5000, available: 5000, held: 0 }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBalances,
      });

      const balances = await CryptoTradingApi.getBalances();

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/balances'), expect.any(Object));
      expect(balances).toEqual(mockBalances);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(CryptoTradingApi.getBalances()).rejects.toThrow('Network timeout');
    });
  });

  describe('Position Operations', () => {
    it('should fetch all positions', async () => {
      const mockPositions = [
        { id: '1', pair: 'XLM/USD', side: 'long', volume: 100, entry_price: 0.12, opened_at: '2025-01-01T00:00:00Z' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPositions,
      });

      const positions = await CryptoTradingApi.getPositions();

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/positions'), expect.any(Object));
      expect(positions).toEqual(mockPositions);
    });

    it('should fetch open positions only', async () => {
      const mockPositions = [
        { id: '1', pair: 'XLM/USD', side: 'long', volume: 100, entry_price: 0.12, status: 'open' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPositions,
      });

      const positions = await CryptoTradingApi.getPositions('open');

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/positions?status=open'), expect.any(Object));
      expect(positions[0].status).toBe('open');
    });

    it('should fetch closed positions only', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const positions = await CryptoTradingApi.getPositions('closed');

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/positions?status=closed'), expect.any(Object));
    });
  });

  describe('Dashboard Summary', () => {
    it('should fetch dashboard metrics with snake_case transformation', async () => {
      const mockResponse = {
        total_portfolio_value: 10000,
        total_pnl: 500,
        total_pnl_percent: 5.0,
        daily_pnl: 50,
        daily_pnl_percent: 0.5,
        open_positions: 3,
        active_orders: 2,
        available_balance: 5000,
        total_exposure: 3000,
        risk_score: 25,
        win_rate: 60,
        last_updated: '2025-01-01T00:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const summary = await CryptoTradingApi.getDashboardSummary();

      expect(summary.totalPortfolioValue).toBe(10000);
      expect(summary.totalPnL).toBe(500);
      expect(summary.totalPnLPercent).toBe(5.0);
      expect(summary.dailyPnL).toBe(50);
      expect(summary.openPositions).toBe(3);
      expect(summary.winRate).toBe(60);
    });
  });

  describe('Risk Metrics', () => {
    it('should fetch risk metrics with transformation', async () => {
      const mockResponse = {
        total_exposure: 3000,
        max_exposure: 10000,
        exposure_percent: 30,
        position_count: 3,
        max_positions: 10,
        risk_score: 25,
        max_risk_score: 100,
        portfolio_value: 10000,
        available_balance: 7000,
        margin_used: 3000,
        margin_available: 7000
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const metrics = await CryptoTradingApi.getRiskMetrics();

      expect(metrics.totalExposure).toBe(3000);
      expect(metrics.maxExposure).toBe(10000);
      expect(metrics.exposurePercent).toBe(30);
      expect(metrics.positionCount).toBe(3);
      expect(metrics.riskScore).toBe(25);
    });
  });

  describe('Trading Activity', () => {
    it('should fetch recent activity with default limit', async () => {
      const mockResponse = {
        data: [
          { id: 1, type: 'order', action: 'buy', pair: 'XLM/USD', timestamp: '2025-01-01T00:00:00Z' }
        ],
        count: 1
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const activity = await CryptoTradingApi.getRecentActivity();

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/activity?limit=50'), expect.any(Object));
      expect(activity).toEqual(mockResponse.data);
    });

    it('should fetch activity with custom limit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], count: 0 }),
      });

      await CryptoTradingApi.getRecentActivity(100);

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/activity?limit=100'), expect.any(Object));
    });
  });

  describe('Orders and Trades', () => {
    it('should fetch recent orders', async () => {
      const mockResponse = {
        data: [{ id: 1, pair: 'XLM/USD', type: 'market', side: 'buy', status: 'filled' }],
        count: 1
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const orders = await CryptoTradingApi.getOrders();

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/orders?limit=100'), expect.any(Object));
      expect(orders).toEqual(mockResponse.data);
    });

    it('should fetch trades for specific pair', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], count: 0 }),
      });

      await CryptoTradingApi.getTrades('XLM/USD', 50);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/trades?limit=50&pair=XLM%2FUSD'),
        expect.any(Object)
      );
    });

    it('should fetch all trades without pair filter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [], count: 0 }),
      });

      await CryptoTradingApi.getTrades();

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/trades?limit=100'), expect.any(Object));
    });
  });

  describe('Market Data', () => {
    it('should fetch market data for trading pair', async () => {
      const mockResponse = {
        data: {
          XXLMZUSD: { c: ['0.1234', '100'], v: ['50000', '75000'] }
        },
        timestamp: '2025-01-01T00:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const marketData = await CryptoTradingApi.getMarketData('XLM/USD');

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/market-data/XLM/USD'), expect.any(Object));
      expect(marketData).toEqual(mockResponse.data);
    });
  });

  describe('Position Summaries', () => {
    it('should calculate position summaries with unrealized P&L', async () => {
      const mockPositions = [
        {
          id: '1',
          pair: 'XLM/USD',
          side: 'long',
          volume: 1000,
          entry_price: 0.12,
          stop_loss: 0.11,
          opened_at: '2025-01-01T00:00:00Z'
        }
      ];

      const mockMarketData = {
        XXLMZUSD: { c: ['0.13', '1000'] }
      };

      // Mock positions fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPositions,
      });

      // Mock market data fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockMarketData, timestamp: '2025-01-01T00:00:00Z' }),
      });

      const summaries = await CryptoTradingApi.getPositionSummaries();

      expect(summaries).toHaveLength(1);
      expect(summaries[0].position).toEqual(mockPositions[0]);
      expect(summaries[0].currentPrice).toBeGreaterThan(0);
    });

    it('should handle market data fetch failures gracefully', async () => {
      const mockPositions = [
        { id: '1', pair: 'XLM/USD', side: 'long', volume: 100, entry_price: 0.12, opened_at: '2025-01-01T00:00:00Z' }
      ];

      // Mock positions fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPositions,
      });

      // Mock market data fetch failure
      mockFetch.mockRejectedValueOnce(new Error('Market data unavailable'));

      const summaries = await CryptoTradingApi.getPositionSummaries();

      expect(summaries).toHaveLength(1);
      expect(summaries[0].currentPrice).toBe(0.12); // Falls back to entry_price
      expect(summaries[0].unrealizedPnL).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should wrap HTTP errors with status code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ detail: 'Invalid parameters' }),
      });

      try {
        await CryptoTradingApi.getBalances();
      } catch (error: any) {
        expect(error.name).toBe('CryptoTradingApiError');
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain('Invalid parameters');
      }
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => { throw new Error('Invalid JSON'); },
      });

      await expect(CryptoTradingApi.getDashboardSummary()).rejects.toThrow();
    });

    it('should wrap unknown errors', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error');

      try {
        await CryptoTradingApi.getRiskMetrics();
      } catch (error: any) {
        expect(error.name).toBe('CryptoTradingApiError');
        expect(error.statusCode).toBe(0);
      }
    });
  });
});
