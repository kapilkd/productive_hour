import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { apiClient } from '../services/api.service';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,

      login: async (email, password) => {
        const { data } = await apiClient.post('/auth/login', { email, password });
        set({ user: data.user, accessToken: data.accessToken });
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
      },

      logout: () => {
        apiClient.post('/auth/logout').catch(() => {});
        set({ user: null, accessToken: null });
        delete apiClient.defaults.headers.common['Authorization'];
      },

      refreshToken: async () => {
        const { data } = await apiClient.post('/auth/refresh');
        set({ accessToken: data.accessToken });
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
      },
    }),
    {
      name: 'auth-store',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
      onRehydrateStorage: () => (state) => {
        // Restore Authorization header after page reload
        if (state?.accessToken) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${state.accessToken}`;
        }
      },
    }
  )
);
