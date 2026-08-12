import { TextInput as RNTextInput, TextInputProps, View, Text } from 'react-native';
import { cn } from './Button';

interface CustomTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
}

export function TextInput({
  label,
  error,
  className,
  containerClassName,
  labelClassName,
  ...props
}: CustomTextInputProps) {
  return (
    <View className={cn('w-full', containerClassName)}>
      {label && (
        <Text className={cn('text-sm font-medium text-slate-700 mb-1.5', labelClassName)}>
          {label}
        </Text>
      )}
      <RNTextInput
        className={cn(
          'w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-900',
          props.multiline && 'py-4 min-h-[100px]',
          error && 'border-red-500',
          className
        )}
        placeholderTextColor="#94a3b8"
        textAlignVertical={props.multiline ? 'top' : 'center'}
        {...props}
      />
      {error && (
        <Text className="text-xs text-red-500 mt-1 font-medium">{error}</Text>
      )}
    </View>
  );
}
