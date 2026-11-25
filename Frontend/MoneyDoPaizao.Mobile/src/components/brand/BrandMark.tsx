import { View } from 'react-native';
import { Check } from 'lucide-react-native';
import { cn } from '../../lib/utils';
import { useTheme } from '../../theme/ThemeProvider';

type BrandMarkProps = {
  dark?: boolean;
  className?: string;
};

export function BrandMark({ dark = false, className }: BrandMarkProps) {
  const { colors } = useTheme();

  return (
    <View className={cn('h-11 w-11 items-center justify-center rounded-[13px]', dark ? 'bg-primary' : 'bg-accent', className)}>
      <Check color={dark ? colors.primaryForeground : colors.secondaryForeground} size={23} strokeWidth={2.5} />
    </View>
  );
}
