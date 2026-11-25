import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { ChevronRight, LogOut, Settings } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../components/ui/card';
import { IconButton, ScreenHeader } from '../components/ui/screen-header';
import { Text } from '../components/ui/text';
import { BrandMark } from '../components/brand/BrandMark';
import { moduleOptions } from '../lib/module-options';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { activateModule, type ProductModule } from '../services/api';
import { clearSession, saveSession } from '../services/session';
import { useTheme } from '../theme/ThemeProvider';

type Props = NativeStackScreenProps<RootStackParamList, 'ModuleSelection'>;

export function ModuleSelectionScreen({ navigation, route }: Props) {
  const { token, userName, role, modules } = route.params;
  const [loadingModule, setLoadingModule] = useState<ProductModule | null>(null);
  const [error, setError] = useState('');
  const { colors, loadTheme, resetTheme } = useTheme();

  useEffect(() => { void loadTheme(token); }, [loadTheme, token]);

  async function openModule(module: ProductModule) {
    try {
      setError('');
      setLoadingModule(module);
      const response = await activateModule(token, module);
      await saveSession(response);
      const availableModules = response.modules?.length ? response.modules : [...modules, module];
      const params = { userName, role, token: response.token, modules: availableModules };
      switch (module) {
        case 'Loans': navigation.replace('Dashboard', { ...params, module }); break;
        case 'Parties': navigation.replace('PartyDashboard', params); break;
        case 'PersonalFinance': navigation.replace('Finance', params); break;
        case 'Sales': navigation.replace('SalesDashboard', params); break;
      }
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Não foi possível abrir este módulo.');
    } finally {
      setLoadingModule(null);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Se Organiza"
        leading={<BrandMark />}
        actions={<IconButton accessibilityLabel="Abrir configurações" onPress={() => navigation.navigate('Settings', { token })}><Settings color={colors.foreground} size={19} /></IconButton>}
      />
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingTop: 32 }}>
        <View className="mx-auto w-full max-w-2xl gap-4">
          <View className="mb-2">
            <Text accessibilityRole="header" className="text-[28px] font-bold tracking-tight">Olá, {userName}.</Text>
            <Text className="mt-1 text-sm text-muted">Escolha um módulo para começar.</Text>
          </View>
          {error ? <Text accessibilityLiveRegion="polite" className="text-sm text-destructive">{error}</Text> : null}

          <Card className="p-1.5">
            {moduleOptions.map(({ module, title, description, icon: Icon }, index) => {
              const active = modules.includes(module);
              const loading = loadingModule === module;

              return (
                <Pressable
                  accessibilityLabel={active ? title : 'Ativar ' + title}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: loadingModule !== null, busy: loading }}
                  className="rounded-xl focus-visible:border-focus pressed:bg-selected"
                  disabled={loadingModule !== null}
                  key={module}
                  onPress={() => openModule(module)}
                >
                  <View className={`min-h-[78px] flex-row items-center gap-3 px-3 py-3 ${index > 0 ? 'border-t border-border' : ''}`}>
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-selected">
                      <Icon color={colors.selectedForeground} size={19} strokeWidth={1.8} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="font-semibold">{title}</Text>
                      <Text className="mt-0.5 text-sm text-muted">{description}</Text>
                      {!active ? <Text className="mt-0.5 text-xs font-semibold text-link">Disponível para ativar</Text> : null}
                    </View>
                    {loading ? <ActivityIndicator color={colors.primary} /> : <ChevronRight color={colors.muted} size={18} />}
                  </View>
                </Pressable>
              );
            })}
          </Card>

          <Pressable
            accessibilityRole="button"
            className="mt-1 min-h-[44px] flex-row items-center gap-2 self-start px-2"
            onPress={() => { void clearSession(); resetTheme(); navigation.replace('Login'); }}
          >
            <LogOut color={colors.link} size={17} />
            <Text className="text-sm font-semibold text-link">Sair</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
