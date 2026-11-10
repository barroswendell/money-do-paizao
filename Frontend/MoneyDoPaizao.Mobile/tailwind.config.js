/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#F6F8FB',
        surface: '#FFFFFF',
        foreground: '#071629',
        muted: '#6D7784',
        border: '#E2E7ED',
        input: '#FBFCFE',
        navy: '#071629',
        gold: {
          DEFAULT: '#D4A64A',
          foreground: '#071629',
        },
        primary: {
          DEFAULT: '#071629',
          foreground: '#FFFFFF',
        },
        accent: '#D4A64A',
        destructive: '#B33A3A',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
