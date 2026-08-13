export type PlatformName = 'instagram' | 'facebook' | 'linkedin' | 'x' | 'youtube' | 'whatsapp';

export type AutomationStatus =
  | 'idle'
  | 'selecting'
  | 'uploading'
  | 'analyzing'
  | 'generating'
  | 'awaiting_approval'
  | 'publishing'
  | 'success'
  | 'warning'
  | 'failed'
  | 'retrying';

export type PlatformStatus =
  | 'IDLE'
  | 'PROCESSING'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHING'
  | 'SUCCESS'
  | 'WARNING'
  | 'FAILED'
  | 'RETRYING';

export type CampaignState =
  | 'DRAFT'
  | 'MEDIA_SELECTED'
  | 'READY_TO_GENERATE'
  | 'ANALYZING'
  | 'GENERATING'
  | 'AWAITING_APPROVAL'
  | 'PARTIALLY_APPROVED'
  | 'APPROVED'
  | 'PUBLISHING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED';

export interface MediaAsset {
  id: string;
  uri: string;
  type?: string;
  filename?: string;
  base64?: string;
  width?: number;
  height?: number;
  size?: number;
  order: number;
  localStatus?: string;
}

export interface PlatformPost {
  id: string;
  campaignId: string;
  platform: PlatformName;
  media: MediaAsset[];
  caption: string;
  hashtags: string[];
  status: PlatformStatus;
  error?: AppError;
  warning?: string;
  publishedAt?: string;
  externalPostId?: string;
}

export type ErrorCategory =
  | 'NETWORK'
  | 'VALIDATION'
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'MEDIA'
  | 'AI'
  | 'PLATFORM'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'SERVER'
  | 'UNKNOWN';

export interface AppError {
  code: string;
  category: ErrorCategory;
  userMessage: string;
  technicalMessage?: string;
  retryable: boolean;
}

export interface Campaign {
  id: string;
  instruction: string;
  media: MediaAsset[];
  selectedPlatforms: PlatformName[];
  status: CampaignState;
  platformPosts?: Record<string, PlatformPost>;
  createdAt: string;
  updatedAt: string;
}
