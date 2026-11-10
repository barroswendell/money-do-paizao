import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { ArrowLeft, CalendarClock, CheckCircle2, ChevronDown, HandCoins, Percent, Plus, WalletCards } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Text } from '../components/ui/text';
import { RootStackParamList } from '../navigation/AppNavigator';
import { createLoan, getCustomers, getLoans, registerLoanPayment, type Customer, type Loan } from '../services/api';
import { formatCurrency, formatDate } from '../lib/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Loans'>;

function parseNumber(value: string) {
  return Number(value.replace(',', '.').replace(/[^0-9.-]/g, ''));
}

export function LoansScreen({ navigation, route }: Props) {
  const { token } = route.params;
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formOpen, setFormOpen] = useState(route.params.openCreate ?? false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [principalAmount, setPrincipalAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [monthlyInterest, setMonthlyInterest] = useState('');
  const [lateDailyInterest, setLateDailyInterest] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoanId, setActionLoanId] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      const [loanResponse, customerResponse] = await Promise.all([getLoans(token), getCustomers(token)]);
      setLoans(loanResponse);
      setCustomers(customerResponse);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível carregar os empréstimos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [token]);

  async function handleCreate() {
    setError('');
    if (!selectedCustomer) {
      setError('Selecione um cliente.');
      return;
    }

    try {
      setSaving(true);
      await createLoan(token, {
        customerId: selectedCustomer.id,
        principalAmount: parseNumber(principalAmount),
        dueDay: Number(dueDay),
        monthlyInterestRatePercent: parseNumber(monthlyInterest),
        lateDailyInterestRatePercent: parseNumber(lateDailyInterest),
      });
      setSelectedCustomer(null);
      setPrincipalAmount('');
      setDueDay('');
      setMonthlyInterest('');
      setLateDailyInterest('');
      setFormOpen(false);
      await loadData();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível cadastrar o empréstimo.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePayment(loanId: string, type: 'Full' | 'InterestOnly') {
    try {
      setActionLoanId(loanId);
      await registerLoanPayment(token, loanId, type);
      await loadData();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível registrar o pagamento.');
    } finally {
      setActionLoanId('');
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
            <Text className="text-xl font-extrabold text-navy">Empréstimos</Text>
            <Text className="text-[12px] text-muted">Acompanhe saldo, juros e pagamentos.</Text>
          </View>
        </View>
        <Pressable accessibilityLabel="Novo empréstimo" className="h-10 w-10 items-center justify-center rounded-xl bg-navy" onPress={() => setFormOpen((current) => !current)}>
          <Plus color="#D4A64A" size={20} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="mx-auto w-full max-w-2xl">
          {formOpen ? (
            <Card className="mb-5 p-5">
              <Text className="mb-1 text-[18px] font-extrabold text-navy">Novo empréstimo</Text>
              <Text className="mb-5 text-[13px] leading-5 text-muted">Defina o cliente, vencimento e as regras de juros.</Text>

              <Text className="mb-1.5 text-[13px] font-bold text-navy">Cliente</Text>
              <Pressable className="mb-3 flex-row items-center justify-between rounded-xl border border-border bg-input px-4 py-3.5" onPress={() => setPickerOpen((current) => !current)}>
                <View className="flex-row items-center">
                  <WalletCards color="#6D7784" size={18} strokeWidth={1.8} />
                  <Text className={`ml-3 text-[15px] ${selectedCustomer ? 'text-navy' : 'text-muted'}`}>{selectedCustomer?.name ?? 'Selecione um cliente'}</Text>
                </View>
                <ChevronDown color="#6D7784" size={18} strokeWidth={1.8} />
              </Pressable>

              {pickerOpen ? (
                <View className="mb-4 rounded-xl border border-border bg-surface p-2">
                  {customers.length === 0 ? <Text className="p-3 text-[13px] text-muted">Cadastre um cliente primeiro.</Text> : null}
                  {customers.map((customer) => (
                    <Pressable className="rounded-lg px-3 py-3" key={customer.id} onPress={() => { setSelectedCustomer(customer); setPickerOpen(false); }}>
                      <Text className="text-[14px] font-semibold text-navy">{customer.name}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <Text className="mb-1.5 text-[13px] font-bold text-navy">Valor do empréstimo</Text>
              <View className="mb-4 flex-row items-center rounded-xl border border-border bg-input px-3.5">
                <HandCoins color="#6D7784" size={18} strokeWidth={1.8} />
                <Input className="border-0 bg-transparent px-3" keyboardType="decimal-pad" onChangeText={setPrincipalAmount} placeholder="Ex.: 1000,00" value={principalAmount} />
              </View>

              <View className="flex-row gap-3">
                <View className="mb-4 flex-1">
                  <Text className="mb-1.5 text-[13px] font-bold text-navy">Dia do vencimento</Text>
                  <Input keyboardType="number-pad" onChangeText={setDueDay} placeholder="Ex.: 10" value={dueDay} />
                </View>
                <View className="mb-4 flex-1">
                  <Text className="mb-1.5 text-[13px] font-bold text-navy">Juros mensal (%)</Text>
                  <View className="flex-row items-center rounded-xl border border-border bg-input px-3">
                    <Input className="border-0 bg-transparent px-1" keyboardType="decimal-pad" onChangeText={setMonthlyInterest} placeholder="Ex.: 10" value={monthlyInterest} />
                    <Percent color="#6D7784" size={17} strokeWidth={1.8} />
                  </View>
                </View>
              </View>

              <Text className="mb-1.5 text-[13px] font-bold text-navy">Juros por atraso ao dia (%)</Text>
              <View className="mb-4 flex-row items-center rounded-xl border border-border bg-input px-3">
                <CalendarClock color="#6D7784" size={18} strokeWidth={1.8} />
                <Input className="border-0 bg-transparent px-3" keyboardType="decimal-pad" onChangeText={setLateDailyInterest} placeholder="Ex.: 0,5" value={lateDailyInterest} />
                <Percent color="#6D7784" size={17} strokeWidth={1.8} />
              </View>

              {error ? <Text className="mb-3 text-[13px] text-destructive">{error}</Text> : null}
              <Button disabled={saving} onPress={handleCreate}>
                <ButtonText>{saving ? 'Salvando...' : 'Cadastrar empréstimo'}</ButtonText>
              </Button>
            </Card>
          ) : null}

          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <HandCoins color="#D4A64A" size={19} strokeWidth={1.8} />
              <Text className="ml-2 text-[16px] font-extrabold text-navy">Empréstimos cadastrados</Text>
            </View>
            <Text className="text-[13px] font-bold text-muted">{loans.length}</Text>
          </View>

          {loading ? <ActivityIndicator color="#D4A64A" size="large" /> : null}
          {!loading && loans.length === 0 ? (
            <Card className="items-center p-8">
              <HandCoins color="#6D7784" size={28} strokeWidth={1.5} />
              <Text className="mt-3 text-[15px] font-bold text-navy">Nenhum empréstimo ainda</Text>
              <Text className="mt-1 text-center text-[13px] leading-5 text-muted">Use o botão + para cadastrar o primeiro empréstimo.</Text>
            </Card>
          ) : null}

          {!loading ? loans.map((loan) => {
            const paid = loan.status === 'Paid';
            return (
              <Card className="mb-3 p-4" key={loan.id}>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-[16px] font-extrabold text-navy">{loan.customerName}</Text>
                    <Text className="mt-1 text-[12px] text-muted">Vencimento: dia {loan.dueDay} · {loan.daysLate > 0 ? `${loan.daysLate} dias em atraso` : 'em dia'}</Text>
                  </View>
                  <View className={`rounded-full px-2.5 py-1 ${paid ? 'bg-navy' : loan.daysLate > 0 ? 'bg-destructive/10' : 'bg-gold/20'}`}>
                    <Text className={`text-[11px] font-bold ${paid ? 'text-white' : loan.daysLate > 0 ? 'text-destructive' : 'text-navy'}`}>{paid ? 'Pago' : loan.daysLate > 0 ? 'Atrasado' : 'Em dia'}</Text>
                  </View>
                </View>

                <View className="my-4 flex-row gap-3 border-y border-border py-3">
                  <View className="flex-1">
                    <Text className="text-[11px] text-muted">Principal</Text>
                    <Text className="mt-1 text-[15px] font-extrabold text-navy">{formatCurrency(loan.principalAmount)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[11px] text-muted">Juros atual</Text>
                    <Text className="mt-1 text-[15px] font-extrabold text-navy">{formatCurrency(loan.interestDue)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[11px] text-muted">Total</Text>
                    <Text className="mt-1 text-[15px] font-extrabold text-navy">{formatCurrency(loan.totalDue)}</Text>
                  </View>
                </View>

                {!paid ? (
                  <View className="flex-row gap-3">
                    <Button className="flex-1 flex-row gap-2" disabled={actionLoanId === loan.id} onPress={() => handlePayment(loan.id, 'InterestOnly')} variant="outline">
                      <Percent color="#071629" size={16} strokeWidth={1.8} />
                      <ButtonText variant="outline">Pagar juros</ButtonText>
                    </Button>
                    <Button className="flex-1 flex-row gap-2" disabled={actionLoanId === loan.id} onPress={() => handlePayment(loan.id, 'Full')}>
                      <CheckCircle2 color="#071629" size={16} strokeWidth={1.8} />
                      <ButtonText>Finalizar pago</ButtonText>
                    </Button>
                  </View>
                ) : null}
              </Card>
            );
          }) : null}
        </View>
      </ScrollView>
    </View>
  );
}
