import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { ArrowLeft, CalendarDays, CreditCard, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PaizaoLogo } from '../components/brand/PaizaoLogo';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Text } from '../components/ui/text';
import { register } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

function normalizeBirthDate(value: string) {
  const trimmedValue = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    return isValidDate(trimmedValue) ? trimmedValue : null;
  }

  const digits = trimmedValue.replace(/\D/g, '');
  if (digits.length !== 8) {
    return null;
  }

  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  const normalizedValue = `${year}-${month}-${day}`;
  return isValidDate(normalizedValue) ? normalizedValue : null;
}

function isValidDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!success) {
      return;
    }

    const timeout = setTimeout(() => navigation.replace('Login'), 1400);
    return () => clearTimeout(timeout);
  }, [navigation, success]);

  async function handleRegister() {
    setError('');
    setSuccess('');
    if (!name || !email || !cpf || !birthDate || !password || !confirmPassword) {
      setError('Preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      setError('A confirmação de senha não confere.');
      return;
    }

    const normalizedBirthDate = normalizeBirthDate(birthDate);
    if (!normalizedBirthDate) {
      setError('Informe uma data válida no formato DD/MM/AAAA.');
      return;
    }

    try {
      setLoading(true);
      await register({ name, email, cpf, birthDate: normalizedBirthDate, password, confirmPassword });
      setSuccess('Cadastro criado com sucesso! Redirecionando para o login...');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível realizar o cadastro.');
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
        <View className="mx-auto w-full max-w-md">
          <View className="mb-8 flex-row items-center">
            <Button accessibilityLabel="Voltar" className="mr-3 h-11 w-11 px-0" onPress={() => navigation.goBack()} variant="outline">
              <ArrowLeft color="#071629" size={18} strokeWidth={1.8} />
            </Button>
            <PaizaoLogo className="flex-1" compact />
          </View>

          <Card className="p-5 shadow-sm">
            <Text className="mb-1 text-[19px] font-extrabold text-foreground">Dados pessoais</Text>
            <Text className="mb-5 text-[13px] leading-[19px] text-muted">
              Seu perfil será criado como usuário padrão.
            </Text>

            <View className="mb-4">
              <Text className="mb-1.5 text-[13px] font-bold text-foreground">Nome completo</Text>
              <View className="flex-row items-center rounded-xl border border-border bg-input px-3.5">
                <UserRound color="#6D7784" size={18} strokeWidth={1.8} />
                <Input className="border-0 bg-transparent px-3" onChangeText={setName} placeholder="Seu nome" value={name} />
              </View>
            </View>

            <View className="mb-4">
              <Text className="mb-1.5 text-[13px] font-bold text-foreground">E-mail</Text>
              <View className="flex-row items-center rounded-xl border border-border bg-input px-3.5">
                <Mail color="#6D7784" size={18} strokeWidth={1.8} />
                <Input autoCapitalize="none" className="border-0 bg-transparent px-3" keyboardType="email-address" onChangeText={setEmail} placeholder="seu@email.com" value={email} />
              </View>
            </View>

            <View className="mb-4">
              <Text className="mb-1.5 text-[13px] font-bold text-foreground">CPF</Text>
              <View className="flex-row items-center rounded-xl border border-border bg-input px-3.5">
                <CreditCard color="#6D7784" size={18} strokeWidth={1.8} />
                <Input className="border-0 bg-transparent px-3" keyboardType="numeric" maxLength={14} onChangeText={setCpf} placeholder="000.000.000-00" value={cpf} />
              </View>
            </View>

            <View className="mb-4">
              <Text className="mb-1.5 text-[13px] font-bold text-foreground">Data de nascimento</Text>
              <View className="flex-row items-center rounded-xl border border-border bg-input px-3.5">
                <CalendarDays color="#6D7784" size={18} strokeWidth={1.8} />
                <Input className="border-0 bg-transparent px-3" keyboardType="numbers-and-punctuation" onChangeText={setBirthDate} placeholder="DD/MM/AAAA" value={birthDate} />
              </View>
            </View>

            <View className="mb-4">
              <Text className="mb-1.5 text-[13px] font-bold text-foreground">Senha</Text>
              <View className="flex-row items-center rounded-xl border border-border bg-input px-3.5">
                <LockKeyhole color="#6D7784" size={18} strokeWidth={1.8} />
                <Input className="border-0 bg-transparent px-3" onChangeText={setPassword} placeholder="Mínimo de 6 caracteres" secureTextEntry={!showPassword} value={password} />
                <Pressable accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onPress={() => setShowPassword((current) => !current)}>
                  {showPassword ? <EyeOff color="#6D7784" size={18} /> : <Eye color="#6D7784" size={18} />}
                </Pressable>
              </View>
            </View>

            <View className="mb-4">
              <Text className="mb-1.5 text-[13px] font-bold text-foreground">Confirmar senha</Text>
              <View className="flex-row items-center rounded-xl border border-border bg-input px-3.5">
                <LockKeyhole color="#6D7784" size={18} strokeWidth={1.8} />
                <Input className="border-0 bg-transparent px-3" onChangeText={setConfirmPassword} placeholder="Repita sua senha" secureTextEntry={!showConfirmPassword} value={confirmPassword} />
                <Pressable accessibilityLabel={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'} onPress={() => setShowConfirmPassword((current) => !current)}>
                  {showConfirmPassword ? <EyeOff color="#6D7784" size={18} /> : <Eye color="#6D7784" size={18} />}
                </Pressable>
              </View>
            </View>

            {error ? <Text className="mb-3 text-[13px] leading-[18px] text-destructive">{error}</Text> : null}
            {success ? <Text className="mb-3 text-[13px] leading-[18px] text-[#1A7F5A]">{success}</Text> : null}

            <Button className="mt-1" disabled={loading} onPress={handleRegister}>
              <ButtonText>{loading ? 'Salvando...' : 'Criar cadastro'}</ButtonText>
            </Button>

            <Pressable className="mt-5 items-center" onPress={() => navigation.goBack()}>
              <Text className="text-sm font-extrabold text-primary">Já tenho cadastro</Text>
            </Pressable>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
