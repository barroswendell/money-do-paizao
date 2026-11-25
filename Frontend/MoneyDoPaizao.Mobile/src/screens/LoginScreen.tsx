import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PaizaoLogo } from '../components/brand/PaizaoLogo';
import { Button, ButtonText } from '../components/ui/button';
import { FieldLabel, Input } from '../components/ui/input';
import { PasswordInput } from '../components/ui/password-input';
import { Text } from '../components/ui/text';
import { login } from '../services/api';
import { saveSession } from '../services/session';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { colors, resetTheme } = useTheme();

  async function handleLogin() {
    if (loading) return;
    setError('');
    if (!email.trim() || !password) {
      setError('Informe seu e-mail e sua senha.');
      return;
    }

    try {
      setLoading(true);
      const response = await login(email.trim(), password);
      await saveSession(response);
      resetTheme();
      navigation.replace('ModuleSelection', {
        userName: response.name,
        role: response.role,
        token: response.token,
        modules: response.modules?.length ? response.modules : ['Loans'],
      });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mx-auto w-full max-w-md flex-1 justify-center">
          <PaizaoLogo className="mb-10" />
          <Text accessibilityRole="header" className="text-[32px] font-bold leading-[38px] tracking-tight">Bem-vindo de volta</Text>
          <Text className="mb-8 mt-2 text-[15px] leading-6 text-muted">Entre com seu e-mail e sua senha.</Text>

          <View className="mb-4">
            <FieldLabel>E-mail</FieldLabel>
            <Input
              accessibilityLabel="E-mail"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="seu@email.com"
              value={email}
            />
          </View>

          <View className="mb-5">
            <PasswordInput
              label="Senha"
              autoComplete="current-password"
              onChangeText={setPassword}
              onSubmitEditing={handleLogin}
              placeholder="Digite sua senha"
              returnKeyType="go"
              value={password}
            />
          </View>

          {error ? <Text accessibilityLiveRegion="polite" className="mb-3 text-sm text-destructive">{error}</Text> : null}

          <Button className="flex-row gap-3" disabled={loading} onPress={handleLogin}>
            <ButtonText>{loading ? 'Entrando...' : 'Entrar'}</ButtonText>
            {!loading ? <ArrowRight color={colors.primaryForeground} size={18} /> : null}
          </Button>

          <Pressable accessibilityRole="button" className="mt-4 min-h-[44px] justify-center self-start" onPress={() => navigation.navigate('Register')}>
            <Text className="text-sm font-semibold text-link">Criar uma conta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
