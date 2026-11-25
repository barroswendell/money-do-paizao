import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ButtonText } from '../components/ui/button';
import { RecordActions } from '../components/RecordActions';
import { useRecordEditor } from '../lib/use-record-editor';
import { Card } from '../components/ui/card';
import { FieldLabel, Input } from '../components/ui/input';
import { FormToggle, ScreenHeader } from '../components/ui/screen-header';
import { Text } from '../components/ui/text';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { savePartyTheme, getPartyThemes, type PartyTheme } from '../services/api';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'PartyThemes'>;

export function PartyThemesScreen({ navigation, route }: Props) {
  const { token } = route.params;
  const [themes, setThemes] = useState<PartyTheme[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const editor = useRecordEditor<PartyTheme>((record) => {
    setName(record?.name ?? '');
    setDescription(record?.description ?? '');
    setError('');
  });
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

  async function handleSave() {
    if (saving) return;
    setError('');
    if (!name.trim()) {
      setError('Informe o nome do tema.');
      return;
    }

    setSaving(true);
    try {
      await savePartyTheme(token, { name: name.trim(), description: description.trim() }, editor.record?.id);
      editor.close();
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
        actions={<FormToggle label="Novo tema" open={editor.open} onPress={editor.toggle} disabled={saving} />}
      />
      <ScrollView ref={editor.scrollRef} className="flex-1" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="mx-auto w-full max-w-2xl gap-4">
          {editor.open ? (
            <Card className="gap-4 p-4 sm:p-5">
              <Text accessibilityRole="header" className="text-lg font-bold">{editor.record ? 'Editar tema' : 'Novo tema'}</Text>
              <View>
                <FieldLabel>Nome do tema</FieldLabel>
                <Input accessibilityLabel="Nome do tema" maxLength={160} onChangeText={setName} placeholder="Ex.: Jardim encantado" value={name} />
              </View>
              <View>
                <FieldLabel>Descrição (opcional)</FieldLabel>
                <Input accessibilityLabel="Descrição do tema" maxLength={240} multiline onChangeText={setDescription} placeholder="Detalhes do tema" textAlignVertical="top" value={description} />
              </View>
              {error ? <Text accessibilityLiveRegion="polite" className="text-sm text-destructive">{error}</Text> : null}
              <Button disabled={saving} onPress={handleSave}><ButtonText>{saving ? 'Salvando...' : editor.record ? 'Salvar alterações' : 'Cadastrar tema'}</ButtonText></Button>
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
              <RecordActions
                token={token} kind="PartyTheme" id={theme.id} name={theme.name} disabled={saving}
                onEdit={() => editor.show(theme)}
                onDeleted={() => {
                  setThemes((items) => items.filter((item) => item.id !== theme.id));
                  if (editor.record?.id === theme.id) editor.close();
                }}
              />
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
