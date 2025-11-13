/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './public/index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Light theme colors
        light: {
          bg: '#ffffff',
          surface: '#f8fafc',
          card: '#ffffff',
          text: '#1f2937',
          textSecondary: '#6b7280',
          border: '#e5e7eb',
          accent: '#3b82f6',
          accentHover: '#2563eb',
        },
        // Dark theme colors (current)
        dark: {
          bg: '#0f0f0f',
          surface: '#1a1a1a',
          card: '#2a2a2a',
          text: '#ffffff',
          textSecondary: '#a1a1aa',
          border: '#374151',
          accent: '#00d4ff',
          accentHover: '#00b8e6',
        },
        // AMOLED theme colors (true black)
        amoled: {
          bg: '#000000',
          surface: '#0a0a0a',
          card: '#111111',
          text: '#ffffff',
          textSecondary: '#888888',
          border: '#222222',
          accent: '#00ff88',
          accentHover: '#00cc6a',
        },
        // Legacy colors for backward compatibility
        gray: {
          900: '#0a0a0a',
          800: '#1a1a1a',
          700: '#2a2a2a',
          600: '#333333',
        },
        cyan: {
          400: '#00d4ff',
          500: '#00b8e6',
        }
      },
      boxShadow: {
        'elevated': '0 8px 25px rgba(0, 0, 0, 0.3)',
        'elevated-light': '0 8px 25px rgba(0, 0, 0, 0.1)',
        'elevated-amoled': '0 8px 25px rgba(0, 255, 136, 0.1)'
      }
    },
  },
  plugins: [],
};
