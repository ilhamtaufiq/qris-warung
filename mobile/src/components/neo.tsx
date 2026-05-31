import { ReactNode } from 'react';
import {
  Pressable,
  PressableProps,
  SafeAreaView,
  StyleSheet,
  type StyleProp,
  Text,
  TextInput,
  TextInputProps,
  type ViewStyle,
  View,
} from 'react-native';

const COLORS = {
  bg: '#F7F0B8',
  ink: '#111111',
  paper: '#FFFDF7',
  cyan: '#63E6E2',
  pink: '#FF8CC8',
  lime: '#C5F26A',
  warning: '#FFB84D',
  danger: '#FF6B6B',
};

export function NeoScreen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.screen}>
      <View pointerEvents="none" style={styles.blockTopLeft} />
      <View pointerEvents="none" style={styles.blockBottomRight} />
      <View style={styles.screenInner}>{children}</View>
    </SafeAreaView>
  );
}

export function NeoCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

type NeoButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function NeoButton({ label, variant = 'primary', style, ...props }: NeoButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        pressed && styles.buttonPressed,
        style as StyleProp<ViewStyle>,
      ] as StyleProp<ViewStyle>}
      {...props}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

type NeoInputProps = TextInputProps & {
  label: string;
};

export function NeoInput({ label, style, ...props }: NeoInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={[styles.input, style]} placeholderTextColor="#6B7280" {...props} />
    </View>
  );
}

export function NeoPill({ label, tone = 'cyan' }: { label: string; tone?: 'cyan' | 'pink' | 'lime' | 'warning' }) {
  const toneStyle = {
    cyan: styles.pill_cyan,
    pink: styles.pill_pink,
    lime: styles.pill_lime,
    warning: styles.pill_warning,
  }[tone];

  return (
    <View style={[styles.pill, toneStyle]}>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const shadow = {
  shadowColor: COLORS.ink,
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 6,
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  screenInner: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  blockTopLeft: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 86,
    height: 86,
    backgroundColor: COLORS.cyan,
    borderWidth: 3,
    borderColor: COLORS.ink,
  },
  blockBottomRight: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 110,
    height: 110,
    backgroundColor: COLORS.pink,
    borderWidth: 3,
    borderColor: COLORS.ink,
  },
  card: {
    backgroundColor: COLORS.paper,
    borderWidth: 3,
    borderColor: COLORS.ink,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    ...shadow,
  },
  button: {
    minHeight: 56,
    borderWidth: 3,
    borderColor: COLORS.ink,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    ...shadow,
  },
  buttonPrimary: {
    backgroundColor: COLORS.lime,
  },
  buttonSecondary: {
    backgroundColor: COLORS.cyan,
  },
  buttonDanger: {
    backgroundColor: COLORS.danger,
  },
  buttonPressed: {
    transform: [{ translateX: 3 }, { translateY: 3 }],
    shadowOffset: { width: 1, height: 1 },
  },
  buttonLabel: {
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    color: COLORS.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  input: {
    minHeight: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: COLORS.ink,
    borderRadius: 16,
    paddingHorizontal: 16,
    color: COLORS.ink,
    fontSize: 16,
    fontWeight: '700',
    ...shadow,
  },
  pill: {
    borderWidth: 3,
    borderColor: COLORS.ink,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    ...shadow,
  },
  pillLabel: {
    color: COLORS.ink,
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  pill_cyan: {
    backgroundColor: COLORS.cyan,
  },
  pill_pink: {
    backgroundColor: COLORS.pink,
  },
  pill_lime: {
    backgroundColor: COLORS.lime,
  },
  pill_warning: {
    backgroundColor: COLORS.warning,
  },
});

export { COLORS };
