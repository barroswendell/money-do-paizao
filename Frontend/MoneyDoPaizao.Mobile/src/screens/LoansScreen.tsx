import { useTheme } from '../theme/ThemeProvider';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { getDocumentAsync, type DocumentPickerAsset } from 'expo-document-picker';
import { File as LocalFile } from 'expo-file-system';
import { CheckCircle2, ChevronDown, ChevronUp, Download, HandCoins, History, Paperclip, Percent, X } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { FieldLabel, fieldControl, Input } from '../components/ui/input';
import { FormToggle, ScreenHeader } from '../components/ui/screen-header';
import { Text } from '../components/ui/text';
import { RootStackParamList } from '../navigation/AppNavigator';
import { createLoan, downloadLoanPaymentReceipt, getCustomers, getLoans, registerLoanPayment, type Customer, type Loan, type LoanPayment, type LoanPaymentType } from '../services/api';
import { formatCurrency, formatDate, parseMoneyCents } from '../lib/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Loans'>;
type PendingPayment = { loan: Loan; type: LoanPaymentType; requestId: string };

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const RECEIPT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

function parseNumber(value: string) {
  return Number(value.replace(',', '.').replace(/[^0-9.-]/g, ''));
}

function discardPickedReceipt(receipt: DocumentPickerAsset) {
  if (Platform.OS === 'web') {
    URL.revokeObjectURL(receipt.uri);
    return;
  }

  try {
    const file = new LocalFile(receipt.uri);
    if (file.exists) file.delete();
  } catch {
    // The document picker only copies the file into the system-managed cache.
  }
}

export function LoansScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
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
  const [expandedLoanId, setExpandedLoanId] = useState('');
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [receipt, setReceipt] = useState<DocumentPickerAsset | null>(null);
  const [pickingReceipt, setPickingReceipt] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [downloadingPaymentId, setDownloadingPaymentId] = useState('');
  const [downloadError, setDownloadError] = useState<{ paymentId: string; message: string } | null>(null);

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

  useEffect(() => {
    if (receipt) return () => discardPickedReceipt(receipt);
  }, [receipt]);

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
        principalAmount: (parseMoneyCents(principalAmount) ?? 0) / 100,
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

  function openPayment(loan: Loan, type: LoanPaymentType) {
    setPaymentError('');
    setPendingPayment({ loan, type, requestId: randomUUID() });
  }

  function closePayment() {
    setPendingPayment(null);
    setReceipt(null);
  }

  async function chooseReceipt() {
    setPaymentError('');
    setPickingReceipt(true);
    try {
      const result = await getDocumentAsync({ type: RECEIPT_TYPES, copyToCacheDirectory: true, base64: false });
      if (result.canceled || !result.assets[0]) return;

      const file = result.assets[0];
      if (file.size !== undefined && (file.size === 0 || file.size > MAX_RECEIPT_BYTES)) {
        discardPickedReceipt(file);
        setPaymentError('Escolha um comprovante de até 5 MB.');
        return;
      }

      setReceipt(file);
    } catch {
      setPaymentError('Não foi possível selecionar o comprovante.');
    } finally {
      setPickingReceipt(false);
    }
  }

  async function handlePayment() {
    if (!pendingPayment || savingPayment || pickingReceipt) return;

    const { loan, type, requestId } = pendingPayment;
    setPaymentError('');
    setSavingPayment(true);
    try {
      const updatedLoan = await registerLoanPayment(token, loan.id, type, requestId, receipt);
      setLoans((current) => current.map((item) => item.id === updatedLoan.id ? updatedLoan : item));
      setExpandedLoanId(updatedLoan.id);
      closePayment();
    } catch (exception) {
      setPaymentError(exception instanceof Error ? exception.message : 'Não foi possível registrar o pagamento.');
    } finally {
      setSavingPayment(false);
    }
  }

  async function handleDownload(loanId: string, payment: LoanPayment) {
    if (!payment.receiptName || downloadingPaymentId) return;

    setDownloadError(null);
    setDownloadingPaymentId(payment.id);
    try {
      await downloadLoanPaymentReceipt(token, loanId, payment.id, payment.receiptName);
    } catch {
      setDownloadError({ paymentId: payment.id, message: 'Não foi possível baixar o comprovante.' });
    } finally {
      setDownloadingPaymentId('');
    }
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Empréstimos"
        onBack={() => navigation.goBack()}
        actions={<FormToggle label="Novo empréstimo" open={formOpen} onPress={() => setFormOpen((current) => !current)} />}
      />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="mx-auto w-full max-w-2xl">
          {formOpen ? (
            <Card className="mb-5 p-5">
              <Text className="mb-4 text-[18px] font-extrabold text-foreground">Novo empréstimo</Text>

              <FieldLabel>Cliente</FieldLabel>
              <Pressable
                accessibilityLabel="Cliente"
                accessibilityRole="button"
                accessibilityState={{ expanded: pickerOpen }}
                className={`${fieldControl} mb-3 flex-row items-center justify-between gap-2 px-3.5 py-3`}
                onPress={() => setPickerOpen((current) => !current)}
              >
                <Text className={`min-w-0 flex-1 ${selectedCustomer ? 'text-foreground' : 'text-muted'}`}>{selectedCustomer?.name ?? 'Selecione um cliente'}</Text>
                <ChevronDown color={colors.muted} size={18} />
              </Pressable>

              {pickerOpen ? (
                <View className="mb-4 rounded-xl border border-border bg-surface p-2">
                  {customers.length === 0 ? <Text className="p-3 text-[13px] text-muted">Cadastre um cliente primeiro.</Text> : null}
                  {customers.map((customer) => (
                    <Pressable accessibilityRole="button" className="min-h-[44px] justify-center rounded-lg px-3 py-3 pressed:bg-selected" key={customer.id} onPress={() => { setSelectedCustomer(customer); setPickerOpen(false); }}>
                      <Text className="text-[14px] font-semibold text-foreground">{customer.name}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <FieldLabel>Valor do empréstimo</FieldLabel>
              <Input accessibilityLabel="Valor do empréstimo" className="mb-4" keyboardType="decimal-pad" onChangeText={setPrincipalAmount} placeholder="Ex.: 1.000,00" value={principalAmount} />

              <View className="flex-row flex-wrap gap-x-3">
                <View className="mb-4 min-w-[140px] flex-1">
                  <FieldLabel>Dia do vencimento</FieldLabel>
                  <Input accessibilityLabel="Dia do vencimento" keyboardType="number-pad" onChangeText={setDueDay} placeholder="Ex.: 10" value={dueDay} />
                </View>
                <View className="mb-4 min-w-[140px] flex-1">
                  <FieldLabel>Juros mensais (%)</FieldLabel>
                  <Input accessibilityLabel="Juros mensais (%)" keyboardType="decimal-pad" onChangeText={setMonthlyInterest} placeholder="Ex.: 10" value={monthlyInterest} />
                </View>
              </View>

              <FieldLabel>Juros por atraso ao dia (%)</FieldLabel>
              <Input accessibilityLabel="Juros por atraso ao dia (%)" className="mb-4" keyboardType="decimal-pad" onChangeText={setLateDailyInterest} placeholder="Ex.: 0,5" value={lateDailyInterest} />

              {error ? <Text className="mb-3 text-[13px] text-destructive">{error}</Text> : null}
              <Button disabled={saving} onPress={handleCreate}>
                <ButtonText>{saving ? 'Salvando...' : 'Cadastrar empréstimo'}</ButtonText>
              </Button>
            </Card>
          ) : null}

          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">

              <Text className="text-[16px] font-bold text-foreground">Empréstimos cadastrados</Text>
            </View>
            <Text className="text-[13px] font-bold text-muted">{loans.length}</Text>
          </View>

          {!formOpen && error ? <Text className="mb-3 text-[13px] text-destructive">{error}</Text> : null}
          {loading ? <ActivityIndicator color={colors.primary} size="large" /> : null}
          {!loading && loans.length === 0 ? (
            <Card className="items-center p-8">
              <HandCoins color={colors.muted} size={28} strokeWidth={1.5} />
              <Text className="mt-3 text-[15px] font-bold text-foreground">Nenhum empréstimo ainda</Text>
              <Text className="mt-1 text-center text-[13px] leading-5 text-muted">Use o botão + para cadastrar o primeiro empréstimo.</Text>
            </Card>
          ) : null}

          {!loading ? loans.map((loan) => {
            const paid = loan.status === 'Paid';
            const payments = loan.payments ?? [];
            const fullPayment = payments.find((payment) => payment.type === 'Full');
            return (
              <Card className="mb-3 p-4" key={loan.id}>
                <Pressable onPress={() => setExpandedLoanId((current) => current === loan.id ? '' : loan.id)}>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-[16px] font-extrabold text-foreground">{loan.customerName}</Text>
                      <Text className="mt-1 text-[12px] text-muted">Vencimento: dia {loan.dueDay} · {loan.daysLate > 0 ? `${loan.daysLate} dias em atraso` : 'em dia'}</Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View className={`rounded-full px-2.5 py-1 ${paid ? 'bg-primary' : loan.daysLate > 0 ? 'bg-destructive/10' : 'bg-selected'}`}>
                        <Text className={`text-[11px] font-bold ${paid ? 'text-primary-foreground' : loan.daysLate > 0 ? 'text-destructive' : 'text-selected-foreground'}`}>{paid ? 'Pago' : loan.daysLate > 0 ? 'Atrasado' : 'Em dia'}</Text>
                      </View>
                      {expandedLoanId === loan.id ? <ChevronUp color={colors.muted} size={18} /> : <ChevronDown color={colors.muted} size={18} />}
                    </View>
                  </View>
                </Pressable>

                <View className="my-4 flex-row gap-3 border-y border-border py-3">
                  <View className="flex-1">
                    <Text className="text-[11px] text-muted">Principal</Text>
                    <Text className="mt-1 text-[15px] font-extrabold text-foreground">{formatCurrency(loan.principalAmount)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[11px] text-muted">Juros atual</Text>
                    <Text className="mt-1 text-[15px] font-extrabold text-foreground">{formatCurrency(loan.interestDue)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[11px] text-muted">Total</Text>
                    <Text className="mt-1 text-[15px] font-extrabold text-foreground">{formatCurrency(loan.totalDue)}</Text>
                  </View>
                </View>

                {expandedLoanId === loan.id ? (
                  <View className="mb-4 rounded-xl border border-border bg-background p-4">
                    <View className="mb-3 flex-row items-center">
                      <History color={colors.selectedForeground} size={18} strokeWidth={1.8} />
                      <Text className="ml-2 text-[14px] font-extrabold text-foreground">Histórico do empréstimo</Text>
                    </View>
                    {paid && fullPayment ? <Text className="mb-3 text-[13px] font-bold text-success">Empréstimo finalizado em {formatDate(fullPayment.paidAtUtc)}</Text> : null}
                    {payments.length === 0 ? <Text className="text-[12px] text-muted">Nenhum pagamento registrado ainda.</Text> : null}
                    {payments.map((payment) => (
                      <View className="mb-3 border-b border-border pb-3 last:mb-0 last:border-b-0 last:pb-0" key={payment.id ?? `${payment.type}-${payment.paidAtUtc}`}>
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1 pr-3">
                            <Text className="text-[14px] font-bold text-foreground">{payment.type === 'Full' ? 'Empréstimo finalizado' : 'Pagamento somente de juros'}</Text>
                            <Text className="mt-1 text-[12px] text-muted">{formatDate(payment.paidAtUtc)}</Text>
                          </View>
                          <Text className="text-[13px] font-extrabold text-foreground">{formatCurrency(payment.amount)}</Text>
                        </View>
                        <Text className="mt-2 text-[11px] text-muted">Juros: {formatCurrency(payment.interestAmount)} · Principal: {formatCurrency(payment.principalAmount)}</Text>
                        {payment.receiptName ? (
                          <Pressable accessibilityRole="button" className="mt-2 flex-row items-center gap-2 py-1" disabled={!!downloadingPaymentId} onPress={() => handleDownload(loan.id, payment)}>
                            <Download color={colors.selectedForeground} size={16} strokeWidth={1.8} />
                            <Text className="text-[12px] font-bold text-foreground">{downloadingPaymentId === payment.id ? 'Baixando...' : 'Baixar comprovante'}</Text>
                          </Pressable>
                        ) : null}
                        {downloadError?.paymentId === payment.id ? <Text accessibilityLiveRegion="polite" className="mt-1 text-[12px] text-destructive">{downloadError.message}</Text> : null}
                      </View>
                    ))}
                  </View>
                ) : null}

                {!paid ? (
                  <View className="flex-row gap-3">
                    <Button accessibilityRole="button" className="flex-1 flex-row gap-2" onPress={() => openPayment(loan, 'InterestOnly')} variant="outline">
                      <Percent color={colors.foreground} size={16} strokeWidth={1.8} />
                      <ButtonText variant="outline">Pagar juros</ButtonText>
                    </Button>
                    <Button accessibilityRole="button" className="flex-1 flex-row gap-2" onPress={() => openPayment(loan, 'Full')}>
                      <CheckCircle2 color={colors.primaryForeground} size={16} strokeWidth={1.8} />
                      <ButtonText>Finalizar pago</ButtonText>
                    </Button>
                  </View>
                ) : null}
              </Card>
            );
          }) : null}
        </View>
      </ScrollView>

      {pendingPayment ? (
        <Modal animationType="fade" onRequestClose={() => { if (!savingPayment && !pickingReceipt) closePayment(); }} transparent>
          <View className="flex-1 items-center justify-center bg-black/50 p-5">
            <Card className="w-full max-w-md p-5">
              <Text accessibilityRole="header" className="text-[18px] font-extrabold text-foreground">{pendingPayment.type === 'Full' ? 'Finalizar empréstimo' : 'Pagar somente os juros'}</Text>
              <Text className="mb-5 mt-1 text-[14px] text-muted">{pendingPayment.loan.customerName}</Text>

              <Text className="mb-1 font-bold text-foreground">Comprovante de pagamento (opcional)</Text>
              <Text className="mb-3 text-[12px] text-muted">PDF, JPG ou PNG de até 5 MB.</Text>
              {receipt ? (
                <View className="mb-3 flex-row items-center gap-2 rounded-xl border border-border bg-input px-3 py-2">
                  <Paperclip color={colors.muted} size={16} strokeWidth={1.8} />
                  <Text className="flex-1 text-[13px] text-foreground" numberOfLines={2}>{receipt.name}</Text>
                  <Pressable accessibilityLabel="Remover comprovante" accessibilityRole="button" className="p-2" disabled={savingPayment || pickingReceipt} onPress={() => { setReceipt(null); setPaymentError(''); }}>
                    <X color={colors.muted} size={18} strokeWidth={1.8} />
                  </Pressable>
                </View>
              ) : null}
              <Button accessibilityRole="button" className="mb-4 flex-row gap-2" disabled={savingPayment || pickingReceipt} onPress={chooseReceipt} variant="outline">
                <Paperclip color={colors.muted} size={16} strokeWidth={1.8} />
                <ButtonText variant="outline">{pickingReceipt ? 'Selecionando...' : receipt ? 'Trocar arquivo' : 'Selecionar arquivo'}</ButtonText>
              </Button>

              {paymentError ? <Text accessibilityLiveRegion="polite" className="mb-3 text-[13px] text-destructive">{paymentError}</Text> : null}
              <View className="flex-row gap-3">
                <Button accessibilityRole="button" className="flex-1" disabled={savingPayment || pickingReceipt} onPress={closePayment} variant="outline">
                  <ButtonText variant="outline">Cancelar</ButtonText>
                </Button>
                <Button accessibilityRole="button" className="flex-1" disabled={savingPayment || pickingReceipt} onPress={handlePayment}>
                  <ButtonText>{savingPayment ? 'Salvando...' : 'Confirmar'}</ButtonText>
                </Button>
              </View>
            </Card>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}
