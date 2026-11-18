import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { ArrowLeft, CheckCircle2, ChevronDown, CircleDollarSign, Package, Plus, ShoppingBag } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DatePickerField } from '../components/DatePickerField';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Text } from '../components/ui/text';
import { RootStackParamList } from '../navigation/AppNavigator';
import { createSale, getCustomers, getProducts, getSales, markSaleAsPaid, type Customer, type Product, type Sale } from '../services/api';
import { formatCurrency, formatDate } from '../lib/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Sales'>;

export function SalesScreen({ navigation, route }: Props) {
  const { token } = route.params;
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customerPicker, setCustomerPicker] = useState(false);
  const [productPicker, setProductPicker] = useState(false);
  const [paymentType, setPaymentType] = useState<'Cash' | 'Installment'>('Cash');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payingId, setPayingId] = useState('');

  async function loadData() {
    try { setLoading(true); const [salesResponse, customerResponse, productResponse] = await Promise.all([getSales(token), getCustomers(token), getProducts(token)]); setSales(salesResponse); setCustomers(customerResponse); setProducts(productResponse); }
    catch (exception) { setError(exception instanceof Error ? exception.message : 'Não foi possível carregar as vendas.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, [token]);

  async function handleCreate() {
    setError('');
    if (!selectedCustomer || !selectedProduct) { setError('Selecione o cliente e o produto.'); return; }
    try { setSaving(true); await createSale(token, { customerId: selectedCustomer.id, productId: selectedProduct.id, paymentType, dueDate: paymentType === 'Installment' && dueDate ? dueDate : null }); setSelectedCustomer(null); setSelectedProduct(null); setDueDate(''); setPaymentType('Cash'); setFormOpen(false); await loadData(); }
    catch (exception) { setError(exception instanceof Error ? exception.message : 'Não foi possível registrar a venda.'); }
    finally { setSaving(false); }
  }

  async function handlePay(id: string) {
    try { setPayingId(id); await markSaleAsPaid(token, id); await loadData(); }
    catch (exception) { setError(exception instanceof Error ? exception.message : 'Não foi possível marcar a venda como paga.'); }
    finally { setPayingId(''); }
  }

  return <View className="flex-1 bg-background"><View className="flex-row items-center justify-between border-b border-border bg-surface px-5 pb-4 pt-5"><View className="flex-row items-center"><Pressable accessibilityLabel="Voltar" className="mr-3 h-10 w-10 items-center justify-center rounded-xl border border-border" onPress={() => navigation.goBack()}><ArrowLeft color="#071629" size={19} /></Pressable><View><Text className="text-xl font-extrabold text-navy">Vendas</Text><Text className="text-[12px] text-muted">Registre vendas e acompanhe pagamentos.</Text></View></View><Pressable accessibilityLabel="Nova venda" className="h-10 w-10 items-center justify-center rounded-xl bg-navy" onPress={() => setFormOpen((current) => !current)}><Plus color="#D4A64A" size={20} /></Pressable></View><ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled"><View className="mx-auto w-full max-w-2xl">{formOpen ? <Card className="mb-5 p-5"><Text className="mb-1 text-[18px] font-extrabold text-navy">Nova venda</Text><Text className="mb-5 text-[13px] text-muted">Escolha o cliente, produto e forma de pagamento.</Text><Text className="mb-1.5 text-[13px] font-bold text-navy">Cliente</Text><Pressable className="mb-3 flex-row items-center justify-between rounded-xl border border-border bg-input px-4 py-3.5" onPress={() => setCustomerPicker((current) => !current)}><Text className={selectedCustomer ? 'text-navy' : 'text-muted'}>{selectedCustomer?.name ?? 'Selecione um cliente'}</Text><ChevronDown color="#6D7784" size={18} /></Pressable>{customerPicker ? <View className="mb-4 rounded-xl border border-border bg-surface p-2">{customers.length === 0 ? <Text className="p-3 text-[13px] text-muted">Cadastre um cliente primeiro.</Text> : null}{customers.map((customer) => <Pressable className="rounded-lg px-3 py-3" key={customer.id} onPress={() => { setSelectedCustomer(customer); setCustomerPicker(false); }}><Text className="text-[14px] font-semibold text-navy">{customer.name}</Text></Pressable>)}</View> : null}<Text className="mb-1.5 text-[13px] font-bold text-navy">Produto</Text><Pressable className="mb-3 flex-row items-center justify-between rounded-xl border border-border bg-input px-4 py-3.5" onPress={() => setProductPicker((current) => !current)}><View className="flex-row items-center"><Package color="#6D7784" size={18} /><Text className={`ml-3 ${selectedProduct ? 'text-navy' : 'text-muted'}`}>{selectedProduct ? `${selectedProduct.name} · ${formatCurrency(selectedProduct.price)}` : 'Selecione um produto'}</Text></View><ChevronDown color="#6D7784" size={18} /></Pressable>{productPicker ? <View className="mb-4 rounded-xl border border-border bg-surface p-2">{products.length === 0 ? <Text className="p-3 text-[13px] text-muted">Cadastre um produto primeiro.</Text> : null}{products.map((product) => <Pressable className="rounded-lg px-3 py-3" key={product.id} onPress={() => { setSelectedProduct(product); setProductPicker(false); }}><Text className="text-[14px] font-semibold text-navy">{product.name} · {formatCurrency(product.price)}</Text><Text className="mt-1 text-[12px] text-muted">{product.brand}</Text></Pressable>)}</View> : null}<Text className="mb-2 text-[13px] font-bold text-navy">Pagamento</Text><View className="mb-4 flex-row gap-2"><Pressable className={`flex-1 flex-row items-center justify-center rounded-xl border px-3 py-3 ${paymentType === 'Cash' ? 'border-navy bg-gold/20' : 'border-border'}`} onPress={() => setPaymentType('Cash')}><CircleDollarSign color="#1A7F5A" size={17} /><Text className="ml-2 text-[13px] font-bold text-navy">À vista</Text></Pressable><Pressable className={`flex-1 flex-row items-center justify-center rounded-xl border px-3 py-3 ${paymentType === 'Installment' ? 'border-navy bg-gold/20' : 'border-border'}`} onPress={() => setPaymentType('Installment')}><ShoppingBag color="#071629" size={17} /><Text className="ml-2 text-[13px] font-bold text-navy">A prazo</Text></Pressable></View>{paymentType === 'Installment' ? <><Text className="mb-1.5 text-[13px] font-bold text-navy">Vencimento (opcional)</Text><View className="mb-4"><DatePickerField label="a data do vencimento" value={dueDate} onChange={setDueDate} /></View></> : null}{error ? <Text className="mb-3 text-[13px] text-destructive">{error}</Text> : null}<Button disabled={saving} onPress={handleCreate}><ButtonText>{saving ? 'Salvando...' : 'Registrar venda'}</ButtonText></Button></Card> : null}<View className="mb-4 flex-row items-center"><ShoppingBag color="#D4A64A" size={19} /><Text className="ml-2 text-[16px] font-extrabold text-navy">Vendas registradas</Text></View>{loading ? <ActivityIndicator color="#D4A64A" size="large" /> : null}{sales.length === 0 && !loading ? <Card className="items-center p-8"><ShoppingBag color="#6D7784" size={28} /><Text className="mt-3 text-[15px] font-bold text-navy">Nenhuma venda ainda</Text><Text className="mt-1 text-center text-[13px] text-muted">Use o botão + para registrar a primeira.</Text></Card> : null}{sales.map((sale) => <Card className="mb-3 p-4" key={sale.id}><View className="flex-row items-start justify-between"><View className="flex-1 pr-3"><Text className="text-[16px] font-extrabold text-navy">{sale.productName}</Text><Text className="mt-1 text-[12px] text-muted">Cliente: {sale.customerName} · {sale.paymentType === 'Cash' ? 'à vista' : 'a prazo'}</Text></View><View className={`rounded-full px-2.5 py-1 ${sale.status === 'Paid' ? 'bg-gold/20' : 'bg-destructive/10'}`}><Text className={`text-[11px] font-bold ${sale.status === 'Paid' ? 'text-navy' : 'text-destructive'}`}>{sale.status === 'Paid' ? 'Pago' : 'Pendente'}</Text></View></View><View className="my-4 flex-row justify-between border-y border-border py-3"><Text className="text-[12px] text-muted">{formatDate(sale.soldAtUtc)}</Text><Text className="text-[16px] font-extrabold text-navy">{formatCurrency(sale.amount)}</Text></View>{sale.status === 'Pending' ? <Button className="flex-row gap-2" disabled={payingId === sale.id} onPress={() => handlePay(sale.id)}><CheckCircle2 color="#071629" size={17} /><ButtonText>{payingId === sale.id ? 'Salvando...' : 'Marcar como pago'}</ButtonText></Button> : null}</Card>)}</View></ScrollView></View>;
}
