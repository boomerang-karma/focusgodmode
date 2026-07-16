import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Body, Button, Caption, Card, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import {
  getAgeBand,
  listDrills,
  type AgeBandId,
} from '../../src/modules';
import { colors, radius, spacing } from '../../src/theme';

export default function SessionBuilderScreen() {
  const router = useRouter();
  const { user } = useApp();
  const band = getAgeBand((user?.settings.ageBandId ?? 'adult') as AgeBandId);
  const maxStreams = Math.max(2, band.maxStreams);

  const parallelDrills = useMemo(
    () =>
      listDrills({ enabledOnly: true, parallelSafeOnly: true }).filter((d) =>
        band.drillIds.includes(d.meta.id),
      ),
    [band.drillIds],
  );

  const defaultPick = band.sessionPresets.find((p) => p.drillIds.length >= 2)?.drillIds ?? [
    'vyasta_recall',
    'digit_span',
  ];
  const [selected, setSelected] = useState<string[]>(
    defaultPick.filter((id) => band.drillIds.includes(id)).slice(0, maxStreams),
  );
  const [bell, setBell] = useState(band.enableBell);
  const [heckler, setHeckler] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= maxStreams) return prev;
      return [...prev, id];
    });
  };

  const start = () => {
    if (selected.length < 2) return;
    router.push({
      pathname: '/practice/session',
      params: {
        drills: selected.join(','),
        bell: bell && band.enableBell ? '1' : '0',
        heckler: heckler && band.enableHeckler ? '1' : '0',
      },
    });
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Title>Session builder</Title>
      <Body style={{ marginBottom: spacing.md }}>
        {band.icon} {band.title} · pick 2–{maxStreams} streams for {band.ageRange.toLowerCase()}.
      </Body>

      <Card>
        <Caption>
          Selected: {selected.length} / {maxStreams}
        </Caption>
        <Text style={styles.selected}>
          {selected.map((s) => s.replace(/_/g, ' ')).join(' · ') || '—'}
        </Text>
        {band.enableBell && (
          <View style={styles.row}>
            <Body style={{ color: colors.text, flex: 1 }}>Background bells</Body>
            <Switch value={bell} onValueChange={setBell} trackColor={{ true: colors.saffron }} />
          </View>
        )}
        {band.enableHeckler && (
          <View style={styles.row}>
            <Body style={{ color: colors.text, flex: 1 }}>Heckler interruptions</Body>
            <Switch
              value={heckler}
              onValueChange={setHeckler}
              trackColor={{ true: colors.saffron }}
            />
          </View>
        )}
        {!band.enableHeckler && (
          <Caption style={{ marginTop: spacing.xs }}>Heckler off for this age path.</Caption>
        )}
      </Card>

      {parallelDrills.map((d) => {
        const on = selected.includes(d.meta.id);
        return (
          <Pressable
            key={d.meta.id}
            onPress={() => toggle(d.meta.id)}
            style={[styles.item, on && styles.itemOn]}
          >
            <Text style={styles.icon}>{d.meta.icon}</Text>
            <View style={{ flex: 1 }}>
              <Body style={{ color: colors.text, fontWeight: '700' }}>{d.meta.name}</Body>
              <Caption numberOfLines={1}>{d.meta.description}</Caption>
            </View>
            <Text style={{ color: on ? colors.success : colors.textMuted }}>{on ? '✓' : '+'}</Text>
          </Pressable>
        );
      })}

      <Button
        label={`Start ${selected.length}-stream session`}
        onPress={start}
        disabled={selected.length < 2}
        style={{ marginTop: spacing.md }}
      />
      <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  selected: { color: colors.gold, fontWeight: '600', marginVertical: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    marginBottom: spacing.sm,
  },
  itemOn: { borderColor: colors.saffron, backgroundColor: colors.saffron + '22' },
  icon: { fontSize: 22 },
});
