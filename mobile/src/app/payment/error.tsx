import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, NeoButton, NeoCard, NeoPill, NeoScreen } from '@/components/neo';

function asText(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default function PaymentErrorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = asText(params.order_id);
  const transactionStatus = asText(params.transaction_status);

  return (
    <NeoScreen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <NeoPill label="Midtrans Error" tone="pink" />
          <Text style={styles.title}>Payment Failed</Text>
          <Text style={styles.subtitle}>
            Midtrans mengembalikan error atau pembayaran gagal diproses.
          </Text>
        </View>

        <NeoCard>
          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValue}>{orderId || '-'}</Text>
          </View>

          <View style={styles.detailBox}>
            <Text style={styles.detailLabel}>Status</Text>
            <Text style={styles.detailValue}>{transactionStatus || '-'}</Text>
          </View>

          <Text style={styles.note}>
            Cek response Midtrans dan notification log untuk detail kegagalannya.
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
  detailBox: {
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
    marginBottom: 12,
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
    marginVertical: 12,
  },
});
