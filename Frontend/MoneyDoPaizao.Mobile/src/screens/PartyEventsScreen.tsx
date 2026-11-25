import { useTheme } from '../theme/ThemeProvider';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PartyEventForm } from '../components/PartyEventForm';
import { RecordActions } from '../components/RecordActions';
import { PartyMonthTotals } from '../components/PartyMonthTotals';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { FieldLabel, fieldControl, Input } from '../components/ui/input';
import { FormToggle, ScreenHeader } from '../components/ui/screen-header';
import { Text } from '../components/ui/text';
import { formatCurrency, formatMoneyInput, parseMoneyCents } from '../lib/format';
import { PARTY_MONTH_NAMES, emptyPartyMonth, partyMonthLabel, partyToday, shiftPartyMonth } from '../lib/partyMonths';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  getCustomers, getPartyEvents, getPartyProducts, getPartyThemes, updatePartyReceivedAmount,
  type Customer, type PartyEvent, type PartyProduct, type PartyTheme,
} from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'PartyEvents'>;
type Catalog = { customers: Customer[]; themes: PartyTheme[]; products: PartyProduct[] };

function EventCard({ event, token, today, onUpdate, onEdit, onDeleted, formSaving }: {
  event: PartyEvent; token: string; today: string; onUpdate: (event: PartyEvent) => void;
  onEdit: () => void; onDeleted: () => void; formSaving: boolean;
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
          <Text className="text-base font-extrabold text-foreground">{event.customerName}</Text>
          <Text className="mt-1 text-xs text-muted">{eventDate.split('-').reverse().join('/')}{event.themeName ? ` · ${event.themeName}` : ''}</Text>
          <Text className="mt-1 text-xs font-semibold text-muted">{eventDate < today ? 'Realizada' : 'Agendada'}</Text>
        </View>
        <Text className="text-sm font-extrabold text-foreground">{formatCurrency(event.totalAmount)}</Text>
      </View>
      {products.length > 0 ? (
        <View className="gap-1 border-t border-border pt-3">
          <Text className="mb-1 text-xs font-bold text-muted">Produtos</Text>
          {products.map((product) => (
            <View className="flex-row justify-between gap-2" key={product.id}>
              <Text className="flex-1 text-sm text-foreground">{product.productName}</Text>
              <Text className="text-sm text-muted">{product.isGift ? `Brinde · ${formatCurrency(0)}` : formatCurrency(product.amount)}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {event.notes ? <Text className="text-sm text-muted">{event.notes}</Text> : null}
      <View className="flex-row flex-wrap justify-between gap-2 border-t border-border pt-3">
        <Text className="text-xs text-muted">Sinal {formatCurrency(event.depositAmount)}</Text>
        <Text className="text-xs text-muted">Recebido {formatCurrency(received)}</Text>
        <Text className="text-xs font-bold text-foreground">A receber {formatCurrency(event.remainingAmount)}</Text>
      </View>
      {editing ? (
        <View className="gap-2 border-t border-border pt-3">
          <FieldLabel className="mb-0">Total recebido, incluindo o sinal</FieldLabel>
          <Input accessibilityLabel="Total recebido, incluindo o sinal" keyboardType="decimal-pad" onChangeText={setAmount} value={amount} />
          {error ? <Text accessibilityRole="alert" className="text-sm text-destructive">{error}</Text> : null}
          <View className="flex-row flex-wrap gap-2">
            <Button accessibilityRole="button" disabled={saving} onPress={saveReceived}><ButtonText>{saving ? 'Salvando...' : 'Salvar recebimento'}</ButtonText></Button>
            <Button accessibilityRole="button" disabled={saving} variant="outline" onPress={() => setEditing(false)}><ButtonText variant="outline">Cancelar</ButtonText></Button>
          </View>
        </View>
      ) : (
        <Pressable accessibilityRole="button" className="self-start py-2" disabled={formSaving} onPress={() => { setAmount(formatMoneyInput(received)); setError(''); setEditing(true); }}>
          <Text className="text-sm font-bold text-foreground">Atualizar recebimento</Text>
        </Pressable>
      )}
      <RecordActions token={token} kind="PartyEvent" id={event.id} name={event.customerName} disabled={saving || formSaving}
        onEdit={() => { setEditing(false); onEdit(); }} onDeleted={onDeleted}
      />
    </Card>
  );
}

export function PartyEventsScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { token, month: initialMonth, create } = route.params;
  const today = partyToday();
  const [month, setMonth] = useState(initialMonth ?? today.slice(0, 7));
  const [pickerYear, setPickerYear] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(!!create);
  const [editingEvent, setEditingEvent] = useState<PartyEvent | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [events, setEvents] = useState<PartyEvent[] | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [listError, setListError] = useState('');
  const [catalogError, setCatalogError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (initialMonth) setMonth(initialMonth);
    if (create) {
      setEditingEvent(null);
      setFormOpen(true);
    }
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

  function handleSave(event: PartyEvent) {
    storeEvent(event);
    setMonth(event.eventDate.slice(0, 7));
    setPickerYear(null);
    setFormOpen(false);
    setEditingEvent(null);
  }

  function openEdit(event: PartyEvent) {
    setEditingEvent(event);
    setFormOpen(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Agenda de festas"
        onBack={() => navigation.goBack()}
        actions={<FormToggle label="Nova festa" open={formOpen} disabled={formSaving} onPress={() => {
          setEditingEvent(null);
          setFormOpen((current) => !current);
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        }} />}
      />

      <ScrollView ref={scrollRef} className="flex-1" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="mx-auto w-full max-w-2xl">
          {formOpen ? (
            <>
              {catalogError ? (
                <Pressable accessibilityRole="button" className="mb-3" onPress={() => setRefresh((current) => current + 1)}>
                  <Text className="text-sm text-destructive">{catalogError} Toque para tentar de novo.</Text>
                </Pressable>
              ) : null}
              <PartyEventForm key={editingEvent?.id ?? 'new'} token={token} customers={catalog?.customers ?? []}
                themes={catalog?.themes ?? []} products={catalog?.products ?? []} initialEvent={editingEvent}
                ready={!!catalog && !catalogError} onSave={handleSave} onSavingChange={setFormSaving} onOpenProducts={() => navigation.navigate('PartyProducts', { token })}
                onOpenCustomers={() => navigation.navigate('Customers', { token })} />
            </>
          ) : null}
          <View className="mb-4 gap-2">
            <Text className="text-sm font-bold text-foreground">Mês da festa</Text>
            <View className="flex-row gap-2">
              <Pressable accessibilityRole="button" accessibilityLabel="Mês anterior" className="items-center justify-center rounded-xl border border-border px-3" onPress={() => { setMonth(shiftPartyMonth(month, -1)); setPickerYear(null); }}>
                <ChevronLeft color={colors.muted} size={18} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: pickerYear !== null }} className={`${fieldControl} flex-1 flex-row items-center justify-between gap-2 px-3 py-3`} onPress={() => setPickerYear(pickerYear === null ? Number(month.slice(0, 4)) : null)}>
                <CalendarDays color={colors.muted} size={17} />
                <Text className="flex-1 font-bold text-foreground">{partyMonthLabel(month)}</Text>
                <ChevronDown color={colors.muted} size={16} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Próximo mês" className="items-center justify-center rounded-xl border border-border px-3" onPress={() => { setMonth(shiftPartyMonth(month, 1)); setPickerYear(null); }}>
                <ChevronRight color={colors.muted} size={18} />
              </Pressable>
            </View>
            {pickerYear !== null ? (
              <Card className="gap-2 p-3">
                <View className="flex-row items-center justify-between">
                  <Pressable accessibilityRole="button" accessibilityLabel="Ano anterior" className="p-2" onPress={() => setPickerYear(pickerYear - 1)}><ChevronLeft color={colors.muted} size={18} /></Pressable>
                  <Text className="font-bold text-foreground">{pickerYear}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel="Próximo ano" className="p-2" onPress={() => setPickerYear(pickerYear + 1)}><ChevronRight color={colors.muted} size={18} /></Pressable>
                </View>
                <View className="flex-row flex-wrap gap-1">
                  {PARTY_MONTH_NAMES.map((label, index) => {
                    const key = `${pickerYear}-${String(index + 1).padStart(2, '0')}`;
                    return (
                      <Pressable accessibilityRole="button" accessibilityState={{ selected: key === month }} className={`w-[31%] rounded-lg px-2 py-3 ${key === month ? 'bg-primary' : 'bg-input'}`} key={key} onPress={() => { setMonth(key); setPickerYear(null); }}>
                        <Text className={`text-center text-xs font-semibold ${key === month ? 'text-primary-foreground' : 'text-foreground'}`}>{label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>
            ) : null}
          </View>
          {!events && !listError ? <ActivityIndicator color={colors.primary} /> : null}
          {listError ? (
            <Pressable accessibilityRole="button" className="mb-3" onPress={() => setRefresh((current) => current + 1)}>
              <Text className="text-sm text-destructive">{listError} Toque para tentar de novo.</Text>
            </Pressable>
          ) : null}
          {events ? (
            <>
              <View className="mb-5 gap-2">
                <Text className="text-base font-extrabold text-foreground">{visibleEvents.length === 1 ? '1 festa no mês' : `${visibleEvents.length} festas no mês`}</Text>
                <Text className="text-sm text-muted">{scheduled} {scheduled === 1 ? 'agendada' : 'agendadas'} · {completed} {completed === 1 ? 'realizada' : 'realizadas'}</Text>
                <PartyMonthTotals month={monthTotals} />
              </View>
              {visibleEvents.length === 0 ? <Card className="p-5"><Text className="text-sm text-muted">Nenhuma festa neste mês.</Text></Card> : null}
              {visibleEvents.map((event) => (
                <EventCard event={event} key={event.id} onUpdate={storeEvent} today={today} token={token} formSaving={formSaving}
                  onEdit={() => openEdit(event)}
                  onDeleted={() => {
                    setEvents((items) => items?.filter((item) => item.id !== event.id) ?? null);
                    if (editingEvent?.id === event.id) {
                      setEditingEvent(null);
                      setFormOpen(false);
                    }
                  }}
                />
              ))}
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
