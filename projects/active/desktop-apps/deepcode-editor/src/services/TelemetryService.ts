/**
 * Telemetry Service for production analytics and error tracking
 */
import { logger } from '../services/Logger';

interface TelemetryEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

interface ErrorEvent {
  error: Error;
  context?: Record<string, any> | undefined;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  sessionId: string;
}

export class TelemetryService {
  private static instance: TelemetryService;
  private sessionId: string;
  private userId?: string;
  private eventQueue: TelemetryEvent[] = [];
  private errorQueue: ErrorEvent[] = [];
  private flushInterval: number = 30000; // 30 seconds
  private maxQueueSize: number = 100;
  private enabled: boolean;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.enabled = import.meta.env['VITE_ENABLE_TELEMETRY'] === 'true';

    if (this.enabled) {
      this.startFlushInterval();
      this.setupErrorHandlers();
    }
  }

  static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  /**
   * Track a custom event
   */
  trackEvent(event: string, properties?: Record<string, any>): void {
    if (!this.enabled) {
      return;
    }

    const telemetryEvent: TelemetryEvent = {
      event,
      ...(properties !== undefined ? { properties } : {}),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...(this.userId !== undefined ? { userId: this.userId } : {}),
    };

    this.eventQueue.push(telemetryEvent);

    if (this.eventQueue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  /**
   * Track an error
   */
  trackError(
    error: Error,
    context?: Record<string, any>,
    severity: ErrorEvent['severity'] = 'medium'
  ): void {
    if (!this.enabled) {
      return;
    }

    const errorEvent: ErrorEvent = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as Error,
      context,
      severity,
      timestamp: Date.now(),
      sessionId: this.sessionId,
    };

    this.errorQueue.push(errorEvent);

    // Immediately flush critical errors
    if (severity === 'critical') {
      this.flushErrors();
    }
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
    this.trackEvent('user_identified', { userId });
  }

  /**
   * Track page view
   */
  trackPageView(page: string, properties?: Record<string, any>): void {
    this.trackEvent('page_view', { page, ...properties });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature: string, properties?: Record<string, any>): void {
    this.trackEvent('feature_used', { feature, ...properties });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.trackEvent('performance_metric', { metric, value, unit });
  }

  /**
   * Flush events to telemetry server
   */
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(import.meta.env['VITE_TELEMETRY_URL'] || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events,
          appVersion: import.meta.env['VITE_APP_VERSION'],
          build: import.meta.env['VITE_APP_BUILD'],
        }),
      });

      if (!response.ok) {
        logger.error('Failed to send telemetry:', response.statusText);
        // Re-queue events if failed
        this.eventQueue.unshift(...events);
      }
    } catch (error) {
      logger.error('Telemetry error:', error);
      // Re-queue events if failed
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Flush errors to error tracking server
   */
  private async flushErrors(): Promise<void> {
    if (this.errorQueue.length === 0) {
      return;
    }

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      const response = await fetch(import.meta.env['VITE_ERROR_REPORTING_URL'] || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errors,
          appVersion: import.meta.env['VITE_APP_VERSION'],
          build: import.meta.env['VITE_APP_BUILD'],
          platform: navigator.platform,
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        logger.error('Failed to send error report:', response.statusText);
      }
    } catch (error) {
      logger.error('Error reporting failed:', error);
    }
  }

  /**
   * Setup global error handlers
   */
  private setupErrorHandlers(): void {
    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.trackError(
        new Error(event.message),
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        'high'
      );
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          reason: event.reason,
          promise: event.promise,
        },
        'high'
      );
    });
  }

  /**
   * Start interval to flush events
   */
  private startFlushInterval(): void {
    setInterval(() => {
      this.flush();
      this.flushErrors();
    }, this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
      this.flushErrors();
    });
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Disable telemetry
   */
  disable(): void {
    this.enabled = false;
    this.eventQueue = [];
    this.errorQueue = [];
  }

  /**
   * Enable telemetry
   */
  enable(): void {
    this.enabled = true;
    this.startFlushInterval();
    this.setupErrorHandlers();
  }
}

// Export singleton instance
export const telemetry = TelemetryService.getInstance();
