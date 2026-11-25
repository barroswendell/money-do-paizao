import { View } from 'react-native';
import { Card } from './ui/card';
import { Text } from './ui/text';
import { formatCurrency } from '../lib/format';
import type { PartyMonth } from '../services/api';

export function PartyMonthTotals({ month }: { month: PartyMonth }) {
  const totals = [
    ['Contratado', month.totalAmount],
    ['Recebido', month.receivedAmount],
    ['A receber', month.remainingAmount],
  ] as const;

  return (
    <View className="flex-row flex-wrap gap-2">
      {totals.map(([label, value]) => (
        <Card className="min-w-[88px] flex-1 p-3" key={label}>
          <Text className="text-xs text-muted">{label}</Text>
          <Text className="mt-1 text-sm font-extrabold text-navy">{formatCurrency(value)}</Text>
        </Card>
      ))}
    </View>
  );
}
