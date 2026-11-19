import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { ArrowRight, HandCoins, LogOut, PartyPopper, PiggyBank, Settings, ShoppingBag } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../components/ui/card';
import { Text } from '../components/ui/text';
import { PaizaoLogo } from '../components/brand/PaizaoLogo';
import { RootStackParamList } from '../navigation/AppNavigator';
import { activateModule, type ProductModule } from '../services/api';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'ModuleSelection'>;

const options: { module: ProductModule; title: string; description: string; icon: typeof HandCoins }[] = [
  { module: 'Loans', title: 'Empréstimos', description: 'Clientes, juros, recebimentos e atrasos.', icon: HandCoins },
  { module: 'Parties', title: 'Organização de festas', description: 'Agenda, temas, sinais e valores pendentes.', icon: PartyPopper },
  { module: 'PersonalFinance', title: 'Finanças pessoais', description: 'Entradas, gastos e saldo do seu mês.', icon: PiggyBank },
  { module: 'Sales', title: 'Vendas', description: 'Produtos, clientes e pagamentos.', icon: ShoppingBag },
];

export function ModuleSelectionScreen({ navigation, route }: Props) {
  const { token, userName, role, modules } = route.params;
  const [loadingModule, setLoadingModule] = useState<ProductModule | null>(null);
  const [error, setError] = useState('');
  const { colors, loadTheme, resetTheme } = useTheme();

  useEffect(() => { loadTheme(token); }, [loadTheme, token]);

  async function openModule(module: ProductModule) {
    try {
      setError('');
      setLoadingModule(module);
      const response = await activateModule(token, module);
      const availableModules = response.modules?.length ? response.modules : [...modules, module];
      if (module === 'Loans') navigation.replace('Dashboard', { userName, role, token: response.token, module, modules: availableModules });
      if (module === 'Parties') navigation.replace('PartyDashboard', { userName, role, token: response.token, modules: availableModules });
      if (module === 'PersonalFinance') navigation.replace('Finance', { userName, role, token: response.token, modules: availableModules });
      if (module === 'Sales') navigation.replace('SalesDashboard', { userName, role, token: response.token, modules: availableModules });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível abrir este módulo.');
    } finally {
      setLoadingModule(null);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
        <View className="mx-auto w-full max-w-2xl flex-1 justify-center">
          <View className="mb-8 flex-row items-start justify-between"><PaizaoLogo /><Pressable accessibilityLabel="Abrir configurações" className="h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface" onPress={() => navigation.navigate('Settings', { token })}><Settings color={colors.primary} size={19} /></Pressable></View>
          <Text className="mb-1 text-2xl font-extrabold text-navy">Olá, {userName}.</Text>
          <Text className="mb-6 text-[14px] leading-5 text-muted">Escolha o que você quer organizar agora. Você pode ativar outros módulos com o mesmo cadastro.</Text>
          {error ? <Text className="mb-4 text-[13px] text-destructive">{error}</Text> : null}
          <View className="gap-3">
            {options.map((option) => {
              const Icon = option.icon;
              const active = modules.includes(option.module);
              const loading = loadingModule === option.module;
              return (
                <Pressable key={option.module} disabled={loadingModule !== null} onPress={() => openModule(option.module)}>
                  <Card className={`flex-row items-center p-4 ${active ? 'border-navy' : ''}`}>
                    <View className={`h-12 w-12 items-center justify-center rounded-2xl ${active ? 'bg-gold' : 'bg-border/60'}`}><Icon color="#071629" size={22} strokeWidth={1.8} /></View>
                    <View className="ml-4 flex-1"><Text className="text-[16px] font-extrabold text-navy">{option.title}</Text><Text className="mt-1 text-[12px] leading-4 text-muted">{option.description}</Text><Text className={`mt-2 text-[11px] font-extrabold uppercase tracking-wider ${active ? 'text-[#1A7F5A]' : 'text-muted'}`}>{active ? 'Módulo disponível · Acessar' : 'Disponível para ativar'}</Text></View>
                    {loading ? <ActivityIndicator color="#D4A64A" /> : <ArrowRight color={active ? '#071629' : '#6D7784'} size={20} />}
                  </Card>
                </Pressable>
              );
            })}
          </View>
          <Pressable className="mt-8 flex-row items-center justify-center" onPress={() => { resetTheme(); navigation.replace('Login'); }}><LogOut color={colors.primary} size={17} /><Text className="ml-2 text-sm font-extrabold text-primary">Sair</Text></Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
