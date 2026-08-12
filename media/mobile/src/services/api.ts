import { Platform } from 'react-native';

// Use the local network IP for testing on physical devices. 192.168.1.6 is likely your Wi-Fi adapter.
const API_URL = 'http://192.168.1.6:3000/api';

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
  }
};
