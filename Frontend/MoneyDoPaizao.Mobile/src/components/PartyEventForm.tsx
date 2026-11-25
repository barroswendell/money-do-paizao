import { useTheme } from '../theme/ThemeProvider';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ChevronDown, Plus, Trash2 } from 'lucide-react-native';
import { DatePickerField } from './DatePickerField';
import { Button, ButtonText } from './ui/button';
import { Card } from './ui/card';
import { FieldLabel, fieldControl, Input } from './ui/input';
import { Text } from './ui/text';
import { formatCurrency, formatMoneyInput, parseMoneyCents } from '../lib/format';
import { partyToday } from '../lib/partyMonths';
import { savePartyEvent, type Customer, type PartyEvent, type PartyProduct, type PartyTheme } from '../services/api';

type Props = {
  token: string;
  customers: Customer[];
  themes: PartyTheme[];
  products: PartyProduct[];
  ready: boolean;
  initialEvent: PartyEvent | null;
  onSave: (event: PartyEvent) => void;
  onSavingChange: (saving: boolean) => void;
  onOpenProducts: () => void;
  onOpenCustomers: () => void;
};

type ProductLine = { id: number; persistedId?: string; product: PartyProduct; price: string; isGift: boolean };

function ChoiceButton({ label, open, onPress }: { label: string; open: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} className={`${fieldControl} flex-row items-center justify-between gap-2 px-3.5 py-3`} onPress={onPress}>
      <Text className="flex-1 text-foreground">{label}</Text>
      <ChevronDown color={colors.muted} size={18} />
    </Pressable>
  );
}

const optionClass = 'rounded-lg px-3 py-3';

export function PartyEventForm({ token, customers, themes, products, ready, initialEvent, onSave, onSavingChange, onOpenProducts, onOpenCustomers }: Props) {
  const { colors } = useTheme();
  const [customer, setCustomer] = useState<Pick<Customer, 'id' | 'name'> | null>(() => initialEvent ?
    { id: initialEvent.customerId, name: initialEvent.customerName } : null);
  const [theme, setTheme] = useState<Pick<PartyTheme, 'id' | 'name'> | null>(() => initialEvent?.themeId ?
    { id: initialEvent.themeId, name: initialEvent.themeName ?? 'Tema' } : null);
  const [picker, setPicker] = useState<'customer' | 'theme' | 'product' | null>(null);
  const [eventDate, setEventDate] = useState(initialEvent?.eventDate.slice(0, 10) ?? '');
  const [baseAmount, setBaseAmount] = useState(initialEvent ? formatMoneyInput(initialEvent.baseAmount) : '');
  const [depositAmount, setDepositAmount] = useState(initialEvent?.depositAmount ? formatMoneyInput(initialEvent.depositAmount) : '');
  const [receivedAmount, setReceivedAmount] = useState(initialEvent ? formatMoneyInput(initialEvent.receivedAmount) : '');
  const [notes, setNotes] = useState(initialEvent?.notes ?? '');
  const [lines, setLines] = useState<ProductLine[]>(() => (initialEvent?.products ?? []).map((item, index) => ({
    id: index, persistedId: item.id, product: { id: item.productId, name: item.productName },
    price: formatMoneyInput(item.amount), isGift: item.isGift,
  })));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const nextLine = useRef(lines.length);
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
    onSavingChange(true);
    try {
      const event = await savePartyEvent(token, {
        customerId: customer.id,
        themeId: theme?.id ?? null,
        eventDate,
        totalAmount: base / 100,
        depositReceived: deposit > 0,
        depositAmount: deposit / 100,
        receivedAmount: received / 100,
        notes,
        products: parsedLines.map((line) => ({
          id: line.persistedId, productId: line.product.id, amount: (line.cents ?? 0) / 100, isGift: line.isGift,
        })),
      }, initialEvent?.id);
      onSave(event);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível salvar a festa.');
    } finally {
      submitting.current = false;
      setSaving(false);
      onSavingChange(false);
    }
  }

  return (
    <Card className="mb-6 gap-4 p-5">
      <Text accessibilityRole="header" className="text-lg font-extrabold text-foreground">{initialEvent ? 'Editar festa' : 'Nova festa'}</Text>
      <View>
        <FieldLabel>Cliente</FieldLabel>
        <ChoiceButton label={customer?.name ?? 'Selecione um cliente'} open={picker === 'customer'} onPress={() => togglePicker('customer')} />
        {picker === 'customer' ? (
          <View className="mt-2 rounded-xl border border-border p-1">
            {customers.map((item) => (
              <Pressable accessibilityRole="button" className={optionClass} key={item.id} onPress={() => { setCustomer(item); setPicker(null); }}>
                <Text className="font-semibold text-foreground">{item.name}</Text>
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" className={optionClass} onPress={onOpenCustomers}>
              <Text className="font-bold text-foreground">Cadastrar cliente</Text>
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
              <Text className="text-foreground">Sem tema</Text>
            </Pressable>
            {themes.map((item) => (
              <Pressable accessibilityRole="button" className={optionClass} key={item.id} onPress={() => { setTheme(item); setPicker(null); }}>
                <Text className="font-semibold text-foreground">{item.name}</Text>
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
                <Text className="flex-1 font-bold text-foreground">{line.product.name}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`Remover ${line.product.name}`} className="p-2" onPress={() => setLines((current) => current.filter((item) => item.id !== line.id))}>
                  <Trash2 color={colors.muted} size={17} />
                </Pressable>
              </View>
              <Pressable accessibilityRole="checkbox" accessibilityLabel={`Brinde: ${line.product.name}`} accessibilityState={{ checked: line.isGift }} className="min-h-10 flex-row items-center gap-2" onPress={() => updateLine(line.id, { isGift: !line.isGift })}>
                <View className={`h-5 w-5 items-center justify-center rounded border border-focus ${line.isGift ? 'bg-primary' : 'bg-surface'}`}>
                  {line.isGift ? <Text className="text-xs font-bold text-primary-foreground">✓</Text> : null}
                </View>
                <Text className="text-sm font-semibold text-foreground">Brinde</Text>
              </Pressable>
              {line.isGift ? <Text className="text-sm text-muted">{formatCurrency(0)}</Text> : (
                <Input accessibilityLabel={`Valor de ${line.product.name}`} keyboardType="decimal-pad" onChangeText={(price) => updateLine(line.id, { price })} placeholder="Valor do produto" value={line.price} />
              )}
            </View>
          ))}
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: picker === 'product' }} className={`${fieldControl} flex-row items-center gap-2 px-3.5 py-3`} onPress={() => togglePicker('product')}>
            <Plus color={colors.muted} size={17} />
            <Text className="font-semibold text-foreground">Adicionar produto</Text>
          </Pressable>
          {picker === 'product' ? (
            <View className="rounded-xl border border-border p-1">
              {products.map((item) => (
                <Pressable accessibilityRole="button" className={optionClass} key={item.id} onPress={() => {
                  const id = nextLine.current++;
                  setLines((current) => [...current, { id, product: item, price: '', isGift: false }]);
                  setPicker(null);
                }}>
                  <Text className="font-semibold text-foreground">{item.name}</Text>
                  {item.notes ? <Text className="mt-1 text-xs text-muted">{item.notes}</Text> : null}
                </Pressable>
              ))}
              <Pressable accessibilityRole="button" className={optionClass} onPress={onOpenProducts}>
                <Text className="font-bold text-foreground">Cadastrar produto</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
      <View className="flex-row flex-wrap items-center justify-between gap-2 rounded-xl bg-input p-3">
        <Text className="font-bold text-foreground">Total da festa</Text>
        <Text className="text-lg font-extrabold text-foreground">{formatCurrency(total / 100)}</Text>
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
            <Text className="text-sm font-bold text-foreground">Marcar como pago</Text>
          </Pressable>
        ) : null}
      </View>
      <View>
        <FieldLabel>Observações (opcional)</FieldLabel>
        <Input accessibilityLabel="Observações da festa" maxLength={500} multiline onChangeText={setNotes} textAlignVertical="top" value={notes} />
      </View>
      {error ? <Text accessibilityRole="alert" className="text-sm text-destructive">{error}</Text> : null}
      <Button accessibilityRole="button" disabled={!ready || saving} onPress={handleSave}>
          <ButtonText>{saving ? 'Salvando...' : initialEvent ? 'Salvar alterações' : past ? 'Registrar festa realizada' : 'Agendar festa'}</ButtonText>
      </Button>
    </Card>
  );
}
