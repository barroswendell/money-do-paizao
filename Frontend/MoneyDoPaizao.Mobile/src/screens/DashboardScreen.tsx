import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import {
  ArrowUpRight,
  Bell,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  ReceiptText,
  Settings,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrandMark } from '../components/brand/BrandMark';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Text } from '../components/ui/text';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getDashboardSummary, type DashboardSummary } from '../services/api';
import { formatCurrency } from '../lib/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const menuItems = [
  { label: 'Visão geral', icon: LayoutDashboard, target: 'Dashboard' as const },
  { label: 'Clientes', icon: Wallet, target: 'Customers' as const },
  { label: 'Empréstimos', icon: HandCoins, target: 'Loans' as const },
  { label: 'Finanças', icon: ReceiptText, target: 'Finance' as const },
  { label: 'Configurações', icon: Settings, target: 'Dashboard' as const },
];

export function DashboardScreen({ navigation, route }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { userName, role } = route.params;
  const { token } = route.params;

  useEffect(() => {
    getDashboardSummary(token)
      .then(setSummary)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between border-b border-border bg-surface px-5 pb-4 pt-5">
        <View className="flex-row items-center">
          <BrandMark />
          <View className="ml-3">
            <Text className="text-[17px] font-extrabold text-navy">Paizão</Text>
            <Text className="text-[11px] font-medium text-muted">Sistema de Empréstimos</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable accessibilityLabel="Notificações" className="h-10 w-10 items-center justify-center rounded-xl" onPress={() => undefined}>
            <Bell color="#071629" size={19} strokeWidth={1.8} />
          </Pressable>
          <Pressable accessibilityLabel="Abrir menu" className="h-10 w-10 items-center justify-center rounded-xl bg-navy" onPress={() => setMenuOpen(true)}>
            <Menu color="#D4A64A" size={20} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <View className="mx-auto w-full max-w-2xl">
          <View className="mb-5">
            <Text className="mb-1 text-[13px] font-bold uppercase tracking-widest text-gold">PAINEL PRINCIPAL</Text>
            <Text className="text-2xl font-extrabold text-navy">Olá, {userName}.</Text>
            <Text className="mt-1 text-[14px] leading-5 text-muted">Controle, confiança e compromisso.</Text>
            {loading ? <ActivityIndicator color="#D4A64A" size="small" /> : null}
          </View>

          <Card className="mb-5 overflow-hidden border-0 bg-navy p-5">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <Text className="mb-2 text-[11px] font-extrabold tracking-widest text-gold">PAIZÃO</Text>
                <Text className="mb-2 text-xl font-extrabold leading-7 text-white">Seu dinheiro, organizado.</Text>
                <Text className="text-[13px] leading-5 text-white/70">Acompanhe empréstimos, recebimentos e o movimento do mês em um só lugar.</Text>
              </View>
              <ShieldCheck color="#D4A64A" size={30} strokeWidth={1.5} />
            </View>
          </Card>

          <Card className="mb-3 p-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[12px] text-muted">Clientes cadastrados</Text>
                <Text className="mt-1 text-2xl font-extrabold text-navy">{summary?.totalCustomers ?? 0}</Text>
              </View>
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-gold/20">
                <Wallet color="#071629" size={18} strokeWidth={1.8} />
              </View>
            </View>
          </Card>

          <View className="mb-3 flex-row gap-3">
            <Card className="min-h-[120px] flex-1 p-4">
              <View className="mb-4 h-9 w-9 items-center justify-center rounded-xl bg-gold/20">
                <HandCoins color="#071629" size={18} strokeWidth={1.8} />
              </View>
              <Text className="text-[12px] text-muted">Dinheiro emprestado</Text>
              <Text className="mt-1 text-lg font-extrabold text-navy">{formatCurrency(summary?.totalLent ?? 0)}</Text>
            </Card>
            <Card className="min-h-[120px] flex-1 p-4">
              <View className="mb-4 h-9 w-9 items-center justify-center rounded-xl bg-gold/20">
                <ArrowUpRight color="#071629" size={18} strokeWidth={1.8} />
              </View>
              <Text className="text-[12px] text-muted">Lucro recebido</Text>
              <Text className="mt-1 text-lg font-extrabold text-navy">{formatCurrency(summary?.totalProfit ?? 0)}</Text>
            </Card>
          </View>

          <View className="mb-5 flex-row gap-3">
            <Card className="min-h-[110px] flex-1 p-4">
              <Text className="text-[12px] text-muted">Clientes em dia</Text>
              <Text className="mt-2 text-2xl font-extrabold text-navy">{summary?.customersOnTime ?? 0}</Text>
            </Card>
            <Card className="min-h-[110px] flex-1 border-destructive/20 p-4">
              <Text className="text-[12px] text-muted">Clientes em atraso</Text>
              <Text className="mt-2 text-2xl font-extrabold text-destructive">{summary?.customersOverdue ?? 0}</Text>
            </Card>
          </View>

          <Card className="mb-5 p-5">
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-[17px] font-extrabold text-navy">Ações rápidas</Text>
                <Text className="mt-1 text-[13px] text-muted">Comece pelo que precisa hoje.</Text>
              </View>
              <ReceiptText color="#D4A64A" size={22} strokeWidth={1.8} />
            </View>

            <View className="flex-row gap-3">
              <Button className="flex-1 flex-row gap-2" onPress={() => navigation.navigate('Loans', { token, openCreate: true })}>
                <Plus color="#071629" size={18} strokeWidth={2} />
                <ButtonText>Empréstimo</ButtonText>
              </Button>
              <Button className="flex-1 flex-row gap-2" onPress={() => navigation.navigate('Finance', { token })} variant="outline">
                <ReceiptText color="#071629" size={18} strokeWidth={1.8} />
                <ButtonText variant="outline">Finança</ButtonText>
              </Button>
            </View>
          </Card>

          <Text className="text-center text-[12px] text-muted">Perfil: {role === 'Admin' ? 'Administrador' : 'Usuário'}</Text>
        </View>
      </ScrollView>

      {menuOpen ? (
        <View className="absolute inset-0 z-20 flex-row">
          <Pressable className="flex-1 bg-black/40" onPress={() => setMenuOpen(false)} />
          <View className="w-[300px] flex-1 bg-navy px-6 pb-8 pt-12">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <BrandMark dark />
                <View className="ml-3">
                  <Text className="text-[17px] font-extrabold text-white">Paizão</Text>
                  <Text className="text-[11px] text-white/60">Sistema de Empréstimos</Text>
                </View>
              </View>
              <Pressable accessibilityLabel="Fechar menu" onPress={() => setMenuOpen(false)}>
                <X color="#FFFFFF" size={22} strokeWidth={1.8} />
              </Pressable>
            </View>

            <View className="mt-10 gap-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const active = index === 0;
                return (
                  <Pressable
                    className={`flex-row items-center rounded-xl px-3 py-3 ${active ? 'bg-white/10' : ''}`}
                    key={item.label}
                    onPress={() => {
                      setMenuOpen(false);
                      if (item.target === 'Customers') navigation.navigate('Customers', { token });
                      if (item.target === 'Loans') navigation.navigate('Loans', { token });
                      if (item.target === 'Finance') navigation.navigate('Finance', { token });
                    }}
                  >
                    <Icon color={active ? '#D4A64A' : '#FFFFFF'} size={19} strokeWidth={1.8} />
                    <Text className={`ml-3 text-[14px] font-semibold ${active ? 'text-gold' : 'text-white/80'}`}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="mt-auto border-t border-white/10 pt-5">
              <Pressable className="flex-row items-center px-3 py-3" onPress={() => navigation.replace('Login')}>
                <LogOut color="#FFFFFF" size={19} strokeWidth={1.8} />
                <Text className="ml-3 text-[14px] font-semibold text-white/80">Sair</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
