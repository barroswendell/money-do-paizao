import { useTheme } from '../theme/ThemeProvider';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { FieldLabel, Input } from '../components/ui/input';
import { ScreenHeader } from '../components/ui/screen-header';
import { Text } from '../components/ui/text';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { createPartyProduct, getPartyProducts, type PartyProduct } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'PartyProducts'>;

export function PartyProductsScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
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
      <ScreenHeader title="Produtos de festa" onBack={() => navigation.goBack()} />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="mx-auto w-full max-w-2xl">
          <Card className="mb-5 gap-3 p-5">
            <Text className="text-lg font-extrabold text-foreground">Cadastrar produto</Text>
            <View>
              <FieldLabel>Nome</FieldLabel>
              <Input accessibilityLabel="Nome do produto" maxLength={160} onChangeText={setName} value={name} />
            </View>
            <View>
              <FieldLabel>Observação (opcional)</FieldLabel>
              <Input accessibilityLabel="Observação do produto" maxLength={500} multiline onChangeText={setNotes} textAlignVertical="top" value={notes} />
            </View>
            {error ? <Text accessibilityRole="alert" className="text-sm text-destructive">{error}</Text> : null}
            <Button accessibilityRole="button" disabled={loading || saving} onPress={handleCreate}>
              <ButtonText>{saving ? 'Salvando...' : 'Cadastrar produto'}</ButtonText>
            </Button>
          </Card>
          <Text className="mb-3 text-base font-extrabold text-foreground">Produtos cadastrados</Text>
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {loadError ? <Text accessibilityRole="alert" className="mb-3 text-sm text-destructive">{loadError}</Text> : null}
          {!loading && !loadError && products.length === 0 ? <Text className="text-sm text-muted">Nenhum produto cadastrado.</Text> : null}
          {products.map((product) => (
            <Card className="mb-3 p-4" key={product.id}>
              <Text className="font-extrabold text-foreground">{product.name}</Text>
              {product.notes ? <Text className="mt-1 text-sm text-muted">{product.notes}</Text> : null}
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
