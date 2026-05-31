import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { COLORS, NeoButton, NeoCard, NeoPill, NeoScreen } from '@/components/neo';
import { getApiBaseUrl } from '@/lib/api';
import { usePaymentNoticeStore } from '../../../store';

function asText(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const didRedirect = useRef(false);
  const setPaymentNotice = usePaymentNoticeStore(state => state.setPaymentNotice);

  const orderId = asText(params.order_id);
  const transactionStatus = asText(params.transaction_status);
  const statusCode = asText(params.status_code);
  const amountParam = asText(params.amount ?? params.gross_amount);
  const directAmount = Number(amountParam);
  const hasDirectAmount = Number.isFinite(directAmount) && directAmount > 0;
  const [resolvedAmount, setResolvedAmount] = useState<number | null>(hasDirectAmount ? directAmount : null);
  const [amountLoaded, setAmountLoaded] = useState(hasDirectAmount || !orderId);

  const amount = resolvedAmount;
  const canStoreNotice = useMemo(() => {
    return Boolean(orderId) && amountLoaded;
  }, [amountLoaded, orderId]);

  useEffect(() => {
    if (hasDirectAmount || !orderId) {
      return;
    }

    let cancelled = false;

    const loadAmount = async () => {
      try {
        const response = await axios.get(`${getApiBaseUrl()}/api/transactions/public/${orderId}`);
        if (!cancelled) {
          setResolvedAmount(Number(response.data.amount ?? 0));
        }
      } catch {
        if (!cancelled) {
          setResolvedAmount(null);
        }
      } finally {
        if (!cancelled) {
          setAmountLoaded(true);
        }
      }
    };

    loadAmount();

    return () => {
      cancelled = true;
    };
  }, [hasDirectAmount, orderId]);

  useEffect(() => {
    if (!canStoreNotice || didRedirect.current) {
      return;
    }

    didRedirect.current = true;
    setPaymentNotice({
      orderId,
      statusCode,
      transactionStatus,
      amount: amount && amount > 0 ? amount : null,
    });
    router.replace({
      pathname: '/',
      params: {
        payment_notice: '1',
        order_id: orderId,
        status_code: statusCode,
        transaction_status: transactionStatus,
        amount: amount && amount > 0 ? String(amount) : '',
      },
    } as any);
  }, [amount, canStoreNotice, orderId, router, setPaymentNotice, statusCode, transactionStatus]);

  const detailAmount = amount && amount > 0 ? `Rp ${amount.toLocaleString('id-ID')}` : amountLoaded ? '-' : 'Loading...';

  return (
    <NeoScreen>
      <View style={styles.center}>
        <NeoCard>
          <View style={styles.header}>
            <NeoPill label="Midtrans Finish" tone="lime" />
            <Text style={styles.title}>Mengembalikan ke Dashboard</Text>
            <Text style={styles.subtitle}>
              Status pembayaran akan ditampilkan sebagai modal di halaman utama.
            </Text>
          </View>

          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValue}>{orderId || '-'}</Text>
          </View>

          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.detailValue}>{transactionStatus || '-'}</Text>
          </View>

          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>{detailAmount}</Text>
          </View>

          <NeoButton label="Kembali Sekarang" onPress={() => router.replace('/')} />
        </NeoCard>
      </View>
    </NeoScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
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
  detailBox: {
    borderWidth: 3,
    borderColor: COLORS.ink,
    borderRadius: 16,
    backgroundColor: COLORS.paper,
    padding: 14,
    gap: 4,
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.ink,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
  },
});
