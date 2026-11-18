import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { ArrowLeft, Palette, Plus } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Text } from '../components/ui/text';
import { RootStackParamList } from '../navigation/AppNavigator';
import { createPartyTheme, getPartyThemes, type PartyTheme } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'PartyThemes'>;

export function PartyThemesScreen({ navigation, route }: Props) {
  const { token } = route.params;
  const [themes, setThemes] = useState<PartyTheme[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadThemes() {
    try { setLoading(true); setThemes(await getPartyThemes(token)); }
    catch (exception) { setError(exception instanceof Error ? exception.message : 'Não foi possível carregar os temas.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadThemes(); }, [token]);

  async function handleCreate() {
    setError('');
    try { setSaving(true); await createPartyTheme(token, { name, description }); setName(''); setDescription(''); setFormOpen(false); await loadThemes(); }
    catch (exception) { setError(exception instanceof Error ? exception.message : 'Não foi possível cadastrar o tema.'); }
    finally { setSaving(false); }
  }

  return <View className="flex-1 bg-background"><View className="flex-row items-center justify-between border-b border-border bg-surface px-5 pb-4 pt-5"><View className="flex-row items-center"><Pressable accessibilityLabel="Voltar" className="mr-3 h-10 w-10 items-center justify-center rounded-xl border border-border" onPress={() => navigation.goBack()}><ArrowLeft color="#071629" size={19} /></Pressable><View><Text className="text-xl font-extrabold text-navy">Temas de festa</Text><Text className="text-[12px] text-muted">Crie uma biblioteca para sua agenda.</Text></View></View><Pressable accessibilityLabel="Novo tema" className="h-10 w-10 items-center justify-center rounded-xl bg-navy" onPress={() => setFormOpen((current) => !current)}><Plus color="#D4A64A" size={20} /></Pressable></View><ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled"><View className="mx-auto w-full max-w-2xl">{formOpen ? <Card className="mb-5 p-5"><Text className="mb-1 text-[18px] font-extrabold text-navy">Novo tema</Text><Text className="mb-4 text-[13px] text-muted">Cadastre nomes que você usa nas festas.</Text><Text className="mb-1.5 text-[13px] font-bold text-navy">Nome do tema</Text><Input className="mb-4" onChangeText={setName} placeholder="Ex.: Jardim encantado" value={name} /><Text className="mb-1.5 text-[13px] font-bold text-navy">Descrição (opcional)</Text><Input className="mb-4" onChangeText={setDescription} placeholder="Detalhes do tema" value={description} />{error ? <Text className="mb-3 text-[13px] text-destructive">{error}</Text> : null}<Button disabled={saving} onPress={handleCreate}><ButtonText>{saving ? 'Salvando...' : 'Cadastrar tema'}</ButtonText></Button></Card> : null}<View className="mb-4 flex-row items-center"><Palette color="#D4A64A" size={19} /><Text className="ml-2 text-[16px] font-extrabold text-navy">Temas cadastrados</Text></View>{loading ? <ActivityIndicator color="#D4A64A" size="large" /> : null}{themes.length === 0 && !loading ? <Card className="items-center p-8"><Palette color="#6D7784" size={28} /><Text className="mt-3 text-[15px] font-bold text-navy">Nenhum tema ainda</Text><Text className="mt-1 text-center text-[13px] text-muted">Use o botão + para criar o primeiro.</Text></Card> : null}{themes.map((theme) => <Card className="mb-3 p-4" key={theme.id}><Text className="text-[16px] font-extrabold text-navy">{theme.name}</Text>{theme.description ? <Text className="mt-1 text-[13px] text-muted">{theme.description}</Text> : null}</Card>)}</View></ScrollView></View>;
}
