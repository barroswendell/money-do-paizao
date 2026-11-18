import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { CalendarDays, CalendarPlus, LogOut, Menu, Palette, PartyPopper, ReceiptText, UsersRound, X } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrandMark } from '../components/brand/BrandMark';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Text } from '../components/ui/text';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getPartyDashboard, type PartyDashboard } from '../services/api';
import { formatCurrency } from '../lib/format';

type Props = NativeStackScreenProps<RootStackParamList, 'PartyDashboard'>;

export function PartyDashboardScreen({ navigation, route }: Props) {
  const { token, userName } = route.params;
  const [summary, setSummary] = useState<PartyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getPartyDashboard(token).then(setSummary).catch(() => undefined).finally(() => setLoading(false));
  }, [token]);

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between border-b border-border bg-surface px-5 pb-4 pt-5">
        <View className="flex-row items-center"><BrandMark /><View className="ml-3"><Text className="text-[17px] font-extrabold text-navy">Se Organiza</Text><Text className="text-[11px] font-medium text-muted">Organização de festas</Text></View></View>
        <Pressable accessibilityLabel="Abrir menu" className="h-10 w-10 items-center justify-center rounded-xl bg-navy" onPress={() => setMenuOpen(true)}><Menu color="#D4A64A" size={20} /></Pressable>
      </View>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <View className="mx-auto w-full max-w-2xl">
          <Text className="mb-1 text-[13px] font-bold uppercase tracking-widest text-gold">PAINEL DE FESTAS</Text>
          <Text className="text-2xl font-extrabold text-navy">Olá, {userName}.</Text>
          <Text className="mt-1 text-[14px] text-muted">Sua agenda e seus recebimentos em ordem.</Text>
          {loading ? <ActivityIndicator className="mt-4" color="#D4A64A" /> : null}
          <Card className="my-5 border-0 bg-navy p-5"><Text className="mb-2 text-[11px] font-extrabold tracking-widest text-gold">SE ORGANIZA · FESTAS</Text><Text className="text-xl font-extrabold text-white">Cada detalhe no seu lugar.</Text><Text className="mt-2 text-[13px] leading-5 text-white/70">Cadastre clientes, temas e acompanhe o que já recebeu.</Text></Card>
          <View className="mb-3 flex-row gap-3">
            <Card className="flex-1 p-4"><CalendarDays color="#D4A64A" size={19} /><Text className="mt-3 text-[12px] text-muted">Próximas festas</Text><Text className="mt-1 text-2xl font-extrabold text-navy">{summary?.upcomingEvents ?? 0}</Text></Card>
            <Card className="flex-1 p-4"><ReceiptText color="#D4A64A" size={19} /><Text className="mt-3 text-[12px] text-muted">Faturamento do mês</Text><Text className="mt-1 text-lg font-extrabold text-navy">{formatCurrency(summary?.monthlyRevenue ?? 0)}</Text></Card>
          </View>
          <View className="mb-5 flex-row gap-3"><Card className="flex-1 p-4"><Text className="text-[12px] text-muted">Sinais recebidos</Text><Text className="mt-2 text-lg font-extrabold text-[#1A7F5A]">{formatCurrency(summary?.monthlyDeposits ?? 0)}</Text></Card><Card className="flex-1 p-4"><Text className="text-[12px] text-muted">Falta receber</Text><Text className="mt-2 text-lg font-extrabold text-navy">{formatCurrency(summary?.monthlyPending ?? 0)}</Text></Card></View>
          <Card className="p-5"><View className="mb-4 flex-row items-center"><PartyPopper color="#D4A64A" size={21} /><View className="ml-2"><Text className="text-[16px] font-extrabold text-navy">Ações rápidas</Text><Text className="text-[12px] text-muted">Organize os próximos passos.</Text></View></View><View className="gap-3"><Button className="flex-row gap-2" onPress={() => navigation.navigate('PartyEvents', { token })}><CalendarPlus color="#071629" size={18} /><ButtonText>Agendar festa</ButtonText></Button><Button className="flex-row gap-2" onPress={() => navigation.navigate('Customers', { token })} variant="outline"><UsersRound color="#071629" size={18} /><ButtonText variant="outline">Cadastrar cliente</ButtonText></Button><Button className="flex-row gap-2" onPress={() => navigation.navigate('PartyThemes', { token })} variant="outline"><Palette color="#071629" size={18} /><ButtonText variant="outline">Cadastrar tema</ButtonText></Button></View></Card>
        </View>
      </ScrollView>
      {menuOpen ? <View className="absolute inset-0 z-20 flex-row"><Pressable className="flex-1 bg-black/40" onPress={() => setMenuOpen(false)} /><View className="w-[300px] flex-1 bg-navy px-6 pb-8 pt-12"><View className="flex-row items-center justify-between"><View className="flex-row items-center"><BrandMark dark /><View className="ml-3"><Text className="text-[17px] font-extrabold text-white">Se Organiza</Text><Text className="text-[11px] text-white/60">Organização de festas</Text></View></View><Pressable onPress={() => setMenuOpen(false)}><X color="#FFF" size={22} /></Pressable></View><View className="mt-10 gap-2"><Pressable className="flex-row items-center rounded-xl bg-white/10 px-3 py-3" onPress={() => setMenuOpen(false)}><PartyPopper color="#D4A64A" size={19} /><Text className="ml-3 text-[14px] font-semibold text-gold">Visão geral</Text></Pressable><Pressable className="flex-row items-center rounded-xl px-3 py-3" onPress={() => { setMenuOpen(false); navigation.navigate('PartyEvents', { token }); }}><CalendarDays color="#FFF" size={19} /><Text className="ml-3 text-[14px] font-semibold text-white/80">Agenda de festas</Text></Pressable><Pressable className="flex-row items-center rounded-xl px-3 py-3" onPress={() => { setMenuOpen(false); navigation.navigate('PartyThemes', { token }); }}><Palette color="#FFF" size={19} /><Text className="ml-3 text-[14px] font-semibold text-white/80">Temas</Text></Pressable><Pressable className="flex-row items-center rounded-xl px-3 py-3" onPress={() => { setMenuOpen(false); navigation.navigate('Customers', { token }); }}><UsersRound color="#FFF" size={19} /><Text className="ml-3 text-[14px] font-semibold text-white/80">Clientes</Text></Pressable></View><View className="mt-auto border-t border-white/10 pt-5"><Pressable className="flex-row items-center px-3 py-3" onPress={() => navigation.replace('Login')}><LogOut color="#FFF" size={19} /><Text className="ml-3 text-[14px] font-semibold text-white/80">Sair</Text></Pressable></View></View></View> : null}
    </View>
  );
}
