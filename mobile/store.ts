import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  storeId: number | null;
  setAuth: (token: string, storeId: number) => void;
  logout: () => void;
}

const webStorage = {
  getItem: async (name: string) => {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(name);
  },
  setItem: async (name: string, value: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(name);
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      storeId: null,
      setAuth: (token, storeId) => set({ token, storeId }),
      logout: () => set({ token: null, storeId: null }),
    }),
    {
      name: 'warung-auth',
      storage: createJSONStorage(() => webStorage),
    }
  )
);
