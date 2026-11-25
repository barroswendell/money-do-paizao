import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Text } from '../components/ui/text';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { createPartyProduct, getPartyProducts, type PartyProduct } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'PartyProducts'>;

export function PartyProductsScreen({ navigation, route }: Props) {
  const { token } = route.params;
  const [products, setProducts] = useState<PartyProduct[]>([]);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    getPartyProducts(token)
      .then((items) => { if (active) setProducts(items); })
      .catch((exception) => { if (active) setLoadError(exception.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  async function handleCreate() {
    if (submitting.current) return;
    setError('');
    if (!name.trim()) {
      setError('Informe o nome do produto.');
      return;
    }

    submitting.current = true;
    setSaving(true);
    try {
      const product = await createPartyProduct(token, { name, notes });
      setProducts((items) => [...items, product].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
      setName('');
      setNotes('');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível cadastrar o produto.');
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center border-b border-border bg-surface px-5 pb-4 pt-5">
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" className="mr-3 h-10 w-10 items-center justify-center rounded-xl border border-border" onPress={navigation.goBack}>
          <ArrowLeft color="#071629" size={19} />
        </Pressable>
        <Text className="text-xl font-extrabold text-navy">Produtos de festa</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="mx-auto w-full max-w-2xl">
          <Card className="mb-5 gap-3 p-5">
            <Text className="text-lg font-extrabold text-navy">Cadastrar produto</Text>
            <View>
              <Text className="mb-1.5 font-bold text-navy">Nome</Text>
              <Input accessibilityLabel="Nome do produto" className="flex-none" maxLength={160} onChangeText={setName} value={name} />
            </View>
            <View>
              <Text className="mb-1.5 font-bold text-navy">Observação (opcional)</Text>
              <Input accessibilityLabel="Observação do produto" className="min-h-[84px] flex-none py-3" maxLength={500} multiline onChangeText={setNotes} textAlignVertical="top" value={notes} />
            </View>
            {error ? <Text accessibilityRole="alert" className="text-sm text-destructive">{error}</Text> : null}
            <Button accessibilityRole="button" disabled={loading || saving} onPress={handleCreate}>
              <ButtonText>{saving ? 'Salvando...' : 'Cadastrar produto'}</ButtonText>
            </Button>
          </Card>
          <Text className="mb-3 text-base font-extrabold text-navy">Produtos cadastrados</Text>
          {loading ? <ActivityIndicator color="#D4A64A" /> : null}
          {loadError ? <Text accessibilityRole="alert" className="mb-3 text-sm text-destructive">{loadError}</Text> : null}
          {!loading && !loadError && products.length === 0 ? <Text className="text-sm text-muted">Nenhum produto cadastrado.</Text> : null}
          {products.map((product) => (
            <Card className="mb-3 p-4" key={product.id}>
              <Text className="font-extrabold text-navy">{product.name}</Text>
              {product.notes ? <Text className="mt-1 text-sm text-muted">{product.notes}</Text> : null}
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
