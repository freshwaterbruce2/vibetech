
/**
 * Utility for browser feature detection that provides graceful degradation
 */

// Helper to safely check if a browser feature exists
export const featureExists = (featureName: string): boolean => {
  try {
    // Check for features in different potential locations
    return !!(
      // @ts-ignore - Using dynamic access for feature detection
      (window[featureName]) || 
      // @ts-ignore - Using dynamic access for feature detection
      (navigator[featureName]) ||
      // @ts-ignore - Using dynamic access for feature detection
      (document[featureName]) ||
      // For CSS features
      (CSS && CSS.supports && CSS.supports(featureName))
    );
  } catch (e) {
    console.warn(`Feature detection for ${featureName} failed:`, e);
    return false;
  }
};

// Common features with fallback information
export const features = {
  webGL: {
    check: () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    },
    fallback: 'Static images instead of 3D rendering'
  },
  webP: {
    check: () => {
      const elem = document.createElement('canvas');
      if (elem.getContext && elem.getContext('2d')) {
        // was able to get 2d context
        return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      }
      return false;
    },
    fallback: 'PNG/JPG images'
  },
  touchScreen: {
    check: () => {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },
    fallback: 'Mouse-optimized interface'
  },
  // Add more feature checks as needed
};

// Hook to use feature detection in components
export const useFeatureDetection = () => {
  return {
    check: featureExists,
    features
  };
};
