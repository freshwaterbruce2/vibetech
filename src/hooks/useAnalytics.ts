
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Define the gtag function since it's added via a script tag
declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'set' | 'js',
      action: string,
      params?: any
    ) => void;
    dataLayer: any[];
  }
}

/**
 * Hook to track page views and send events to Google Analytics
 */
export const useAnalytics = () => {
  const location = useLocation();
  
  // Track page views
  useEffect(() => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('config', 'G-XXXXXXXXXX', {
        page_path: location.pathname + location.search
      });
    }
  }, [location]);
  
  // Function to track custom events
  const trackEvent = (
    eventName: string,
    category: string,
    label?: string,
    value?: number
  ) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', eventName, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  };
  
  return { trackEvent };
};
