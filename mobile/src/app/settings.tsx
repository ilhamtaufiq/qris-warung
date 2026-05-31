import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import axios, { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store';
import { getApiBaseUrl } from '@/lib/api';
import { COLORS, NeoButton, NeoCard, NeoPill, NeoScreen } from '@/components/neo';

type PaymentMode = 'qris' | 'snap';

type PaymentSettingResponse = {
  store_id: number;
  payment_mode: PaymentMode;
  effective_mode: PaymentMode;
  is_locked: boolean;
};

export default function SettingsScreen() {
  const router = useRouter();
  const storeId = useAuthStore(state => state.storeId);
  const token = useAuthStore(state => state.token);
  const [selectedMode, setSelectedMode] = useState<PaymentMode>('qris');
  const [effectiveMode, setEffectiveMode] = useState<PaymentMode>('qris');
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (!storeId || !token) {
        router.replace('/login');
        return;
      }

      try {
        const response = await axios.get<PaymentSettingResponse>(
          `${getApiBaseUrl()}/api/settings/${storeId}/payment`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSelectedMode(response.data.is_locked ? response.data.effective_mode : response.data.payment_mode);
        setEffectiveMode(response.data.effective_mode);
        setIsLocked(response.data.is_locked);
      } catch {
        Alert.alert('Error', 'Gagal memuat pengaturan pembayaran.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [router, storeId, token]);

  const saveMode = async () => {
    if (!storeId || !token) {
      router.replace('/login');
      return;
    }

    if (isLocked && selectedMode !== 'snap') {
      Alert.alert('Sandbox locked', 'Sandbox hanya menggunakan Snap mode.');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.put<PaymentSettingResponse>(
        `${getApiBaseUrl()}/api/settings/${storeId}/payment`,
        { payment_mode: selectedMode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedMode(response.data.payment_mode);
      setEffectiveMode(response.data.effective_mode);
      setIsLocked(response.data.is_locked);
      Alert.alert('Saved', 'Pengaturan pembayaran tersimpan.');
    } catch (error) {
      const message =
        isAxiosError(error) && typeof error.response?.data?.detail === 'string'
          ? error.response.data.detail
          : 'Gagal menyimpan pengaturan.';
      Alert.alert('Error', message);
    } finally {
      setSaving(false);
    }
  };

  const renderOption = (mode: PaymentMode, title: string, description: string, tone: 'cyan' | 'warning') => {
    const active = selectedMode === mode;
    const disabled = isLocked && mode !== 'snap';

    return (
      <Pressable
        key={mode}
        disabled={disabled}
        onPress={() => setSelectedMode(mode)}
        style={({ pressed }) => [
          styles.option,
          active && styles.optionActive,
          disabled && styles.optionDisabled,
          pressed && !disabled && styles.optionPressed,
        ]}
      >
        <View style={styles.optionHeader}>
          <NeoPill label={title} tone={tone} />
          <NeoPill label={active ? 'Selected' : 'Tap to choose'} tone={active ? 'lime' : 'pink'} />
        </View>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionText}>{description}</Text>
        {disabled && <Text style={styles.optionHint}>Sandbox dikunci ke Snap.</Text>}
      </Pressable>
    );
  };

  return (
    <NeoScreen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <NeoPill label="Midtrans Settings" tone="warning" />
          <Text style={styles.title}>Payment Mode</Text>
          <Text style={styles.subtitle}>
            Sandbox dipaksa ke Snap. Production bisa dipilih antara Snap checkout atau QRIS dinamis.
          </Text>
        </View>

        <NeoCard>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Stored</Text>
              <Text style={styles.summaryValue}>{loading ? 'Loading...' : selectedMode.toUpperCase()}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Effective</Text>
              <Text style={styles.summaryValue}>{loading ? 'Loading...' : effectiveMode.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.summaryNote}>
            {isLocked
              ? 'Environment sandbox sedang dikunci ke Snap. Production mode baru bisa dipilih setelah live.'
              : 'Pilih mode yang akan dipakai saat generate payment di production.'}
          </Text>
        </NeoCard>

        {renderOption(
          'snap',
          'Snap Checkout',
          'Midtrans membuka halaman pembayaran hosted. Cocok untuk sandbox dan production jika ingin flow checkout lengkap.',
          'warning'
        )}

        {renderOption(
          'qris',
          'QRIS Dinamis',
          'Backend membuat QR unik per transaksi. Cocok untuk kasir yang ingin scan langsung.',
          'cyan'
        )}

        <View style={styles.buttonStack}>
          <NeoButton label={saving ? 'Saving...' : 'Save Settings'} onPress={saveMode} />
          <NeoButton label="Back" variant="secondary" onPress={() => router.back()} />
        </View>
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
    flexDirection: 'row',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
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
  summaryNote: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: COLORS.ink,
  },
  option: {
    borderWidth: 3,
    borderColor: COLORS.ink,
    borderRadius: 18,
    backgroundColor: COLORS.paper,
    padding: 16,
    gap: 10,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  optionActive: {
    backgroundColor: '#FFFFFF',
  },
  optionDisabled: {
    opacity: 0.55,
  },
  optionPressed: {
    transform: [{ translateX: 3 }, { translateY: 3 }],
    shadowOffset: { width: 1, height: 1 },
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  optionTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    color: COLORS.ink,
  },
  optionText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: COLORS.ink,
  },
  optionHint: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    color: COLORS.ink,
  },
  buttonStack: {
    gap: 10,
  },
});
