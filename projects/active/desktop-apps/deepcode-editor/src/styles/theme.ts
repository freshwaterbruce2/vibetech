// Vibe Tech Design System
export const vibeTheme = {
  colors: {
    // Background colors
    primary: '#0a0a0f',
    secondary: '#1a1a2e',
    tertiary: '#2d2d3a',
    surface: '#16213e',
    
    // Accent colors
    cyan: '#00d4ff',
    cyanSecondary: '#4ecdc4',
    purple: '#8b5cf6',
    purpleSecondary: '#a855f7',
    
    // Text colors
    text: '#ffffff',
    textSecondary: '#b4b4b4',
    textMuted: '#6b7280',
    
    // Interactive states
    hover: 'rgba(139, 92, 246, 0.1)',
    active: 'rgba(139, 92, 246, 0.2)',
    
    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #8b5cf6 0%, #00d4ff 100%)',
    secondary: 'linear-gradient(135deg, #a855f7 0%, #4ecdc4 100%)',
    background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #2d2d3a 100%)',
    card: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(0, 212, 255, 0.05) 100%)',
    border: 'linear-gradient(135deg, #8b5cf6 0%, #00d4ff 100%)',
  },
  
  shadows: {
    small: '0 2px 8px rgba(0, 0, 0, 0.3)',
    medium: '0 4px 16px rgba(0, 0, 0, 0.4)',
    large: '0 8px 32px rgba(0, 0, 0, 0.5)',
    glow: '0 0 20px rgba(139, 92, 246, 0.3)',
    cyanGlow: '0 0 20px rgba(0, 212, 255, 0.3)',
  },
  
  borders: {
    thin: '1px solid rgba(139, 92, 246, 0.2)',
    medium: '2px solid rgba(139, 92, 246, 0.4)',
    thick: '3px solid rgba(139, 92, 246, 0.6)',
    neon: '2px solid #00d4ff',
    gradient: '2px solid transparent',
  },
  
  borderRadius: {
    small: '6px',
    medium: '12px',
    large: '16px',
    xl: '24px',
    full: '9999px',
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  
  typography: {
    fontFamily: {
      primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      mono: '"JetBrains Mono", "Fira Code", "Monaco", monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  
  // Root-level properties for backward compatibility
  background: '#0a0a0f',
  text: '#ffffff',
  border: 'rgba(139, 92, 246, 0.2)',
  primary: '#8b5cf6',
  error: '#ef4444',
  surface: '#16213e',
  textSecondary: '#b4b4b4',
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
  success: '#10b981',
  // Add missing properties that components expect
  hover: 'rgba(139, 92, 246, 0.1)',
  accent: '#00d4ff',
  input: '#2d2d3a',
  info: '#3b82f6',
}

export type VibeTheme = typeof vibeTheme