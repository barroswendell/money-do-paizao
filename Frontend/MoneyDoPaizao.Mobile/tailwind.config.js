const themeColor = (name) => `rgb(var(--color-${name}-r) var(--color-${name}-g) var(--color-${name}-b) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: themeColor('background'),
        surface: themeColor('surface'),
        foreground: themeColor('foreground'),
        muted: themeColor('muted'),
        border: themeColor('border'),
        input: themeColor('input'),
        'field-border': themeColor('field-border'),
        primary: {
          DEFAULT: themeColor('primary'),
          foreground: themeColor('primary-foreground'),
        },
        accent: {
          DEFAULT: themeColor('secondary'),
          foreground: themeColor('secondary-foreground'),
        },
        link: themeColor('link'),
        selected: {
          DEFAULT: themeColor('selected'),
          foreground: themeColor('selected-foreground'),
        },
        focus: themeColor('focus'),
        success: themeColor('success'),
        destructive: themeColor('destructive'),
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
