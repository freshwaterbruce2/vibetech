// Vibe Code Studio - Design System 2025
// Where innovation meets elegant design
export const vibeTheme = {
  colors: {
    // Background colors - refined dark palette
    primary: '#0d0d12',        // Deeper, richer black
    secondary: '#1a1a22',      // Elevated surface
    tertiary: '#242430',       // Card backgrounds
    surface: '#18181f',        // Panel backgrounds
    elevated: '#2a2a35',       // Hover/active surfaces

    // Accent colors - vibrant but refined
    cyan: '#00d4ff',           // Primary accent
    cyanSecondary: '#4ecdc4',  // Secondary cyan
    cyanDark: '#0099cc',       // Darker cyan for contrast
    purple: '#8b5cf6',         // Secondary accent
    purpleSecondary: '#a855f7', // Light purple
    purpleDark: '#6d28d9',     // Dark purple

    // Neutral grays - improved legibility
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },

    // Text colors - WCAG AA compliant
    text: '#f5f5f7',           // Primary text (94% white)
    textPrimary: '#f5f5f7',    // Alias for primary text
    textSecondary: '#a8a9ad',  // Secondary text (66% opacity)
    textMuted: '#6e6f73',      // Muted text (44% opacity)
    textDisabled: '#48494d',   // Disabled text (28% opacity)

    // Border colors
    border: 'rgba(255, 255, 255, 0.1)', // Subtle border color

    // Interactive states - subtle and refined
    hover: 'rgba(139, 92, 246, 0.08)',
    hoverStrong: 'rgba(139, 92, 246, 0.15)',
    active: 'rgba(139, 92, 246, 0.2)',
    focus: 'rgba(0, 212, 255, 0.4)',
    disabled: 'rgba(255, 255, 255, 0.05)',

    // Status colors - vibrant and accessible
    success: '#10b981',        // Green
    successLight: '#34d399',
    warning: '#f59e0b',        // Amber
    warningLight: '#fbbf24',
    error: '#ef4444',          // Red
    errorLight: '#f87171',
    info: '#3b82f6',           // Blue
    infoLight: '#60a5fa',

    // Additional color aliases for compatibility
    green: '#10b981',          // Alias for success
    orange: '#f59e0b',         // Alias for warning
    red: '#ef4444',            // Alias for error
    danger: '#ef4444',         // Alias for error
    background: '#0d0d12',     // Alias for primary background
  },
  
  gradients: {
    // Primary gradients - signature DeepCode style
    primary: 'linear-gradient(135deg, #8b5cf6 0%, #00d4ff 100%)',
    primarySubtle: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(0, 212, 255, 0.1) 100%)',
    secondary: 'linear-gradient(135deg, #a855f7 0%, #4ecdc4 100%)',

    // Background gradients - depth and dimension
    background: 'linear-gradient(135deg, #0d0d12 0%, #1a1a22 50%, #242430 100%)',
    backgroundSubtle: 'linear-gradient(180deg, #0d0d12 0%, #1a1a22 100%)',

    // Surface gradients - cards and panels
    card: 'linear-gradient(135deg, rgba(139, 92, 246, 0.03) 0%, rgba(0, 212, 255, 0.02) 100%)',
    cardHover: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(0, 212, 255, 0.05) 100%)',

    // Border gradients - accents
    border: 'linear-gradient(135deg, #8b5cf6 0%, #00d4ff 100%)',
    borderSubtle: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(0, 212, 255, 0.2) 100%)',
  },

  shadows: {
    // Refined shadow system - subtle depth
    xs: '0 1px 2px rgba(0, 0, 0, 0.25)',
    sm: '0 2px 4px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
    md: '0 4px 8px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.25)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3)',
    xl: '0 16px 32px rgba(0, 0, 0, 0.45), 0 8px 16px rgba(0, 0, 0, 0.35)',

    // Glow effects - accent shadows
    glow: '0 0 16px rgba(139, 92, 246, 0.3), 0 0 4px rgba(139, 92, 246, 0.2)',
    glowStrong: '0 0 24px rgba(139, 92, 246, 0.5), 0 0 8px rgba(139, 92, 246, 0.3)',
    cyanGlow: '0 0 16px rgba(0, 212, 255, 0.3), 0 0 4px rgba(0, 212, 255, 0.2)',
    cyanGlowStrong: '0 0 24px rgba(0, 212, 255, 0.5), 0 0 8px rgba(0, 212, 255, 0.3)',

    // Inner shadows - depth
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.25)',
    innerStrong: 'inset 0 4px 8px rgba(0, 0, 0, 0.35)',

    // Legacy compatibility
    small: '0 2px 4px rgba(0, 0, 0, 0.3)',
    medium: '0 4px 8px rgba(0, 0, 0, 0.35)',
    large: '0 8px 16px rgba(0, 0, 0, 0.4)',
  },
  
  borders: {
    // Border widths and styles
    none: '0',
    thin: '1px solid rgba(139, 92, 246, 0.15)',
    medium: '1px solid rgba(139, 92, 246, 0.3)',
    thick: '2px solid rgba(139, 92, 246, 0.5)',
    strong: '2px solid #8b5cf6',
    neon: '1px solid #00d4ff',
    gradient: '2px solid transparent',

    // Semantic borders
    divider: '1px solid rgba(255, 255, 255, 0.08)',
    subtle: '1px solid rgba(255, 255, 255, 0.05)',
  },

  borderRadius: {
    // Refined radius scale
    none: '0',
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    '3xl': '24px',
    full: '9999px',

    // Legacy compatibility
    small: '6px',
    medium: '8px',
    large: '12px',
  },

  spacing: {
    // 4px base spacing system
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    10: '40px',
    12: '48px',
    14: '56px',
    16: '64px',
    20: '80px',
    24: '96px',
    32: '128px',

    // Legacy compatibility
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  
  typography: {
    // Font families - system native for performance
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "Roboto", system-ui, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", "Cascadia Code", "SF Mono", "Monaco", "Consolas", monospace',
      display: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },

    // Font sizes - refined scale (1.125 ratio)
    fontSize: {
      xs: '0.6875rem',    // 11px - labels, badges
      sm: '0.8125rem',    // 13px - secondary text
      base: '0.9375rem',  // 15px - body text (larger for readability)
      md: '1rem',         // 16px - emphasized text
      lg: '1.125rem',     // 18px - subheadings
      xl: '1.25rem',      // 20px - headings
      '2xl': '1.5rem',    // 24px - large headings
      '3xl': '1.875rem',  // 30px - section titles
      '4xl': '2.25rem',   // 36px - hero text
      '5xl': '3rem',      // 48px - display text
    },

    // Font weights - refined hierarchy
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },

    // Line heights - optimized for readability
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },

    // Letter spacing - refined
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },
  
  animation: {
    // Duration scale
    duration: {
      instant: '0ms',
      fastest: '75ms',
      fast: '150ms',
      normal: '250ms',
      slow: '400ms',
      slower: '600ms',
      slowest: '800ms',
    },

    // Easing functions - refined curves
    easing: {
      // Standard easings
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',              // Smooth
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',

      // Special easings
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',    // Elastic bounce
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',   // Spring effect
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',               // Sharp transition
    },

    // Transition presets
    transition: {
      all: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
      transform: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      colors: 'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1), color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  // Root-level properties for backward compatibility
  background: '#0d0d12',
  text: '#f5f5f7',
  border: 'rgba(139, 92, 246, 0.15)',
  primary: '#8b5cf6',
  error: '#ef4444',
  surface: '#18181f',
  textSecondary: '#a8a9ad',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", "Roboto", system-ui, sans-serif',
  success: '#10b981',
  hover: 'rgba(139, 92, 246, 0.08)',
  accent: '#00d4ff',
  input: '#242430',
  info: '#3b82f6',
}

export type VibeTheme = typeof vibeTheme