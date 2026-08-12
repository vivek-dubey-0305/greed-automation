import { View, Text } from 'react-native';
import { PlatformStatus, CampaignState } from '../types';
import { cn } from './Button';

interface StatusBadgeProps {
  status: PlatformStatus | CampaignState;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'SUCCESS':
      case 'APPROVED':
        return { bg: 'bg-green-100', text: 'text-green-700', label: status };
      case 'FAILED':
        return { bg: 'bg-red-100', text: 'text-red-700', label: status };
      case 'WARNING':
        return { bg: 'bg-amber-100', text: 'text-amber-700', label: status };
      case 'PROCESSING':
      case 'PUBLISHING':
      case 'RETRYING':
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: status };
      case 'IDLE':
      case 'AWAITING_APPROVAL':
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-700', label: status };
    }
  };

  const config = getStatusConfig();

  return (
    <View className={cn('px-2.5 py-1 rounded-full self-start', config.bg, className)}>
      <Text className={cn('text-xs font-semibold uppercase', config.text)}>
        {config.label.replace('_', ' ')}
      </Text>
    </View>
  );
}
