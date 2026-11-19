import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { ArrowDownRight, ArrowLeft, ArrowLeftRight, ArrowUpRight, CircleDollarSign, LogOut, Menu, Plus, Settings, WalletCards, X } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Text } from '../components/ui/text';
import { RootStackParamList } from '../navigation/AppNavigator';
import { createFinanceEntry, getFinanceEntries, getFinanceSummary, type FinanceEntry, type FinanceEntryType, type PersonalFinanceSummary } from '../services/api';
import { clearSession } from '../services/session';
import { formatCurrency, formatDate } from '../lib/format';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Finance'>;

function parseNumber(value: string) {
  return Number(value.replace(',', '.').replace(/[^0-9.-]/g, ''));
}

export function FinanceScreen({ navigation, route }: Props) {
  const { token, userName, role, modules } = route.params;
  const [summary, setSummary] = useState<PersonalFinanceSummary | null>(null);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [type, setType] = useState<FinanceEntryType>('Income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { colors, resetTheme } = useTheme();

  async function loadData() {
    try {
      setLoading(true);
      const [summaryResponse, entriesResponse] = await Promise.all([getFinanceSummary(token), getFinanceEntries(token)]);
      setSummary(summaryResponse);
      setEntries(entriesResponse);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível carregar suas finanças.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [token]);

  async function handleCreate() {
    setError('');
    try {
      setSaving(true);
      await createFinanceEntry(token, {
        type,
        amount: parseNumber(amount),
        entryDate: new Date().toISOString().slice(0, 10),
        category,
        description,
      });
      setAmount('');
      setCategory('');
      setDescription('');
      setFormOpen(false);
      await loadData();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível registrar o lançamento.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between border-b border-border bg-surface px-5 pb-4 pt-5">
        <View className="flex-row items-center">
          <Pressable accessibilityLabel="Voltar" className="mr-3 h-10 w-10 items-center justify-center rounded-xl border border-border" onPress={() => navigation.goBack()}>
            <ArrowLeft color="#071629" size={19} strokeWidth={1.8} />
          </Pressable>
          <View>
            <Text className="text-xl font-extrabold text-navy">Finanças pessoais</Text>
            <Text className="text-[12px] text-muted">Seu mês em uma visão simples.</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable accessibilityLabel="Novo lançamento" className="h-10 w-10 items-center justify-center rounded-xl bg-navy" onPress={() => setFormOpen((current) => !current)}>
            <Plus color="#D4A64A" size={20} strokeWidth={2} />
          </Pressable>
          <Pressable accessibilityLabel="Abrir menu" className="h-10 w-10 items-center justify-center rounded-xl bg-navy" onPress={() => setMenuOpen(true)}>
            <Menu color={colors.secondary} size={20} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="mx-auto w-full max-w-2xl">
          {loading ? <ActivityIndicator color="#D4A64A" size="large" /> : null}
          {error ? <Text className="mb-4 text-[13px] text-destructive">{error}</Text> : null}

          <Card className="mb-4 border-0 bg-navy p-5">
            <Text className="mb-1 text-[11px] font-extrabold tracking-widest text-gold">SEU MÊS</Text>
            <Text className="text-xl font-extrabold text-white">Organização para respirar melhor.</Text>
            <Text className="mt-2 text-[13px] leading-5 text-white/70">Registre entradas e gastos para entender seu saldo de verdade.</Text>
          </Card>

          <View className="mb-3 flex-row gap-3">
            <Card className="flex-1 p-4">
              <ArrowUpRight color="#1A7F5A" size={18} strokeWidth={1.8} />
              <Text className="mt-3 text-[12px] text-muted">Entradas</Text>
              <Text className="mt-1 text-lg font-extrabold text-navy">{formatCurrency(summary?.monthlyIncome ?? 0)}</Text>
            </Card>
            <Card className="flex-1 p-4">
              <ArrowDownRight color="#B42318" size={18} strokeWidth={1.8} />
              <Text className="mt-3 text-[12px] text-muted">Gastos</Text>
              <Text className="mt-1 text-lg font-extrabold text-navy">{formatCurrency(summary?.monthlyExpenses ?? 0)}</Text>
            </Card>
          </View>

          <Card className="mb-5 p-5">
            <View className="flex-row items-center">
              <CircleDollarSign color="#D4A64A" size={20} strokeWidth={1.8} />
              <Text className="ml-2 text-[15px] font-extrabold text-navy">Saldo do mês</Text>
            </View>
            <Text className={`mt-3 text-3xl font-extrabold ${(summary?.monthlyBalance ?? 0) >= 0 ? 'text-navy' : 'text-destructive'}`}>{formatCurrency(summary?.monthlyBalance ?? 0)}</Text>
            <Text className="mt-1 text-[12px] text-muted">{summary?.entriesCount ?? 0} lançamentos registrados neste mês.</Text>
          </Card>

          {formOpen ? (
            <Card className="mb-5 p-5">
              <Text className="mb-1 text-[18px] font-extrabold text-navy">Novo lançamento</Text>
              <Text className="mb-4 text-[13px] text-muted">Registre o que entrou ou saiu.</Text>
              <View className="mb-4 flex-row gap-2">
                <Pressable className={`flex-1 flex-row items-center justify-center rounded-xl border px-3 py-3 ${type === 'Income' ? 'border-navy bg-gold/20' : 'border-border'}`} onPress={() => setType('Income')}>
                  <ArrowUpRight color="#1A7F5A" size={17} />
                  <Text className="ml-2 text-[14px] font-bold text-navy">Entrada</Text>
                </Pressable>
                <Pressable className={`flex-1 flex-row items-center justify-center rounded-xl border px-3 py-3 ${type === 'Expense' ? 'border-navy bg-gold/20' : 'border-border'}`} onPress={() => setType('Expense')}>
                  <ArrowDownRight color="#B42318" size={17} />
                  <Text className="ml-2 text-[14px] font-bold text-navy">Gasto</Text>
                </Pressable>
              </View>
              <Text className="mb-1.5 text-[14px] font-bold text-navy">Valor</Text>
              <Input className="mb-4" keyboardType="decimal-pad" onChangeText={setAmount} placeholder="Ex.: 250,00" value={amount} />
              <Text className="mb-1.5 text-[14px] font-bold text-navy">Categoria</Text>
              <Input className="mb-4" onChangeText={setCategory} placeholder="Ex.: Alimentação" value={category} />
              <Text className="mb-1.5 text-[14px] font-bold text-navy">Descrição (opcional)</Text>
              <Input className="mb-4" onChangeText={setDescription} placeholder="Detalhes do lançamento" value={description} />
              <Button disabled={saving} onPress={handleCreate}><ButtonText>{saving ? 'Salvando...' : 'Salvar lançamento'}</ButtonText></Button>
            </Card>
          ) : null}

          <View className="mb-4 flex-row items-center">
            <WalletCards color="#D4A64A" size={19} strokeWidth={1.8} />
            <Text className="ml-2 text-[16px] font-extrabold text-navy">Últimos lançamentos</Text>
          </View>
          {entries.length === 0 && !loading ? <Card className="items-center p-8"><Text className="text-[15px] font-bold text-navy">Nenhum lançamento ainda</Text><Text className="mt-1 text-center text-[13px] text-muted">Use o botão + para começar.</Text></Card> : null}
          {entries.map((entry) => (
            <Card className="mb-3 p-4" key={entry.id}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  {entry.type === 'Income' ? <ArrowUpRight color="#1A7F5A" size={18} /> : <ArrowDownRight color="#B42318" size={18} />}
                  <View className="ml-3"><Text className="text-[15px] font-extrabold text-navy">{entry.category}</Text><Text className="mt-1 text-[12px] text-muted">{formatDate(entry.entryDate)}</Text></View>
                </View>
                <Text className={`text-[15px] font-extrabold ${entry.type === 'Income' ? 'text-[#1A7F5A]' : 'text-destructive'}`}>{entry.type === 'Income' ? '+' : '-'} {formatCurrency(entry.amount)}</Text>
              </View>
              {entry.description ? <Text className="mt-3 text-[12px] text-muted">{entry.description}</Text> : null}
            </Card>
          ))}
        </View>
      </ScrollView>

      {menuOpen ? (
        <View className="absolute inset-0 z-20 flex-row">
          <Pressable className="flex-1 bg-black/40" onPress={() => setMenuOpen(false)} />
          <View className="w-[300px] flex-1 bg-navy px-6 pb-8 pt-12">
            <View className="flex-row items-center justify-between">
              <View><Text className="text-[17px] font-extrabold text-white">Se Organiza</Text><Text className="text-[11px] text-white/60">Finanças pessoais</Text></View>
              <Pressable accessibilityLabel="Fechar menu" onPress={() => setMenuOpen(false)}><X color="#FFF" size={22} /></Pressable>
            </View>
            <View className="mt-10 gap-2">
              <Pressable className="flex-row items-center rounded-xl bg-white/10 px-3 py-3" onPress={() => setMenuOpen(false)}><WalletCards color={colors.secondary} size={19} /><Text className="ml-3 text-[14px] font-semibold text-gold">Visão geral</Text></Pressable>
              <Pressable className="flex-row items-center rounded-xl px-3 py-3" onPress={() => { setMenuOpen(false); navigation.navigate('Settings', { token }); }}><Settings color="#FFF" size={19} /><Text className="ml-3 text-[14px] font-semibold text-white/80">Configurações</Text></Pressable>
            </View>
            <Pressable className="mt-5 flex-row items-center rounded-xl border border-gold/40 px-3 py-3" onPress={() => { setMenuOpen(false); navigation.replace('ModuleSelection', { userName, role, token, modules }); }}><ArrowLeftRight color="#D4A64A" size={19} /><Text className="ml-3 text-[14px] font-semibold text-gold">Trocar de módulo</Text></Pressable>
            <View className="mt-auto border-t border-white/10 pt-5"><Pressable className="flex-row items-center px-3 py-3" onPress={() => { void clearSession(); resetTheme(); navigation.replace('Login'); }}><LogOut color="#FFF" size={19} /><Text className="ml-3 text-[14px] font-semibold text-white/80">Sair</Text></Pressable></View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
