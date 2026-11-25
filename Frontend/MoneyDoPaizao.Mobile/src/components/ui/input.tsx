import { forwardRef, type ReactNode, useState } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';
import { cn } from '../../lib/utils';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './text';

export const fieldControl = 'min-h-[52px] min-w-0 rounded-xl border border-field-border bg-input';

export function FieldLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <Text className={cn('mb-1.5 text-sm font-semibold leading-5 text-foreground', className)}>{children}</Text>;
}

type InputProps = TextInputProps & {
  className?: string;
  endAdornment?: ReactNode;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { className, endAdornment, multiline, onBlur, onFocus, ...props }, ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const input = (
    <TextInput
      ref={ref}
      className={cn(
        fieldControl,
        'w-full px-3.5 py-3 text-base text-foreground web:outline-none',
        multiline && 'min-h-[96px]',
        focused && 'border-focus',
        endAdornment ? 'min-h-[50px] w-auto flex-1 border-0 bg-transparent' : className,
      )}
      multiline={multiline}
      onBlur={(event) => { setFocused(false); onBlur?.(event); }}
      onFocus={(event) => { setFocused(true); onFocus?.(event); }}
      placeholderTextColor={colors.muted}
      selectionColor={colors.focus}
      {...props}
    />
  );

  if (!endAdornment) return input;

  return (
    <View className={cn(fieldControl, 'w-full flex-row items-center', focused && 'border-focus', className)}>
      {input}
      {endAdornment}
    </View>
  );
});
