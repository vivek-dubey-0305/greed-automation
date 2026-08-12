import { PlatformName } from '../types';

export const PLATFORMS: { id: PlatformName; name: string; icon: string; supported: boolean }[] = [
  { id: 'instagram', name: 'Instagram', icon: 'instagram', supported: true },
  { id: 'facebook', name: 'Facebook', icon: 'facebook', supported: true },
  { id: 'linkedin', name: 'LinkedIn', icon: 'linkedin', supported: true },
  { id: 'x', name: 'X', icon: 'twitter', supported: true },
  { id: 'youtube', name: 'YouTube', icon: 'youtube', supported: true },
  { id: 'whatsapp', name: 'WhatsApp', icon: 'message-circle', supported: false },
];
