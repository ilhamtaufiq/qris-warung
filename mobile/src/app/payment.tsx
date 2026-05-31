import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { useAuthStore } from '../../store';
import { getApiBaseUrl } from '@/lib/api';
import { COLORS, NeoButton, NeoCard, NeoPill, NeoScreen } from '@/components/neo';

type PaymentType = 'qris' | 'snap' | null;

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export default function PaymentScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const storeId = useAuthStore(state => state.storeId);
  const token = useAuthStore(state => state.token);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>(null);
  const [loading, setLoading] = useState(true);
  const amountParam = Array.isArray(params.amount) ? params.amount[0] : params.amount;

  const amount = useMemo(() => {
    const parsed = Number(amountParam);
    return Number.isFinite(parsed) ? parsed : NaN;
  }, [amountParam]);

  useEffect(() => {
    const requestPayment = async () => {
      if (!storeId || !token) {
        Alert.alert('Session expired', 'Silakan login ulang.');
        router.replace('/login');
        return;
      }

      if (!amountParam || Number.isNaN(amount) || amount <= 0) {
        Alert.alert('Invalid amount', 'Nominal pembayaran tidak valid.');
        router.back();
        return;
      }

      setLoading(true);

      try {
        const response = await axios.post(
          `${getApiBaseUrl()}/api/transactions/${storeId}/payment`,
          { amount: Math.round(amount) },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setPaymentType((response.data.payment_type as PaymentType) ?? null);
        setPaymentUrl(response.data.payment_url ?? response.data.qr_url ?? null);
      } catch {
        Alert.alert('Error', 'Gagal generate payment.');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    requestPayment();
  }, [amount, amountParam, router, storeId, token]);

  const handleOpenPayment = async () => {
    if (!paymentUrl) {
      return;
    }

    try {
      await Linking.openURL(paymentUrl);
    } catch {
      Alert.alert('Error', 'Tidak bisa membuka halaman pembayaran.');
    }
  };

  const isSnap = paymentType === 'snap';
  const isQris = paymentType === 'qris';

  return (
    <NeoScreen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <NeoPill
            label={loading ? 'Midtrans Payment' : isSnap ? 'Snap Payment' : 'QRIS Payment'}
            tone={isSnap ? 'warning' : 'cyan'}
          />
          <Text style={styles.title}>{loading ? 'Preparing Payment' : isSnap ? 'Midtrans Snap Checkout' : 'Midtrans QRIS'}</Text>
          <Text style={styles.subtitle}>
            {isSnap
              ? 'Buka halaman Midtrans untuk memilih metode pembayaran yang aktif di production.'
              : 'Midtrans notification akan mengubah status transaksi tanpa refresh layar.'}
          </Text>
        </View>

        <NeoCard>
          <Text style={styles.amountLabel}>Total</Text>
          <Text style={styles.amountValue}>{Number.isNaN(amount) ? 'Rp 0' : formatCurrency(amount)}</Text>

          <View style={styles.qrBox}>
            {loading ? (
              <Text style={styles.qrFallback}>Generating payment...</Text>
            ) : isSnap ? (
              <View style={styles.snapBlock}>
                <Text style={styles.snapTitle}>Snap redirect siap dibuka</Text>
                <Text style={styles.snapText}>
                  Midtrans akan menampilkan halaman pembayaran. Setelah selesai, status akan masuk lewat webhook.
                </Text>
              </View>
            ) : paymentUrl ? (
              <Image source={{ uri: paymentUrl }} style={styles.qrImage} resizeMode="contain" />
            ) : (
              <Text style={styles.qrFallback}>QR code unavailable</Text>
            )}
          </View>

          {!loading && isSnap && (
            <Text style={styles.note}>
              Mode Snap dipakai di sandbox dan bisa dipilih di production lewat halaman settings.
            </Text>
          )}

          {!loading && isQris && (
            <Text style={styles.note}>
              QR di bawah ini dipakai untuk QRIS dinamis. Pastikan Midtrans payment channel sudah aktif di production.
            </Text>
          )}

          <View style={styles.buttonStack}>
            {isSnap && (
              <NeoButton label="Open Payment Page" onPress={handleOpenPayment} />
            )}
            {!isSnap && <NeoButton label="Back" variant="secondary" onPress={() => router.back()} />}
            {isSnap && <NeoButton label="Back" variant="secondary" onPress={() => router.back()} />}
          </View>
        </NeoCard>

        <NeoCard>
          <Text style={styles.cardTitle}>Webhook</Text>
          <Text style={styles.cardText}>
            Pastikan Payment Notification URL di Midtrans sudah menunjuk ke endpoint publik agar pembayaran sukses terdeteksi.
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
  header: {
    gap: 8,
  },
  title: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '900',
    color: COLORS.ink,
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    color: COLORS.ink,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.ink,
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '900',
    color: COLORS.ink,
  },
  qrBox: {
    minHeight: 280,
    borderWidth: 3,
    borderColor: COLORS.ink,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  qrImage: {
    width: 240,
    height: 240,
  },
  qrFallback: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.ink,
    textAlign: 'center',
  },
  snapBlock: {
    gap: 10,
    alignItems: 'center',
  },
  snapTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
    textAlign: 'center',
  },
  snapText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: COLORS.ink,
    textAlign: 'center',
  },
  note: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: COLORS.ink,
  },
  buttonStack: {
    gap: 10,
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    color: COLORS.ink,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: COLORS.ink,
  },
});
