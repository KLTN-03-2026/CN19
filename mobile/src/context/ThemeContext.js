import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (e) {
      console.log('Error loading theme:', e);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('themeMode', newMode ? 'dark' : 'light');
    } catch (e) {
      console.log('Error saving theme:', e);
    }
  };

  const theme = {
    isDarkMode,
    colors: {
      neon: '#39FF14',
      primary: '#39FF14',
      background: isDarkMode ? '#060606' : '#F5F7FA',
      card: isDarkMode ? 'rgba(255,255,255,0.04)' : '#ffffff',
      text: isDarkMode ? '#ffffff' : '#1A1A1A',
      subtext: isDarkMode ? '#888888' : '#666666',
      border: isDarkMode ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
      inputBg: isDarkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
      shadow: isDarkMode ? '#000' : '#000',
    },
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
