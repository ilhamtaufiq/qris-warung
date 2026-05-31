import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../../store';
import { wsService } from '../../services/websocket';
import '../global.css';

export default function RootLayout() {
  const token = useAuthStore(state => state.token);
  const storeId = useAuthStore(state => state.storeId);
  const segments = useSegments();
  const router = useRouter();
  const hasHydrated = useAuthStore.persist.hasHydrated();

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const inAuthGroup = segments[0] === 'login';

    if (!token && !inAuthGroup) {
      router.replace('/login');
    } else if (token && inAuthGroup) {
      router.replace('/');
    }
  }, [hasHydrated, token, segments, router]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (token && storeId) {
      wsService.connect(storeId);
    } else {
      wsService.disconnect();
    }
    return () => {
      wsService.disconnect();
    };
  }, [hasHydrated, token, storeId]);

  if (!hasHydrated) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="payment" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
