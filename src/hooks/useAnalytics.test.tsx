import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAnalytics } from './useAnalytics';

describe('useAnalytics', () => {
  let gtagSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock gtag function
    gtagSpy = vi.fn();
    window.gtag = gtagSpy;
    window.dataLayer = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as any).gtag;
    delete (window as any).dataLayer;
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter>{children}</MemoryRouter>
  );

  it('should track page view on mount', () => {
    renderHook(() => useAnalytics(), { wrapper });

    expect(gtagSpy).toHaveBeenCalledWith('config', 'G-TCZZ9JFEKN', {
      page_path: '/',
    });
  });

  it('should handle missing gtag gracefully', () => {
    delete (window as any).gtag;

    const { result } = renderHook(() => useAnalytics(), { wrapper });

    // Should not throw and should return tracking functions
    expect(result.current.trackEvent).toBeDefined();
    expect(result.current.trackServiceView).toBeDefined();
    expect(result.current.trackButtonClick).toBeDefined();
  });

  describe('trackEvent', () => {
    it('should track custom event with all options', () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      result.current.trackEvent('test_event', {
        category: 'Test Category',
        label: 'Test Label',
        value: 100,
        nonInteraction: true,
        customDimensions: { custom_key: 'custom_value' },
      });

      expect(gtagSpy).toHaveBeenCalledWith('event', 'test_event', {
        event_category: 'Test Category',
        event_label: 'Test Label',
        value: 100,
        non_interaction: true,
        custom_key: 'custom_value',
      });
    });

    it('should track custom event with minimal options', () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      result.current.trackEvent('minimal_event', {
        category: 'Minimal',
      });

      expect(gtagSpy).toHaveBeenCalledWith('event', 'minimal_event', {
        event_category: 'Minimal',
        event_label: undefined,
        value: undefined,
        non_interaction: false,
      });
    });

    it('should not throw when gtag is undefined', () => {
      delete (window as any).gtag;
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      expect(() => {
        result.current.trackEvent('test_event', { category: 'Test' });
      }).not.toThrow();
    });
  });

  describe('trackServiceView', () => {
    it('should track service view with correct parameters', () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      result.current.trackServiceView('service-123', 'Web Development');

      expect(gtagSpy).toHaveBeenCalledWith('event', 'service_view', {
        event_category: 'Services',
        event_label: 'Web Development',
        value: undefined,
        non_interaction: false,
        service_id: 'service-123',
      });
    });
  });

  describe('trackButtonClick', () => {
    it('should track button click with location', () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      result.current.trackButtonClick('Get Started', 'hero-section');

      expect(gtagSpy).toHaveBeenCalledWith('event', 'button_click', {
        event_category: 'Engagement',
        event_label: 'Get Started',
        value: undefined,
        non_interaction: false,
        location: 'hero-section',
      });
    });
  });

  describe('trackFeatureInteraction', () => {
    it('should track feature interaction with action', () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      result.current.trackFeatureInteraction('Search', 'submit');

      expect(gtagSpy).toHaveBeenCalledWith('event', 'feature_interaction', {
        event_category: 'Features',
        event_label: 'Search',
        value: undefined,
        non_interaction: false,
        action: 'submit',
      });
    });
  });

  describe('trackDashboardTabChange', () => {
    it('should track dashboard tab changes', () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      result.current.trackDashboardTabChange('customers');

      expect(gtagSpy).toHaveBeenCalledWith('event', 'dashboard_tab_change', {
        event_category: 'Dashboard',
        event_label: 'customers',
        value: undefined,
        non_interaction: false,
        tab_name: 'customers',
      });
    });
  });

  describe('trackLeadAction', () => {
    it('should track lead action with lead data', () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      result.current.trackLeadAction('converted', { id: 42, name: 'John Doe' });

      expect(gtagSpy).toHaveBeenCalledWith('event', 'lead_action', {
        event_category: 'Dashboard',
        event_label: 'converted',
        value: undefined,
        non_interaction: false,
        action: 'converted',
        lead_id: 42,
        lead_name: 'John Doe',
      });
    });

    it('should track lead action without lead data', () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      result.current.trackLeadAction('created');

      expect(gtagSpy).toHaveBeenCalledWith('event', 'lead_action', {
        event_category: 'Dashboard',
        event_label: 'created',
        value: undefined,
        non_interaction: false,
        action: 'created',
        lead_id: undefined,
        lead_name: undefined,
      });
    });
  });

  describe('trackDashboardMetricView', () => {
    it('should track metric view as non-interactive', () => {
      const { result } = renderHook(() => useAnalytics(), { wrapper });

      result.current.trackDashboardMetricView('total_revenue');

      expect(gtagSpy).toHaveBeenCalledWith('event', 'dashboard_metric_view', {
        event_category: 'Dashboard',
        event_label: 'total_revenue',
        value: undefined,
        non_interaction: true,
        metric_name: 'total_revenue',
      });
    });
  });
});
