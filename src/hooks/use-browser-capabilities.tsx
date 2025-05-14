
import React from 'react';
import { features } from '@/lib/feature-detection';

interface BrowserCapabilities {
  supportsWebGL: boolean;
  supportsWebP: boolean;
  isTouchDevice: boolean;
  prefersReducedMotion: boolean;
  isLowPowerMode: boolean;
  batteryLevel?: number;
}

export function useBrowserCapabilities(): BrowserCapabilities {
  const [capabilities, setCapabilities] = React.useState<BrowserCapabilities>({
    supportsWebGL: true,
    supportsWebP: true,
    isTouchDevice: false,
    prefersReducedMotion: false,
    isLowPowerMode: false,
  });

  React.useEffect(() => {
    // Detect features
    const supportsWebGL = features.webGL.check();
    const supportsWebP = features.webP.check();
    const isTouchDevice = features.touchScreen.check();
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Detect if device might be in low power mode (various heuristics)
    let isLowPowerMode = false;
    let batteryLevel: number | undefined = undefined;
    
    // Try to get battery info if available
    if ('getBattery' in navigator) {
      // @ts-ignore - Navigator battery API
      navigator.getBattery().then((battery: any) => {
        isLowPowerMode = battery.charging === false && battery.level < 0.2;
        batteryLevel = battery.level;
        
        setCapabilities(prev => ({
          ...prev,
          isLowPowerMode,
          batteryLevel
        }));
      }).catch(() => {
        // Battery API failed, continue without it
      });
    }

    setCapabilities({
      supportsWebGL,
      supportsWebP,
      isTouchDevice,
      prefersReducedMotion,
      isLowPowerMode,
      batteryLevel
    });
  }, []);

  return capabilities;
}
