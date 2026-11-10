import { View, type ViewProps } from 'react-native';
import { cn } from '../../lib/utils';

type CardProps = ViewProps & {
  className?: string;
};

export function Card({ className, ...props }: CardProps) {
  return <View className={cn('rounded-3xl border border-border bg-surface', className)} {...props} />;
}
