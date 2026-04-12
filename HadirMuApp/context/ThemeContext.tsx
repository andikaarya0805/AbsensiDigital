import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { LIGHT_COLORS, DARK_COLORS } from '../constants/theme';

type Mode = 'light' | 'dark';

interface ThemeContextType {
  theme: Mode;
  colors: typeof DARK_COLORS;
  setTheme: (mode: Mode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Mode>('dark'); // Default to dark as per current app style

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const storedTheme = await SecureStore.getItemAsync('hadirmu_theme');
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setTheme(storedTheme);
      }
    } catch (e) {
      console.error('Failed to load theme preference:', e);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await SecureStore.setItemAsync('hadirmu_theme', newTheme);
    } catch (e) {
      console.error('Failed to save theme preference:', e);
    }
  };

  const colors = theme === 'light' ? LIGHT_COLORS : DARK_COLORS;
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme, toggleTheme, isDark }}>
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
