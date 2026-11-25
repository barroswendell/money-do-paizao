import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { CalendarDays, ChevronRight, Package, Palette, Plus, Settings, UsersRound } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PartyMonthTotals } from '../components/PartyMonthTotals';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ModuleHeader, ModuleMenu } from '../components/ui/module-panel';
import { Text } from '../components/ui/text';
import { emptyPartyMonth, partyMonthLabel, partyToday, shiftPartyMonth } from '../lib/partyMonths';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getPartyDashboard, type PartyDashboard, type PartyMonth } from '../services/api';
import { clearSession } from '../services/session';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'PartyDashboard'>;

function MonthCard({ month, current = false, onPress }: { month: PartyMonth; current?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Ver festas de ${partyMonthLabel(month.month)}`} onPress={onPress}>
      <Card className="gap-3 p-4">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1">
            <Text className="font-extrabold text-foreground">{partyMonthLabel(month.month)}{current ? ' · Mês atual' : ''}</Text>
            <Text className="mt-1 text-xs text-muted">{month.eventCount === 1 ? '1 festa' : `${month.eventCount} festas`}</Text>
          </View>
          <ChevronRight color={colors.muted} size={19} />
        </View>
        <PartyMonthTotals month={month} />
      </Card>
    </Pressable>
  );
}

export function PartyDashboardScreen({ navigation, route }: Props) {
  const { token, userName, role, modules } = route.params;
  const [summary, setSummary] = useState<PartyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const { colors, resetTheme } = useTheme();

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    getPartyDashboard(token)
      .then((data) => { if (active) setSummary(data); })
      .catch((exception) => { if (active) setError(exception instanceof Error ? exception.message : 'Não foi possível carregar as festas.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, refresh]));

  const currentMonth = summary?.currentMonth ?? partyToday().slice(0, 7);
  const months = new Map((summary?.months ?? []).map((month) => [month.month, month]));
  const current = months.get(currentMonth) ?? {
    ...emptyPartyMonth(currentMonth),
    totalAmount: summary?.monthlyRevenue ?? 0,
    receivedAmount: summary?.monthlyDeposits ?? 0,
    remainingAmount: summary?.monthlyPending ?? 0,
  };
  const past = [...months.values()].filter((month) => month.month < currentMonth).reverse();
  const futureKeys = new Set([1, 2, 3].map((offset) => shiftPartyMonth(currentMonth, offset)));
  for (const month of months.keys()) {
    if (month > currentMonth) futureKeys.add(month);
  }
  const future = [...futureKeys].sort().map((month) => months.get(month) ?? emptyPartyMonth(month));
  const openMonth = (month: string) => navigation.navigate('PartyEvents', { token, month });

  const menuItems = [
    { label: 'Agenda de festas', icon: CalendarDays, action: () => openMonth(currentMonth) },
    { label: 'Cadastrar produto', icon: Package, action: () => navigation.navigate('PartyProducts', { token }) },
    { label: 'Temas', icon: Palette, action: () => navigation.navigate('PartyThemes', { token }) },
    { label: 'Clientes', icon: UsersRound, action: () => navigation.navigate('Customers', { token }) },
    { label: 'Configurações', icon: Settings, action: () => navigation.navigate('Settings', { token }) },
  ];

  return (
    <View className="flex-1 bg-background">
      <ModuleHeader title="Organização de festas" onMenu={() => setMenuOpen(true)} />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <View className="mx-auto w-full max-w-4xl gap-5">
          <View className="flex-row flex-wrap items-center justify-between gap-3">
            <Text accessibilityRole="header" className="text-[26px] font-bold tracking-tight">Visão geral</Text>
            <View className="flex-row flex-wrap gap-2">
              <Button className="flex-row gap-2" onPress={() => navigation.navigate('PartyEvents', { token, month: currentMonth, create: true })}>
                <Plus color={colors.primaryForeground} size={18} />
                <ButtonText>Nova festa</ButtonText>
              </Button>
              <Button variant="outline" onPress={() => openMonth(currentMonth)}>
                <ButtonText variant="outline">Ver agenda</ButtonText>
              </Button>
            </View>
          </View>
          {loading && !summary ? <ActivityIndicator color={colors.primary} /> : null}
          {error ? (
            <Pressable accessibilityRole="button" onPress={() => setRefresh((value) => value + 1)}>
              <Text className="text-sm text-destructive">{error} Toque para tentar de novo.</Text>
            </Pressable>
          ) : null}
          {summary ? (
            <>
              <Card className="flex-row items-center justify-between gap-3 p-4">

                <Text className="flex-1 font-bold text-foreground">Próximas festas</Text>
                <Text className="text-xl font-extrabold text-foreground">{summary.upcomingEvents}</Text>
              </Card>
              <MonthCard current month={current} onPress={() => openMonth(currentMonth)} />
              <View className="gap-2">
                <Text className="text-base font-extrabold text-foreground">Previsão dos próximos meses</Text>
                {future.map((month) => <MonthCard key={month.month} month={month} onPress={() => openMonth(month.month)} />)}
              </View>
              <View className="gap-2">
                <Text className="text-base font-extrabold text-foreground">Faturamento dos meses anteriores</Text>
                {past.length === 0 ? <Text className="text-sm text-muted">Nenhuma festa registrada em meses anteriores.</Text> : null}
                {past.map((month) => <MonthCard key={month.month} month={month} onPress={() => openMonth(month.month)} />)}
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
      {menuOpen ? (
        <ModuleMenu
          title="Organização de festas"
          items={menuItems}
          onClose={() => setMenuOpen(false)}
          onSwitch={() => navigation.replace('ModuleSelection', { userName, role, token, modules })}
          onSignOut={() => { void clearSession(); resetTheme(); navigation.replace('Login'); }}
        />
      ) : null}
    </View>
  );
}
