import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuthStore } from '../../store';
import { getApiBaseUrl } from '@/lib/api';
import { NeoButton, NeoCard, NeoInput, NeoPill, NeoScreen } from '@/components/neo';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Login gagal', 'Email dan password harus diisi.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${getApiBaseUrl()}/api/auth/login`, {
        email,
        password,
      });

      setAuth(response.data.access_token, response.data.store_id);
      router.replace('/');
    } catch {
      Alert.alert('Login gagal', 'Periksa kredensial sandbox.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <NeoScreen>
      <View style={styles.center}>
        <View style={styles.header}>
          <NeoPill label="Sandbox ready" tone="pink" />
          <Text style={styles.title}>Warung Payment</Text>
          <Text style={styles.subtitle}>
            Login untuk generate QRIS dan menerima status pembayaran secara langsung.
          </Text>
        </View>

        <NeoCard>
          <NeoInput
            label="Email"
            placeholder="admin@warung.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <NeoInput
            label="Password"
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <NeoButton label={loading ? 'Signing in...' : 'Sign In'} onPress={handleLogin} />
        </NeoCard>

        <Text style={styles.footer}>
          Gunakan akun seed local atau akun yang sudah dibuat di backend.
        </Text>
      </View>
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: 18,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 36,
    lineHeight: 38,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    color: '#111111',
  },
  footer: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
});
