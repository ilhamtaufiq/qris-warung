import { create } from 'zustand';

interface AuthState {
  token: string | null;
  storeId: number | null;
  setAuth: (token: string, storeId: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  storeId: null,
  setAuth: (token, storeId) => set({ token, storeId }),
  logout: () => set({ token: null, storeId: null }),
}));
