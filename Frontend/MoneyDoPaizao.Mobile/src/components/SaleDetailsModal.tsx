import { useTheme } from '../theme/ThemeProvider';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { formatCurrency, formatDate } from '../lib/format';
import { getSaleInstallments, paySaleInstallment, type Sale, type SaleInstallmentPage } from '../services/api';
import { Button, ButtonText } from './ui/button';
import { Card } from './ui/card';
import { Text } from './ui/text';

type Props = {
  token: string;
  sale: Sale;
  onClose: () => void;
  onSaleUpdated: (sale: Sale) => void;
};

const paidAtFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
});

export function SaleDetailsModal({ token, sale, onClose, onSaleUpdated }: Props) {
  const { colors } = useTheme();
  const [page, setPage] = useState(1);
  const [pageData, setPageData] = useState<SaleInstallmentPage | null>(null);
  const [payingNumber, setPayingNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(sale.paymentType === 'Installment');
  const [error, setError] = useState('');

  useEffect(() => {
    if (sale.paymentType !== 'Installment') return;
    let active = true;
    setError('');
    setLoading(true);
    getSaleInstallments(token, sale.id, page)
      .then((result) => {
        if (!active) return;
        setPageData(result);
        onSaleUpdated(result.sale);
      })
      .catch((exception) => {
        if (active) setError(exception instanceof Error ? exception.message : 'Não foi possível carregar as parcelas.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, sale.id, sale.paymentType, page, onSaleUpdated]);

  async function handlePay(number: number) {
    if (payingNumber !== null) return;
    setError('');
    setPayingNumber(number);
    try {
      const result = await paySaleInstallment(token, sale.id, number);
      onSaleUpdated(result.sale);
      setPageData(result);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível registrar o pagamento da parcela.');
    } finally {
      setPayingNumber(null);
    }
  }

  const receivedAmount = sale.receivedAmount ?? (sale.status === 'Paid' ? sale.amount : sale.downPaymentAmount);
  const legacySettlement = sale.status === 'Paid' && pageData?.installments.every((item) => !item.paidAtUtc);
  const close = () => { if (payingNumber === null) onClose(); };

  return (
    <Modal animationType="fade" onRequestClose={close} transparent>
      <View className="flex-1 items-center justify-center bg-black/50 p-5">
        <Card className="max-h-[90%] w-full max-w-xl p-5">
          <View className="mb-4 flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text accessibilityRole="header" className="text-[19px] font-extrabold text-foreground">Detalhes da venda</Text>
              <Text className="mt-1 text-[14px] font-bold text-foreground">{sale.productName}</Text>
              <Text className="mt-0.5 text-[13px] text-muted">{sale.customerName} · {formatDate(sale.soldAtUtc)}</Text>
            </View>
            <Pressable accessibilityLabel="Fechar detalhes" accessibilityRole="button" className="rounded-lg border border-border p-2" disabled={payingNumber !== null} onPress={close}>
              <X color={colors.foreground} size={19} />
            </Pressable>
          </View>

          <ScrollView className="shrink" style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled">
            <View className="mb-4 gap-1 rounded-xl border border-border bg-input p-3.5">
              <Text className="text-[15px] font-extrabold text-foreground">Total {formatCurrency(sale.amount)}</Text>
              {sale.downPaymentAmount > 0 ? <Text className="text-[13px] text-muted">Entrada {formatCurrency(sale.downPaymentAmount)}</Text> : null}
              <Text className="text-[13px] text-muted">Recebido {formatCurrency(receivedAmount)} · Falta {formatCurrency(Math.round((sale.amount - receivedAmount) * 100) / 100)}</Text>
            </View>

            {error ? <Text accessibilityLiveRegion="polite" className="mb-3 text-[13px] text-destructive">{error}</Text> : null}
            {sale.paymentType === 'Cash' ? (
              <Text className="text-[14px] font-bold text-foreground">Pagamento à vista</Text>
            ) : (
              <>
                <Text className="mb-2 text-[15px] font-extrabold text-foreground">Parcelas {sale.paidInstallmentCount ?? 0}/{sale.scheduledInstallmentCount ?? sale.installmentCount ?? 1} pagas</Text>
                {loading ? <ActivityIndicator color={colors.primary} size="small" /> : null}
                {!loading && legacySettlement ? <Text className="mb-3 text-[12px] text-muted">Esta venda foi quitada antes do histórico por parcela.</Text> : null}
                {!loading ? pageData?.installments.map((installment) => (
                  <View className="mb-2 rounded-xl border border-border px-3.5 py-3" key={installment.number}>
                    <View className="flex-row justify-between gap-2">
                      <Text className="text-[14px] font-bold text-foreground">Parcela {installment.number}</Text>
                      <Text className="text-[14px] font-extrabold text-foreground">{formatCurrency(installment.amount)}</Text>
                    </View>
                    {installment.dueDate ? <Text className="mt-1 text-[12px] text-muted">Vencimento em {installment.dueDate.split('-').reverse().join('/')}</Text> : null}
                    {installment.isPaid ? (
                      <View className="mt-2 flex-row items-start gap-2">
                        <Check color={colors.success} size={16} />
                        <View className="flex-1">
                          <Text className="text-[13px] font-bold text-success">Paga</Text>
                          {installment.paidAtUtc ? (
                            <Text className="mt-0.5 text-[12px] text-muted">
                              Paga em {paidAtFormatter.format(new Date(installment.paidAtUtc))} por {installment.paidByUserName}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    ) : (
                      <>
                        {installment.isOverdue ? <Text className="mt-1 text-[12px] font-bold text-destructive">Vencida</Text> : null}
                        <Button accessibilityLabel={`Marcar parcela ${installment.number} como paga`} accessibilityRole="button" className="mt-2" disabled={payingNumber !== null} onPress={() => handlePay(installment.number)} size="sm" variant="outline">
                          <ButtonText variant="outline">{payingNumber === installment.number ? 'Registrando...' : 'Marcar como paga'}</ButtonText>
                        </Button>
                      </>
                    )}
                  </View>
                )) : null}
                {!loading && pageData && pageData.totalPages > 1 ? (
                  <View className="mt-2 flex-row items-center justify-between gap-2">
                    <Button accessibilityRole="button" disabled={pageData.page <= 1 || payingNumber !== null} onPress={() => setPage(pageData.page - 1)} size="sm" variant="outline">
                      <ButtonText variant="outline">Anteriores</ButtonText>
                    </Button>
                    <Text className="text-[12px] text-muted">{pageData.page} de {pageData.totalPages}</Text>
                    <Button accessibilityRole="button" disabled={pageData.page >= pageData.totalPages || payingNumber !== null} onPress={() => setPage(pageData.page + 1)} size="sm" variant="outline">
                      <ButtonText variant="outline">Próximas</ButtonText>
                    </Button>
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );
}
