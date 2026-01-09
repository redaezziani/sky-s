'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, ThemeColor, ThemeMode, defaultTheme, themeColors } from '@/lib/theme-config';

interface ThemeContextType {
  theme: Theme;
  setThemeColor: (color: ThemeColor) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      try {
        const parsedTheme = JSON.parse(stored) as Theme;
        setTheme(parsedTheme);
      } catch (error) {
        console.error('Failed to parse stored theme:', error);
      }
    }
    setMounted(true);
  }, []);

  // Apply theme changes to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Apply dark/light mode
    if (theme.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply color theme
    const primaryColor = themeColors[theme.color].primary;
    root.style.setProperty('--primary', primaryColor);

    // Save to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  }, [theme, mounted]);

  const setThemeColor = (color: ThemeColor) => {
    setTheme((prev) => ({
      ...prev,
      color,
      name: `${color}-${prev.mode}`,
    }));
  };

  const setThemeMode = (mode: ThemeMode) => {
    setTheme((prev) => ({
      ...prev,
      mode,
      name: `${prev.color}-${mode}`,
    }));
  };

  const toggleThemeMode = () => {
    setThemeMode(theme.mode === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setThemeColor,
        setThemeMode,
        toggleThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
