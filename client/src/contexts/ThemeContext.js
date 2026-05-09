import React, { createContext, useContext, useState, useEffect } from 'react';
import { getThemeCSSVars } from '../utils/themeUtils';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('amoled'); // Default to amoled
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && ['dark', 'amoled'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('theme', theme);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    
    // Apply CSS variables for stable theming
    const cssVars = getThemeCSSVars(theme);
    const root = document.documentElement;
    
    Object.entries(cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // Debug logging
    // 
    // 
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'amoled') return 'dark';
      return 'amoled';
    });
  };

  const setThemeMode = (newTheme) => {
    if (['dark', 'amoled'].includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const value = {
    theme,
    sidebarOpen,
    toggleTheme,
    setThemeMode,
    toggleSidebar,
    closeSidebar
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
