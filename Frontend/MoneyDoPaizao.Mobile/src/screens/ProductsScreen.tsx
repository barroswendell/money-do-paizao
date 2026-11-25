import { useTheme } from '../theme/ThemeProvider';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { Package } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { FieldLabel, Input } from '../components/ui/input';
import { FormToggle, ScreenHeader } from '../components/ui/screen-header';
import { Text } from '../components/ui/text';
import { RootStackParamList } from '../navigation/AppNavigator';
import { createProduct, getProducts, type Product } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Products'>;

export function ProductsScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { token } = route.params;
  const [products, setProducts] = useState<Product[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    getProducts(token)
      .then(setProducts)
      .catch((exception) => setError(exception instanceof Error ? exception.message : 'Não foi possível carregar os produtos.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleCreate() {
    setError('');
    if (!name.trim()) {
      setError('Informe o nome do produto.');
      return;
    }

    try {
      setSaving(true);
      const product = await createProduct(token, { name: name.trim() });
      setProducts((current) => [...current, product].sort((left, right) => left.name.localeCompare(right.name, 'pt-BR')));
      setName('');
      setFormOpen(false);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível cadastrar o produto.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Produtos"
        onBack={() => navigation.goBack()}
        actions={<FormToggle label="Novo produto" open={formOpen} onPress={() => setFormOpen((current) => !current)} disabled={saving || loading} />}
      />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="mx-auto w-full max-w-2xl">
          {formOpen ? (
            <Card className="mb-5 p-5">
              <Text className="mb-4 text-[18px] font-extrabold text-foreground">Novo produto</Text>
              <FieldLabel>Nome do produto</FieldLabel>
              <Input accessibilityLabel="Nome do produto" className="mb-4" maxLength={160} onChangeText={setName} placeholder="Ex.: Televisão" value={name} />
              {error ? <Text accessibilityLiveRegion="polite" className="mb-3 text-[13px] text-destructive">{error}</Text> : null}
              <Button accessibilityRole="button" disabled={saving} onPress={handleCreate}>
                <ButtonText>{saving ? 'Salvando...' : 'Cadastrar produto'}</ButtonText>
              </Button>
            </Card>
          ) : null}

          <View className="mb-4 flex-row items-center">

            <Text className="text-[16px] font-bold text-foreground">Produtos cadastrados</Text>
          </View>
          {!formOpen && error ? <Text className="mb-3 text-[13px] text-destructive">{error}</Text> : null}
          {loading ? <ActivityIndicator color={colors.primary} size="large" /> : null}
          {products.length === 0 && !loading && !error ? (
            <Card className="items-center p-8">
              <Package color={colors.muted} size={28} />
              <Text className="mt-3 text-[15px] font-bold text-foreground">Nenhum produto ainda</Text>
            </Card>
          ) : null}
          {products.map((product) => (
            <Card className="mb-3 p-4" key={product.id}>
              <Text className="text-[16px] font-extrabold text-foreground">{product.name}</Text>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
