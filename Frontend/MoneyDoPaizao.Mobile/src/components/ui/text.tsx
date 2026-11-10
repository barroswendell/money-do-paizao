import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';
import { cn } from '../../lib/utils';

type TextProps = NativeTextProps & {
  className?: string;
};

export function Text({ className, ...props }: TextProps) {
  return <NativeText className={cn('text-base text-foreground', className)} {...props} />;
}
