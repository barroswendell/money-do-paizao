import type { ReactNode } from 'react';
import { Pressable, type PressableProps } from 'react-native';
import { cn } from '../../lib/utils';
import { Text } from './text';

type ButtonProps = PressableProps & {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm';
};

const variants = {
  default: 'bg-gold',
  outline: 'border border-border bg-surface',
  ghost: 'bg-transparent',
};

const sizes = {
  default: 'min-h-[52px] px-5',
  sm: 'min-h-[42px] px-4',
};

export function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <Pressable
      className={cn(
        'items-center justify-center rounded-xl',
        variants[variant],
        sizes[size],
        'pressed:opacity-80 disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}

type ButtonTextProps = {
  className?: string;
  children?: ReactNode;
  variant?: ButtonProps['variant'];
};

export function ButtonText({ className, children, variant = 'default' }: ButtonTextProps) {
  const textColor = variant === 'default' ? 'text-gold-foreground' : 'text-primary';
  return <Text className={cn('text-sm font-bold', textColor, className)}>{children}</Text>;
}
