import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Check } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrandMark } from '../components/brand/BrandMark';
import { DatePickerField } from '../components/DatePickerField';
import { Button, ButtonText } from '../components/ui/button';
import { FieldLabel, Input } from '../components/ui/input';
import { PasswordInput } from '../components/ui/password-input';
import { ScreenHeader } from '../components/ui/screen-header';
import { Text } from '../components/ui/text';
import { formatPhone } from '../lib/format';
import { moduleOptions } from '../lib/module-options';
import { register, type ProductModule } from '../services/api';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeProvider';

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
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modules, setModules] = useState<ProductModule[]>(['Loans']);
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
    if (loading || success) return;
    setError('');
    setSuccess('');
    if (!name || !email || !phone || !birthDate || !password || !confirmPassword) {
      setError('Preencha todos os campos.');
      return;
    }

    if (modules.length === 0) {
      setError('Escolha pelo menos um módulo.');
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
      await register({ name, email, phone, birthDate: normalizedBirthDate, password, confirmPassword, modules });
      setSuccess('Cadastro criado com sucesso! Redirecionando para o login...');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível realizar o cadastro.');
    } finally {
      setLoading(false);
    }
  }

  const { colors } = useTheme();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background">
      <ScreenHeader title="Se Organiza" onBack={() => navigation.goBack()} actions={<BrandMark />} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 28 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mx-auto w-full max-w-md gap-4">
          <View className="mb-2">
            <Text accessibilityRole="header" className="text-[30px] font-bold tracking-tight">Criar conta</Text>
            <Text className="mt-1.5 text-sm leading-5 text-muted">Preencha seus dados e escolha os módulos que deseja usar.</Text>
          </View>

          <View>
            <FieldLabel>Nome completo</FieldLabel>
            <Input accessibilityLabel="Nome completo" autoComplete="name" onChangeText={setName} placeholder="Seu nome" value={name} />
          </View>
          <View>
            <FieldLabel>E-mail</FieldLabel>
            <Input accessibilityLabel="E-mail" autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="seu@email.com" value={email} />
          </View>
          <View>
            <FieldLabel>Telefone</FieldLabel>
            <Input accessibilityLabel="Telefone" autoComplete="tel" keyboardType="phone-pad" maxLength={15} onChangeText={(value) => setPhone(formatPhone(value))} placeholder="(00) 00000-0000" value={phone} />
          </View>
          <View>
            <FieldLabel>Data de nascimento</FieldLabel>
            <DatePickerField allowFuture={false} label="Data de nascimento" value={birthDate} onChange={setBirthDate} />
          </View>
          <View>
            <PasswordInput autoComplete="new-password" label="Senha" onChangeText={setPassword} placeholder="Mínimo de 6 caracteres" value={password} />
          </View>
          <View>
            <PasswordInput autoComplete="new-password" label="Confirmação de senha" onChangeText={setConfirmPassword} placeholder="Repita sua senha" value={confirmPassword} />
          </View>

          <View className="mt-2">
            <FieldLabel>Módulos</FieldLabel>
            <View className="gap-2">
              {moduleOptions.map(({ module, title, description, icon: Icon }) => {
                const checked = modules.includes(module);
                return (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    className={`min-h-[54px] flex-row items-center gap-3 rounded-xl border px-3 py-2 ${checked ? 'border-focus bg-selected' : 'border-border bg-input'}`}
                    key={module}
                    onPress={() => setModules((current) => checked ? current.filter((item) => item !== module) : [...current, module])}
                  >
                    <Icon color={checked ? colors.selectedForeground : colors.muted} size={19} />
                    <View className="min-w-0 flex-1">
                      <Text className="text-sm font-semibold">{title}</Text>
                      <Text className="mt-0.5 text-xs text-muted">{description}</Text>
                    </View>
                    <View className={`h-5 w-5 items-center justify-center rounded border ${checked ? 'border-primary bg-primary' : 'border-field-border'}`}>
                      {checked ? <Check color={colors.primaryForeground} size={14} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {error ? <Text accessibilityLiveRegion="polite" className="text-sm text-destructive">{error}</Text> : null}
          {success ? <Text accessibilityLiveRegion="polite" className="text-sm text-success">{success}</Text> : null}

          <Button className="mt-2" disabled={loading || !!success} onPress={handleRegister}>
            <ButtonText>{loading ? 'Salvando...' : 'Criar cadastro'}</ButtonText>
          </Button>
          <Pressable accessibilityRole="button" className="min-h-[44px] justify-center self-start" onPress={() => navigation.goBack()}>
            <Text className="text-sm font-semibold text-link">Já tenho uma conta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
