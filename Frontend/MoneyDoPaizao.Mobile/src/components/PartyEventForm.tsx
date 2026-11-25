import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronDown, Plus, Trash2 } from 'lucide-react-native';
import { DatePickerField } from './DatePickerField';
import { Button, ButtonText } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Text } from './ui/text';
import { formatCurrency, parseMoneyCents } from '../lib/format';
import { partyToday } from '../lib/partyMonths';
import { createPartyEvent, type Customer, type PartyEvent, type PartyProduct, type PartyTheme } from '../services/api';

type Props = {
  token: string;
  customers: Customer[];
  themes: PartyTheme[];
  products: PartyProduct[];
  ready: boolean;
  onCreate: (event: PartyEvent) => void;
  onOpenProducts: () => void;
  onOpenCustomers: () => void;
};

type ProductLine = { id: number; product: PartyProduct; price: string; isGift: boolean };

function FieldLabel({ children }: { children: string }) {
  return <Text className="mb-1.5 text-sm font-bold text-navy">{children}</Text>;
}

function ChoiceButton({ label, open, onPress }: { label: string; open: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} className="flex-row items-center justify-between gap-2 rounded-xl border border-border bg-input px-4 py-3" onPress={onPress}>
      <Text className="flex-1 text-navy">{label}</Text>
      <ChevronDown color="#6D7784" size={18} />
    </Pressable>
  );
}

const optionClass = 'rounded-lg px-3 py-3';

export function PartyEventForm({ token, customers, themes, products, ready, onCreate, onOpenProducts, onOpenCustomers }: Props) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [theme, setTheme] = useState<PartyTheme | null>(null);
  const [picker, setPicker] = useState<'customer' | 'theme' | 'product' | null>(null);
  const [eventDate, setEventDate] = useState('');
  const [baseAmount, setBaseAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<ProductLine[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const nextLine = useRef(0);
  const base = baseAmount.trim() ? parseMoneyCents(baseAmount) : 0;
  const parsedLines = lines.map((line) => ({ ...line, cents: line.isGift ? 0 : parseMoneyCents(line.price) }));
  const total = (base ?? 0) + parsedLines.reduce((sum, line) => sum + (line.cents ?? 0), 0);
  const deposit = depositAmount.trim() ? parseMoneyCents(depositAmount) : 0;
  const received = receivedAmount.trim() ? parseMoneyCents(receivedAmount) : deposit;
  const validPrices = base !== null && parsedLines.every((line) => line.isGift || (line.cents ?? 0) > 0);
  const validTotal = validPrices && Number.isSafeInteger(total) && Math.round(total / 100 * 100) === total && total > 0;
  const past = !!eventDate && eventDate < partyToday();

  function togglePicker(name: NonNullable<typeof picker>) {
    setPicker((current) => current === name ? null : name);
  }

  function updateLine(id: number, update: Partial<Pick<ProductLine, 'price' | 'isGift'>>) {
    setLines((current) => current.map((line) => line.id === id ? { ...line, ...update } : line));
  }

  async function handleSave() {
    if (submitting.current || !ready) return;
    setError('');
    if (!customer || !eventDate) {
      setError('Selecione o cliente e a data da festa.');
      return;
    }
    if (!validTotal || base === null) {
      setError('Informe um valor total válido e preencha o preço de cada produto cobrado.');
      return;
    }
    if (deposit === null || deposit > total) {
      setError('Informe um sinal entre zero e o valor total.');
      return;
    }
    if (received === null || received < deposit || received > total) {
      setError('O total recebido deve ficar entre o sinal e o valor total da festa.');
      return;
    }

    submitting.current = true;
    setSaving(true);
    try {
      const event = await createPartyEvent(token, {
        customerId: customer.id,
        themeId: theme?.id ?? null,
        eventDate,
        totalAmount: base / 100,
        depositReceived: deposit > 0,
        depositAmount: deposit / 100,
        receivedAmount: received / 100,
        notes,
        products: parsedLines.map((line) => ({ productId: line.product.id, amount: (line.cents ?? 0) / 100, isGift: line.isGift })),
      });
      onCreate(event);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível salvar a festa.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <Card className="mb-6 gap-4 p-5">
      <Text className="text-lg font-extrabold text-navy">Nova festa</Text>
      <View>
        <FieldLabel>Cliente</FieldLabel>
        <ChoiceButton label={customer?.name ?? 'Selecione um cliente'} open={picker === 'customer'} onPress={() => togglePicker('customer')} />
        {picker === 'customer' ? (
          <View className="mt-2 rounded-xl border border-border p-1">
            {customers.map((item) => (
              <Pressable accessibilityRole="button" className={optionClass} key={item.id} onPress={() => { setCustomer(item); setPicker(null); }}>
                <Text className="font-semibold text-navy">{item.name}</Text>
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" className={optionClass} onPress={onOpenCustomers}>
              <Text className="font-bold text-navy">Cadastrar cliente</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      <View>
        <FieldLabel>Tema (opcional)</FieldLabel>
        <ChoiceButton label={theme?.name ?? 'Selecione um tema'} open={picker === 'theme'} onPress={() => togglePicker('theme')} />
        {picker === 'theme' ? (
          <View className="mt-2 rounded-xl border border-border p-1">
            <Pressable accessibilityRole="button" className={optionClass} onPress={() => { setTheme(null); setPicker(null); }}>
              <Text className="text-navy">Sem tema</Text>
            </Pressable>
            {themes.map((item) => (
              <Pressable accessibilityRole="button" className={optionClass} key={item.id} onPress={() => { setTheme(item); setPicker(null); }}>
                <Text className="font-semibold text-navy">{item.name}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
      <View>
        <FieldLabel>Data da festa</FieldLabel>
        <DatePickerField allowFuture label="a data da festa" value={eventDate} onChange={setEventDate} />
      </View>
      <View>
        <FieldLabel>Valor base da festa</FieldLabel>
        <Input accessibilityLabel="Valor base da festa" keyboardType="decimal-pad" onChangeText={setBaseAmount} placeholder="0,00" value={baseAmount} />
      </View>
      <View>
        <FieldLabel>Produtos da festa</FieldLabel>
        <View className="gap-2">
          {lines.map((line) => (
            <View className="gap-2 rounded-xl border border-border p-3" key={line.id}>
              <View className="flex-row items-center justify-between gap-2">
                <Text className="flex-1 font-bold text-navy">{line.product.name}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`Remover ${line.product.name}`} className="p-2" onPress={() => setLines((current) => current.filter((item) => item.id !== line.id))}>
                  <Trash2 color="#6D7784" size={17} />
                </Pressable>
              </View>
              <Pressable accessibilityRole="checkbox" accessibilityLabel={`Brinde: ${line.product.name}`} accessibilityState={{ checked: line.isGift }} className="min-h-10 flex-row items-center gap-2" onPress={() => updateLine(line.id, { isGift: !line.isGift })}>
                <View className={`h-5 w-5 items-center justify-center rounded border border-navy ${line.isGift ? 'bg-navy' : 'bg-surface'}`}>
                  {line.isGift ? <Text className="text-xs font-bold text-white">✓</Text> : null}
                </View>
                <Text className="text-sm font-semibold text-navy">Brinde</Text>
              </Pressable>
              {line.isGift ? <Text className="text-sm text-muted">{formatCurrency(0)}</Text> : (
                <Input accessibilityLabel={`Valor de ${line.product.name}`} keyboardType="decimal-pad" onChangeText={(price) => updateLine(line.id, { price })} placeholder="Valor do produto" value={line.price} />
              )}
            </View>
          ))}
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: picker === 'product' }} className="flex-row items-center gap-2 rounded-xl border border-border px-4 py-3" onPress={() => togglePicker('product')}>
            <Plus color="#6D7784" size={17} />
            <Text className="font-semibold text-navy">Adicionar produto</Text>
          </Pressable>
          {picker === 'product' ? (
            <View className="rounded-xl border border-border p-1">
              {products.map((item) => (
                <Pressable accessibilityRole="button" className={optionClass} key={item.id} onPress={() => {
                  const id = nextLine.current++;
                  setLines((current) => [...current, { id, product: item, price: '', isGift: false }]);
                  setPicker(null);
                }}>
                  <Text className="font-semibold text-navy">{item.name}</Text>
                  {item.notes ? <Text className="mt-1 text-xs text-muted">{item.notes}</Text> : null}
                </Pressable>
              ))}
              <Pressable accessibilityRole="button" className={optionClass} onPress={onOpenProducts}>
                <Text className="font-bold text-navy">Cadastrar produto</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
      <View className="flex-row flex-wrap items-center justify-between gap-2 rounded-xl bg-input p-3">
        <Text className="font-bold text-navy">Total da festa</Text>
        <Text className="text-lg font-extrabold text-navy">{formatCurrency(total / 100)}</Text>
      </View>
      <View>
        <FieldLabel>Sinal recebido (opcional)</FieldLabel>
        <Input accessibilityLabel="Sinal recebido" keyboardType="decimal-pad" onChangeText={setDepositAmount} placeholder="0,00" value={depositAmount} />
      </View>
      <View>
        <FieldLabel>Total já recebido (opcional)</FieldLabel>
        <Input accessibilityLabel="Total já recebido" keyboardType="decimal-pad" onChangeText={setReceivedAmount} placeholder={deposit ? (deposit / 100).toFixed(2).replace('.', ',') : '0,00'} value={receivedAmount} />
        <Text className="mt-1 text-xs text-muted">Inclua o sinal no total já recebido.</Text>
        {validTotal ? (
          <Pressable accessibilityRole="button" className="mt-1 self-start py-2" onPress={() => setReceivedAmount((total / 100).toFixed(2).replace('.', ','))}>
            <Text className="text-sm font-bold text-navy">Marcar como pago</Text>
          </Pressable>
        ) : null}
      </View>
      <View>
        <FieldLabel>Observações (opcional)</FieldLabel>
        <Input accessibilityLabel="Observações da festa" className="min-h-[84px] py-3" maxLength={500} multiline onChangeText={setNotes} textAlignVertical="top" value={notes} />
      </View>
      {error ? <Text accessibilityRole="alert" className="text-sm text-destructive">{error}</Text> : null}
      <Button disabled={!ready || saving} onPress={handleSave}>
        <ButtonText>{saving ? 'Salvando...' : past ? 'Registrar festa realizada' : 'Agendar festa'}</ButtonText>
      </Button>
    </Card>
  );
}
