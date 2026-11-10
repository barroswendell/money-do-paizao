import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { ArrowLeft, CalendarCheck2, CircleDollarSign, Clock3, TrendingUp, UsersRound } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../components/ui/card';
import { Text } from '../components/ui/text';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getDashboardSummary, type DashboardSummary } from '../services/api';
import { formatCurrency } from '../lib/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Finance'>;

export function FinanceScreen({ navigation, route }: Props) {
  const { token } = route.params;
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardSummary(token)
      .then(setSummary)
      .catch((exception) => setError(exception instanceof Error ? exception.message : 'Não foi possível carregar as finanças.'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center border-b border-border bg-surface px-5 pb-4 pt-5">
        <Pressable accessibilityLabel="Voltar" className="mr-3 h-10 w-10 items-center justify-center rounded-xl border border-border" onPress={() => navigation.goBack()}>
          <ArrowLeft color="#071629" size={19} strokeWidth={1.8} />
        </Pressable>
        <View>
          <Text className="text-xl font-extrabold text-navy">Finanças</Text>
          <Text className="text-[12px] text-muted">Resumo do dinheiro movimentado.</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <View className="mx-auto w-full max-w-2xl">
          {loading ? <ActivityIndicator color="#D4A64A" size="large" /> : null}
          {error ? <Text className="mb-4 text-[13px] text-destructive">{error}</Text> : null}

          <Card className="mb-4 border-0 bg-navy p-5">
            <Text className="mb-1 text-[11px] font-extrabold tracking-widest text-gold">VISÃO FINANCEIRA</Text>
            <Text className="text-xl font-extrabold text-white">Organização para decidir melhor.</Text>
            <Text className="mt-2 text-[13px] leading-5 text-white/70">Confira quanto está emprestado, o lucro recebido e a situação dos clientes.</Text>
          </Card>

          <View className="mb-3 flex-row gap-3">
            <Card className="flex-1 p-4">
              <View className="mb-4 h-9 w-9 items-center justify-center rounded-xl bg-gold/20">
                <CircleDollarSign color="#071629" size={18} strokeWidth={1.8} />
              </View>
              <Text className="text-[12px] text-muted">Dinheiro emprestado</Text>
              <Text className="mt-1 text-lg font-extrabold text-navy">{formatCurrency(summary?.totalLent ?? 0)}</Text>
            </Card>
            <Card className="flex-1 p-4">
              <View className="mb-4 h-9 w-9 items-center justify-center rounded-xl bg-gold/20">
                <TrendingUp color="#071629" size={18} strokeWidth={1.8} />
              </View>
              <Text className="text-[12px] text-muted">Lucro recebido</Text>
              <Text className="mt-1 text-lg font-extrabold text-navy">{formatCurrency(summary?.totalProfit ?? 0)}</Text>
            </Card>
          </View>

          <Card className="mb-3 p-5">
            <View className="mb-4 flex-row items-center">
              <UsersRound color="#D4A64A" size={20} strokeWidth={1.8} />
              <Text className="ml-2 text-[16px] font-extrabold text-navy">Carteira de clientes</Text>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1 rounded-xl bg-gold/10 p-4">
                <CalendarCheck2 color="#071629" size={18} strokeWidth={1.8} />
                <Text className="mt-3 text-[12px] text-muted">Em dia</Text>
                <Text className="mt-1 text-2xl font-extrabold text-navy">{summary?.customersOnTime ?? 0}</Text>
              </View>
              <View className="flex-1 rounded-xl bg-destructive/10 p-4">
                <Clock3 color="#B42318" size={18} strokeWidth={1.8} />
                <Text className="mt-3 text-[12px] text-muted">Em atraso</Text>
                <Text className="mt-1 text-2xl font-extrabold text-destructive">{summary?.customersOverdue ?? 0}</Text>
              </View>
            </View>
          </Card>

          <Card className="p-5">
            <Text className="text-[16px] font-extrabold text-navy">Clientes cadastrados</Text>
            <Text className="mt-2 text-3xl font-extrabold text-gold">{summary?.totalCustomers ?? 0}</Text>
            <Text className="mt-1 text-[13px] leading-5 text-muted">Esse resumo é atualizado a partir dos empréstimos e pagamentos registrados.</Text>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
