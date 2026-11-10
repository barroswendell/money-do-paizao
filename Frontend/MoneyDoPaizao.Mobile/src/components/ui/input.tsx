import { forwardRef } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '../../lib/utils';

type InputProps = TextInputProps & {
  className?: string;
};

export const Input = forwardRef<TextInput, InputProps>(function Input({ className, ...props }, ref) {
  return (
    <TextInput
      ref={ref}
      className={cn(
        'h-[51px] flex-1 rounded-xl border border-border bg-input px-3.5 text-[15px] text-foreground',
        className,
      )}
      placeholderTextColor="#7A857D"
      {...props}
    />
  );
});
