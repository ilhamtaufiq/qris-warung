import { useEffect, useRef, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import * as Speech from 'expo-speech';
import { useAuthStore, usePaymentNoticeStore } from '../../store';
import { getApiBaseUrl } from '@/lib/api';
import { NeoButton, NeoCard, NeoInput, NeoPill, NeoScreen } from '@/components/neo';
import { formatCurrencySpeech } from '@/lib/speech';

function formatCurrency(value: string) {
  const parsed = Number(value);
  if (!parsed) {
    return 'Rp 0';
  }

  return `Rp ${parsed.toLocaleString('id-ID')}`;
}

export default function DashboardScreen() {
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'qris' | 'snap' | null>(null);
  const [loadingMode, setLoadingMode] = useState(true);
  const router = useRouter();
  const params = useLocalSearchParams();
  const logout = useAuthStore(state => state.logout);
  const storeId = useAuthStore(state => state.storeId);
  const token = useAuthStore(state => state.token);
  const paymentNotice = usePaymentNoticeStore(state => state);
  const setPaymentNotice = usePaymentNoticeStore(state => state.setPaymentNotice);
  const didSpeak = useRef(false);
  const didHandleRedirectNotice = useRef<string | null>(null);
  const paymentNoticeFlag = Array.isArray(params.payment_notice) ? params.payment_notice[0] : params.payment_notice;
  const paymentOrderId = Array.isArray(params.order_id) ? params.order_id[0] : params.order_id;
  const paymentStatusCode = Array.isArray(params.status_code) ? params.status_code[0] : params.status_code;
  const paymentTransactionStatus = Array.isArray(params.transaction_status)
    ? params.transaction_status[0]
    : params.transaction_status;
  const paymentAmountParam = Array.isArray(params.amount ?? params.gross_amount)
    ? (params.amount ?? params.gross_amount)[0]
    : (params.amount ?? params.gross_amount);
  const paymentAmount = typeof paymentNotice.amount === 'number' && paymentNotice.amount > 0 ? paymentNotice.amount : null;
  const isSuccess = paymentNotice.transactionStatus === 'settlement' || paymentNotice.transactionStatus === 'capture';
  const isPending = paymentNotice.transactionStatus === 'pending';
  const isFailed = paymentNotice.transactionStatus === 'deny' || paymentNotice.transactionStatus === 'cancel' || paymentNotice.transactionStatus === 'expire';

  useEffect(() => {
    if (paymentNoticeFlag !== '1' || !paymentOrderId) {
      return;
    }

    const redirectKey = `${paymentOrderId}-${paymentStatusCode ?? ''}-${paymentTransactionStatus ?? ''}-${paymentAmountParam ?? ''}`;
    if (didHandleRedirectNotice.current === redirectKey) {
      return;
    }

    didHandleRedirectNotice.current = redirectKey;
    const parsedAmount = Number(paymentAmountParam);
    setPaymentNotice({
      orderId: paymentOrderId,
      statusCode: paymentStatusCode ?? null,
      transactionStatus: paymentTransactionStatus ?? null,
      amount: Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null,
    });

    setTimeout(() => {
      router.replace('/');
    }, 0);
  }, [paymentAmountParam, paymentNoticeFlag, paymentOrderId, paymentStatusCode, paymentTransactionStatus, router, setPaymentNotice]);

  useEffect(() => {
    if (!paymentNotice.visible) {
      didSpeak.current = false;
      return;
    }

    if (didSpeak.current) {
      return;
    }

    didSpeak.current = true;
    Speech.stop();

    let speechText = 'Status pembayaran diterima';
    if (isSuccess) {
      speechText = paymentAmount ? `Pembayaran berhasil, ${formatCurrencySpeech(paymentAmount)}` : 'Pembayaran berhasil';
    } else if (isPending) {
      speechText = paymentAmount ? `Pembayaran menunggu, ${formatCurrencySpeech(paymentAmount)}` : 'Pembayaran menunggu';
    } else if (isFailed) {
      speechText = paymentAmount ? `Pembayaran gagal, ${formatCurrencySpeech(paymentAmount)}` : 'Pembayaran gagal';
    }

    Speech.speak(speechText, {
      language: 'id-ID',
      rate: 0.95,
      pitch: 1,
    });
  }, [isFailed, isPending, isSuccess, paymentAmount, paymentNotice.visible]);

  const closePaymentNotice = () => {
    Speech.stop();
    paymentNotice.clearPaymentNotice();
  };

  useEffect(() => {
    const loadPaymentMode = async () => {
      if (!storeId || !token) {
        setLoadingMode(false);
        return;
      }

      try {
        const response = await axios.get(`${getApiBaseUrl()}/api/settings/${storeId}/payment`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPaymentMode(response.data.effective_mode ?? response.data.payment_mode ?? null);
      } catch {
        setPaymentMode(null);
      } finally {
        setLoadingMode(false);
      }
    };

    loadPaymentMode();
  }, [storeId, token]);

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
            <Text style={styles.subtitle}>Generate Snap atau QRIS, terima notifikasi real-time.</Text>
          </View>
          <View style={styles.actionStack}>
            <NeoButton
              label="Midtrans Settings"
              variant="secondary"
              onPress={() => router.push({ pathname: '/settings' } as any)}
            />
            <NeoButton
              label="Transactions"
              variant="secondary"
              onPress={() => router.push({ pathname: '/transactions' } as any)}
            />
            <NeoButton label="Logout" variant="danger" onPress={logout} />
          </View>
        </View>

        <NeoCard>
          <View style={styles.metaRow}>
            <NeoPill label={storeId ? `Store #${storeId}` : 'No store'} tone="cyan" />
            <NeoPill
              label={
                loadingMode
                  ? 'Loading mode'
                  : paymentMode === 'snap'
                    ? 'Mode SNAP'
                    : paymentMode === 'qris'
                      ? 'Mode QRIS'
                      : 'Mode unknown'
              }
              tone="warning"
            />
          </View>
          <Text style={styles.cardTitle}>Generate Payment</Text>
          <Text style={styles.cardText}>
            Masukkan nominal dan kirim pembayaran. Sandbox dipaksa ke Snap, production bisa Snap atau QRIS dinamis lewat settings.
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

          <NeoButton label="Generate Payment" onPress={handleGenerateQR} />
        </NeoCard>

        <NeoCard>
          <Text style={styles.cardTitle}>Session</Text>
          <Text style={styles.cardText}>
            Status koneksi websocket dan autentikasi berjalan dari store lokal, jadi notifikasi transaksi masuk tanpa refresh.
          </Text>
        </NeoCard>
      </ScrollView>

      <Modal
        visible={paymentNotice.visible}
        transparent
        animationType="fade"
        onRequestClose={closePaymentNotice}
      >
        <Pressable style={styles.modalBackdrop} onPress={closePaymentNotice}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <View style={styles.modalHeader}>
              <NeoPill
                label={isSuccess ? 'Payment Success' : isPending ? 'Payment Pending' : 'Payment Status'}
                tone={isSuccess ? 'lime' : isPending ? 'warning' : 'cyan'}
              />
              <Text style={styles.modalTitle}>
                {isSuccess ? 'Pembayaran Berhasil' : isPending ? 'Pembayaran Menunggu' : 'Status Pembayaran'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {isSuccess
                  ? 'Transaksi sudah terkonfirmasi. Modal ini akan hilang setelah ditutup.'
                  : isPending
                    ? 'Midtrans masih memproses pembayaran.'
                    : 'Status transaksi sudah diterima dari Midtrans.'}
              </Text>
            </View>

            <View style={styles.modalDetail}>
              <Text style={styles.modalLabel}>Order ID</Text>
              <Text style={styles.modalValue}>{paymentNotice.orderId || '-'}</Text>
            </View>

            <View style={styles.modalDetail}>
              <Text style={styles.modalLabel}>Status Code</Text>
              <Text style={styles.modalValue}>{paymentNotice.statusCode || '-'}</Text>
            </View>

            <View style={styles.modalDetail}>
              <Text style={styles.modalLabel}>Amount</Text>
              <Text style={styles.modalValue}>
                {paymentAmount ? `Rp ${paymentAmount.toLocaleString('id-ID')}` : '-'}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <NeoButton label="Tutup" onPress={closePaymentNotice} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  actionStack: {
    gap: 10,
  },
  brandBlock: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderWidth: 3,
    borderColor: '#111111',
    borderRadius: 18,
    backgroundColor: '#F9F5EE',
    padding: 16,
    gap: 12,
    shadowColor: '#111111',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 10,
  },
  modalHeader: {
    gap: 8,
  },
  modalTitle: {
    color: '#111111',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
  },
  modalSubtitle: {
    color: '#111111',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  modalDetail: {
    borderWidth: 3,
    borderColor: '#111111',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 4,
  },
  modalLabel: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  modalValue: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '900',
  },
  modalActions: {
    marginTop: 4,
  },
});
