/**
 * Horizontal age-path picker — used on Home, Practice, Settings.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getAgeBands, type AgeBandId } from '../modules';
import { colors, radius, spacing } from '../theme';
import { Body, Caption } from './ui';

export function AgeBandPicker({
  value,
  onChange,
  compact = false,
}: {
  value: AgeBandId;
  onChange: (id: AgeBandId) => void;
  compact?: boolean;
}) {
  const bands = getAgeBands();

  return (
    <View>
      {!compact && (
        <Caption style={{ marginBottom: spacing.sm, color: colors.violetSoft }}>
          Age-wise path — light it up for age 7 or go deep at 40
        </Caption>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {bands.map((b) => {
          const on = b.id === value;
          return (
            <Pressable key={b.id} onPress={() => onChange(b.id)} style={styles.chipWrap}>
              {on ? (
                <LinearGradient
                  colors={[...colors.gradients.aurora]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.chip}
                >
                  <Text style={styles.icon}>{b.icon}</Text>
                  <Text style={[styles.label, styles.labelOn]}>{b.label}</Text>
                  <Text style={[styles.range, styles.rangeOn]}>{b.ageRange}</Text>
                  {!compact && (
                    <Text style={[styles.ex, styles.rangeOn]}>e.g. {b.exampleAge}</Text>
                  )}
                </LinearGradient>
              ) : (
                <View style={[styles.chip, styles.chipOff]}>
                  <Text style={styles.icon}>{b.icon}</Text>
                  <Text style={styles.label}>{b.label}</Text>
                  <Text style={styles.range}>{b.ageRange}</Text>
                  {!compact && <Text style={styles.ex}>e.g. {b.exampleAge}</Text>}
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function AgeBandSummaryCard({
  bandId,
  onPressChange,
}: {
  bandId: AgeBandId;
  onPressChange?: () => void;
}) {
  const band = getAgeBands().find((b) => b.id === bandId)!;
  return (
    <Pressable onPress={onPressChange} style={styles.summaryWrap}>
      <LinearGradient
        colors={['#3b1d6e', '#1f1245']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.summary}
      >
        <View style={styles.summaryIconWrap}>
          <Text style={styles.summaryIcon}>{band.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Body style={{ color: colors.text, fontWeight: '800' }}>
            {band.title} · {band.ageRange}
          </Body>
          <Caption style={{ marginTop: 4, color: colors.goldBright }}>{band.focus}</Caption>
          <Caption style={{ marginTop: 2, color: colors.violetSoft }}>
            ~{band.sessionMinutes} min · max {band.maxStreams} stream
            {band.maxStreams > 1 ? 's' : ''} · {band.drillIds.length} drills
          </Caption>
        </View>
        {onPressChange ? (
          <Caption style={{ color: colors.saffronLight, fontWeight: '800' }}>Change</Caption>
        ) : null}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10, paddingVertical: 4 },
  chipWrap: { borderRadius: radius.md, overflow: 'hidden' },
  chip: {
    width: 112,
    padding: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
    minHeight: 96,
    justifyContent: 'center',
  },
  chipOff: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  icon: { fontSize: 26, marginBottom: 4 },
  label: { color: colors.textSecondary, fontWeight: '800', fontSize: 13 },
  labelOn: { color: '#1a0500' },
  range: { color: colors.textMuted, fontSize: 10, marginTop: 2, textAlign: 'center', fontWeight: '600' },
  rangeOn: { color: '#2a1000', fontWeight: '700' },
  ex: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  summaryWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.violet + '88',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  summaryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.saffron + '33',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gold + '66',
  },
  summaryIcon: { fontSize: 26 },
});
