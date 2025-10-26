/**
 * Completion Analytics Service
 * Tracks inline completion performance and user behavior
 *
 * Based on 2025 best practices:
 * - Batch writes every 30s (performance optimization)
 * - Session-based aggregation
 * - Privacy-first (100% local)
 * - Industry benchmarks (30% acceptance target)
 */
import { v4 as uuidv4 } from 'uuid';

import { logger } from '../../services/Logger';
import type {
  AnalyticsConfig,
  AnalyticsSummary,
  CompletionEvent,
  CompletionLatency,
  DailyMetrics,
  LanguageMetrics,
  VariationMetrics,
  VariationType,
} from '../../types/analytics';
import { AnalyticsStorage } from '../../utils/AnalyticsStorage';

const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  batchInterval: 30000, // 30 seconds
  maxEvents: 10000,
  retentionDays: 30,
  debug: false,
};

/**
 * Completion Analytics Manager
 */
export class CompletionAnalytics {
  private storage: AnalyticsStorage;
  private config: AnalyticsConfig;
  private eventQueue: CompletionEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  private sessionStartTime: number;
  private completionMap: Map<string, CompletionEvent> = new Map(); // Track shown completions

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.storage = new AnalyticsStorage();
    this.sessionId = uuidv4();
    this.sessionStartTime = Date.now();

    // Start batch write timer
    if (this.config.enabled) {
      this.startBatchTimer();
    }

    // Auto-prune on init
    this.storage.pruneOldData(this.config).catch(console.error);

    if (this.config.debug) {
      logger.debug('📊 CompletionAnalytics initialized:', this.sessionId);
    }
  }

  /**
   * Track completion shown to user
   */
  trackCompletionShown(
    completionId: string,
    variationType: VariationType,
    language: string,
    completionLength: number,
    latency: CompletionLatency,
    fileType: string
  ): void {
    if (!this.config.enabled) {return;}

    const event: CompletionEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      eventType: 'shown',
      variationType,
      language,
      completionLength,
      latency,
      sessionId: this.sessionId,
      fileType,
      completionId,
    };

    // Store for matching with acceptance
    this.completionMap.set(completionId, event);

    this.queueEvent(event);

    // Auto-dismiss after 10 seconds if not accepted/rejected
    setTimeout(() => {
      if (this.completionMap.has(completionId)) {
        this.trackCompletionIgnored(completionId);
      }
    }, 10000);
  }

  /**
   * Track completion accepted
   */
  trackCompletionAccepted(completionId: string, variationType: VariationType): void {
    if (!this.config.enabled) {return;}

    const shownEvent = this.completionMap.get(completionId);
    if (!shownEvent) {
      logger.warn('Acceptance tracked for unknown completion:', completionId);
      return;
    }

    const event: CompletionEvent = {
      ...shownEvent,
      id: uuidv4(),
      timestamp: Date.now(),
      eventType: 'accepted',
      variationType, // Update with actual accepted type
    };

    this.queueEvent(event);
    this.completionMap.delete(completionId);

    if (this.config.debug) {
      logger.debug('✅ Completion accepted:', variationType, shownEvent.language);
    }
  }

  /**
   * Track completion rejected (Esc pressed)
   */
  trackCompletionRejected(completionId: string): void {
    if (!this.config.enabled) {return;}

    const shownEvent = this.completionMap.get(completionId);
    if (!shownEvent) {return;}

    const event: CompletionEvent = {
      ...shownEvent,
      id: uuidv4(),
      timestamp: Date.now(),
      eventType: 'rejected',
    };

    this.queueEvent(event);
    this.completionMap.delete(completionId);
  }

  /**
   * Track completion dismissed (user kept typing)
   */
  trackCompletionDismissed(completionId: string): void {
    if (!this.config.enabled) {return;}

    const shownEvent = this.completionMap.get(completionId);
    if (!shownEvent) {return;}

    const event: CompletionEvent = {
      ...shownEvent,
      id: uuidv4(),
      timestamp: Date.now(),
      eventType: 'dismissed',
    };

    this.queueEvent(event);
    this.completionMap.delete(completionId);
  }

  /**
   * Track completion ignored (timeout)
   */
  private trackCompletionIgnored(completionId: string): void {
    if (!this.config.enabled) {return;}

    const shownEvent = this.completionMap.get(completionId);
    if (!shownEvent) {return;}

    const event: CompletionEvent = {
      ...shownEvent,
      id: uuidv4(),
      timestamp: Date.now(),
      eventType: 'timeout',
    };

    this.queueEvent(event);
    this.completionMap.delete(completionId);
  }

  /**
   * Queue event for batch write
   */
  private queueEvent(event: CompletionEvent): void {
    this.eventQueue.push(event);

    if (this.config.debug) {
      logger.debug('📊 Event queued:', event.eventType, event.variationType);
    }
  }

  /**
   * Start batch write timer
   */
  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      this.flushQueue();
    }, this.config.batchInterval);
  }

  /**
   * Flush event queue to storage
   */
  async flushQueue(): Promise<void> {
    if (this.eventQueue.length === 0) {return;}

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.storage.addEventsBatch(events);

      if (this.config.debug) {
        logger.debug(`📊 Flushed ${events.length} events to storage`);
      }
    } catch (error) {
      logger.error('Failed to flush analytics queue:', error);
      // Re-queue events on failure
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Get analytics summary for date range
   */
  async getSummary(startTime: number, endTime: number): Promise<AnalyticsSummary> {
    const events = await this.storage.getEventsByDateRange(startTime, endTime);

    const shown = events.filter(e => e.eventType === 'shown');
    const accepted = events.filter(e => e.eventType === 'accepted');

    const totalShown = shown.length;
    const totalAccepted = accepted.length;
    const acceptanceRate = totalShown > 0 ? (totalAccepted / totalShown) * 100 : 0;

    // Calculate latencies
    const latencies = shown.map(e => e.latency);
    const avgFirstVisible =
      latencies.length > 0
        ? latencies.reduce((sum, l) => sum + l.firstVisible, 0) / latencies.length
        : 0;
    const avgComplete =
      latencies.length > 0
        ? latencies.reduce((sum, l) => sum + l.complete, 0) / latencies.length
        : 0;

    // Cache hit rate
    const cacheHits = latencies.filter(l => l.fromCache).length;
    const cacheHitRate = latencies.length > 0 ? (cacheHits / latencies.length) * 100 : 0;

    // Streaming usage
    const streamingUsed = latencies.filter(l => l.wasStreaming).length;
    const streamingUsage = latencies.length > 0 ? (streamingUsed / latencies.length) * 100 : 0;

    // Time saved (estimate: 1 char = 0.05s typing time)
    const totalChars = accepted.reduce((sum, e) => sum + e.completionLength, 0);
    const totalTimeSaved = totalChars * 0.05; // seconds

    // By language
    const byLanguage = this.aggregateByLanguage(events);

    // By variation
    const byVariation = this.aggregateByVariation(events);

    // Daily trend
    const dailyTrend = this.aggregateDaily(events);

    return {
      dateRange: { start: startTime, end: endTime },
      totalShown,
      totalAccepted,
      acceptanceRate,
      avgFirstVisible,
      avgComplete,
      cacheHitRate,
      streamingUsage,
      totalTimeSaved,
      byLanguage,
      byVariation,
      dailyTrend,
    };
  }

  /**
   * Aggregate metrics by language
   */
  private aggregateByLanguage(events: CompletionEvent[]): LanguageMetrics[] {
    const langMap = new Map<string, CompletionEvent[]>();

    for (const event of events) {
      if (!langMap.has(event.language)) {
        langMap.set(event.language, []);
      }
      langMap.get(event.language)!.push(event);
    }

    const metrics: LanguageMetrics[] = [];

    for (const [language, langEvents] of langMap) {
      const shown = langEvents.filter(e => e.eventType === 'shown');
      const accepted = langEvents.filter(e => e.eventType === 'accepted');

      const totalShown = shown.length;
      const totalAccepted = accepted.length;
      const acceptanceRate = totalShown > 0 ? (totalAccepted / totalShown) * 100 : 0;

      const avgLength =
        accepted.length > 0
          ? accepted.reduce((sum, e) => sum + e.completionLength, 0) / accepted.length
          : 0;

      const avgLatency =
        shown.length > 0
          ? shown.reduce((sum, e) => sum + e.latency.complete, 0) / shown.length
          : 0;

      const cacheHits = shown.filter(e => e.latency.fromCache).length;
      const cacheHitRate = shown.length > 0 ? (cacheHits / shown.length) * 100 : 0;

      metrics.push({
        language,
        totalShown,
        totalAccepted,
        acceptanceRate,
        avgLength,
        avgLatency,
        cacheHitRate,
      });
    }

    return metrics.sort((a, b) => b.totalShown - a.totalShown);
  }

  /**
   * Aggregate metrics by variation type
   */
  private aggregateByVariation(events: CompletionEvent[]): VariationMetrics[] {
    const varMap = new Map<VariationType, CompletionEvent[]>();

    for (const event of events) {
      if (!varMap.has(event.variationType)) {
        varMap.set(event.variationType, []);
      }
      varMap.get(event.variationType)!.push(event);
    }

    const metrics: VariationMetrics[] = [];

    for (const [type, varEvents] of varMap) {
      const shown = varEvents.filter(e => e.eventType === 'shown');
      const accepted = varEvents.filter(e => e.eventType === 'accepted');

      const totalShown = shown.length;
      const totalAccepted = accepted.length;
      const acceptanceRate = totalShown > 0 ? (totalAccepted / totalShown) * 100 : 0;

      const avgLength =
        accepted.length > 0
          ? accepted.reduce((sum, e) => sum + e.completionLength, 0) / accepted.length
          : 0;

      metrics.push({
        type,
        totalShown,
        totalAccepted,
        acceptanceRate,
        avgLength,
      });
    }

    return metrics.sort((a, b) => b.totalShown - a.totalShown);
  }

  /**
   * Aggregate metrics by day
   */
  private aggregateDaily(events: CompletionEvent[]): DailyMetrics[] {
    const dayMap = new Map<string, CompletionEvent[]>();

    for (const event of events) {
      const date = new Date(event.timestamp).toISOString().split('T')[0];
      if (date) {
        if (!dayMap.has(date)) {
          dayMap.set(date, []);
        }
        dayMap.get(date)!.push(event);
      }
    }

    const metrics: DailyMetrics[] = [];

    for (const [date, dayEvents] of dayMap) {
      const shown = dayEvents.filter(e => e.eventType === 'shown');
      const accepted = dayEvents.filter(e => e.eventType === 'accepted');

      const totalShown = shown.length;
      const totalAccepted = accepted.length;
      const acceptanceRate = totalShown > 0 ? (totalAccepted / totalShown) * 100 : 0;

      const avgLatency =
        shown.length > 0
          ? shown.reduce((sum, e) => sum + e.latency.complete, 0) / shown.length
          : 0;

      metrics.push({
        date,
        totalShown,
        totalAccepted,
        acceptanceRate,
        avgLatency,
      });
    }

    return metrics.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Export analytics data
   */
  async exportData(): Promise<string> {
    const events = await this.storage.getAllEvents();
    const now = Date.now();
    const summary = await this.getSummary(now - 30 * 24 * 60 * 60 * 1000, now);

    const exportData = {
      events,
      summary,
      exportedAt: now,
      version: '1.0',
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Clear all analytics data
   */
  async clearAllData(): Promise<void> {
    await this.storage.clearAllData();
    this.eventQueue = [];
    this.completionMap.clear();

    if (this.config.debug) {
      logger.debug('🗑️ All analytics data cleared');
    }
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;

    if (enabled && !this.batchTimer) {
      this.startBatchTimer();
    } else if (!enabled && this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
      this.flushQueue(); // Final flush
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    return this.storage.getStorageStats();
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    await this.flushQueue();

    if (this.config.debug) {
      logger.debug('📊 CompletionAnalytics shutdown complete');
    }
  }
}

// Singleton instance
let analyticsInstance: CompletionAnalytics | null = null;

export function getAnalyticsInstance(): CompletionAnalytics {
  if (!analyticsInstance) {
    analyticsInstance = new CompletionAnalytics();
  }
  return analyticsInstance;
}
