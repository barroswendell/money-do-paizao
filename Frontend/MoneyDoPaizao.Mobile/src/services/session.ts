import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthResponse } from './api';

const SESSION_KEY = '@se-organiza/auth-session';

export async function saveSession(session: AuthResponse) {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<AuthResponse | null> {
  const value = await AsyncStorage.getItem(SESSION_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as AuthResponse;
  } catch {
    await clearSession();
    return null;
  }
}

export async function clearSession() {
  await AsyncStorage.removeItem(SESSION_KEY);
}
