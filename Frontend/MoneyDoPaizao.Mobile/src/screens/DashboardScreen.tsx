import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { HandCoins, Plus, Settings, UsersRound, Wallet } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Metrics, ModuleHeader, ModuleMenu } from '../components/ui/module-panel';
import { Text } from '../components/ui/text';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { activateModule, getDashboardSummary, type DashboardSummary } from '../services/api';
import { clearSession, saveSession } from '../services/session';
import { formatCurrency } from '../lib/format';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation, route }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openingFinance, setOpeningFinance] = useState(false);
  const { userName, role, token, modules } = route.params;
  const { colors, resetTheme } = useTheme();
  async function openFinance() {
    if (openingFinance) return;
    setOpeningFinance(true);
    setError('');
    try {
      const response = await activateModule(token, 'PersonalFinance');
      await saveSession(response);
      navigation.replace('Finance', { userName, role, token: response.token, modules: response.modules?.length ? response.modules : [...new Set([...modules, 'PersonalFinance' as const])] });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível abrir as finanças.');
    } finally {
      setOpeningFinance(false);
    }
  }

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    getDashboardSummary(token)
      .then((result) => { if (active) setSummary(result); })
      .catch((exception) => { if (active) setError(exception instanceof Error ? exception.message : 'Não foi possível carregar os empréstimos.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]));

  return (
    <View className="flex-1 bg-background">
      <ModuleHeader title="Empréstimos" onMenu={() => setMenuOpen(true)} />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <View className="mx-auto w-full max-w-4xl gap-5">
          <View className="flex-row flex-wrap items-center justify-between gap-3">
            <Text accessibilityRole="header" className="text-[26px] font-bold tracking-tight">Visão geral</Text>
            <Button className="flex-row gap-2" onPress={() => navigation.navigate('Loans', { token, openCreate: true })}>
              <Plus color={colors.primaryForeground} size={18} />
              <ButtonText>Novo empréstimo</ButtonText>
            </Button>
          </View>

          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {error ? <Text accessibilityLiveRegion="polite" className="text-sm text-destructive">{error}</Text> : null}
          {summary ? (
            <>
              <Card className="border-0 bg-primary p-5">
                <Text className="text-sm text-primary-foreground">Dinheiro emprestado</Text>
                <Text className="mt-2 text-[32px] font-bold tabular-nums tracking-tight text-primary-foreground">{formatCurrency(summary.totalLent)}</Text>
              </Card>
              <Metrics items={[
                { label: 'Lucro recebido', value: formatCurrency(summary.totalProfit), tone: 'positive' },
                { label: 'Clientes cadastrados', value: summary.totalCustomers },
                { label: 'Clientes em dia', value: summary.customersOnTime },
                { label: 'Clientes em atraso', value: summary.customersOverdue, tone: summary.customersOverdue ? 'negative' : undefined },
              ]} />
            </>
          ) : null}

          <View className="flex-row flex-wrap gap-2">
            <Button onPress={() => navigation.navigate('Loans', { token })} variant="outline"><ButtonText variant="outline">Ver empréstimos</ButtonText></Button>
            <Button disabled={openingFinance} onPress={openFinance} variant="outline"><ButtonText variant="outline">{openingFinance ? 'Abrindo...' : 'Finanças pessoais'}</ButtonText></Button>
          </View>
        </View>
      </ScrollView>

      {menuOpen ? (
        <ModuleMenu
          title="Empréstimos"
          items={[
            { label: 'Clientes', icon: UsersRound, action: () => navigation.navigate('Customers', { token }) },
            { label: 'Empréstimos', icon: HandCoins, action: () => navigation.navigate('Loans', { token }) },
            { label: 'Finanças', icon: Wallet, action: openFinance },
            { label: 'Configurações', icon: Settings, action: () => navigation.navigate('Settings', { token }) },
          ]}
          onClose={() => setMenuOpen(false)}
          onSwitch={() => navigation.replace('ModuleSelection', { userName, role, token, modules })}
          onSignOut={() => { void clearSession(); resetTheme(); navigation.replace('Login'); }}
        />
      ) : null}
    </View>
  );
}
