import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { cn } from './Button';

interface IconButtonProps extends React.ComponentProps<typeof TouchableOpacity> {
  icon: LucideIcon;
  color?: string;
  size?: number;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
  className?: string;
}

export function IconButton({
  icon: Icon,
  color,
  size = 24,
  variant = 'ghost',
  isLoading = false,
  className,
  disabled,
  ...props
}: IconButtonProps) {
  const baseClasses = 'items-center justify-center rounded-full p-2';
  
  const variantClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-slate-200',
    ghost: 'bg-transparent',
    danger: 'bg-red-500',
  };

  const defaultIconColor = {
    primary: 'white',
    secondary: '#475569',
    ghost: '#475569',
    danger: 'white',
  };

  const disabledClasses = disabled || isLoading ? 'opacity-50' : '';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || isLoading}
      className={cn(baseClasses, variantClasses[variant], disabledClasses, className)}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={color || defaultIconColor[variant]} />
      ) : (
        <Icon color={color || defaultIconColor[variant]} size={size} />
      )}
    </TouchableOpacity>
  );
}
