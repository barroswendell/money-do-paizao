import { ArrowLeftRight, LayoutDashboard, LogOut, Menu, X } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { BrandMark } from '../brand/BrandMark';
import { cn } from '../../lib/utils';
import { useTheme } from '../../theme/ThemeProvider';
import { Card } from './card';
import { IconButton, ScreenHeader } from './screen-header';
import { Text } from './text';

export function ModuleHeader({ title, onMenu }: { title: string; onMenu: () => void }) {
  const { colors } = useTheme();

  return (
    <ScreenHeader
      title={title}
      leading={<BrandMark />}
      actions={<IconButton accessibilityLabel="Abrir menu" onPress={onMenu}><Menu color={colors.foreground} size={21} /></IconButton>}
    />
  );
}

type MenuItem = { label: string; icon: LucideIcon; action: () => void };
type MenuProps = {
  title: string;
  items: MenuItem[];
  onClose: () => void;
  onSwitch: () => void;
  onSignOut: () => void;
};

export function ModuleMenu({ title, items, onClose, onSwitch, onSignOut }: MenuProps) {
  const { colors } = useTheme();
  const rows: (MenuItem & { current?: boolean })[] = [
    { label: 'Visão geral', icon: LayoutDashboard, action: onClose, current: true },
    ...items,
    { label: 'Trocar de módulo', icon: ArrowLeftRight, action: onSwitch },
  ];

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent>
      <View className="flex-1 flex-row justify-end bg-black/45">
        <Pressable accessibilityLabel="Fechar menu" accessibilityRole="button" className="flex-1" onPress={onClose} />
        <ScrollView
          accessibilityViewIsModal
          className="grow-0 bg-surface"
          style={{ width: '84%', maxWidth: 320 }}
          contentContainerStyle={{ flexGrow: 1, padding: 20, paddingTop: 32 }}
        >
          <View className="mb-6 flex-row items-center gap-3">
            <BrandMark />
            <Text accessibilityRole="header" className="min-w-0 flex-1 font-bold">{title}</Text>
            <IconButton accessibilityLabel="Fechar menu lateral" onPress={onClose}><X color={colors.foreground} size={20} /></IconButton>
          </View>

          <View className="gap-1">
            {rows.map(({ label, icon: Icon, action, current = false }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: current }}
                  className={cn('min-h-[48px] flex-row items-center gap-3 rounded-xl px-3 py-2 pressed:bg-selected', current && 'bg-selected')}
                  key={label}
                  onPress={current ? onClose : () => { onClose(); action(); }}
                >
                  <Icon color={current ? colors.selectedForeground : colors.muted} size={18} strokeWidth={1.8} />
                  <Text className={cn('flex-1 text-sm font-semibold', current && 'text-selected-foreground')}>{label}</Text>
                </Pressable>
            ))}
          </View>

          <View className="mt-auto pt-6">
            <Pressable accessibilityRole="button" className="min-h-[48px] flex-row items-center gap-3 border-t border-border px-3" onPress={() => { onClose(); onSignOut(); }}>
              <LogOut color={colors.muted} size={18} strokeWidth={1.8} />
              <Text className="text-sm font-semibold">Sair</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

type Metric = { label: string; value: string | number; tone?: 'positive' | 'negative' };

export function Metrics({ items }: { items: Metric[] }) {
  return (
    <View className="flex-row flex-wrap gap-3">
      {items.map(({ label, value, tone }) => (
        <Card className={cn('min-w-[130px] flex-1 basis-[43%] p-4', items.length === 4 ? 'md:basis-[20%]' : 'md:basis-[28%]')} key={label}>
          <Text className="text-sm leading-5 text-muted">{label}</Text>
          <Text className={cn('mt-2 text-xl font-bold tabular-nums tracking-tight', tone === 'positive' && 'text-success', tone === 'negative' && 'text-destructive')}>{value}</Text>
        </Card>
      ))}
    </View>
  );
}
