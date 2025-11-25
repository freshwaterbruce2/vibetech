import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

// Check if running in Tauri context
export function isTauriContext(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

// Helper to throw helpful error if not in Tauri
function ensureTauriContext() {
  if (!isTauriContext()) {
    throw new Error(
      'Desktop Commander must be run in Tauri context. Please use "npm run tauri:dev" instead of "npm run dev".'
    );
  }
}

export interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error' | 'unknown' | 'starting' | 'stopping';
  pid: number | null;
  port: number | null;
  uptime: number | null;
  health: 'healthy' | 'unhealthy' | 'unknown';
  cpuUsage: number;
  memoryUsage: number;
  autoRestartEnabled: boolean;
  restartCount: number;
}

export interface TradingMetrics {
  balance: number;
  totalTrades: number;
  profitLoss: number;
  winRate: number;
  lastTradeTime: string | null;
  activePosition: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  source: string;
}

// Service Management
export async function getServiceStatus(serviceName: string): Promise<ServiceStatus> {
  ensureTauriContext();
  return invoke<ServiceStatus>('get_service_status', { serviceName });
}

export async function getAllServicesStatus(): Promise<ServiceStatus[]> {
  ensureTauriContext();
  return invoke<ServiceStatus[]>('get_all_services_status');
}

export async function startService(serviceName: string): Promise<boolean> {
  return invoke<boolean>('start_service', { serviceName });
}

export async function stopService(serviceName: string): Promise<boolean> {
  return invoke<boolean>('stop_service', { serviceName });
}

export async function restartService(serviceName: string): Promise<boolean> {
  return invoke<boolean>('restart_service', { serviceName });
}

// NEW: Parallel operations
export async function startAllServices(): Promise<string[]> {
  return invoke<string[]>('start_all_services');
}

export async function stopAllServices(): Promise<string[]> {
  return invoke<string[]>('stop_all_services');
}

// NEW: Health checks
export async function checkServiceHealth(serviceName: string): Promise<string> {
  return invoke<string>('check_service_health', { serviceName });
}

// NEW: Auto-restart control
export async function toggleAutoRestart(
  serviceName: string,
  enabled: boolean
): Promise<boolean> {
  return invoke<boolean>('toggle_auto_restart', { serviceName, enabled });
}

// Trading Bot
export async function getTradingMetrics(): Promise<TradingMetrics> {
  return invoke<TradingMetrics>('get_trading_metrics');
}

export async function getTradingBotStatus(): Promise<{
  isRunning: boolean;
  lastHeartbeat: string | null;
  circuitBreakerStatus: string;
}> {
  return invoke('get_trading_bot_status');
}

// Log Management
export async function getTailLogs(
  serviceName: string,
  lines: number
): Promise<LogEntry[]> {
  return invoke<LogEntry[]>('get_tail_logs', { serviceName, lines });
}

export async function clearLogs(serviceName: string): Promise<boolean> {
  return invoke<boolean>('clear_logs', { serviceName });
}

// Event listeners for real-time updates
export async function listenToServiceEvents(
  callback: (status: ServiceStatus) => void
): Promise<UnlistenFn> {
  return listen<ServiceStatus>('service-status-changed', (event) => {
    callback(event.payload);
  });
}

export async function listenToLogEvents(
  callback: (log: LogEntry) => void
): Promise<UnlistenFn> {
  return listen<LogEntry>('log-entry', (event) => {
    callback(event.payload);
  });
}

export async function listenToTradingMetrics(
  callback: (metrics: TradingMetrics) => void
): Promise<UnlistenFn> {
  return listen<TradingMetrics>('trading-metrics-updated', (event) => {
    callback(event.payload);
  });
}
