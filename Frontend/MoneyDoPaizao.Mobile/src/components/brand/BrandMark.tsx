import { View } from 'react-native';
import { ClipboardCheck, Coins } from 'lucide-react-native';

type BrandMarkProps = {
  dark?: boolean;
  className?: string;
};

export function BrandMark({ dark = false, className }: BrandMarkProps) {
  return (
    <View className={`relative h-11 w-11 items-center justify-center rounded-2xl ${dark ? 'bg-gold' : 'bg-navy'} ${className ?? ''}`}>
      <Coins color={dark ? '#071629' : '#D4A64A'} size={21} strokeWidth={1.7} />
      <View className={`absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-md ${dark ? 'bg-navy' : 'bg-gold'}`}>
        <ClipboardCheck color={dark ? '#D4A64A' : '#071629'} size={12} strokeWidth={2} />
      </View>
    </View>
  );
}
