/**
 * Horizontal age-path picker — used on Home, Practice, Settings.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  getAgeBands,
  type AgeBandId,
} from '../modules';
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
        <Caption style={{ marginBottom: spacing.sm }}>
          Age-wise practice path — a 7-year-old and a 40-year-old train differently
        </Caption>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {bands.map((b) => {
          const on = b.id === value;
          return (
            <Pressable
              key={b.id}
              onPress={() => onChange(b.id)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={styles.icon}>{b.icon}</Text>
              <Text style={[styles.label, on && styles.labelOn]}>{b.label}</Text>
              <Text style={[styles.range, on && styles.rangeOn]}>{b.ageRange}</Text>
              {!compact && (
                <Text style={[styles.ex, on && styles.rangeOn]}>e.g. {b.exampleAge}</Text>
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
    <Pressable onPress={onPressChange} style={styles.summary}>
      <Text style={styles.summaryIcon}>{band.icon}</Text>
      <View style={{ flex: 1 }}>
        <Body style={{ color: colors.text, fontWeight: '700' }}>
          {band.title} · {band.ageRange}
        </Body>
        <Caption style={{ marginTop: 4 }}>{band.focus}</Caption>
        <Caption style={{ marginTop: 2 }}>
          ~{band.sessionMinutes} min · max {band.maxStreams} stream
          {band.maxStreams > 1 ? 's' : ''} · {band.drillIds.length} drills
        </Caption>
      </View>
      {onPressChange ? <Caption style={{ color: colors.saffronLight }}>Change</Caption> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    width: 108,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
  },
  chipOn: {
    borderColor: colors.saffron,
    backgroundColor: colors.saffron + '33',
  },
  icon: { fontSize: 22, marginBottom: 4 },
  label: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  labelOn: { color: colors.text },
  range: { color: colors.textMuted, fontSize: 10, marginTop: 2, textAlign: 'center' },
  rangeOn: { color: colors.gold },
  ex: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  summaryIcon: { fontSize: 28 },
});
