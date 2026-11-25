import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { FieldLabel, Input } from '../components/ui/input';
import { FormToggle, ScreenHeader } from '../components/ui/screen-header';
import { Text } from '../components/ui/text';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { createPartyTheme, getPartyThemes, type PartyTheme } from '../services/api';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'PartyThemes'>;

export function PartyThemesScreen({ navigation, route }: Props) {
  const { token } = route.params;
  const [themes, setThemes] = useState<PartyTheme[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { colors } = useTheme();

  async function loadThemes() {
    setLoading(true);
    setLoadError('');
    try {
      setThemes(await getPartyThemes(token));
    } catch (exception) {
      setLoadError(exception instanceof Error ? exception.message : 'Não foi possível carregar os temas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadThemes(); }, [token]);

  async function handleCreate() {
    setError('');
    if (!name.trim()) {
      setError('Informe o nome do tema.');
      return;
    }

    setSaving(true);
    try {
      await createPartyTheme(token, { name: name.trim(), description: description.trim() });
      setName('');
      setDescription('');
      setFormOpen(false);
      await loadThemes();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível cadastrar o tema.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Temas de festa"
        onBack={() => navigation.goBack()}
        actions={<FormToggle label="Novo tema" open={formOpen} onPress={() => setFormOpen((current) => !current)} />}
      />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="mx-auto w-full max-w-2xl gap-4">
          {formOpen ? (
            <Card className="gap-4 p-4 sm:p-5">
              <Text accessibilityRole="header" className="text-lg font-bold">Novo tema</Text>
              <View>
                <FieldLabel>Nome do tema</FieldLabel>
                <Input accessibilityLabel="Nome do tema" onChangeText={setName} placeholder="Ex.: Jardim encantado" value={name} />
              </View>
              <View>
                <FieldLabel>Descrição (opcional)</FieldLabel>
                <Input accessibilityLabel="Descrição do tema" multiline onChangeText={setDescription} placeholder="Detalhes do tema" textAlignVertical="top" value={description} />
              </View>
              {error ? <Text accessibilityLiveRegion="polite" className="text-sm text-destructive">{error}</Text> : null}
              <Button disabled={saving} onPress={handleCreate}><ButtonText>{saving ? 'Salvando...' : 'Cadastrar tema'}</ButtonText></Button>
            </Card>
          ) : null}
          <Text accessibilityRole="header" className="text-lg font-bold">Temas cadastrados</Text>
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {loadError ? <Text accessibilityLiveRegion="polite" className="text-sm text-destructive">{loadError}</Text> : null}
          {!themes.length && !loading && !loadError ? <Card className="p-4"><Text className="text-sm text-muted">Nenhum tema cadastrado.</Text></Card> : null}
          {themes.map((theme) => (
            <Card className="p-4" key={theme.id}>
              <Text className="font-semibold">{theme.name}</Text>
              {theme.description ? <Text className="mt-1 text-sm text-muted">{theme.description}</Text> : null}
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
