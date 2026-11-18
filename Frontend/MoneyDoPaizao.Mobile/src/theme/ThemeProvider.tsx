import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { AppearanceSettings, getAppearanceSettings, updateAppearanceSettings } from '../services/api';

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  useCustomTheme: false,
  primaryColor: '#071629',
  secondaryColor: '#D4A64A',
  isDarkMode: false,
};

export type ThemeColors = {
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  input: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
};

type ThemeContextValue = {
  appearance: AppearanceSettings;
  colors: ThemeColors;
  loading: boolean;
  loadTheme: (token: string) => Promise<void>;
  saveTheme: (token: string, next: AppearanceSettings) => Promise<AppearanceSettings>;
  resetTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3 ? normalized.split('').map((part) => `${part}${part}`).join('') : normalized;
  const number = Number.parseInt(value, 16);
  return `${(number >> 16) & 255} ${(number >> 8) & 255} ${number & 255}`;
}

function contrastColor(hex: string) {
  const normalized = hex.replace('#', '');
  const number = Number.parseInt(normalized, 16);
  const red = (number >> 16) & 255;
  const green = (number >> 8) & 255;
  const blue = number & 255;
  return red * 299 + green * 587 + blue * 114 > 150000 ? '#071629' : '#FFFFFF';
}

function buildColors(appearance: AppearanceSettings): ThemeColors {
  const primary = appearance.useCustomTheme ? appearance.primaryColor : DEFAULT_APPEARANCE.primaryColor;
  const secondary = appearance.useCustomTheme ? appearance.secondaryColor : DEFAULT_APPEARANCE.secondaryColor;
  const dark = appearance.isDarkMode;

  return {
    background: dark ? '#071629' : '#F6F8FB',
    surface: dark ? '#10243B' : '#FFFFFF',
    foreground: dark ? '#F7F9FC' : '#071629',
    muted: dark ? '#A9B5C4' : '#6D7784',
    border: dark ? '#29405A' : '#E2E7ED',
    input: dark ? '#0C1D31' : '#FBFCFE',
    primary,
    primaryForeground: contrastColor(primary),
    secondary,
    secondaryForeground: contrastColor(secondary),
  };
}

function applyWebTheme(colors: ThemeColors) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const root = document.documentElement;
  const values: Record<string, string> = {
    '--color-background': hexToRgb(colors.background),
    '--color-surface': hexToRgb(colors.surface),
    '--color-foreground': hexToRgb(colors.foreground),
    '--color-muted': hexToRgb(colors.muted),
    '--color-border': hexToRgb(colors.border),
    '--color-input': hexToRgb(colors.input),
    '--color-primary': hexToRgb(colors.primary),
    '--color-primary-foreground': hexToRgb(colors.primaryForeground),
    '--color-secondary': hexToRgb(colors.secondary),
    '--color-secondary-foreground': hexToRgb(colors.secondaryForeground),
  };

  Object.entries(values).forEach(([name, value]) => root.style.setProperty(name, value));
  root.style.colorScheme = colors.background === '#071629' ? 'dark' : 'light';
  document.body.style.backgroundColor = colors.background;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', colors.primary);
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [appearance, setAppearance] = useState<AppearanceSettings>(DEFAULT_APPEARANCE);
  const [loading, setLoading] = useState(false);
  const colors = useMemo(() => buildColors(appearance), [appearance]);

  useEffect(() => {
    applyWebTheme(colors);
  }, [colors]);

  const loadTheme = useCallback(async (token: string) => {
    setLoading(true);
    try {
      setAppearance(await getAppearanceSettings(token));
    } catch {
      setAppearance(DEFAULT_APPEARANCE);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveTheme = useCallback(async (token: string, next: AppearanceSettings) => {
    setLoading(true);
    try {
      const updated = await updateAppearanceSettings(token, next);
      setAppearance(updated);
      return updated;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetTheme = useCallback(() => setAppearance(DEFAULT_APPEARANCE), []);

  const value = useMemo(() => ({ appearance, colors, loading, loadTheme, saveTheme, resetTheme }), [appearance, colors, loading, loadTheme, resetTheme, saveTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme deve ser usado dentro de ThemeProvider.');
  return context;
}
