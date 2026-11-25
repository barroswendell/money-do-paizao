import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Package, Plus, Settings, ShoppingBag, UsersRound } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Metrics, ModuleHeader, ModuleMenu } from '../components/ui/module-panel';
import { Text } from '../components/ui/text';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getSalesDashboard, type SalesDashboard } from '../services/api';
import { clearSession } from '../services/session';
import { formatCurrency } from '../lib/format';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'SalesDashboard'>;

export function SalesDashboardScreen({ navigation, route }: Props) {
  const { token, userName, role, modules } = route.params;
  const [summary, setSummary] = useState<SalesDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const { colors, resetTheme } = useTheme();
  const openSales = () => navigation.navigate('Sales', { token });
  const openProducts = () => navigation.navigate('Products', { token });
  const openCustomers = () => navigation.navigate('Customers', { token });

  useFocusEffect(useCallback(() => {
    let active = true;

    setError('');
    setLoading(true);
    getSalesDashboard(token)
      .then((result) => { if (active) setSummary(result); })
      .catch((exception) => { if (active) setError(exception instanceof Error ? exception.message : 'Não foi possível carregar as vendas.'); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [token]));

  return (
    <View className="flex-1 bg-background">
      <ModuleHeader title="Vendas" onMenu={() => setMenuOpen(true)} />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <View className="mx-auto w-full max-w-4xl gap-5">
          <View className="flex-row flex-wrap items-center justify-between gap-3">
            <Text accessibilityRole="header" className="text-[26px] font-bold tracking-tight">Visão geral</Text>
            <Button className="flex-row gap-2" onPress={openSales}>
              <Plus color={colors.primaryForeground} size={18} />
              <ButtonText>Registrar venda</ButtonText>
            </Button>
          </View>

          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {error ? <Text accessibilityLiveRegion="polite" className="text-sm text-destructive">{error}</Text> : null}
          {summary ? (
            <>
              <Card className="border-0 bg-primary p-5">
                <Text className="text-sm text-primary-foreground">Faturamento</Text>
                <Text className="mt-2 text-[32px] font-bold tabular-nums tracking-tight text-primary-foreground">{formatCurrency(summary.totalRevenue)}</Text>
              </Card>
              <Metrics items={[
                { label: 'Vendas realizadas', value: summary.totalSales },
                { label: 'Já recebido', value: formatCurrency(summary.totalReceived), tone: 'positive' },
                { label: 'A receber', value: formatCurrency(summary.totalPending) },
              ]} />
            </>
          ) : null}

          <View className="flex-row flex-wrap gap-2">
            <Button onPress={openProducts} variant="outline"><ButtonText variant="outline">Cadastrar produto</ButtonText></Button>
            <Button onPress={openCustomers} variant="outline"><ButtonText variant="outline">Cadastrar cliente</ButtonText></Button>
          </View>
        </View>
      </ScrollView>

      {menuOpen ? (
        <ModuleMenu
          title="Vendas"
          items={[
            { label: 'Vendas', icon: ShoppingBag, action: openSales },
            { label: 'Produtos', icon: Package, action: openProducts },
            { label: 'Clientes', icon: UsersRound, action: openCustomers },
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
