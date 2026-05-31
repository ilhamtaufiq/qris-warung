import { Platform } from 'react-native';

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export function getApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) {
    return trimTrailingSlash(configured);
  }

  if (process.env.NODE_ENV === 'production') {
    return 'https://qris.cianjur.space/api';
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }

  return 'http://localhost:8000';
}

export function getWebSocketUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (process.env.NODE_ENV === 'production') {
    return `wss://qris.cianjur.space${normalizedPath}`;
  }

  const baseUrl = getApiBaseUrl().replace(/^http(s)?/, 'ws$1');
  return `${baseUrl}${normalizedPath}`;
}
