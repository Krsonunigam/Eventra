import React from 'react';
import { Moon, Zap } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, setThemeMode } = useTheme();

  const themes = [
    { id: 'dark', name: 'Dark', icon: Moon, color: 'text-cyan-400' },
    { id: 'amoled', name: 'AMOLED', icon: Zap, color: 'text-green-400' }
  ];

  const getThemeIcon = (themeId) => {
    const themeConfig = themes.find(t => t.id === themeId);
    return themeConfig ? themeConfig.icon : Moon;
  };


  const getThemeName = (themeId) => {
    const themeConfig = themes.find(t => t.id === themeId);
    return themeConfig ? themeConfig.name : 'Dark';
  };

  const IconComponent = getThemeIcon(theme);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium theme-text-secondary uppercase tracking-wider">
        Theme
      </h3>
      
      <div className="space-y-1">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.id;
          
          return (
            <button
              key={themeOption.id}
              onClick={() => setThemeMode(themeOption.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'theme-card theme-text shadow-md'
                  : 'theme-text-secondary hover:theme-text hover:theme-surface'
              }`}
            >
              <Icon className={`h-4 w-4 ${themeOption.color}`} />
              <span>{themeOption.name}</span>
              {isActive && (
                <div className="ml-auto w-2 h-2 theme-accent-bg rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
      
      <div className="pt-2 border-t theme-border">
        <div className="flex items-center space-x-2 text-xs theme-text-secondary">
          <IconComponent className="h-3 w-3" />
          <span>Current: {getThemeName(theme)}</span>
        </div>
      </div>
    </div>
  );
};

export default ThemeToggle;
