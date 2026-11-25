import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { ArrowLeft, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PartyEventForm } from '../components/PartyEventForm';
import { PartyMonthTotals } from '../components/PartyMonthTotals';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Text } from '../components/ui/text';
import { formatCurrency, parseMoneyCents } from '../lib/format';
import { PARTY_MONTH_NAMES, emptyPartyMonth, partyMonthLabel, partyToday, shiftPartyMonth } from '../lib/partyMonths';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  getCustomers, getPartyEvents, getPartyProducts, getPartyThemes, updatePartyReceivedAmount,
  type Customer, type PartyEvent, type PartyProduct, type PartyTheme,
} from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'PartyEvents'>;
type Catalog = { customers: Customer[]; themes: PartyTheme[]; products: PartyProduct[] };

function EventCard({ event, token, today, onUpdate }: {
  event: PartyEvent; token: string; today: string; onUpdate: (event: PartyEvent) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);
  const eventDate = event.eventDate.slice(0, 10);
  const received = event.receivedAmount ?? event.depositAmount;
  const products = event.products ?? [];

  async function saveReceived() {
    if (submitting.current) return;
    setError('');
    const receivedCents = parseMoneyCents(amount);
    if (receivedCents === null || receivedCents < Math.round(event.depositAmount * 100) || receivedCents > Math.round(event.totalAmount * 100)) {
      setError('O total recebido deve ficar entre o sinal e o valor total da festa.');
      return;
    }

    submitting.current = true;
    setSaving(true);
    try {
      onUpdate(await updatePartyReceivedAmount(token, event.id, receivedCents / 100));
      setEditing(false);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível atualizar o recebimento.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <Card className="mb-3 gap-3 p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-extrabold text-navy">{event.customerName}</Text>
          <Text className="mt-1 text-xs text-muted">{eventDate.split('-').reverse().join('/')}{event.themeName ? ` · ${event.themeName}` : ''}</Text>
          <Text className="mt-1 text-xs font-semibold text-muted">{eventDate < today ? 'Realizada' : 'Agendada'}</Text>
        </View>
        <Text className="text-sm font-extrabold text-navy">{formatCurrency(event.totalAmount)}</Text>
      </View>
      {products.length > 0 ? (
        <View className="gap-1 border-t border-border pt-3">
          <Text className="mb-1 text-xs font-bold text-muted">Produtos</Text>
          {products.map((product) => (
            <View className="flex-row justify-between gap-2" key={product.id}>
              <Text className="flex-1 text-sm text-navy">{product.productName}</Text>
              <Text className="text-sm text-muted">{product.isGift ? `Brinde · ${formatCurrency(0)}` : formatCurrency(product.amount)}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {event.notes ? <Text className="text-sm text-muted">{event.notes}</Text> : null}
      <View className="flex-row flex-wrap justify-between gap-2 border-t border-border pt-3">
        <Text className="text-xs text-muted">Sinal {formatCurrency(event.depositAmount)}</Text>
        <Text className="text-xs text-muted">Recebido {formatCurrency(received)}</Text>
        <Text className="text-xs font-bold text-navy">A receber {formatCurrency(event.remainingAmount)}</Text>
      </View>
      {editing ? (
        <View className="gap-2 border-t border-border pt-3">
          <Text className="text-sm font-bold text-navy">Total recebido, incluindo o sinal</Text>
          <Input accessibilityLabel="Total recebido, incluindo o sinal" keyboardType="decimal-pad" onChangeText={setAmount} value={amount} />
          {error ? <Text accessibilityRole="alert" className="text-sm text-destructive">{error}</Text> : null}
          <View className="flex-row flex-wrap gap-2">
            <Button disabled={saving} onPress={saveReceived}><ButtonText>{saving ? 'Salvando...' : 'Salvar recebimento'}</ButtonText></Button>
            <Button disabled={saving} variant="outline" onPress={() => setEditing(false)}><ButtonText variant="outline">Cancelar</ButtonText></Button>
          </View>
        </View>
      ) : (
        <Pressable accessibilityRole="button" className="self-start py-2" onPress={() => { setAmount(received.toFixed(2).replace('.', ',')); setError(''); setEditing(true); }}>
          <Text className="text-sm font-bold text-navy">Atualizar recebimento</Text>
        </Pressable>
      )}
    </Card>
  );
}

export function PartyEventsScreen({ navigation, route }: Props) {
  const { token, month: initialMonth, create } = route.params;
  const today = partyToday();
  const [month, setMonth] = useState(initialMonth ?? today.slice(0, 7));
  const [pickerYear, setPickerYear] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(!!create);
  const [events, setEvents] = useState<PartyEvent[] | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [listError, setListError] = useState('');
  const [catalogError, setCatalogError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (initialMonth) setMonth(initialMonth);
    if (create) setFormOpen(true);
  }, [initialMonth, create]);

  useFocusEffect(useCallback(() => {
    let active = true;
    setListError('');
    setCatalogError('');
    getPartyEvents(token)
      .then((items) => { if (active) setEvents(items); })
      .catch((exception) => { if (active) setListError(exception.message); });
    Promise.all([getCustomers(token), getPartyThemes(token), getPartyProducts(token)])
      .then(([customers, themes, products]) => { if (active) setCatalog({ customers, themes, products }); })
      .catch((exception) => { if (active) setCatalogError(exception.message); });
    return () => { active = false; };
  }, [token, refresh]));

  const visibleEvents = (events ?? []).filter((event) => event.eventDate.startsWith(`${month}-`))
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  const monthTotals = visibleEvents.reduce((totals, event) => ({
    month,
    eventCount: totals.eventCount + 1,
    totalAmount: totals.totalAmount + Math.round(event.totalAmount * 100),
    receivedAmount: totals.receivedAmount + Math.round((event.receivedAmount ?? event.depositAmount) * 100),
    remainingAmount: totals.remainingAmount + Math.round(event.remainingAmount * 100),
  }), emptyPartyMonth(month));
  monthTotals.totalAmount /= 100;
  monthTotals.receivedAmount /= 100;
  monthTotals.remainingAmount /= 100;
  const scheduled = visibleEvents.filter((event) => event.eventDate.slice(0, 10) >= today).length;
  const completed = visibleEvents.length - scheduled;

  function storeEvent(event: PartyEvent) {
    setEvents((items) => items ? [...items.filter((item) => item.id !== event.id), event] : null);
    setRefresh((current) => current + 1);
  }

  function handleCreate(event: PartyEvent) {
    storeEvent(event);
    setMonth(event.eventDate.slice(0, 7));
    setPickerYear(null);
    setFormOpen(false);
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between border-b border-border bg-surface px-5 pb-4 pt-5">
        <View className="flex-row items-center gap-3">
          <Pressable accessibilityRole="button" accessibilityLabel="Voltar" className="h-10 w-10 items-center justify-center rounded-xl border border-border" onPress={navigation.goBack}>
            <ArrowLeft color="#071629" size={19} />
          </Pressable>
          <Text className="text-xl font-extrabold text-navy">Agenda de festas</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={formOpen ? 'Fechar formulário' : 'Nova festa'} accessibilityState={{ expanded: formOpen }} className="h-10 w-10 items-center justify-center rounded-xl bg-navy" onPress={() => setFormOpen((open) => !open)}>
          {formOpen ? <Text className="text-lg font-bold text-gold">×</Text> : <Plus color="#D4A64A" size={20} />}
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="mx-auto w-full max-w-2xl">
          {formOpen ? (
            <>
              {catalogError ? (
                <Pressable accessibilityRole="button" className="mb-3" onPress={() => setRefresh((current) => current + 1)}>
                  <Text className="text-sm text-destructive">{catalogError} Toque para tentar de novo.</Text>
                </Pressable>
              ) : null}
              <PartyEventForm token={token} customers={catalog?.customers ?? []} themes={catalog?.themes ?? []} products={catalog?.products ?? []}
                ready={!!catalog && !catalogError} onCreate={handleCreate} onOpenProducts={() => navigation.navigate('PartyProducts', { token })}
                onOpenCustomers={() => navigation.navigate('Customers', { token })} />
            </>
          ) : null}
          <View className="mb-4 gap-2">
            <Text className="text-sm font-bold text-navy">Mês da festa</Text>
            <View className="flex-row gap-2">
              <Pressable accessibilityRole="button" accessibilityLabel="Mês anterior" className="items-center justify-center rounded-xl border border-border px-3" onPress={() => { setMonth(shiftPartyMonth(month, -1)); setPickerYear(null); }}>
                <ChevronLeft color="#6D7784" size={18} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: pickerYear !== null }} className="flex-1 flex-row items-center justify-between gap-2 rounded-xl border border-border bg-input px-3 py-3" onPress={() => setPickerYear(pickerYear === null ? Number(month.slice(0, 4)) : null)}>
                <CalendarDays color="#6D7784" size={17} />
                <Text className="flex-1 font-bold text-navy">{partyMonthLabel(month)}</Text>
                <ChevronDown color="#6D7784" size={16} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Próximo mês" className="items-center justify-center rounded-xl border border-border px-3" onPress={() => { setMonth(shiftPartyMonth(month, 1)); setPickerYear(null); }}>
                <ChevronRight color="#6D7784" size={18} />
              </Pressable>
            </View>
            {pickerYear !== null ? (
              <Card className="gap-2 p-3">
                <View className="flex-row items-center justify-between">
                  <Pressable accessibilityRole="button" accessibilityLabel="Ano anterior" className="p-2" onPress={() => setPickerYear(pickerYear - 1)}><ChevronLeft color="#6D7784" size={18} /></Pressable>
                  <Text className="font-bold text-navy">{pickerYear}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel="Próximo ano" className="p-2" onPress={() => setPickerYear(pickerYear + 1)}><ChevronRight color="#6D7784" size={18} /></Pressable>
                </View>
                <View className="flex-row flex-wrap gap-1">
                  {PARTY_MONTH_NAMES.map((label, index) => {
                    const key = `${pickerYear}-${String(index + 1).padStart(2, '0')}`;
                    return (
                      <Pressable accessibilityRole="button" accessibilityState={{ selected: key === month }} className={`w-[31%] rounded-lg px-2 py-3 ${key === month ? 'bg-navy' : 'bg-input'}`} key={key} onPress={() => { setMonth(key); setPickerYear(null); }}>
                        <Text className={`text-center text-xs font-semibold ${key === month ? 'text-white' : 'text-navy'}`}>{label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>
            ) : null}
          </View>
          {!events && !listError ? <ActivityIndicator color="#D4A64A" /> : null}
          {listError ? (
            <Pressable accessibilityRole="button" className="mb-3" onPress={() => setRefresh((current) => current + 1)}>
              <Text className="text-sm text-destructive">{listError} Toque para tentar de novo.</Text>
            </Pressable>
          ) : null}
          {events ? (
            <>
              <View className="mb-5 gap-2">
                <Text className="text-base font-extrabold text-navy">{visibleEvents.length === 1 ? '1 festa no mês' : `${visibleEvents.length} festas no mês`}</Text>
                <Text className="text-sm text-muted">{scheduled} {scheduled === 1 ? 'agendada' : 'agendadas'} · {completed} {completed === 1 ? 'realizada' : 'realizadas'}</Text>
                <PartyMonthTotals month={monthTotals} />
              </View>
              {visibleEvents.length === 0 ? <Card className="p-5"><Text className="text-sm text-muted">Nenhuma festa neste mês.</Text></Card> : null}
              {visibleEvents.map((event) => <EventCard event={event} key={event.id} onUpdate={storeEvent} today={today} token={token} />)}
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
