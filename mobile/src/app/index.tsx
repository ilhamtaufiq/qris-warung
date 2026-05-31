import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store';
import { NeoButton, NeoCard, NeoInput, NeoPill, NeoScreen } from '@/components/neo';

function formatCurrency(value: string) {
  const parsed = Number(value);
  if (!parsed) {
    return 'Rp 0';
  }

  return `Rp ${parsed.toLocaleString('id-ID')}`;
}

export default function DashboardScreen() {
  const [amount, setAmount] = useState('');
  const router = useRouter();
  const logout = useAuthStore(state => state.logout);
  const storeId = useAuthStore(state => state.storeId);

  const handleGenerateQR = () => {
    const parsed = Number(amount);
    if (!amount || Number.isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid amount', 'Masukkan nominal yang valid.');
      return;
    }

    router.push({ pathname: '/payment', params: { amount } });
  };

  return (
    <NeoScreen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.brandBlock}>
            <NeoPill label="QRIS local" tone="lime" />
            <Text style={styles.title}>Warung Payment</Text>
            <Text style={styles.subtitle}>Generate QRIS, terima notifikasi real-time.</Text>
          </View>
          <NeoButton label="Logout" variant="danger" onPress={logout} />
        </View>

        <NeoCard>
          <NeoPill label={storeId ? `Store #${storeId}` : 'No store'} tone="cyan" />
          <Text style={styles.cardTitle}>Generate New QRIS</Text>
          <Text style={styles.cardText}>
            Masukkan nominal dan kirim QR dinamis ke pelanggan. Webhook Midtrans akan memicu status pembayaran otomatis.
          </Text>

          <NeoInput
            label="Nominal"
            placeholder="50000"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Preview</Text>
            <Text style={styles.previewValue}>{formatCurrency(amount)}</Text>
          </View>

          <NeoButton label="Generate QR Code" onPress={handleGenerateQR} />
        </NeoCard>

        <NeoCard>
          <Text style={styles.cardTitle}>Session</Text>
          <Text style={styles.cardText}>
            Status koneksi websocket dan autentikasi berjalan dari store lokal, jadi notifikasi transaksi masuk tanpa refresh.
          </Text>
        </NeoCard>
      </ScrollView>
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 28,
    gap: 16,
  },
  topRow: {
    gap: 14,
  },
  brandBlock: {
    gap: 8,
  },
  title: {
    fontSize: 34,
    lineHeight: 36,
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
  cardTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    color: '#111111',
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#111111',
    fontWeight: '600',
  },
  previewRow: {
    borderWidth: 3,
    borderColor: '#111111',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  previewLabel: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  previewValue: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '900',
  },
});
