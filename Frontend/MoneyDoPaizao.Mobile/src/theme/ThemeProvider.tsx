import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { vars } from 'nativewind';
import { Platform, View } from 'react-native';
import { type AppearanceSettings, getAppearanceSettings, updateAppearanceSettings } from '../services/api';
import { buildColors, colorVariables, DEFAULT_APPEARANCE } from './palette';

export type ThemeColors = ReturnType<typeof buildColors>;

type ThemeContextValue = {
  appearance: AppearanceSettings;
  colors: ThemeColors;
  loading: boolean;
  loadTheme: (token: string) => Promise<void>;
  saveTheme: (token: string, next: AppearanceSettings) => Promise<AppearanceSettings>;
  resetTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);
  const [loading, setLoading] = useState(false);
  const revision = useRef(0);
  const colors = useMemo(() => buildColors(appearance), [appearance]);
  const variables = useMemo(() => colorVariables(colors), [colors]);
  const nativeTheme = useMemo(() => vars(variables), [variables]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const { style } = document.documentElement;
    Object.entries(variables).forEach(([name, value]) => style.setProperty(name, String(value)));
    style.colorScheme = appearance.isDarkMode ? 'dark' : 'light';
    style.backgroundColor = colors.background;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors.background);
  }, [appearance.isDarkMode, colors.background, variables]);

  const loadTheme = useCallback(async (token: string) => {
    const request = ++revision.current;
    setLoading(true);
    try {
      const saved = await getAppearanceSettings(token);
      if (request === revision.current) setAppearance(saved);
    } catch {
      // A failed refresh leaves the active appearance in place.
    } finally {
      if (request === revision.current) setLoading(false);
    }
  }, []);

  const saveTheme = useCallback(async (token: string, next: AppearanceSettings) => {
    const request = ++revision.current;
    setLoading(true);
    try {
      const saved = await updateAppearanceSettings(token, next);
      if (request === revision.current) setAppearance(saved);
      return saved;
    } finally {
      if (request === revision.current) setLoading(false);
    }
  }, []);

  const resetTheme = useCallback(() => {
    revision.current += 1;
    setAppearance(DEFAULT_APPEARANCE);
    setLoading(false);
  }, []);

  const value = useMemo(() => ({ appearance, colors, loading, loadTheme, saveTheme, resetTheme }), [appearance, colors, loading, loadTheme, saveTheme, resetTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <View className="flex-1" style={Platform.OS === 'web' ? undefined : nativeTheme}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme deve ser usado dentro de ThemeProvider.');
  return context;
}
