import { create } from 'zustand';
import { api } from '../services/api';

export interface SocialAccount {
  id: string;
  platform: string;
  displayName: string;
  username?: string;
  status: string;
  connectedAt: string;
}

interface SocialStore {
  accounts: SocialAccount[];
  loading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  disconnectAccount: (id: string) => Promise<void>;
}

export const useSocialStore = create<SocialStore>((set) => ({
  accounts: [],
  loading: false,
  error: null,

  fetchAccounts: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get('/social-accounts');
      set({ accounts: data.accounts, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  disconnectAccount: async (id: string) => {
    try {
      await api.delete(`/social-accounts/${id}`);
      set((state) => ({
        accounts: state.accounts.filter(a => a.id !== id)
      }));
    } catch (e: any) {
      set({ error: e.message });
    }
  }
}));
