import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { ArrowLeft, Check, ChevronDown, ChevronRight, CircleDollarSign, Plus, ShoppingBag } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DatePickerField } from '../components/DatePickerField';
import { SaleDetailsModal } from '../components/SaleDetailsModal';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Text } from '../components/ui/text';
import { formatCurrency, formatDate } from '../lib/format';
import { calculateInstallments, parseInstallmentCount, parseMoneyCents } from '../lib/saleAmounts';
import { RootStackParamList } from '../navigation/AppNavigator';
import { createSale, getCustomers, getProducts, getSales, type Customer, type Product, type Sale } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Sales'>;
type Choice = { id: string; name: string };
type SaleFilter = 'all' | 'paid' | 'overdue';

const saleFilters: { value: SaleFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'paid', label: 'Quitadas' },
  { value: 'overdue', label: 'Vencidas' },
];
const allProducts = { id: '', name: 'Todos os produtos' };

function SalePicker<T extends Choice>({ label, placeholder, emptyLabel, options, selected, open, onToggle, onSelect }: {
  label: string;
  placeholder: string;
  emptyLabel: string;
  options: T[];
  selected: T | null;
  open: boolean;
  onToggle: () => void;
  onSelect: (option: T) => void;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-[14px] font-bold text-navy">{label}</Text>
      <Pressable accessibilityLabel={label} accessibilityRole="button" accessibilityState={{ expanded: open }} className="flex-row items-center justify-between rounded-xl border border-border bg-input px-4 py-3.5" onPress={onToggle}>
        <Text className={selected ? 'text-navy' : 'text-muted'}>{selected?.name ?? placeholder}</Text>
        <ChevronDown color="#6D7784" size={18} />
      </Pressable>
      {open ? (
        <View className="mt-2 rounded-xl border border-border bg-surface p-2">
          {options.length === 0 ? <Text className="p-3 text-[13px] text-muted">{emptyLabel}</Text> : null}
          {options.map((option) => (
            <Pressable accessibilityRole="button" className="rounded-lg px-3 py-3" key={option.id} onPress={() => onSelect(option)}>
              <Text className="text-[14px] font-semibold text-navy">{option.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function formatInstallments(count: number, amount: number, lastAmount?: number | null) {
  if (lastAmount == null || lastAmount === amount) return `${count}× de ${formatCurrency(amount)}`;
  return `${count - 1}× de ${formatCurrency(amount)} + última de ${formatCurrency(lastAmount)}`;
}

export function SalesScreen({ navigation, route }: Props) {
  const { token } = route.params;
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [openPicker, setOpenPicker] = useState<'customer' | 'product' | null>(null);
  const [paymentType, setPaymentType] = useState<Sale['paymentType']>('Cash');
  const [unitPrice, setUnitPrice] = useState('');
  const [hasDownPayment, setHasDownPayment] = useState(false);
  const [downPayment, setDownPayment] = useState('');
  const [count, setCount] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saleFilter, setSaleFilter] = useState<SaleFilter>('all');
  const [filterProduct, setFilterProduct] = useState<Choice>(allProducts);
  const [filterProductOpen, setFilterProductOpen] = useState(false);
  const [detailSaleId, setDetailSaleId] = useState<string | null>(null);

  const isInstallment = paymentType === 'Installment';
  const unitPriceCents = parseMoneyCents(unitPrice);
  const downPaymentCents = hasDownPayment ? parseMoneyCents(downPayment) : 0;
  const installmentCount = parseInstallmentCount(count);
  const hasManualAmount = Boolean(installmentAmount.trim());
  const manualInstallmentCents = hasManualAmount ? parseMoneyCents(installmentAmount) : null;
  const validDownPayment = downPaymentCents !== null && (!hasDownPayment || downPaymentCents > 0);
  const quote = isInstallment && unitPriceCents && validDownPayment && installmentCount && (!hasManualAmount || manualInstallmentCents !== null)
    ? calculateInstallments(unitPriceCents, downPaymentCents, installmentCount, manualInstallmentCents)
    : null;
  const totalCents = isInstallment ? quote?.total : unitPriceCents;
  const detailSale = sales.find((sale) => sale.id === detailSaleId);
  const visibleSales = sales.filter((sale) =>
    (!filterProduct.id || filterProduct.id === sale.productId) &&
    (saleFilter === 'all' || (saleFilter === 'paid' ? sale.status === 'Paid' : sale.isOverdue)));
  const updateSale = useCallback((updated: Sale) => {
    setSales((current) => current.map((sale) => sale.id === updated.id ? updated : sale));
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([getSales(token), getCustomers(token), getProducts(token)])
      .then(([salesResponse, customerResponse, productResponse]) => {
        setSales(salesResponse);
        setCustomers(customerResponse);
        setProducts(productResponse);
      })
      .catch((exception) => setError(exception instanceof Error ? exception.message : 'Não foi possível carregar as vendas.'))
      .finally(() => setLoading(false));
  }, [token]);

  function resetForm() {
    setSelectedCustomer(null);
    setSelectedProduct(null);
    setOpenPicker(null);
    setPaymentType('Cash');
    setUnitPrice('');
    setHasDownPayment(false);
    setDownPayment('');
    setCount('');
    setInstallmentAmount('');
    setDueDate('');
    setFormOpen(false);
  }

  async function handleCreate() {
    setError('');
    if (!selectedCustomer || !selectedProduct) {
      setError('Selecione o cliente e o produto.');
      return;
    }
    if (!unitPriceCents) {
      setError('Informe um valor do produto maior que zero, com até duas casas decimais.');
      return;
    }
    if (isInstallment) {
      if (!validDownPayment || downPaymentCents >= unitPriceCents) {
        setError('Informe uma entrada maior que zero e menor que o valor do produto.');
        return;
      }
      if (!installmentCount) {
        setError('Informe uma quantidade de parcelas maior que zero.');
        return;
      }
      if (!quote) {
        setError('Confira o valor e a quantidade de parcelas.');
        return;
      }
    }

    try {
      setSaving(true);
      const sale = await createSale(token, {
        customerId: selectedCustomer.id,
        productId: selectedProduct.id,
        paymentType,
        unitPrice: unitPriceCents / 100,
        ...(isInstallment ? {
          dueDate: dueDate || null,
          downPaymentAmount: (downPaymentCents ?? 0) / 100,
          installmentCount: installmentCount ?? undefined,
          installmentAmount: manualInstallmentCents === null ? undefined : manualInstallmentCents / 100,
        } : {}),
      });
      setSales((current) => [sale, ...current]);
      resetForm();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível registrar a venda.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between border-b border-border bg-surface px-5 pb-4 pt-5">
        <View className="flex-row items-center">
          <Pressable accessibilityLabel="Voltar" className="mr-3 h-10 w-10 items-center justify-center rounded-xl border border-border" onPress={() => navigation.goBack()}>
            <ArrowLeft color="#071629" size={19} />
          </Pressable>
          <View>
            <Text className="text-xl font-extrabold text-navy">Vendas</Text>
            <Text className="text-[12px] text-muted">Registre vendas e acompanhe pagamentos.</Text>
          </View>
        </View>
        <Pressable accessibilityLabel="Nova venda" accessibilityRole="button" className="h-10 w-10 items-center justify-center rounded-xl bg-navy" disabled={saving || loading} onPress={() => setFormOpen((current) => !current)}>
          <Plus color="#D4A64A" size={20} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="mx-auto w-full max-w-2xl">
          {formOpen ? (
            <Card className="mb-5 p-5">
              <Text className="mb-4 text-[18px] font-extrabold text-navy">Nova venda</Text>
              <SalePicker label="Cliente" placeholder="Selecione um cliente" emptyLabel="Cadastre um cliente primeiro." options={customers} selected={selectedCustomer} open={openPicker === 'customer'} onToggle={() => setOpenPicker(openPicker === 'customer' ? null : 'customer')} onSelect={(customer) => { setSelectedCustomer(customer); setOpenPicker(null); }} />
              <SalePicker label="Produto" placeholder="Selecione um produto" emptyLabel="Cadastre um produto primeiro." options={products} selected={selectedProduct} open={openPicker === 'product'} onToggle={() => setOpenPicker(openPicker === 'product' ? null : 'product')} onSelect={(product) => { setSelectedProduct(product); setOpenPicker(null); }} />

              <Text className="mb-1.5 text-[14px] font-bold text-navy">Valor do produto</Text>
              <Input accessibilityLabel="Valor do produto" className="mb-4" keyboardType="decimal-pad" onChangeText={setUnitPrice} placeholder="Ex.: 1.000,00" value={unitPrice} />

              <Text className="mb-2 text-[14px] font-bold text-navy">Forma de pagamento</Text>
              <View className="mb-4 flex-row gap-2">
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: !isInstallment }} className={`flex-1 flex-row items-center justify-center rounded-xl border px-3 py-3 ${!isInstallment ? 'border-navy bg-gold/20' : 'border-border'}`} onPress={() => setPaymentType('Cash')}>
                  <CircleDollarSign color="#1A7F5A" size={17} />
                  <Text className="ml-2 text-[14px] font-bold text-navy">À vista</Text>
                </Pressable>
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: isInstallment }} className={`flex-1 flex-row items-center justify-center rounded-xl border px-3 py-3 ${isInstallment ? 'border-navy bg-gold/20' : 'border-border'}`} onPress={() => setPaymentType('Installment')}>
                  <ShoppingBag color="#071629" size={17} />
                  <Text className="ml-2 text-[14px] font-bold text-navy">Parcelado</Text>
                </Pressable>
              </View>

              {isInstallment ? (
                <View className="mb-4 gap-4">
                  <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: hasDownPayment }} className="flex-row items-center justify-between rounded-xl border border-border bg-input px-4 py-3" onPress={() => setHasDownPayment((current) => !current)}>
                    <Text className="text-[14px] font-bold text-navy">Tem entrada?</Text>
                    <View className={`h-6 w-6 items-center justify-center rounded-md border ${hasDownPayment ? 'border-navy bg-navy' : 'border-border'}`}>
                      {hasDownPayment ? <Check color="#FFFFFF" size={16} /> : null}
                    </View>
                  </Pressable>
                  {hasDownPayment ? (
                    <View>
                      <Text className="mb-1.5 text-[14px] font-bold text-navy">Valor da entrada</Text>
                      <Input accessibilityLabel="Valor da entrada" keyboardType="decimal-pad" onChangeText={setDownPayment} placeholder="Ex.: 500,00" value={downPayment} />
                    </View>
                  ) : null}
                  <View>
                    <Text className="mb-1.5 text-[14px] font-bold text-navy">Quantidade de parcelas</Text>
                    <Input accessibilityLabel="Quantidade de parcelas" keyboardType="number-pad" onChangeText={setCount} placeholder="Ex.: 4" value={count} />
                  </View>
                  <View>
                    <Text className="mb-1.5 text-[14px] font-bold text-navy">Valor de cada parcela (opcional)</Text>
                    <Input accessibilityLabel="Valor de cada parcela" keyboardType="decimal-pad" onChangeText={setInstallmentAmount} placeholder={quote && !hasManualAmount ? formatCurrency(quote.installment / 100) : 'Ex.: 125,00'} value={installmentAmount} />
                    <Text className="mt-1.5 text-[12px] text-muted">Deixe em branco para dividir o valor restante automaticamente.</Text>
                  </View>
                  <View>
                    <Text className="mb-1.5 text-[14px] font-bold text-navy">Primeiro vencimento (opcional)</Text>
                    <DatePickerField label="Primeiro vencimento" value={dueDate} onChange={setDueDate} />
                  </View>
                </View>
              ) : null}

              {totalCents ? (
                <View className="mb-4 rounded-xl border border-border bg-input p-3.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[14px] font-bold text-navy">Total da venda</Text>
                    <Text className="text-[18px] font-extrabold text-navy">{formatCurrency(totalCents / 100)}</Text>
                  </View>
                  {quote && installmentCount ? (
                    <Text className="mt-1 text-[12px] text-muted">
                      {hasDownPayment && downPaymentCents ? `Entrada de ${formatCurrency(downPaymentCents / 100)} + ` : ''}
                      {formatInstallments(installmentCount, quote.installment / 100, quote.lastInstallment / 100)}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {error ? <Text accessibilityLiveRegion="polite" className="mb-3 text-[13px] text-destructive">{error}</Text> : null}
              <Button accessibilityRole="button" disabled={saving} onPress={handleCreate}>
                <ButtonText>{saving ? 'Salvando...' : 'Registrar venda'}</ButtonText>
              </Button>
            </Card>
          ) : null}

          <View className="mb-4 flex-row items-center">
            <ShoppingBag color="#D4A64A" size={19} />
            <Text className="ml-2 text-[16px] font-extrabold text-navy">Vendas registradas</Text>
          </View>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {saleFilters.map(({ value, label }) => (
              <Pressable accessibilityRole="radio" accessibilityState={{ checked: saleFilter === value }} className={`rounded-xl border px-4 py-2.5 ${saleFilter === value ? 'border-navy bg-gold/20' : 'border-border bg-surface'}`} key={value} onPress={() => setSaleFilter(value)}>
                <Text className="text-[13px] font-bold text-navy">{label}</Text>
              </Pressable>
            ))}
          </View>
          <SalePicker label="Filtrar por produto" placeholder={allProducts.name} emptyLabel="Nenhum produto cadastrado." options={[allProducts, ...products]} selected={filterProduct} open={filterProductOpen} onToggle={() => setFilterProductOpen((current) => !current)} onSelect={(product) => { setFilterProduct(product); setFilterProductOpen(false); }} />
          {!formOpen && error ? <Text className="mb-3 text-[13px] text-destructive">{error}</Text> : null}
          {loading ? <ActivityIndicator color="#D4A64A" size="large" /> : null}
          {!visibleSales.length && !loading && !error ? (
            <Card className="items-center p-8">
              <ShoppingBag color="#6D7784" size={28} />
              <Text className="mt-3 text-center text-[15px] font-bold text-navy">{sales.length ? 'Nenhuma venda para esses filtros' : 'Nenhuma venda ainda'}</Text>
              {!sales.length ? <Text className="mt-1 text-center text-[13px] text-muted">Use o botão + para registrar a primeira.</Text> : null}
            </Card>
          ) : null}
          {visibleSales.map((sale) => (
            <Pressable accessibilityLabel={`Detalhes da venda de ${sale.productName} para ${sale.customerName}`} accessibilityRole="button" className="mb-3" key={sale.id} onPress={() => setDetailSaleId(sale.id)}>
              <Card className="p-4">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-[16px] font-extrabold text-navy">{sale.productName}</Text>
                    <Text className="mt-1 text-[12px] text-muted">{sale.customerName} · {sale.paymentType === 'Cash' ? 'à vista' : 'parcelado'}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className={`rounded-full px-2.5 py-1 ${sale.isOverdue ? 'bg-destructive/10' : 'bg-gold/20'}`}>
                      <Text className={`text-[11px] font-bold ${sale.isOverdue ? 'text-destructive' : 'text-navy'}`}>{sale.status === 'Paid' ? 'Quitada' : sale.isOverdue ? 'Vencida' : 'Pendente'}</Text>
                    </View>
                    <ChevronRight color="#6D7784" size={17} />
                  </View>
                </View>
                <View className="mt-3 gap-1.5 border-t border-border pt-3">
                  <View className="flex-row justify-between">
                    <Text className="text-[12px] text-muted">{formatDate(sale.soldAtUtc)}</Text>
                    <Text className="text-[16px] font-extrabold text-navy">{formatCurrency(sale.amount)}</Text>
                  </View>
                  {sale.installmentCount && sale.installmentAmount != null ? (
                    <>
                      {sale.unitPrice !== sale.amount ? <Text className="text-[12px] text-muted">Valor do produto {formatCurrency(sale.unitPrice)}</Text> : null}
                      {sale.downPaymentAmount > 0 ? <Text className="text-[12px] text-muted">Entrada de {formatCurrency(sale.downPaymentAmount)}</Text> : null}
                      <Text className="text-[12px] text-muted">{formatInstallments(sale.installmentCount, sale.installmentAmount, sale.lastInstallmentAmount)}</Text>
                    </>
                  ) : null}
                  {sale.scheduledInstallmentCount > 0 ? (
                    <Text className="text-[12px] font-bold text-navy">{sale.paidInstallmentCount}/{sale.scheduledInstallmentCount} parcelas pagas</Text>
                  ) : null}
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      {detailSale ? <SaleDetailsModal key={detailSale.id} token={token} sale={detailSale} onSaleUpdated={updateSale} onClose={() => setDetailSaleId(null)} /> : null}
    </View>
  );
}
