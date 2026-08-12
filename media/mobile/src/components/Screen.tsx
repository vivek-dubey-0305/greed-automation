import { SafeAreaView, View, type ViewProps } from 'react-native';
import { cn } from './Button';

interface ScreenProps extends ViewProps {
  className?: string;
  safeArea?: boolean;
}

export function Screen({ className, children, safeArea = true, ...props }: ScreenProps) {
  const Container = safeArea ? SafeAreaView : View;
  return (
    <Container className={cn('flex-1 bg-slate-50', className)} {...props}>
      {children}
    </Container>
  );
}
