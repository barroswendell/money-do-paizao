import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable } from 'react-native';
import { cn } from '../lib/utils';
import { useTheme } from '../theme/ThemeProvider';
import { fieldControl } from './ui/input';
import { Text } from './ui/text';

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  allowFuture?: boolean;
};

function parseDate(value: string) {
  if (!value) {
    return new Date();
  }

  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value: string) {
  if (!value) {
    return 'Selecione uma data';
  }

  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function toISODate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function DatePickerField({ value, onChange, label = 'Data', allowFuture = true }: Props) {
  const { appearance, colors } = useTheme();
  const [open, setOpen] = useState(false);

  function handleChange(event: DateTimePickerEvent, selectedDate?: Date) {
    setOpen(false);
    if (event.type === 'set' && selectedDate) {
      onChange(toISODate(selectedDate));
    }
  }

  return (
    <>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className={cn(fieldControl, 'w-full flex-row items-center justify-between gap-3 px-3.5', open && 'border-focus')}
        onPress={() => setOpen(true)}
      >
        <Text className={cn('min-w-0 flex-1 py-3', !value && 'text-muted')}>
          {formatDate(value)}
        </Text>
        <CalendarDays color={colors.muted} size={18} strokeWidth={1.8} />
      </Pressable>

      {open ? (
        <DateTimePicker
          value={parseDate(value)}
          mode="date"
          display={Platform.OS === 'android' ? 'calendar' : 'default'}
          maximumDate={allowFuture ? undefined : new Date()}
          themeVariant={appearance.isDarkMode ? 'dark' : 'light'}
          onChange={handleChange}
        />
      ) : null}
    </>
  );
}
