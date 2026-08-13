import { Platform } from 'react-native';

// Use the local network IP for testing on physical devices. 192.168.1.6 is likely your Wi-Fi adapter.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://greed-automation.onrender.com/api';

export const api = {
  async get(endpoint: string) {
    console.log(`[API GET] ${API_URL}${endpoint}`);
    const res = await fetch(`${API_URL}${endpoint}`);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  async post(endpoint: string, data: any) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  async delete(endpoint: string) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
  },

  async createCampaign(instruction: string, platforms: string[]) {
    // Backend enum expects uppercase
    const upperPlatforms = platforms.map(p => p.toUpperCase());
    return this.post('/campaigns', { instruction, platforms: upperPlatforms });
  },

  async addMedia(campaignId: string, base64: string, resourceType: string = 'image', format: string = 'jpeg') {
    return this.post(`/campaigns/${campaignId}/upload-base64`, { base64, resourceType, format });
  },

  async startCampaign(campaignId: string) {
    return this.post(`/campaigns/${campaignId}/start`, {});
  },

  async getCampaign(campaignId: string) {
    return this.get(`/campaigns/${campaignId}`);
  }
};
