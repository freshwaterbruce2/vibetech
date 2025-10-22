/**
 * TypeScript interfaces for Crypto Trading Dashboard
 * Based on the crypto-enhanced trading system database schema
 */

// Base trading data types
export interface TradingPair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  displayName: string;
}

// Order related interfaces
export interface Order {
  id: number;
  order_id: string;
  pair: string;
  side: 'buy' | 'sell';
  order_type: 'market' | 'limit' | 'stop-loss' | 'take-profit';
  volume: number;
  price?: number;
  status: 'pending' | 'open' | 'closed' | 'canceled' | 'expired';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

// Trade execution interfaces
export interface Trade {
  id: number;
  trade_id: string;
  order_id?: string;
  pair: string;
  side: 'buy' | 'sell';
  price: number;
  volume: number;
  fee?: number;
  executed_at?: string;
  created_at: string;
}

export interface Execution {
  id: number;
  order_id?: string;
  exec_id: string;
  exec_type: string;
  trade_id?: string;
  symbol: string;
  side: 'buy' | 'sell';
  last_qty: number;
  last_price: number;
  liquidity_ind?: string;
  cost?: number;
  order_userref?: number;
  order_status?: string;
  order_type?: string;
  fee_usd_equiv?: number;
  timestamp?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

// Position interfaces
export interface Position {
  id: number;
  position_id: string;
  pair: string;
  side: 'long' | 'short';
  entry_price: number;
  volume: number;
  stop_loss?: number;
  take_profit?: number;
  status: 'open' | 'closed' | 'partial';
  opened_at: string;
  closed_at?: string;
  pnl?: number;
  unrealized_pnl?: number;
  metadata?: Record<string, any>;
}

// Market data interfaces
export interface MarketData {
  id: number;
  pair: string;
  timestamp: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  bid?: number;
  ask?: number;
  created_at: string;
}

export interface TickerData {
  pair: string;
  price: number;
  change24h: number;
  change24hPercent: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  bid: number;
  ask: number;
  spread: number;
  lastUpdate: string;
}

// Balance interfaces
export interface Balance {
  asset: string;
  amount: number;
  lockedAmount: number;
  availableAmount: number;
  usdValue?: number;
}

export interface BalanceHistory {
  id: number;
  usd_balance: number;
  xlm_balance: number;
  timestamp: string;
  source: string;
}

// Performance and risk metrics
export interface PerformanceMetrics {
  id: number;
  timestamp: string;
  total_pnl: number;
  win_rate: number;
  sharpe_ratio?: number;
  max_drawdown?: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  average_win: number;
  average_loss: number;
  profit_factor: number;
  metadata?: Record<string, any>;
}

export interface RiskMetrics {
  totalExposure: number;
  maxExposure: number;
  exposurePercent: number;
  positionCount: number;
  maxPositions: number;
  riskScore: number;
  maxRiskScore: number;
  portfolioValue: number;
  availableBalance: number;
  marginUsed: number;
  marginAvailable: number;
}

// System event interfaces
export interface SystemEvent {
  id: number;
  timestamp: string;
  event_type: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  message: string;
  metadata?: Record<string, any>;
}

// Dashboard aggregated data interfaces
export interface DashboardSummary {
  totalPortfolioValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  dailyPnL: number;
  dailyPnLPercent: number;
  openPositions: number;
  activeOrders: number;
  availableBalance: number;
  totalExposure: number;
  riskScore: number;
  winRate: number;
  lastUpdated: string;
}

export interface PositionSummary {
  position: Position;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  riskAmount: number;
  durationHours: number;
  marketData: MarketData;
}

export interface TradingActivity {
  id: string;
  type: 'order' | 'trade' | 'position' | 'event';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
  value?: string;
  pair?: string;
  side?: 'buy' | 'sell';
  amount?: number;
}

// Chart data interfaces
export interface PricePoint {
  timestamp: string;
  price: number;
  volume?: number;
}

export interface PnLPoint {
  timestamp: string;
  pnl: number;
  cumulativePnL: number;
  portfolioValue: number;
}

export interface ChartTimeframe {
  label: string;
  value: '1h' | '4h' | '1d' | '1w' | '1m';
  duration: number; // in milliseconds
}

// Configuration interfaces
export interface TradingConfig {
  maxPositionSize: number;
  maxTotalExposure: number;
  maxPositions: number;
  maxRiskScore: number;
  minBalanceRequired: number;
  tradingPairs: string[];
  fees: {
    makerFee: number;
    takerFee: number;
  };
  riskManagement: {
    stopLossPercent: number;
    takeProfitPercent: number;
    maxDrawdownPercent: number;
  };
}

// API response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Real-time data interfaces
export interface WebSocketMessage {
  type: 'ticker' | 'execution' | 'balance' | 'order' | 'position';
  data: any;
  timestamp: string;
}

export interface ConnectionStatus {
  connected: boolean;
  lastHeartbeat?: string;
  reconnectAttempts: number;
  latency?: number;
}

// Component prop interfaces
export interface DashboardProps {
  refreshInterval?: number;
  autoRefresh?: boolean;
  theme?: 'light' | 'dark';
  compact?: boolean;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  icon?: React.ComponentType<any>;
  loading?: boolean;
  error?: string;
}

// Filter and sorting interfaces
export interface TradeFilter {
  pair?: string;
  side?: 'buy' | 'sell';
  dateFrom?: string;
  dateTo?: string;
  minVolume?: number;
  maxVolume?: number;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// Alert and notification interfaces
export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  dismissed?: boolean;
  actionRequired?: boolean;
}

export interface NotificationSettings {
  enablePnLAlerts: boolean;
  enableRiskAlerts: boolean;
  enableOrderAlerts: boolean;
  enableSystemAlerts: boolean;
  pnlThresholdPercent: number;
  riskThreshold: number;
}