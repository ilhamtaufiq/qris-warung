import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store';
import { getApiBaseUrl } from '@/lib/api';
import { COLORS, NeoButton, NeoCard, NeoPill, NeoScreen } from '@/components/neo';

type TransactionItem = {
  id: string;
  store_id: number;
  amount: number;
  status: string;
  created_at: string;
  payment_type?: string | null;
  payment_url?: string | null;
};

type TransactionStats = {
  total_transactions: number;
  success_transactions: number;
  pending_transactions: number;
  expired_transactions: number;
  total_amount: number;
  success_amount: number;
  pending_amount: number;
  expired_amount: number;
};

type OverviewResponse = {
  stats: TransactionStats;
  transactions: TransactionItem[];
};

function formatCurrency(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function statusTone(status: string): 'lime' | 'warning' | 'pink' {
  if (status === 'success') {
    return 'lime';
  }
  if (status === 'pending') {
    return 'warning';
  }
  return 'pink';
}

export default function TransactionsScreen() {
  const router = useRouter();
  const storeId = useAuthStore(state => state.storeId);
  const token = useAuthStore(state => state.token);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  const loadOverview = useCallback(async () => {
    if (!storeId || !token) {
      router.replace('/login');
      return;
    }

    try {
      const response = await axios.get<OverviewResponse>(
        `${getApiBaseUrl()}/api/transactions/${storeId}/overview?limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStats(response.data.stats);
      setTransactions(response.data.transactions);
    } catch {
      Alert.alert('Error', 'Gagal memuat daftar transaksi.');
    }
  }, [router, storeId, token]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await loadOverview();
      setLoading(false);
    };

    run();
  }, [loadOverview]);

  const statCards = useMemo(() => {
    if (!stats) {
      return [];
    }

    return [
      { label: 'Total', value: stats.total_transactions.toString(), tone: 'cyan' as const },
      { label: 'Success', value: stats.success_transactions.toString(), tone: 'lime' as const },
      { label: 'Pending', value: stats.pending_transactions.toString(), tone: 'warning' as const },
      { label: 'Expired', value: stats.expired_transactions.toString(), tone: 'pink' as const },
    ];
  }, [stats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOverview();
    setRefreshing(false);
  };

  return (
    <NeoScreen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <NeoPill label="Transactions" tone="cyan" />
          <Text style={styles.title}>Daftar Transaksi</Text>
          <Text style={styles.subtitle}>
            Ringkasan transaksi dan status pembayaran terakhir untuk store aktif.
          </Text>
        </View>

        <View style={styles.topActions}>
          <NeoButton label={refreshing ? 'Refreshing...' : 'Refresh'} variant="secondary" onPress={handleRefresh} />
          <NeoButton label="Back" onPress={() => router.back()} />
        </View>

        <View style={styles.statsGrid}>
          {loading && !stats
            ? [0, 1, 2, 3].map((index) => (
                <View key={index} style={[styles.statCard, styles.statPlaceholder]}>
                  <Text style={styles.statLabel}>Loading</Text>
                  <Text style={styles.statValue}>...</Text>
                </View>
              ))
            : statCards.map((card) => (
                <View key={card.label} style={styles.statCard}>
                  <NeoPill label={card.label} tone={card.tone} />
                  <Text style={styles.statValue}>{card.value}</Text>
                </View>
              ))}
        </View>

        <NeoCard>
          <Text style={styles.sectionTitle}>Nilai Transaksi</Text>
          <View style={styles.amountGrid}>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Total</Text>
              <Text style={styles.amountValue}>{stats ? formatCurrency(stats.total_amount) : 'Rp 0'}</Text>
            </View>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Success</Text>
              <Text style={styles.amountValue}>{stats ? formatCurrency(stats.success_amount) : 'Rp 0'}</Text>
            </View>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Pending</Text>
              <Text style={styles.amountValue}>{stats ? formatCurrency(stats.pending_amount) : 'Rp 0'}</Text>
            </View>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Expired</Text>
              <Text style={styles.amountValue}>{stats ? formatCurrency(stats.expired_amount) : 'Rp 0'}</Text>
            </View>
          </View>
        </NeoCard>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Text style={styles.listCount}>{transactions.length} items</Text>
        </View>

        {transactions.length === 0 && !loading ? (
          <NeoCard>
            <Text style={styles.emptyTitle}>Belum ada transaksi</Text>
            <Text style={styles.emptyText}>Generate payment pertama dari dashboard untuk melihat daftar di sini.</Text>
          </NeoCard>
        ) : (
          transactions.map((item) => (
            <NeoCard key={item.id}>
              <View style={styles.rowTop}>
                <NeoPill label={item.status} tone={statusTone(item.status)} />
                <Text style={styles.txId}>{item.id}</Text>
              </View>

              <View style={styles.rowMeta}>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Amount</Text>
                  <Text style={styles.metaValue}>{formatCurrency(item.amount)}</Text>
                </View>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>Type</Text>
                  <Text style={styles.metaValue}>{(item.payment_type ?? '-').toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.timestamp}>{formatDate(item.created_at)}</Text>
            </NeoCard>
          ))
        )}
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
  topActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flexBasis: '48%',
    flexGrow: 1,
    borderWidth: 3,
    borderColor: COLORS.ink,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 8,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  statPlaceholder: {
    minHeight: 96,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.ink,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '900',
    color: COLORS.ink,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    color: COLORS.ink,
  },
  amountGrid: {
    gap: 10,
  },
  amountBox: {
    borderWidth: 3,
    borderColor: COLORS.ink,
    borderRadius: 16,
    backgroundColor: COLORS.paper,
    padding: 14,
    gap: 4,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.ink,
    textTransform: 'uppercase',
  },
  amountValue: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    color: COLORS.ink,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 10,
  },
  listCount: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.ink,
    textTransform: 'uppercase',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: COLORS.ink,
  },
  rowTop: {
    gap: 8,
  },
  txId: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '900',
    color: COLORS.ink,
  },
  rowMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  metaBlock: {
    flex: 1,
    borderWidth: 3,
    borderColor: COLORS.ink,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 4,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.ink,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
});
