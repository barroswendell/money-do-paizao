import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, View } from 'react-native';
import { ArrowLeft, Check, Moon, Palette, Sun } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Text } from '../components/ui/text';
import { RootStackParamList } from '../navigation/AppNavigator';
import { DEFAULT_APPEARANCE, useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const colorOptions = ['#071629', '#1D4ED8', '#0F766E', '#7C3AED', '#9F1239', '#334155'];

function isHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}

export function SettingsScreen({ navigation, route }: Props) {
  const { appearance, colors, loading, saveTheme } = useTheme();
  const [useCustomTheme, setUseCustomTheme] = useState(appearance.useCustomTheme);
  const [primaryColor, setPrimaryColor] = useState(appearance.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(appearance.secondaryColor);
  const [isDarkMode, setIsDarkMode] = useState(appearance.isDarkMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setUseCustomTheme(appearance.useCustomTheme);
    setPrimaryColor(appearance.primaryColor);
    setSecondaryColor(appearance.secondaryColor);
    setIsDarkMode(appearance.isDarkMode);
  }, [appearance]);

  const previewPrimary = useCustomTheme && isHexColor(primaryColor) ? primaryColor : DEFAULT_APPEARANCE.primaryColor;
  const previewSecondary = useCustomTheme && isHexColor(secondaryColor) ? secondaryColor : DEFAULT_APPEARANCE.secondaryColor;
  const previewBackground = isDarkMode ? '#071629' : '#F6F8FB';

  const previewLabel = useMemo(() => useCustomTheme ? 'Identidade personalizada' : 'Identidade padrão', [useCustomTheme]);

  async function handleSave() {
    setError('');
    setSuccess('');
    try {
      await saveTheme(route.params.token, { useCustomTheme, primaryColor, secondaryColor, isDarkMode });
      setSuccess('Preferências salvas com sucesso.');
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível salvar as preferências.');
    }
  }

  function restoreDefault() {
    setUseCustomTheme(false);
    setPrimaryColor(DEFAULT_APPEARANCE.primaryColor);
    setSecondaryColor(DEFAULT_APPEARANCE.secondaryColor);
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center border-b border-border bg-surface px-5 pb-4 pt-5">
        <Pressable accessibilityLabel="Voltar" className="mr-3 h-10 w-10 items-center justify-center rounded-xl border border-border" onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.foreground} size={19} strokeWidth={1.8} />
        </Pressable>
        <View>
          <Text className="text-xl font-extrabold text-navy">Configurações</Text>
          <Text className="text-[12px] text-muted">Personalize a aparência da sua conta.</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="mx-auto w-full max-w-2xl">
          <Card className="mb-5 overflow-hidden p-0">
            <View className="p-5" style={{ backgroundColor: previewBackground }}>
              <View className="mb-4 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: previewPrimary }}>
                    <Palette color={previewSecondary} size={21} />
                  </View>
                  <View>
                    <Text className="text-[16px] font-extrabold" style={{ color: isDarkMode ? '#F7F9FC' : '#071629' }}>{previewLabel}</Text>
                    <Text className="mt-1 text-[12px]" style={{ color: isDarkMode ? '#A9B5C4' : '#6D7784' }}>Visualização da sua identidade</Text>
                  </View>
                </View>
                <View className="h-3 w-3 rounded-full" style={{ backgroundColor: previewSecondary }} />
              </View>
              <View className="rounded-xl p-4" style={{ backgroundColor: previewPrimary }}>
                <Text className="text-[12px] font-bold" style={{ color: previewSecondary }}>SE ORGANIZA</Text>
                <Text className="mt-1 text-[18px] font-extrabold" style={{ color: '#FFFFFF' }}>Seu sistema, do seu jeito.</Text>
              </View>
            </View>
          </Card>

          <Card className="mb-4 p-5">
            <View className="mb-5 flex-row items-center">
              <Palette color={colors.secondary} size={20} />
              <View className="ml-3"><Text className="text-[16px] font-extrabold text-navy">Identidade visual</Text><Text className="mt-1 text-[12px] text-muted">Escolha as cores usadas nos menus, botões e destaques.</Text></View>
            </View>

            <View className="mb-4 flex-row items-center justify-between rounded-xl border border-border bg-input px-4 py-3">
              <View className="flex-1 pr-3"><Text className="text-[14px] font-bold text-navy">Usar cores personalizadas</Text><Text className="mt-1 text-[12px] text-muted">Desative para voltar à identidade padrão.</Text></View>
              <Switch value={useCustomTheme} onValueChange={setUseCustomTheme} trackColor={{ false: '#CBD5E1', true: previewSecondary }} thumbColor="#FFFFFF" />
            </View>

            {useCustomTheme ? <>
              <Text className="mb-1.5 text-[14px] font-bold text-navy">Cor primária</Text>
              <View className="mb-3 flex-row items-center"><View className="mr-2 h-10 w-10 rounded-xl border border-border" style={{ backgroundColor: isHexColor(primaryColor) ? primaryColor : '#FFFFFF' }} /><Input className="flex-1" autoCapitalize="characters" maxLength={7} onChangeText={setPrimaryColor} placeholder="#071629" value={primaryColor} /></View>
              <View className="mb-4 flex-row flex-wrap gap-2">{colorOptions.map((color) => <Pressable accessibilityLabel={`Escolher cor ${color}`} className="h-8 w-8 rounded-full border-2 border-white shadow-sm" key={`primary-${color}`} onPress={() => setPrimaryColor(color)} style={{ backgroundColor: color }} />)}</View>
              <Text className="mb-1.5 text-[14px] font-bold text-navy">Cor secundária</Text>
              <View className="mb-3 flex-row items-center"><View className="mr-2 h-10 w-10 rounded-xl border border-border" style={{ backgroundColor: isHexColor(secondaryColor) ? secondaryColor : '#FFFFFF' }} /><Input className="flex-1" autoCapitalize="characters" maxLength={7} onChangeText={setSecondaryColor} placeholder="#D4A64A" value={secondaryColor} /></View>
              <View className="mb-2 flex-row flex-wrap gap-2">{colorOptions.map((color) => <Pressable accessibilityLabel={`Escolher cor ${color}`} className="h-8 w-8 rounded-full border-2 border-white shadow-sm" key={`secondary-${color}`} onPress={() => setSecondaryColor(color)} style={{ backgroundColor: color }} />)}</View>
              <Pressable className="mt-3 self-start" onPress={restoreDefault}><Text className="text-[12px] font-bold text-primary">Voltar para cores padrão</Text></Pressable>
            </> : null}
          </Card>

          <Card className="mb-5 p-5">
            <View className="mb-4 flex-row items-center"><Moon color={colors.secondary} size={20} /><View className="ml-3"><Text className="text-[16px] font-extrabold text-navy">Modo de exibição</Text><Text className="mt-1 text-[12px] text-muted">Escolha entre o modo claro e o modo escuro.</Text></View></View>
            <View className="flex-row gap-3">
              <Pressable className={`flex-1 flex-row items-center justify-center rounded-xl border px-3 py-3 ${!isDarkMode ? 'border-navy bg-gold/20' : 'border-border'}`} onPress={() => setIsDarkMode(false)}><Sun color={colors.foreground} size={17} /><Text className="ml-2 text-[14px] font-bold text-navy">Modo claro</Text></Pressable>
              <Pressable className={`flex-1 flex-row items-center justify-center rounded-xl border px-3 py-3 ${isDarkMode ? 'border-navy bg-gold/20' : 'border-border'}`} onPress={() => setIsDarkMode(true)}><Moon color={colors.foreground} size={17} /><Text className="ml-2 text-[14px] font-bold text-navy">Modo escuro</Text></Pressable>
            </View>
          </Card>

          {error ? <Text className="mb-3 text-[13px] text-destructive">{error}</Text> : null}
          {success ? <View className="mb-3 flex-row items-center"><Check color="#1A7F5A" size={16} /><Text className="ml-2 text-[13px] text-[#1A7F5A]">{success}</Text></View> : null}
          <Button disabled={loading} onPress={handleSave}><ButtonText>{loading ? 'Salvando...' : 'Salvar preferências'}</ButtonText></Button>
          {loading ? <ActivityIndicator className="mt-3" color={colors.secondary} /> : null}
        </View>
      </ScrollView>
    </View>
  );
}
