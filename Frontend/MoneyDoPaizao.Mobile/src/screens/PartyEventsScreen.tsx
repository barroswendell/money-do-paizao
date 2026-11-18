import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { ArrowLeft, CalendarDays, CalendarPlus, ChevronDown, HandCoins, Plus } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DatePickerField } from '../components/DatePickerField';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Text } from '../components/ui/text';
import { RootStackParamList } from '../navigation/AppNavigator';
import { createPartyEvent, getCustomers, getPartyEvents, getPartyThemes, type Customer, type PartyEvent, type PartyTheme } from '../services/api';
import { formatCurrency, formatDate } from '../lib/format';

type Props = NativeStackScreenProps<RootStackParamList, 'PartyEvents'>;

function parseNumber(value: string) { return Number(value.replace(',', '.').replace(/[^0-9.-]/g, '')); }

export function PartyEventsScreen({ navigation, route }: Props) {
  const { token } = route.params;
  const [events, setEvents] = useState<PartyEvent[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [themes, setThemes] = useState<PartyTheme[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [theme, setTheme] = useState<PartyTheme | null>(null);
  const [customerPicker, setCustomerPicker] = useState(false);
  const [themePicker, setThemePicker] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [depositReceived, setDepositReceived] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [eventsResponse, customersResponse, themesResponse] = await Promise.all([getPartyEvents(token), getCustomers(token), getPartyThemes(token)]);
      setEvents(eventsResponse); setCustomers(customersResponse); setThemes(themesResponse);
    } catch (exception) { setError(exception instanceof Error ? exception.message : 'Não foi possível carregar a agenda.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, [token]);

  async function handleCreate() {
    setError('');
    if (!customer) { setError('Selecione o cliente da festa.'); return; }
    if (!eventDate) { setError('Escolha a data da festa.'); return; }
    try {
      setSaving(true);
      await createPartyEvent(token, { customerId: customer.id, themeId: theme?.id ?? null, eventDate, totalAmount: parseNumber(totalAmount), depositReceived, depositAmount: depositReceived ? parseNumber(depositAmount) : 0, notes });
      setCustomer(null); setTheme(null); setEventDate(''); setTotalAmount(''); setDepositReceived(false); setDepositAmount(''); setNotes(''); setFormOpen(false); await loadData();
    } catch (exception) { setError(exception instanceof Error ? exception.message : 'Não foi possível agendar a festa.'); }
    finally { setSaving(false); }
  }

  return <View className="flex-1 bg-background"><View className="flex-row items-center justify-between border-b border-border bg-surface px-5 pb-4 pt-5"><View className="flex-row items-center"><Pressable accessibilityLabel="Voltar" className="mr-3 h-10 w-10 items-center justify-center rounded-xl border border-border" onPress={() => navigation.goBack()}><ArrowLeft color="#071629" size={19} /></Pressable><View><Text className="text-xl font-extrabold text-navy">Agenda de festas</Text><Text className="text-[12px] text-muted">Planeje cada evento com clareza.</Text></View></View><Pressable accessibilityLabel="Agendar festa" className="h-10 w-10 items-center justify-center rounded-xl bg-navy" onPress={() => setFormOpen((current) => !current)}><Plus color="#D4A64A" size={20} /></Pressable></View><ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled"><View className="mx-auto w-full max-w-2xl">{formOpen ? <Card className="mb-5 p-5"><Text className="mb-1 text-[18px] font-extrabold text-navy">Agendar festa</Text><Text className="mb-5 text-[13px] text-muted">Preencha os detalhes do evento.</Text><Text className="mb-1.5 text-[13px] font-bold text-navy">Cliente</Text><Pressable className="mb-3 flex-row items-center justify-between rounded-xl border border-border bg-input px-4 py-3.5" onPress={() => setCustomerPicker((current) => !current)}><Text className={customer ? 'text-navy' : 'text-muted'}>{customer?.name ?? 'Selecione um cliente'}</Text><ChevronDown color="#6D7784" size={18} /></Pressable>{customerPicker ? <View className="mb-4 rounded-xl border border-border bg-surface p-2">{customers.length === 0 ? <Text className="p-3 text-[13px] text-muted">Cadastre um cliente primeiro.</Text> : null}{customers.map((item) => <Pressable className="rounded-lg px-3 py-3" key={item.id} onPress={() => { setCustomer(item); setCustomerPicker(false); }}><Text className="text-[14px] font-semibold text-navy">{item.name}</Text></Pressable>)}</View> : null}<Text className="mb-1.5 text-[13px] font-bold text-navy">Tema</Text><Pressable className="mb-4 flex-row items-center justify-between rounded-xl border border-border bg-input px-4 py-3.5" onPress={() => setThemePicker((current) => !current)}><Text className={theme ? 'text-navy' : 'text-muted'}>{theme?.name ?? 'Selecione um tema (opcional)'}</Text><ChevronDown color="#6D7784" size={18} /></Pressable>{themePicker ? <View className="mb-4 rounded-xl border border-border bg-surface p-2">{themes.map((item) => <Pressable className="rounded-lg px-3 py-3" key={item.id} onPress={() => { setTheme(item); setThemePicker(false); }}><Text className="text-[14px] font-semibold text-navy">{item.name}</Text></Pressable>)}</View> : null}<Text className="mb-1.5 text-[13px] font-bold text-navy">Data da festa</Text><View className="mb-4"><DatePickerField label="a data da festa" value={eventDate} onChange={setEventDate} /></View><Text className="mb-1.5 text-[13px] font-bold text-navy">Valor total</Text><View className="mb-4 flex-row items-center rounded-xl border border-border bg-input px-3.5"><HandCoins color="#6D7784" size={18} /><Input className="border-0 bg-transparent px-3" keyboardType="decimal-pad" onChangeText={setTotalAmount} placeholder="Ex.: 1500,00" value={totalAmount} /></View><View className="mb-4 flex-row items-center justify-between rounded-xl border border-border bg-input px-4 py-3"><View className="flex-1 pr-3"><Text className="text-[14px] font-bold text-navy">Recebeu sinal?</Text><Text className="mt-1 text-[12px] text-muted">Marque se já entrou algum valor.</Text></View><Pressable accessibilityRole="switch" accessibilityState={{ checked: depositReceived }} onPress={() => setDepositReceived((current) => !current)}><View className={`h-7 w-12 justify-center rounded-full px-1 ${depositReceived ? 'bg-navy' : 'bg-border'}`}><View className={`h-5 w-5 rounded-full bg-white ${depositReceived ? 'self-end' : 'self-start'}`} /></View></Pressable></View>{depositReceived ? <><Text className="mb-1.5 text-[13px] font-bold text-navy">Valor do sinal</Text><Input className="mb-4" keyboardType="decimal-pad" onChangeText={setDepositAmount} placeholder="Ex.: 500,00" value={depositAmount} /></> : null}<Text className="mb-1.5 text-[13px] font-bold text-navy">Observações</Text><Input className="mb-4" onChangeText={setNotes} placeholder="Detalhes importantes" value={notes} />{error ? <Text className="mb-3 text-[13px] text-destructive">{error}</Text> : null}<Button disabled={saving} onPress={handleCreate}><ButtonText>{saving ? 'Salvando...' : 'Agendar festa'}</ButtonText></Button></Card> : null}<View className="mb-4 flex-row items-center"><CalendarDays color="#D4A64A" size={19} /><Text className="ml-2 text-[16px] font-extrabold text-navy">Festas agendadas</Text></View>{loading ? <ActivityIndicator color="#D4A64A" size="large" /> : null}{events.length === 0 && !loading ? <Card className="items-center p-8"><CalendarPlus color="#6D7784" size={28} /><Text className="mt-3 text-[15px] font-bold text-navy">Nenhuma festa agendada</Text><Text className="mt-1 text-center text-[13px] text-muted">Use o botão + para adicionar seu próximo evento.</Text></Card> : null}{events.map((event) => <Card className="mb-3 p-4" key={event.id}><View className="flex-row items-start justify-between"><View><Text className="text-[16px] font-extrabold text-navy">{event.customerName}</Text><Text className="mt-1 text-[12px] text-muted">{formatDate(event.eventDate)}{event.themeName ? ` · ${event.themeName}` : ''}</Text></View><Text className="text-[14px] font-extrabold text-navy">{formatCurrency(event.totalAmount)}</Text></View><View className="mt-4 flex-row justify-between border-t border-border pt-3"><Text className="text-[12px] text-muted">Sinal: {formatCurrency(event.depositAmount)}</Text><Text className="text-[12px] font-bold text-gold">Falta: {formatCurrency(event.remainingAmount)}</Text></View></Card>)}</View></ScrollView></View>;
}
