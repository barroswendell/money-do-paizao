import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { ArrowLeft, Package, Plus } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Text } from '../components/ui/text';
import { RootStackParamList } from '../navigation/AppNavigator';
import { createProduct, getProducts, type Product } from '../services/api';
import { formatCurrency } from '../lib/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Products'>;

function parseNumber(value: string) { return Number(value.replace(',', '.').replace(/[^0-9.-]/g, '')); }

export function ProductsScreen({ navigation, route }: Props) {
  const { token } = route.params;
  const [products, setProducts] = useState<Product[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadProducts() {
    try { setLoading(true); setProducts(await getProducts(token)); }
    catch (exception) { setError(exception instanceof Error ? exception.message : 'Não foi possível carregar os produtos.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadProducts(); }, [token]);

  async function handleCreate() {
    setError('');
    try { setSaving(true); await createProduct(token, { name, brand, price: parseNumber(price) }); setName(''); setBrand(''); setPrice(''); setFormOpen(false); await loadProducts(); }
    catch (exception) { setError(exception instanceof Error ? exception.message : 'Não foi possível cadastrar o produto.'); }
    finally { setSaving(false); }
  }

  return <View className="flex-1 bg-background"><View className="flex-row items-center justify-between border-b border-border bg-surface px-5 pb-4 pt-5"><View className="flex-row items-center"><Pressable accessibilityLabel="Voltar" className="mr-3 h-10 w-10 items-center justify-center rounded-xl border border-border" onPress={() => navigation.goBack()}><ArrowLeft color="#071629" size={19} /></Pressable><View><Text className="text-xl font-extrabold text-navy">Produtos</Text><Text className="text-[12px] text-muted">Cadastre o catálogo das suas vendas.</Text></View></View><Pressable accessibilityLabel="Novo produto" className="h-10 w-10 items-center justify-center rounded-xl bg-navy" onPress={() => setFormOpen((current) => !current)}><Plus color="#D4A64A" size={20} /></Pressable></View><ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled"><View className="mx-auto w-full max-w-2xl">{formOpen ? <Card className="mb-5 p-5"><Text className="mb-1 text-[18px] font-extrabold text-navy">Novo produto</Text><Text className="mb-4 text-[13px] text-muted">Informe marca, nome e valor.</Text><Text className="mb-1.5 text-[14px] font-bold text-navy">Nome do produto</Text><Input className="mb-4" onChangeText={setName} placeholder="Ex.: Camiseta básica" value={name} /><Text className="mb-1.5 text-[14px] font-bold text-navy">Marca</Text><Input className="mb-4" onChangeText={setBrand} placeholder="Ex.: Marca própria" value={brand} /><Text className="mb-1.5 text-[14px] font-bold text-navy">Valor do produto</Text><Input className="mb-4" keyboardType="decimal-pad" onChangeText={setPrice} placeholder="Ex.: 89,90" value={price} />{error ? <Text className="mb-3 text-[13px] text-destructive">{error}</Text> : null}<Button disabled={saving} onPress={handleCreate}><ButtonText>{saving ? 'Salvando...' : 'Cadastrar produto'}</ButtonText></Button></Card> : null}<View className="mb-4 flex-row items-center"><Package color="#D4A64A" size={19} /><Text className="ml-2 text-[16px] font-extrabold text-navy">Produtos cadastrados</Text></View>{loading ? <ActivityIndicator color="#D4A64A" size="large" /> : null}{products.length === 0 && !loading ? <Card className="items-center p-8"><Package color="#6D7784" size={28} /><Text className="mt-3 text-[15px] font-bold text-navy">Nenhum produto ainda</Text><Text className="mt-1 text-center text-[13px] text-muted">Use o botão + para cadastrar o primeiro.</Text></Card> : null}{products.map((product) => <Card className="mb-3 p-4" key={product.id}><View className="flex-row items-center justify-between"><View><Text className="text-[16px] font-extrabold text-navy">{product.name}</Text><Text className="mt-1 text-[12px] text-muted">{product.brand}</Text></View><Text className="text-[15px] font-extrabold text-navy">{formatCurrency(product.price)}</Text></View></Card>)}</View></ScrollView></View>;
}
