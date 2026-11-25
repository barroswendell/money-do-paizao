import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ScreenHeader } from '../components/ui/screen-header';
import { Text } from '../components/ui/text';
import { formatCurrency, formatDate, formatPhone } from '../lib/format';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getRecordHistory, type HistoryEntry, type RecordKind } from '../services/api';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'RecordHistory'>;

const kindLabels: Record<RecordKind, string> = {
  Customer: 'Cliente', Loan: 'Empréstimo', PartyEvent: 'Festa', PartyTheme: 'Tema',
  PartyProduct: 'Produto de festa', Sale: 'Venda', Product: 'Produto de venda', FinanceEntry: 'Lançamento',
};

const actionLabels: Record<HistoryEntry['action'], string> = {
  Created: 'cadastrou o registro', Edited: 'editou o registro', Deactivated: 'excluiu o registro',
  ItemAdded: 'adicionou um item', ItemEdited: 'editou um item', ItemDeactivated: 'removeu um item',
  PaymentRegistered: 'registrou um pagamento',
};

const fieldLabels: Record<string, string> = {
  Name: 'Nome', Phone: 'Telefone', HasReferral: 'Possui indicação', Referral: 'Indicação',
  CustomerId: 'Cliente', PrincipalAmount: 'Valor do empréstimo', DueDay: 'Dia de vencimento',
  MonthlyInterestRatePercent: 'Juros mensais', LateDailyInterestRatePercent: 'Juros por atraso ao dia', Notes: 'Observações',
  ThemeId: 'Tema', EventDate: 'Data da festa', TotalAmount: 'Total', DepositReceived: 'Recebeu sinal',
  DepositAmount: 'Sinal', AdditionalReceivedAmount: 'Recebido além do sinal', ProductName: 'Produto',
  IsGift: 'Brinde', ProductId: 'Produto', Type: 'Tipo', Amount: 'Valor', EntryDate: 'Data',
  Category: 'Categoria', Description: 'Descrição', UnitPrice: 'Valor do produto', PaymentType: 'Forma de pagamento',
  DownPaymentAmount: 'Entrada', InstallmentCount: 'Quantidade de parcelas', InstallmentAmount: 'Valor da parcela',
  LastInstallmentAmount: 'Valor da última parcela', DueDate: 'Primeiro vencimento', Status: 'Situação',
  PaidAtUtc: 'Data do pagamento', Number: 'Número da parcela', InterestAmount: 'Valor dos juros',
  ReceiptName: 'Comprovante', Brand: 'Marca', Price: 'Preço',
};

const enumValues: Record<string, string> = {
  Active: 'Em aberto', Paid: 'Pago', Pending: 'Pendente', Scheduled: 'Agendada', Income: 'Entrada', Expense: 'Gasto',
  Full: 'Quitação', InterestOnly: 'Somente juros', Cash: 'À vista', Installment: 'Parcelado',
};

const monetaryFields = new Set([
  'PrincipalAmount', 'TotalAmount', 'DepositAmount', 'AdditionalReceivedAmount', 'Amount', 'UnitPrice',
  'DownPaymentAmount', 'InstallmentAmount', 'LastInstallmentAmount', 'InterestAmount', 'Price',
]);
const dateFields = new Set(['EventDate', 'EntryDate', 'DueDate']);
const enumFields = new Set(['Status', 'Type', 'PaymentType']);
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'America/Sao_Paulo' });

function displayValue(field: string, value: HistoryEntry['changes'][number]['before']) {
  if (value === null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'number' && monetaryFields.has(field)) return formatCurrency(value);
  if (typeof value === 'number' && field.endsWith('Percent')) return value.toLocaleString('pt-BR') + '%';
  if (typeof value === 'string' && dateFields.has(field)) return formatDate(value.slice(0, 10));
  if (typeof value === 'string' && field === 'PaidAtUtc') return dateTime.format(new Date(value));
  if (typeof value === 'string' && field === 'Phone') return formatPhone(value);
  return typeof value === 'string' && enumFields.has(field) ? enumValues[value] ?? value : String(value);
}

export function RecordHistoryScreen({ navigation, route }: Props) {
  const { token, kind, recordId, title } = route.params;
  const { colors } = useTheme();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getRecordHistory(token, page, kind, recordId)
      .then((result) => {
        if (!active) return;
        setEntries((previous) => page === 1 ? result.items : [...previous, ...result.items.filter((entry) => !previous.some((item) => item.id === entry.id))]);
        setHasMore(result.hasMore);
      })
      .catch((exception) => {
        if (active) setError(exception instanceof Error ? exception.message : 'Não foi possível carregar o histórico.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, page, kind, recordId, retry]);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Histórico" onBack={() => navigation.goBack()} />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }}>
        <View className="mx-auto w-full max-w-2xl gap-3">
          <Text accessibilityRole="header" className="text-xl font-bold">{title ?? 'Atividade do módulo'}</Text>
          {entries.map((entry) => (
            <Card className="gap-2 p-4" key={entry.id}>
              <Text className="text-xs font-semibold text-muted">{kindLabels[entry.kind]} · {dateTime.format(new Date(entry.occurredAtUtc))}</Text>
              <Text className="font-bold">{entry.recordName}</Text>
              <Text className="text-sm">{entry.userName} {actionLabels[entry.action]}.</Text>
              {entry.changes.map(({ field, before, after }) => (
                <View className="border-t border-border pt-2" key={field}>
                  <Text className="text-sm font-semibold">{fieldLabels[field] ?? field}</Text>
                  <Text className="text-sm text-muted">{before === null ? displayValue(field, after) : `${displayValue(field, before)} → ${displayValue(field, after)}`}</Text>
                </View>
              ))}
            </Card>
          ))}
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {!loading && error ? <>
            <Text accessibilityRole="alert" className="text-sm text-destructive">{error}</Text>
            <Button onPress={() => setRetry((current) => current + 1)} variant="outline"><ButtonText variant="outline">Tentar novamente</ButtonText></Button>
          </> : null}
          {!loading && !error && !entries.length ? <Card className="p-4"><Text className="text-sm text-muted">Ainda não há atividade registrada aqui.</Text></Card> : null}
          {hasMore && !error ? <Button disabled={loading} onPress={() => setPage((current) => current + 1)} variant="outline"><ButtonText variant="outline">Carregar mais</ButtonText></Button> : null}
        </View>
      </ScrollView>
    </View>
  );
}
