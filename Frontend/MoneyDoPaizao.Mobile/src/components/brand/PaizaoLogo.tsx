import { View } from 'react-native';
import { cn } from '../../lib/utils';
import { Text } from '../ui/text';
import { BrandMark } from './BrandMark';

export function PaizaoLogo({ className }: { className?: string }) {
  return (
    <View className={cn('flex-row items-center gap-3', className)}>
      <BrandMark />
      <Text className="text-xl font-bold tracking-tight">Se Organiza</Text>
    </View>
  );
}
