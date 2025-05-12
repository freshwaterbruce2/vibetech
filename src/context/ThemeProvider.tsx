
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({
  theme: 'system',
  setTheme: () => null,
});

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  attribute = 'data-theme',
  defaultTheme = 'system',
  enableSystem = false,
  disableTransitionOnChange = false,
}) => {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove current class
    root.classList.remove('light', 'dark');

    // Add new theme class
    if (theme === 'system' && enableSystem) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      root.setAttribute(attribute, systemTheme);
    } else {
      root.classList.add(theme);
      root.setAttribute(attribute, theme);
    }

    if (disableTransitionOnChange) {
      // Temporarily disable transitions
      root.classList.add('no-transitions');
      setTimeout(() => root.classList.remove('no-transitions'), 0);
    }
  }, [theme, attribute, enableSystem, disableTransitionOnChange]);

  // Listen for system theme changes
  useEffect(() => {
    if (!enableSystem) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(systemTheme);
        root.setAttribute(attribute, systemTheme);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, attribute, enableSystem]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeProvider;
