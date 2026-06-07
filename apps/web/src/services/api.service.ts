import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // sends httpOnly refresh-token cookie automatically
});

// Response interceptor: on 401, attempt token refresh then retry once
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        // Lazy-import to avoid circular dependency (store imports apiClient)
        const { useAuthStore } = await import('../stores/auth.store');
        await useAuthStore.getState().refreshToken();
        return apiClient(original);
      } catch {
        const { useAuthStore } = await import('../stores/auth.store');
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);
