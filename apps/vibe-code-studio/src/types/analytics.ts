/**
 * Analytics Type Definitions
 * For tracking inline completion performance and user behavior
 *
 * Based on 2025 best practices:
 * - Privacy-first (all data stored locally)
 * - Industry benchmarks (30% acceptance rate target)
 * - Comprehensive metrics (latency, streaming, variations)
 */

/**
 * Event types for completion lifecycle
 */
export type CompletionEventType =
  | 'shown'      // Completion displayed to user
  | 'accepted'   // User accepted completion (Tab)
  | 'rejected'   // User explicitly rejected (Esc)
  | 'dismissed'  // User ignored (kept typing)
  | 'timeout';   // Completion timed out

/**
 * Variation types for completions
 */
export type VariationType =
  | 'full'          // Complete suggestion
  | 'single-line'   // First line only
  | 'conservative'  // First statement
  | 'two-line';     // First two lines

/**
 * Performance metrics for a completion
 */
export interface CompletionLatency {
  /** Time to first visible characters (ms) */
  firstVisible: number;

  /** Total time to complete response (ms) */
  complete: number;

  /** Whether result came from cache */
  fromCache: boolean;

  /** Whether streaming was used */
  wasStreaming: boolean;

  /** Debounce time (typically 200ms) */
  debounceTime?: number;
}

/**
 * Single completion event
 */
export interface CompletionEvent {
  /** Unique event ID */
  id: string;

  /** Event timestamp (ms since epoch) */
  timestamp: number;

  /** Event type */
  eventType: CompletionEventType;

  /** Completion variation type */
  variationType: VariationType;

  /** Programming language */
  language: string;

  /** Length of completion text (characters) */
  completionLength: number;

  /** Performance metrics */
  latency: CompletionLatency;

  /** Session ID for grouping */
  sessionId: string;

  /** File extension (e.g., 'ts', 'js') */
  fileType: string;

  /** Completion ID (for matching shown→accepted) */
  completionId?: string;
}

/**
 * Aggregated metrics for a language
 */
export interface LanguageMetrics {
  /** Language name */
  language: string;

  /** Total suggestions shown */
  totalShown: number;

  /** Total accepted */
  totalAccepted: number;

  /** Acceptance rate (0-100) */
  acceptanceRate: number;

  /** Average completion length */
  avgLength: number;

  /** Average latency (ms) */
  avgLatency: number;

  /** Cache hit rate (0-100) */
  cacheHitRate: number;
}

/**
 * Aggregated metrics for a variation type
 */
export interface VariationMetrics {
  /** Variation type */
  type: VariationType;

  /** Total shown */
  totalShown: number;

  /** Total accepted */
  totalAccepted: number;

  /** Acceptance rate (0-100) */
  acceptanceRate: number;

  /** Average length */
  avgLength: number;
}

/**
 * Session-level aggregated metrics
 */
export interface SessionMetrics {
  /** Session ID */
  sessionId: string;

  /** Session start time */
  startTime: number;

  /** Session end time */
  endTime: number;

  /** Total completions shown */
  totalShown: number;

  /** Total accepted */
  totalAccepted: number;

  /** Overall acceptance rate (0-100) */
  acceptanceRate: number;

  /** Average latency (ms) */
  avgLatency: number;

  /** Streaming usage (0-100) */
  streamingUsage: number;

  /** Cache hit rate (0-100) */
  cacheHitRate: number;

  /** Metrics by language */
  byLanguage: Record<string, LanguageMetrics>;

  /** Metrics by variation type */
  byVariation: Record<string, VariationMetrics>;

  /** Estimated time saved (seconds) */
  timeSaved: number;
}

/**
 * Overall analytics summary
 */
export interface AnalyticsSummary {
  /** Date range */
  dateRange: {
    start: number;
    end: number;
  };

  /** Total suggestions shown */
  totalShown: number;

  /** Total accepted */
  totalAccepted: number;

  /** Overall acceptance rate (0-100) */
  acceptanceRate: number;

  /** Average first visible latency (ms) */
  avgFirstVisible: number;

  /** Average complete latency (ms) */
  avgComplete: number;

  /** Cache hit rate (0-100) */
  cacheHitRate: number;

  /** Streaming usage rate (0-100) */
  streamingUsage: number;

  /** Total time saved (seconds) */
  totalTimeSaved: number;

  /** Breakdown by language */
  byLanguage: LanguageMetrics[];

  /** Breakdown by variation */
  byVariation: VariationMetrics[];

  /** Daily trend data */
  dailyTrend: DailyMetrics[];
}

/**
 * Daily aggregated metrics
 */
export interface DailyMetrics {
  /** Date (YYYY-MM-DD) */
  date: string;

  /** Total shown */
  totalShown: number;

  /** Total accepted */
  totalAccepted: number;

  /** Acceptance rate */
  acceptanceRate: number;

  /** Average latency */
  avgLatency: number;
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  /** Enable/disable analytics collection */
  enabled: boolean;

  /** Batch write interval (ms) */
  batchInterval: number;

  /** Maximum events to store */
  maxEvents: number;

  /** Data retention period (days) */
  retentionDays: number;

  /** Enable debug logging */
  debug: boolean;
}

/**
 * Export format for CSV
 */
export interface AnalyticsExport {
  events: CompletionEvent[];
  summary: AnalyticsSummary;
  exportedAt: number;
  version: string;
}
