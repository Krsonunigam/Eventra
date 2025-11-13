// Theme utility functions for getting theme-aware classes
export const getThemeClasses = (theme) => {
  const themes = {
    dark: {
      bg: 'bg-gray-900',
      surface: 'bg-gray-800',
      card: 'bg-gray-800',
      text: 'text-white',
      textSecondary: 'text-gray-400',
      border: 'border-gray-700',
      accent: 'text-cyan-400',
      accentBg: 'bg-cyan-400',
      accentHover: 'hover:bg-cyan-500',
      input: 'bg-gray-700 border-gray-600 text-white',
      button: 'bg-cyan-400 hover:bg-cyan-500 text-black',
      sidebar: 'bg-gray-900 border-gray-800',
      navbar: 'bg-gray-900 border-gray-800'
    },
    amoled: {
      bg: 'bg-black',
      surface: 'bg-gray-900',
      card: 'bg-gray-900',
      text: 'text-white',
      textSecondary: 'text-gray-500',
      border: 'border-gray-800',
      accent: 'text-green-400',
      accentBg: 'bg-green-400',
      accentHover: 'hover:bg-green-500',
      input: 'bg-black border-gray-800 text-white',
      button: 'bg-green-400 hover:bg-green-500 text-black',
      sidebar: 'bg-black border-gray-800',
      navbar: 'bg-black border-gray-800'
    }
  };

  return themes[theme] || themes.amoled;
};

// Get theme-aware body classes
export const getBodyClasses = (theme) => {
  const themeClasses = getThemeClasses(theme);
  return `${themeClasses.bg} ${themeClasses.text} transition-colors duration-300`;
};

// Get theme-aware component classes
export const getComponentClasses = (theme, component) => {
  const themeClasses = getThemeClasses(theme);
  return themeClasses[component] || '';
};

// Get theme-specific CSS variables
export const getThemeCSSVars = (theme) => {
  const themes = {
    dark: {
      '--bg-color': '#0f0f0f',
      '--surface-color': '#1a1a1a',
      '--card-color': '#2a2a2a',
      '--text-color': '#ffffff',
      '--text-secondary': '#a1a1aa',
      '--border-color': '#374151',
      '--accent-color': '#00d4ff',
      '--accent-hover': '#00b8e6'
    },
    amoled: {
      '--bg-color': '#000000',
      '--surface-color': '#0a0a0a',
      '--card-color': '#111111',
      '--text-color': '#ffffff',
      '--text-secondary': '#888888',
      '--border-color': '#222222',
      '--accent-color': '#00ff88',
      '--accent-hover': '#00cc6a'
    }
  };

  return themes[theme] || themes.amoled;
};
