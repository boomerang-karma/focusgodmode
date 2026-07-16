import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow, spacing, typography } from '../theme';

export function Screen({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.screen, style]}>
      <LinearGradient
        colors={[...colors.gradients.night]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* ambient glow orbs */}
      <View style={styles.orbTop} pointerEvents="none" />
      <View style={styles.orbBottom} pointerEvents="none" />
      {children}
    </View>
  );
}

export function GlowBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient
        colors={['#1a0a3e', '#0b0618', '#120820']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orbTop} pointerEvents="none" />
      <View style={styles.orbMid} pointerEvents="none" />
      <View style={styles.orbBottom} pointerEvents="none" />
      {children}
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
  glow = false,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  glow?: boolean;
}) {
  const content = (
    <LinearGradient
      colors={['#24124f', '#1a1035', '#15102a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.cardInner, glow && styles.cardGlowBorder]}
    >
      {children}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.cardWrap,
          glow && shadow.glow,
          style,
          pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
        ]}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={[styles.cardWrap, glow && shadow.glow, style]}>{content}</View>;
}

export function HeroCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <LinearGradient
      colors={[...colors.gradients.aurora]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.heroCard, style, shadow.glow]}
    >
      <View style={styles.heroInner}>{children}</View>
    </LinearGradient>
  );
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
  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.btnOuter,
          shadow.glow,
          (disabled || pressed) && { opacity: disabled ? 0.4 : 0.88 },
          style,
        ]}
      >
        <LinearGradient
          colors={[...colors.gradients.saffron]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.btn}
        >
          <Text style={[styles.btnLabel, { color: '#1a0500' }]}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === 'danger') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.btnOuter,
          (disabled || pressed) && { opacity: disabled ? 0.4 : 0.88 },
          style,
        ]}
      >
        <LinearGradient
          colors={['#c9184a', '#ff4d6d']}
          style={styles.btn}
        >
          <Text style={styles.btnLabel}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'secondary' && styles.btnSecondary,
        variant === 'ghost' && styles.btnGhost,
        (disabled || pressed) && { opacity: disabled ? 0.4 : 0.85 },
        style,
      ]}
    >
      <Text style={[styles.btnLabel, variant === 'ghost' && { color: colors.goldBright }]}>
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
  const c = accent ?? colors.gold;
  return (
    <View style={[styles.chip, { borderColor: c + '99' }]}>
      <LinearGradient
        colors={['#2a1858', '#1a1035']}
        style={StyleSheet.absoluteFill}
      />
      <Text style={[styles.chipValue, { color: c }]}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

export function PillarBadge({ pillar }: { pillar: 'smriti' | 'sahitya' | 'dharana' }) {
  const labels = { smriti: 'Smriti', sahitya: 'Sahitya', dharana: 'Dharana' };
  return (
    <View style={[styles.pillar, { backgroundColor: colors.pillar[pillar] + '44', borderColor: colors.pillar[pillar] }]}>
      <Text style={[styles.pillarText, { color: colors.pillar[pillar] }]}>{labels[pillar]}</Text>
    </View>
  );
}

export function ProgressBar({
  progress,
  color = colors.saffronLight,
}: {
  progress: number;
  color?: string;
}) {
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View style={styles.barTrack}>
      <LinearGradient
        colors={[color, colors.gold]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.barFill, { width: `${p * 100}%` }]}
      />
    </View>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <GlowBackground>
      <View style={styles.loading}>
        <ActivityIndicator color={colors.saffronLight} size="large" />
        <Caption style={{ marginTop: spacing.sm, color: colors.goldBright }}>{label}</Caption>
      </View>
    </GlowBackground>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionAccent} />
        <Subtitle style={{ color: colors.goldBright }}>{title}</Subtitle>
      </View>
      {action}
    </View>
  );
}

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
            <LinearGradient
              colors={[colors.chart[i % colors.chart.length], colors.gold]}
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
  orbTop: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.violet,
    opacity: Platform.OS === 'web' ? 0.22 : 0.18,
  },
  orbMid: {
    position: 'absolute',
    top: '35%',
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.magenta,
    opacity: 0.12,
  },
  orbBottom: {
    position: 'absolute',
    bottom: 40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.saffron,
    opacity: Platform.OS === 'web' ? 0.16 : 0.12,
  },
  cardWrap: {
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border + 'cc',
  },
  cardInner: {
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  cardGlowBorder: {
    borderWidth: 1,
    borderColor: colors.saffronLight + '66',
  },
  heroCard: {
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    padding: 2,
  },
  heroInner: {
    backgroundColor: 'rgba(11,6,24,0.55)',
    borderRadius: radius.lg - 2,
    padding: spacing.md,
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
  btnOuter: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  btn: {
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    backgroundColor: colors.bgMuted,
    borderWidth: 1.5,
    borderColor: colors.violetSoft + '88',
  },
  btnGhost: {
    backgroundColor: 'transparent',
  },
  btnLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1.5,
    borderColor: colors.borderLight + '66',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  chip: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1.5,
    padding: spacing.sm,
    alignItems: 'center',
    minWidth: 80,
    overflow: 'hidden',
  },
  chipValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '600',
  },
  pillar: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  pillarText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  barTrack: {
    height: 10,
    backgroundColor: colors.bgMuted,
    borderRadius: radius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: colors.saffronLight,
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
    borderRadius: 6,
    minHeight: 4,
  },
  chartLabel: {
    marginTop: 4,
    fontSize: 10,
    color: colors.violetSoft,
  },
});
