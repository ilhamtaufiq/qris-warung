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

  useEffect(() => {
    const inAuthGroup = segments[0] === 'login';

    if (!token && !inAuthGroup) {
      router.replace('/login');
    } else if (token && inAuthGroup) {
      router.replace('/');
    }
  }, [token, segments, router]);

  useEffect(() => {
    if (token && storeId) {
      wsService.connect(storeId);
    } else {
      wsService.disconnect();
    }
    return () => {
      wsService.disconnect();
    };
  }, [token, storeId]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="payment" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
