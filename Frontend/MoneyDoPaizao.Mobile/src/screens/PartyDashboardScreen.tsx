import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { ArrowLeftRight, CalendarDays, CalendarPlus, ChevronRight, LogOut, Menu, Package, Palette, PartyPopper, Settings, UsersRound, X } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrandMark } from '../components/brand/BrandMark';
import { PartyMonthTotals } from '../components/PartyMonthTotals';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Text } from '../components/ui/text';
import { emptyPartyMonth, partyMonthLabel, partyToday, shiftPartyMonth } from '../lib/partyMonths';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getPartyDashboard, type PartyDashboard, type PartyMonth } from '../services/api';
import { clearSession } from '../services/session';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'PartyDashboard'>;

function MonthCard({ month, current = false, onPress }: { month: PartyMonth; current?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Ver festas de ${partyMonthLabel(month.month)}`} onPress={onPress}>
      <Card className="gap-3 p-4">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1">
            <Text className="font-extrabold text-navy">{partyMonthLabel(month.month)}{current ? ' · Mês atual' : ''}</Text>
            <Text className="mt-1 text-xs text-muted">{month.eventCount === 1 ? '1 festa' : `${month.eventCount} festas`}</Text>
          </View>
          <ChevronRight color="#6D7784" size={19} />
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
      .catch((exception) => { if (active) setError(exception.message); })
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
      <View className="flex-row items-center justify-between border-b border-border bg-surface px-5 pb-4 pt-5">
        <View className="flex-row items-center">
          <BrandMark />
          <View className="ml-3">
            <Text className="text-[17px] font-extrabold text-navy">Se Organiza</Text>
            <Text className="text-[11px] font-medium text-muted">Organização de festas</Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Abrir menu" className="h-10 w-10 items-center justify-center rounded-xl bg-navy" onPress={() => setMenuOpen(true)}>
          <Menu color={colors.secondary} size={20} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="mx-auto w-full max-w-2xl gap-5">
          <View>
            <Text className="text-sm font-bold text-gold">Painel de festas</Text>
            <Text className="mt-1 text-2xl font-extrabold text-navy">Olá, {userName}.</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            <Button accessibilityRole="button" className="min-w-[130px] flex-1 flex-row gap-2" onPress={() => navigation.navigate('PartyEvents', { token, month: currentMonth, create: true })}>
              <CalendarPlus color="#071629" size={18} /><ButtonText>Nova festa</ButtonText>
            </Button>
            <Button accessibilityRole="button" className="min-w-[130px] flex-1 flex-row gap-2" variant="outline" onPress={() => openMonth(currentMonth)}>
              <CalendarDays color="#071629" size={18} /><ButtonText variant="outline">Ver agenda</ButtonText>
            </Button>
          </View>
          {loading && !summary ? <ActivityIndicator color="#D4A64A" /> : null}
          {error ? (
            <Pressable accessibilityRole="button" onPress={() => setRefresh((value) => value + 1)}>
              <Text className="text-sm text-destructive">{error} Toque para tentar de novo.</Text>
            </Pressable>
          ) : null}
          {summary ? (
            <>
              <Card className="flex-row items-center justify-between gap-3 p-4">
                <CalendarDays color={colors.secondary} size={19} />
                <Text className="flex-1 font-bold text-navy">Próximas festas</Text>
                <Text className="text-xl font-extrabold text-navy">{summary.upcomingEvents}</Text>
              </Card>
              <MonthCard current month={current} onPress={() => openMonth(currentMonth)} />
              <View className="gap-2">
                <Text className="text-base font-extrabold text-navy">Previsão dos próximos meses</Text>
                {future.map((month) => <MonthCard key={month.month} month={month} onPress={() => openMonth(month.month)} />)}
              </View>
              <View className="gap-2">
                <Text className="text-base font-extrabold text-navy">Faturamento dos meses anteriores</Text>
                {past.length === 0 ? <Text className="text-sm text-muted">Nenhuma festa registrada em meses anteriores.</Text> : null}
                {past.map((month) => <MonthCard key={month.month} month={month} onPress={() => openMonth(month.month)} />)}
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
      {menuOpen ? (
        <View className="absolute inset-0 z-20 flex-row">
          <Pressable accessibilityRole="button" accessibilityLabel="Fechar menu" className="flex-1 bg-black/40" onPress={() => setMenuOpen(false)} />
          <ScrollView className="grow-0 bg-navy" style={{ width: '84%', maxWidth: 320 }} contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 36, paddingBottom: 24 }}>
            <View className="flex-row items-center justify-between gap-2">
              <View className="flex-1 flex-row items-center">
                <BrandMark dark />
                <Text className="ml-3 flex-1 text-[17px] font-extrabold text-white">Se Organiza</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Fechar menu lateral" className="p-2" onPress={() => setMenuOpen(false)}><X color="#FFF" size={22} /></Pressable>
            </View>
            <View className="mt-7 gap-1">
              <Pressable accessibilityRole="button" className="flex-row items-center rounded-xl bg-white/10 px-3 py-3" onPress={() => setMenuOpen(false)}>
                <PartyPopper color={colors.secondary} size={19} /><Text className="ml-3 text-sm font-semibold text-gold">Visão geral</Text>
              </Pressable>
              {menuItems.map(({ label, icon: Icon, action }) => (
                <Pressable accessibilityRole="button" className="flex-row items-center rounded-xl px-3 py-3" key={label} onPress={() => { setMenuOpen(false); action(); }}>
                  <Icon color="#FFF" size={19} /><Text className="ml-3 text-sm font-semibold text-white/80">{label}</Text>
                </Pressable>
              ))}
              <Pressable accessibilityRole="button" className="my-3 flex-row items-center rounded-xl border border-gold/40 px-3 py-3" onPress={() => { setMenuOpen(false); navigation.replace('ModuleSelection', { userName, role, token, modules }); }}>
                <ArrowLeftRight color={colors.secondary} size={19} /><Text className="ml-3 text-sm font-semibold text-gold">Trocar de módulo</Text>
              </Pressable>
            </View>
            <Pressable accessibilityRole="button" className="mt-auto flex-row items-center border-t border-white/10 px-3 py-3" onPress={() => { void clearSession(); resetTheme(); navigation.replace('Login'); }}>
              <LogOut color="#FFF" size={19} /><Text className="ml-3 text-sm font-semibold text-white/80">Sair</Text>
            </Pressable>
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
