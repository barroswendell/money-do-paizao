import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { Check } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button, ButtonText } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { FieldLabel, Input } from '../components/ui/input';
import { ScreenHeader } from '../components/ui/screen-header';
import { Text } from '../components/ui/text';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { AppearanceSettings } from '../services/api';
import { buildColors, DEFAULT_APPEARANCE, isHexColor } from '../theme/palette';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const colorOptions = [
  { name: 'Azul-marinho', value: '#071629' },
  { name: 'Dourado', value: '#D4A64A' },
  { name: 'Azul', value: '#1D4ED8' },
  { name: 'Verde', value: '#0F766E' },
  { name: 'Verde-água', value: '#20C9AB' },
  { name: 'Roxo', value: '#7C3AED' },
  { name: 'Vinho', value: '#9F1239' },
];

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <View>
      <FieldLabel>{label}</FieldLabel>
      <Input accessibilityLabel={label} autoCapitalize="characters" autoCorrect={false} maxLength={7} onChangeText={onChange} placeholder="#RRGGBB" value={value} />
      <View className="mt-2 flex-row flex-wrap gap-1">
        {colorOptions.map((option) => {
          const checked = value.toUpperCase() === option.value;
          return (
            <Pressable
              accessibilityLabel={label + ' · ' + option.name}
              accessibilityRole="radio"
              accessibilityState={{ checked }}
              className={`h-11 w-11 items-center justify-center rounded-full border ${checked ? 'border-focus bg-selected' : 'border-transparent'}`}
              key={option.value}
              onPress={() => onChange(option.value)}
            >
              <View className="h-6 w-6 rounded-full border border-black/10" style={{ backgroundColor: option.value }} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SettingsScreen({ navigation, route }: Props) {
  const { appearance, colors, loading, saveTheme } = useTheme();
  const [draft, setDraft] = useState(appearance);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => { setDraft(appearance); }, [appearance]);

  function updateDraft(change: Partial<AppearanceSettings>) {
    setDraft((previous) => ({ ...previous, ...change }));
    setError('');
    setSaved(false);
  }

  async function handleSave() {
    const { primaryColor, secondaryColor, useCustomTheme } = draft;
    if (useCustomTheme && (!isHexColor(primaryColor) || !isHexColor(secondaryColor))) {
      setError('Use o formato hexadecimal #RRGGBB nas duas cores.');
      return;
    }

    setError('');
    setSaved(false);
    try {
      await saveTheme(route.params.token, {
        ...draft,
        primaryColor: isHexColor(primaryColor) ? primaryColor.trim() : DEFAULT_APPEARANCE.primaryColor,
        secondaryColor: isHexColor(secondaryColor) ? secondaryColor.trim() : DEFAULT_APPEARANCE.secondaryColor,
      });
      setSaved(true);
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível salvar as preferências.');
    }
  }

  const preview = buildColors(draft);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Configurações" onBack={() => navigation.goBack()} />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <View className="mx-auto w-full max-w-2xl gap-4">
          <Text accessibilityRole="header" className="text-[26px] font-bold tracking-tight">Aparência</Text>

          <Card className="gap-4 p-4 sm:p-5">
            <View className="flex-row items-center justify-between gap-3">
              <View className="min-w-0 flex-1">
                <Text className="font-semibold">Cores personalizadas</Text>
                <Text className="mt-1 text-sm text-muted">A paleta padrão usa azul-marinho e dourado.</Text>
              </View>
              <Switch
                accessibilityLabel="Cores personalizadas"
                value={draft.useCustomTheme}
                onValueChange={(useCustomTheme) => updateDraft({ useCustomTheme })}
                trackColor={{ false: colors.fieldBorder, true: colors.primary }}
              />
            </View>
            {draft.useCustomTheme ? (
              <View className="gap-4 border-t border-border pt-4">
                <ColorField label="Cor principal" value={draft.primaryColor} onChange={(primaryColor) => updateDraft({ primaryColor })} />
                <ColorField label="Cor de destaque" value={draft.secondaryColor} onChange={(secondaryColor) => updateDraft({ secondaryColor })} />
                <Button
                  className="self-start"
                  onPress={() => updateDraft({ useCustomTheme: false, primaryColor: DEFAULT_APPEARANCE.primaryColor, secondaryColor: DEFAULT_APPEARANCE.secondaryColor })}
                  size="sm"
                  variant="outline"
                >
                  <ButtonText variant="outline">Restaurar cores padrão</ButtonText>
                </Button>
              </View>
            ) : null}
          </Card>

          <Card className="gap-3 p-4 sm:p-5">
            <Text className="font-semibold">Modo de exibição</Text>
            <View className="flex-row gap-2">
              {[false, true].map((isDarkMode) => {
                const checked = draft.isDarkMode === isDarkMode;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked }}
                    className={`min-h-[48px] flex-1 flex-row items-center justify-center gap-2 rounded-xl border px-2 ${checked ? 'border-focus bg-selected' : 'border-border bg-input'}`}
                    key={String(isDarkMode)}
                    onPress={() => updateDraft({ isDarkMode })}
                  >
                    {checked ? <Check color={colors.selectedForeground} size={16} /> : null}
                    <Text className="text-sm font-semibold">{isDarkMode ? 'Escuro' : 'Claro'}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card className="gap-3 p-4 sm:p-5">
            <Text className="font-semibold">Prévia</Text>
            <View className="gap-3 rounded-xl border p-3" style={{ backgroundColor: preview.background, borderColor: preview.border }}>
              <View className="rounded-xl border p-3" style={{ backgroundColor: preview.surface, borderColor: preview.border }}>
                <Text className="text-sm" style={{ color: preview.muted }}>Saldo do mês</Text>
                <Text className="mt-1 text-xl font-bold" style={{ color: preview.foreground }}>R$ 1.250,00</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                <View className="rounded-lg px-3 py-2" style={{ backgroundColor: preview.primary }}>
                  <Text className="text-sm font-semibold" style={{ color: preview.primaryForeground }}>Novo lançamento</Text>
                </View>
                <View className="rounded-lg px-3 py-2" style={{ backgroundColor: preview.selected }}>
                  <Text className="text-sm font-semibold" style={{ color: preview.selectedForeground }}>Selecionado</Text>
                </View>
              </View>
            </View>
          </Card>

          {error ? <Text accessibilityLiveRegion="polite" className="text-sm text-destructive">{error}</Text> : null}
          {saved ? <Text accessibilityLiveRegion="polite" className="text-sm text-success">Preferências salvas.</Text> : null}
          <Button disabled={loading} onPress={handleSave}><ButtonText>{loading ? 'Aguarde...' : 'Salvar preferências'}</ButtonText></Button>
        </View>
      </ScrollView>
    </View>
  );
}
