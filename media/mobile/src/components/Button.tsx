import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ComponentProps<typeof TouchableOpacity> {
  title?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  className?: string;
  textClassName?: string;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  textClassName,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'flex-row items-center justify-center rounded-lg';
  
  const variantClasses = {
    primary: 'bg-blue-600',
    secondary: 'bg-slate-200',
    outline: 'border border-slate-300 bg-transparent',
    ghost: 'bg-transparent',
    danger: 'bg-red-500',
  };

  const textVariantClasses = {
    primary: 'text-white font-semibold',
    secondary: 'text-slate-900 font-medium',
    outline: 'text-slate-700 font-medium',
    ghost: 'text-slate-700 font-medium',
    danger: 'text-white font-semibold',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  const disabledClasses = disabled || isLoading ? 'opacity-50' : '';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || isLoading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabledClasses,
        className
      )}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? 'white' : '#475569'} />
      ) : (
        children || (title && <Text className={cn(textVariantClasses[variant], textClassName)}>{title}</Text>)
      )}
    </TouchableOpacity>
  );
}
