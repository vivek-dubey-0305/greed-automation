import { View, ViewProps } from 'react-native';
import { cn } from './Button';

interface CardProps extends ViewProps {
  className?: string;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <View
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-sm p-4',
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}
