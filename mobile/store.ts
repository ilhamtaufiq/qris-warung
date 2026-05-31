import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  storeId: number | null;
  setAuth: (token: string, storeId: number) => void;
  logout: () => void;
}

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
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
