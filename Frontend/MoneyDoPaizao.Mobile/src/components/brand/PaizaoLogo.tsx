import { ClipboardCheck, Coins } from 'lucide-react-native';
import { View } from 'react-native';
import { Text } from '../ui/text';
import { BrandMark } from './BrandMark';

type PaizaoLogoProps = {
  compact?: boolean;
  className?: string;
};

export function PaizaoLogo({ compact = false, className }: PaizaoLogoProps) {
  if (compact) {
    return (
      <View className={`flex-row items-center ${className ?? ''}`}>
        <BrandMark />
        <View className="ml-3">
          <Text className="text-[17px] font-black text-navy">Paizão</Text>
          <Text className="text-[10px] font-medium text-muted">Sistema de Empréstimos</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={`items-center ${className ?? ''}`}>
      <View className="relative h-14 w-14 items-center justify-center rounded-2xl bg-navy">
        <Coins color="#D4A64A" size={28} strokeWidth={1.7} />
        <View className="absolute -right-1 -top-1 h-7 w-7 items-center justify-center rounded-lg bg-gold">
          <ClipboardCheck color="#071629" size={16} strokeWidth={2} />
        </View>
      </View>
      <Text className="mt-3 text-2xl font-black tracking-tight text-navy">Paizão</Text>
      <Text className="mt-0.5 text-[10px] font-bold uppercase tracking-[1.5px] text-muted">Sistema de Empréstimos</Text>
    </View>
  );
}
