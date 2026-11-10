import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PaizaoLogo } from '../components/brand/PaizaoLogo';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Text } from '../components/ui/text';
import { login } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    if (!email.trim() || !password) {
      setError('Informe seu e-mail e sua senha.');
      return;
    }

    try {
      setLoading(true);
      const response = await login(email.trim(), password);
      navigation.replace('Dashboard', { userName: response.name, role: response.role, token: response.token });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        className="flex-1 bg-background"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mx-auto w-full max-w-md flex-1 justify-center">
          <PaizaoLogo className="mb-8" />

          <Card className="p-5 shadow-sm">
            <Text className="mb-1 text-[19px] font-extrabold text-foreground">Entrar na conta</Text>
            <Text className="mb-5 text-[13px] leading-[19px] text-muted">
              Use seu e-mail e sua senha para continuar.
            </Text>

            <View className="mb-4">
              <Text className="mb-1.5 text-[13px] font-bold text-foreground">E-mail</Text>
              <View className="flex-row items-center rounded-xl border border-border bg-input px-3.5">
                <Mail color="#6D7784" size={18} strokeWidth={1.8} />
                <Input
                  autoCapitalize="none"
                  autoComplete="email"
                  className="border-0 bg-transparent px-3"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="seu@email.com"
                  value={email}
                />
              </View>
            </View>

            <View className="mb-4">
              <Text className="mb-1.5 text-[13px] font-bold text-foreground">Senha</Text>
              <View className="flex-row items-center rounded-xl border border-border bg-input px-3.5">
                <LockKeyhole color="#6D7784" size={18} strokeWidth={1.8} />
                <Input
                  className="border-0 bg-transparent px-3"
                  onChangeText={setPassword}
                  placeholder="Digite sua senha"
                  secureTextEntry={!showPassword}
                  value={password}
                />
                <Pressable accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onPress={() => setShowPassword((current) => !current)}>
                  {showPassword ? <EyeOff color="#6D7784" size={18} /> : <Eye color="#6D7784" size={18} />}
                </Pressable>
              </View>
            </View>

            {error ? <Text className="mb-3 text-[13px] leading-[18px] text-destructive">{error}</Text> : null}

            <Button className="mt-1" disabled={loading} onPress={handleLogin}>
              <ButtonText>{loading ? 'Entrando...' : 'Entrar'}</ButtonText>
            </Button>

            <Pressable className="mt-5 items-center" onPress={() => navigation.navigate('Register')}>
              <Text className="text-sm font-extrabold text-primary">Criar uma conta</Text>
            </Pressable>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
