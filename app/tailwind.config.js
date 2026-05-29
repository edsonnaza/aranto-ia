/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './resources/**/*.blade.php',
    './resources/**/*.js',
    './resources/**/*.ts',
    './resources/**/*.tsx',
    './resources/**/*.vue',
    './resources/**/*.jsx',
    './resources/**/*.css',
    './resources/**/*.md',
    './resources/**/*.mdx',
    './resources/**/*.html',
    './app/**/*.tsx',
    './app/**/*.ts',
    './app/**/*.js',
    './app/**/*.jsx',
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          50: '#f0f7f5',
          100: '#d4e8e3',
          200: '#a8d1c7',
          300: '#7cbaab',
          400: '#50a38f',
          500: '#34a853',
          600: '#2a8a45',
          700: '#1e3034',
          800: '#1a2a2e',
          900: '#0f1a1e',
        },
        card: {
          DEFAULT: '#fff',
          dark: '#0f1a1e',
        },
        'card-foreground': {
          DEFAULT: '#222',
          dark: '#fff',
        },
        border: {
          DEFAULT: '#a8d1c7',
          dark: '#1e3034',
        },
        background: {
          DEFAULT: '#fff',
          dark: '#0f1a1e',
        },
        muted: {
          DEFAULT: '#f0f7f5',
          dark: '#1a2a2e',
        },
        accent: {
          DEFAULT: '#50a38f',
          dark: '#2a8a45',
        },
        destructive: {
          DEFAULT: '#ef4444',
          dark: '#ef4444',
        },
        warning: {
          DEFAULT: '#f97316',
          dark: '#f97316',
        },
      },
      borderRadius: {
        lg: '1rem',
        xl: '1.25rem',
      },
      fontFamily: {
        sans: [
          'Instrument Sans',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji',
        ],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
