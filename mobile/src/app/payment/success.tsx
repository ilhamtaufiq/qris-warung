import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, NeoButton, NeoCard, NeoPill, NeoScreen } from '@/components/neo';

function asText(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const orderId = asText(params.order_id);
  const transactionStatus = asText(params.transaction_status);
  const statusCode = asText(params.status_code);

  const title = useMemo(() => {
    if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
      return 'Payment Completed';
    }
    if (transactionStatus === 'pending') {
      return 'Payment Pending';
    }
    return 'Payment Finished';
  }, [transactionStatus]);

  return (
    <NeoScreen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <NeoPill label="Midtrans Finish" tone="lime" />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            Redirect dari Midtrans sudah masuk ke halaman ini. Status final tetap dikunci oleh webhook server.
          </Text>
        </View>

        <NeoCard>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Order ID</Text>
              <Text style={styles.summaryValue}>{orderId || '-'}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Status</Text>
              <Text style={styles.summaryValue}>{transactionStatus || '-'}</Text>
            </View>
          </View>

          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Status Code</Text>
            <Text style={styles.detailValue}>{statusCode || '-'}</Text>
          </View>

          <Text style={styles.note}>
            Jika pembayaran sukses, aplikasi kasir akan menerima update dari webhook dan websocket.
          </Text>

          <NeoButton label="Back to Dashboard" onPress={() => router.replace('/')} />
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
  summaryRow: {
    gap: 12,
  },
  summaryItem: {
    borderWidth: 3,
    borderColor: COLORS.ink,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 4,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.ink,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
  },
  detailBox: {
    borderWidth: 3,
    borderColor: COLORS.ink,
    borderRadius: 16,
    backgroundColor: COLORS.paper,
    padding: 14,
    gap: 4,
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
  note: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: COLORS.ink,
  },
});
