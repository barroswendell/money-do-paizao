import { useState } from 'react';
import { View } from 'react-native';
import { cn } from '../lib/utils';
import { useTheme } from '../theme/ThemeProvider';
import { fieldControl } from './ui/input';

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  allowFuture?: boolean;
};

export function DatePickerField({ value, onChange, label = 'Data', allowFuture = true }: Props) {
  const { appearance, colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const now = new Date();
  const today = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((part) => String(part).padStart(2, '0')).join('-');

  return (
    <View className={cn(fieldControl, 'w-full flex-row items-stretch', focused && 'border-focus')}>
      <input
        aria-label={label}
        type="date"
        max={allowFuture ? undefined : today}
        value={value}
        onBlur={() => setFocused(false)}
        onChange={(event) => onChange(event.currentTarget.value)}
        onFocus={() => setFocused(true)}
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 50,
          boxSizing: 'border-box',
          border: 0,
          borderRadius: 12,
          outline: 'none',
          background: 'transparent',
          color: colors.foreground,
          colorScheme: appearance.isDarkMode ? 'dark' : 'light',
          fontFamily: 'inherit',
          fontSize: 16,
          padding: '0 14px',
        }}
      />
    </View>
  );
}
