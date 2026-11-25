import { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import './global.css';
import { AppNavigator } from './src/navigation/AppNavigator';
import { ThemeProvider, useTheme } from './src/theme/ThemeProvider';
import { loadSession } from './src/services/session';
import type { AuthResponse } from './src/services/api';

function configureProgressiveWebApp() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return;
  }

  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = '/manifest.json';
    document.head.appendChild(manifest);
  }

  const addMeta = (name: string, content: string) => {
    if (document.querySelector(`meta[name="${name}"]`)) {
      return;
    }

    const meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    document.head.appendChild(meta);
  };

  addMeta('theme-color', '#071629');
  addMeta('mobile-web-app-capable', 'yes');
  addMeta('apple-mobile-web-app-capable', 'yes');
  addMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
  addMeta('apple-mobile-web-app-title', 'Se Organiza');

  if (!document.querySelector('link[rel="apple-touch-icon"]')) {
    const appleIcon = document.createElement('link');
    appleIcon.rel = 'apple-touch-icon';
    appleIcon.href = '/icon.svg';
    document.head.appendChild(appleIcon);
  }

  if (!__DEV__ && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }
}

export default function App() {
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  useEffect(() => {
    configureProgressiveWebApp();
    loadSession()
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setSessionLoaded(true));
  }, []);

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppContent session={session} sessionLoaded={sessionLoaded} />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

function AppContent({ session, sessionLoaded }: { session: AuthResponse | null; sessionLoaded: boolean }) {
  const { appearance, colors } = useTheme();
  const baseTheme = appearance.isDarkMode ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.foreground,
      border: colors.border,
      notification: colors.destructive,
    },
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={appearance.isDarkMode ? 'light' : 'dark'} />
      {sessionLoaded ? (
        <NavigationContainer theme={navigationTheme}>
          <AppNavigator session={session} />
        </NavigationContainer>
      ) : (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}
    </SafeAreaView>
  );
}
