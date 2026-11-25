import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, Menu, Plus, Settings } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { FieldLabel, Input } from '../components/ui/input';
import { Metrics, ModuleMenu } from '../components/ui/module-panel';
import { IconButton, ScreenHeader } from '../components/ui/screen-header';
import { Text } from '../components/ui/text';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { createFinanceEntry, getFinanceEntries, getFinanceSummary, type FinanceEntry, type FinanceEntryType, type PersonalFinanceSummary } from '../services/api';
import { clearSession } from '../services/session';
import { formatCurrency, formatDate, parseMoneyCents } from '../lib/format';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Finance'>;
const entryTypes = [{ value: 'Income', label: 'Entrada' }, { value: 'Expense', label: 'Gasto' }] as const;

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
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { colors, resetTheme } = useTheme();

  async function loadData() {
    setLoadError('');
    try {
      setLoading(true);
      const [summaryResponse, entriesResponse] = await Promise.all([getFinanceSummary(token), getFinanceEntries(token)]);
      setSummary(summaryResponse);
      setEntries(entriesResponse);
    } catch (exception) {
      setLoadError(exception instanceof Error ? exception.message : 'Não foi possível carregar suas finanças.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, [token]);

  async function handleCreate() {
    setError('');
    const cents = parseMoneyCents(amount);
    if (cents === null || cents <= 0 || !category.trim()) {
      setError('Informe um valor maior que zero e uma categoria.');
      return;
    }

    try {
      setSaving(true);
      const now = new Date();
      const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((part) => String(part).padStart(2, '0')).join('-');
      await createFinanceEntry(token, { type, amount: cents / 100, entryDate: date, category: category.trim(), description });
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
      <ScreenHeader
        title="Finanças pessoais"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
        actions={<IconButton accessibilityLabel="Abrir menu" onPress={() => setMenuOpen(true)}><Menu color={colors.foreground} size={21} /></IconButton>}
      />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="mx-auto w-full max-w-4xl gap-5">
          <View className="flex-row flex-wrap items-center justify-between gap-3">
            <Text accessibilityRole="header" className="text-[26px] font-bold tracking-tight">Visão geral</Text>
            <Button className="flex-row gap-2" onPress={() => setFormOpen((current) => !current)}>
              <Plus color={colors.primaryForeground} size={18} />
              <ButtonText>{formOpen ? 'Fechar formulário' : 'Novo lançamento'}</ButtonText>
            </Button>
          </View>

          {formOpen ? (
            <Card className="gap-4 p-4 sm:p-5">
              <Text accessibilityRole="header" className="text-lg font-bold">Novo lançamento</Text>
              <View className="flex-row gap-2">
                {entryTypes.map(({ value, label }) => (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: type === value }}
                    className={`min-h-[48px] flex-1 items-center justify-center rounded-xl border px-2 ${type === value ? 'border-focus bg-selected' : 'border-border bg-input'}`}
                    key={value}
                    onPress={() => setType(value)}
                  >
                    <Text className={`text-sm font-semibold ${type === value ? 'text-selected-foreground' : 'text-foreground'}`}>{label}</Text>
                  </Pressable>
                ))}
              </View>
              <View>
                <FieldLabel>Valor</FieldLabel>
                <Input accessibilityLabel="Valor" keyboardType="decimal-pad" onChangeText={setAmount} placeholder="Ex.: 250,00" value={amount} />
              </View>
              <View>
                <FieldLabel>Categoria</FieldLabel>
                <Input accessibilityLabel="Categoria" onChangeText={setCategory} placeholder="Ex.: Alimentação" value={category} />
              </View>
              <View>
                <FieldLabel>Descrição (opcional)</FieldLabel>
                <Input accessibilityLabel="Descrição" multiline onChangeText={setDescription} placeholder="Detalhes do lançamento" textAlignVertical="top" value={description} />
              </View>
              {error ? <Text accessibilityLiveRegion="polite" className="text-sm text-destructive">{error}</Text> : null}
              <Button disabled={saving} onPress={handleCreate}><ButtonText>{saving ? 'Salvando...' : 'Salvar lançamento'}</ButtonText></Button>
            </Card>
          ) : null}

          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {loadError ? <Text accessibilityLiveRegion="polite" className="text-sm text-destructive">{loadError}</Text> : null}
          {summary ? (
            <>
              <Card className="border-0 bg-primary p-5">
                <Text className="text-sm text-primary-foreground">Saldo do mês</Text>
                <Text className="mt-2 text-[32px] font-bold tabular-nums tracking-tight text-primary-foreground">{formatCurrency(summary.monthlyBalance)}</Text>
              </Card>
              <Metrics items={[
                { label: 'Entradas', value: formatCurrency(summary.monthlyIncome), tone: 'positive' },
                { label: 'Gastos', value: formatCurrency(summary.monthlyExpenses), tone: 'negative' },
                { label: 'Lançamentos no mês', value: summary.entriesCount },
              ]} />
            </>
          ) : null}

          <View className="gap-3">
            <Text accessibilityRole="header" className="text-lg font-bold">Últimos lançamentos</Text>
            {entries.length === 0 && !loading && !loadError ? <Card className="p-4"><Text className="text-sm text-muted">Nenhum lançamento ainda.</Text></Card> : null}
            {entries.map((entry) => {
              const isIncome = entry.type === 'Income';
              const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
              return (
                <Card className="p-4" key={entry.id}>
                  <View className="flex-row flex-wrap items-center justify-between gap-2">
                    <View className="min-w-[120px] flex-1 flex-row items-center gap-3">
                      <Icon color={isIncome ? colors.success : colors.destructive} size={19} />
                      <View className="min-w-0 flex-1">
                        <Text className="font-semibold">{entry.category}</Text>
                        <Text className="mt-0.5 text-xs text-muted">{formatDate(entry.entryDate.slice(0, 10))}</Text>
                      </View>
                    </View>
                    <Text className={`text-sm font-bold tabular-nums ${isIncome ? 'text-success' : 'text-destructive'}`}>{isIncome ? '+' : '−'} {formatCurrency(entry.amount)}</Text>
                  </View>
                  {entry.description ? <Text className="mt-2 text-sm text-muted">{entry.description}</Text> : null}
                </Card>
              );
            })}
          </View>
        </View>
      </ScrollView>
      {menuOpen ? (
        <ModuleMenu
          title="Finanças pessoais"
          items={[{ label: 'Configurações', icon: Settings, action: () => navigation.navigate('Settings', { token }) }]}
          onClose={() => setMenuOpen(false)}
          onSwitch={() => navigation.replace('ModuleSelection', { userName, role, token, modules })}
          onSignOut={() => { void clearSession(); resetTheme(); navigation.replace('Login'); }}
        />
      ) : null}
    </View>
  );
}
