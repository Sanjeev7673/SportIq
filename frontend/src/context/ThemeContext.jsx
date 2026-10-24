import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

const THEME_STORAGE_KEY = 'sportiq_theme';

const ThemeContext = createContext({
  theme: THEME_MODES.SYSTEM,
  resolvedTheme: THEME_MODES.DARK,
  isDark: true,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  // 1. Initialize theme preference from localStorage or default to SYSTEM
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && Object.values(THEME_MODES).includes(saved)) {
      return saved;
    }
    return THEME_MODES.SYSTEM;
  });

  // 2. Track System Color Scheme Preference
  const getSystemTheme = useCallback(() => {
    if (typeof window === 'undefined') return THEME_MODES.DARK;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? THEME_MODES.DARK
      : THEME_MODES.LIGHT;
  }, []);

  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  // 3. Compute resolved active theme ('light' or 'dark')
  const resolvedTheme = theme === THEME_MODES.SYSTEM ? systemTheme : theme;
  const isDark = resolvedTheme === THEME_MODES.DARK;

  // 4. Update DOM classes & attributes when resolvedTheme changes
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  }, [isDark]);

  // 5. Reactive OS color-scheme listener for dynamic system changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setSystemTheme(e.matches ? THEME_MODES.DARK : THEME_MODES.LIGHT);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 6. Set theme with persistence
  const setTheme = (newTheme) => {
    if (Object.values(THEME_MODES).includes(newTheme)) {
      setThemeState(newTheme);
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    }
  };

  // 7. Quick toggle between light and dark
  const toggleTheme = () => {
    const nextTheme = isDark ? THEME_MODES.LIGHT : THEME_MODES.DARK;
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        isDark,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
