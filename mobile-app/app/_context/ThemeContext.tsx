// ThemeContext.tsx – provides light/dark theme handling and persistence
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '@/app/_constants/theme';

export type ThemeContextType = {
  isDark: boolean;
  colors: typeof lightColors;
  toggleTheme: () => void;
  setThemePreference: (pref: 'light' | 'dark' | 'system') => void;
  themePreference: 'light' | 'dark' | 'system';
};

export const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  colors: lightColors,
  toggleTheme: () => { },
  setThemePreference: () => { },
  themePreference: 'system',
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [themePreference, setThemePreferenceState] = useState<'light' | 'dark' | 'system'>('system');

  // Load persisted preference on mount
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('theme_preference');
      if (stored) {
        const pref = stored as 'light' | 'dark' | 'system';
        setThemePreferenceState(pref);
        if (pref === 'light') setIsDark(false);
        else if (pref === 'dark') setIsDark(true);
        else setIsDark(Appearance.getColorScheme() === 'dark');
      } else {
        // No stored pref, follow system
        setIsDark(Appearance.getColorScheme() === 'dark');
      }
    })();
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    setThemePreferenceState('system'); // toggling respects system after manual change
    AsyncStorage.setItem('theme_preference', newIsDark ? 'dark' : 'light');
  };

  const setThemePreference = (pref: 'light' | 'dark' | 'system') => {
    setThemePreferenceState(pref);
    if (pref === 'system') {
      const sys = Appearance.getColorScheme() === 'dark';
      setIsDark(sys);
    } else {
      setIsDark(pref === 'dark');
    }
    AsyncStorage.setItem('theme_preference', pref);
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{ isDark, colors, toggleTheme, setThemePreference, themePreference }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => React.useContext(ThemeContext);

