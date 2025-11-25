import { useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'vibetech-theme';

const isClient = typeof window !== 'undefined';

const readStoredTheme = (): ThemePreference | null => {
  if (!isClient) return null;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : null;
  } catch {
    return null;
  }
};

const readSystemTheme = (): Exclude<ThemePreference, 'system'> => {
  if (!isClient) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>(() => readStoredTheme() ?? 'system');
  const [systemTheme, setSystemTheme] = useState<Exclude<ThemePreference, 'system'>>(readSystemTheme);

  // Listen for system theme changes
  useEffect(() => {
    if (!isClient) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Apply theme to the document element
  useEffect(() => {
    if (!isClient) return;
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    const effectiveTheme = theme === 'system' ? systemTheme : theme;
    root.classList.add(effectiveTheme);
    root.setAttribute('data-theme', effectiveTheme);
  }, [theme, systemTheme]);

  const setTheme = (newTheme: ThemePreference) => {
    setThemeState(newTheme);
    if (!isClient) return;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignore storage failures (e.g., privacy mode)
    }
  };

  const toggleTheme = () => {
    const nextTheme: ThemePreference =
      theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(nextTheme);
  };

  return {
    theme,
    setTheme,
    toggleTheme,
    systemTheme
  };
}
