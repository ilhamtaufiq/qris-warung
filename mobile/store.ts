import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  storeId: number | null;
  setAuth: (token: string, storeId: number) => void;
  logout: () => void;
}

interface PaymentNoticeState {
  visible: boolean;
  orderId: string | null;
  statusCode: string | null;
  transactionStatus: string | null;
  amount: number | null;
  setPaymentNotice: (payload: {
    orderId: string;
    statusCode: string | null;
    transactionStatus: string | null;
    amount: number | null;
  }) => void;
  clearPaymentNotice: () => void;
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

export const usePaymentNoticeStore = create<PaymentNoticeState>()(
  persist(
    (set) => ({
      visible: false,
      orderId: null,
      statusCode: null,
      transactionStatus: null,
      amount: null,
      setPaymentNotice: ({ orderId, statusCode, transactionStatus, amount }) =>
        set({
          visible: true,
          orderId,
          statusCode,
          transactionStatus,
          amount,
        }),
      clearPaymentNotice: () =>
        set({
          visible: false,
          orderId: null,
          statusCode: null,
          transactionStatus: null,
          amount: null,
        }),
    }),
    {
      name: 'warung-payment-notice',
      storage: createJSONStorage(() => webStorage),
    }
  )
);
