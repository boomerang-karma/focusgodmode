import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, style, pressed && styles.cardPressed]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Subtitle({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.subtitle, style]}>{children}</Text>;
}

export function Body({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Caption({
  children,
  style,
  numberOfLines,
}: {
  children: React.ReactNode;
  style?: TextStyle;
  numberOfLines?: number;
}) {
  return (
    <Text style={[styles.caption, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && styles.btnPrimary,
        variant === 'secondary' && styles.btnSecondary,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        (disabled || pressed) && { opacity: disabled ? 0.4 : 0.85 },
        style,
      ]}
    >
      <Text
        style={[
          styles.btnLabel,
          (variant === 'secondary' || variant === 'ghost') && { color: colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

export function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <View style={[styles.chip, accent ? { borderColor: accent } : null]}>
      <Text style={[styles.chipValue, accent ? { color: accent } : null]}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

export function PillarBadge({ pillar }: { pillar: 'smriti' | 'sahitya' | 'dharana' }) {
  const labels = { smriti: 'Smriti', sahitya: 'Sahitya', dharana: 'Dharana' };
  return (
    <View style={[styles.pillar, { backgroundColor: colors.pillar[pillar] + '33' }]}>
      <Text style={[styles.pillarText, { color: colors.pillar[pillar] }]}>{labels[pillar]}</Text>
    </View>
  );
}

export function ProgressBar({ progress, color = colors.saffron }: { progress: number; color?: string }) {
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${p * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.saffron} size="large" />
      <Caption style={{ marginTop: spacing.sm }}>{label}</Caption>
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Subtitle>{title}</Subtitle>
      {action}
    </View>
  );
}

/** Simple bar chart for weekly minutes */
export function MiniBarChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barMaxHeight = 72;
  return (
    <View style={styles.chartRow}>
      {data.map((d, i) => (
        <View key={`${d.label}-${i}`} style={styles.chartCol}>
          <View style={styles.chartBarWrap}>
            <View
              style={[
                styles.chartBar,
                { height: Math.max(4, (d.value / max) * barMaxHeight) },
              ]}
            />
          </View>
          <Caption style={styles.chartLabel}>{d.label}</Caption>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardPressed: {
    backgroundColor: colors.bgMuted,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  caption: {
    ...typography.caption,
    color: colors.textMuted,
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: colors.saffron,
  },
  btnSecondary: {
    backgroundColor: colors.bgMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  btnGhost: {
    backgroundColor: 'transparent',
  },
  btnDanger: {
    backgroundColor: colors.danger,
  },
  btnLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  chip: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    alignItems: 'center',
    minWidth: 80,
  },
  chipValue: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: '700',
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  pillar: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  pillarText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  barTrack: {
    height: 8,
    backgroundColor: colors.bgMuted,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  chartRow: {
    flexDirection: 'row',
    height: 100,
    alignItems: 'flex-end',
    gap: 6,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  chartBarWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chartBar: {
    width: '70%',
    backgroundColor: colors.saffron,
    borderRadius: 4,
    minHeight: 4,
  },
  chartLabel: {
    marginTop: 4,
    fontSize: 10,
  },
});
