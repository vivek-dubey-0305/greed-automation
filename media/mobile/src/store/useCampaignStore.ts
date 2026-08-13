import { create } from 'zustand';
import { CampaignState, MediaAsset, PlatformName, PlatformPost } from '../types';
import { CONFIG } from '../constants/Config';

interface CampaignStore {
  instruction: string;
  postType: 'FEED' | 'STORY' | 'REEL';
  media: MediaAsset[];
  selectedPlatforms: PlatformName[];
  status: CampaignState;
  platformPosts: Record<string, PlatformPost>;
  
  // Actions
  setInstruction: (instruction: string) => void;
  setPostType: (postType: 'FEED' | 'STORY' | 'REEL') => void;
  addMedia: (assets: MediaAsset[]) => void;
  removeMedia: (id: string) => void;
  reorderMedia: (oldIndex: number, newIndex: number) => void;
  togglePlatform: (platform: PlatformName) => void;
  
  // Transitions
  generateCampaign: () => Promise<void>;
  updatePlatformPost: (platformId: string, updates: Partial<PlatformPost>) => void;
  approvePlatform: (platform: PlatformName) => void;
  approveAll: () => void;
  publishCampaign: () => Promise<void>;
  retryPlatform: (platform: PlatformName) => Promise<void>;
  resetCampaign: () => void;
}

export const useCampaignStore = create<CampaignStore>()((set, get) => ({
  instruction: '',
  postType: 'FEED',
  media: [],
  selectedPlatforms: [],
  status: 'DRAFT',
  platformPosts: {},

  setInstruction: (instruction) => set({ instruction }),
  setPostType: (postType) => set({ postType }),
  
  addMedia: (assets) => set((state) => {
    const combined = [...state.media, ...assets];
    return { media: combined.slice(0, CONFIG.MAX_IMAGES) };
  }),

  removeMedia: (id) => set((state) => ({
    media: state.media.filter(m => m.id !== id)
  })),

  reorderMedia: (oldIndex, newIndex) => set((state) => {
    const newMedia = [...state.media];
    const [movedItem] = newMedia.splice(oldIndex, 1);
    newMedia.splice(newIndex, 0, movedItem);
    // Update order property
    const updatedMedia = newMedia.map((m, i) => ({ ...m, order: i }));
    return { media: updatedMedia };
  }),

  togglePlatform: (platform) => set((state) => {
    const isSelected = state.selectedPlatforms.includes(platform);
    return {
      selectedPlatforms: isSelected 
        ? state.selectedPlatforms.filter(p => p !== platform)
        : [...state.selectedPlatforms, platform]
    };
  }),

  // Complex actions to be implemented with mock services
  generateCampaign: async () => {
    // Implementation later
  },
  
  updatePlatformPost: (platformId, updates) => set((state) => ({
    platformPosts: {
      ...state.platformPosts,
      [platformId]: { ...state.platformPosts[platformId], ...updates }
    }
  })),

  approvePlatform: (platform) => {
     // Implementation later
  },

  approveAll: () => {
    // Implementation later
  },

  publishCampaign: async () => {
    // Implementation later
  },

  retryPlatform: async (platform) => {
    // Implementation later
  },

  resetCampaign: () => set({
    instruction: '',
    postType: 'FEED',
    media: [],
    selectedPlatforms: [],
    status: 'DRAFT',
    platformPosts: {},
  }),
}));
