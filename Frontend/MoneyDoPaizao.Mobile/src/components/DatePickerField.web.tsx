import { CalendarDays } from 'lucide-react-native';
import { View } from 'react-native';

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

export function DatePickerField({ value, onChange, label = 'Data' }: Props) {
  return (
    <View className="flex-row items-center rounded-xl border border-border bg-input px-3.5">
      <CalendarDays color="#6D7784" size={18} strokeWidth={1.8} />
      <input
        aria-label={label}
        type="date"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        style={{
          flex: 1,
          border: 0,
          outline: 'none',
          background: 'transparent',
          color: '#071629',
          fontFamily: 'inherit',
          fontSize: 16,
          padding: '12px 0 12px 12px',
        }}
      />
    </View>
  );
}
