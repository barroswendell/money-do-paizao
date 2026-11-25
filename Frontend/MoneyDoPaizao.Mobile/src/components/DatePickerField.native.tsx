import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
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

function formatDate(value: string, label: string) {
  if (!value) {
    return `Escolha ${label.toLowerCase()}`;
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

export function DatePickerField({ value, onChange, label = 'a data', allowFuture = false }: Props) {
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
        accessibilityLabel={`Selecionar ${label.toLowerCase()}`}
        className="flex-row items-center rounded-xl border border-border bg-input px-3.5"
        onPress={() => setOpen(true)}
      >
        <CalendarDays color="#6D7784" size={18} strokeWidth={1.8} />
        <Text className={`flex-1 px-3 py-3 text-base ${value ? 'text-foreground' : 'text-muted'}`}>
          {formatDate(value, label)}
        </Text>
      </Pressable>

      {open ? (
        <DateTimePicker
          value={parseDate(value)}
          mode="date"
          display={Platform.OS === 'android' ? 'calendar' : 'default'}
          maximumDate={allowFuture ? undefined : new Date()}
          onChange={handleChange}
        />
      ) : null}
    </>
  );
}
