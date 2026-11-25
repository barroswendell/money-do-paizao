import type { ReactNode } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react-native';
import { Pressable, type PressableProps, View } from 'react-native';
import { cn } from '../../lib/utils';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './text';

export function IconButton({ className, children, ...props }: PressableProps & { className?: string; children: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn('h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface focus-visible:border-focus pressed:opacity-75 disabled:opacity-60', className)}
      {...props}
    >
      {children}
    </Pressable>
  );
}

export function FormToggle({ label, open, onPress, disabled }: { label: string; open: boolean; onPress: () => void; disabled?: boolean }) {
  const { colors } = useTheme();
  const Icon = open ? X : Plus;

  return (
    <IconButton
      accessibilityLabel={open ? 'Fechar formulário' : label}
      accessibilityState={{ expanded: open }}
      className="border-primary bg-primary"
      disabled={disabled}
      onPress={onPress}
    >
      <Icon color={colors.primaryForeground} size={20} />
    </IconButton>
  );
}

type HeaderProps = {
  title: string;
  onBack?: () => void;
  leading?: ReactNode;
  actions?: ReactNode;
};

export function ScreenHeader({ title, onBack, leading, actions }: HeaderProps) {
  const { colors } = useTheme();

  return (
    <View className="border-b border-border bg-surface px-5">
      <View className="mx-auto min-h-[68px] w-full max-w-4xl flex-row items-center gap-3 py-3">
        {onBack ? <IconButton accessibilityLabel="Voltar" onPress={onBack}><ArrowLeft color={colors.foreground} size={19} /></IconButton> : leading}
        <View className="min-w-0 flex-1">
          <Text accessibilityRole="header" className="text-lg font-bold tracking-tight">{title}</Text>
        </View>
        {actions ? <View className="shrink-0 flex-row items-center gap-2">{actions}</View> : null}
      </View>
    </View>
  );
}
