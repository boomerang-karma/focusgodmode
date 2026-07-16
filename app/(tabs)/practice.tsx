import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Body,
  Button,
  Caption,
  Card,
  PillarBadge,
  SectionHeader,
  Title,
} from '../../src/components/ui';
import { listDrills } from '../../src/modules';
import { colors, radius, spacing } from '../../src/theme';

const PRESETS = [
  {
    id: 'dvi',
    label: 'Dvi-avadhani (2)',
    drills: 'vyasta_recall,digit_span',
    heckler: false,
  },
  {
    id: 'chatur',
    label: 'Chatur-avadhani (4)',
    drills: 'vyasta_recall,digit_span,task_switch,arithmetic_load',
    heckler: true,
  },
  {
    id: 'ashta',
    label: 'Ashta track (6 streams)',
    drills:
      'vyasta_recall,digit_span,verse_recall,task_switch,arithmetic_load,puranapathana',
    heckler: true,
  },
];

export default function PracticeCatalogScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'smriti' | 'sahitya' | 'dharana'>('all');
  const drills = useMemo(() => listDrills({ enabledOnly: true }), []);

  const filtered = useMemo(() => {
    if (filter === 'all') return drills;
    return drills.filter((d) => d.meta.pillar === filter);
  }, [drills, filter]);

  const byPillar = useMemo(() => {
    return {
      smriti: drills.filter((d) => d.meta.pillar === 'smriti'),
      sahitya: drills.filter((d) => d.meta.pillar === 'sahitya'),
      dharana: drills.filter((d) => d.meta.pillar === 'dharana'),
    };
  }, [drills]);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Title>Practice</Title>
      <Body style={{ marginBottom: spacing.md }}>
        {drills.length} drills across three pillars. Each is a plugin — enhance module by module.
      </Body>

      <Card>
        <Text style={styles.sessionTitle}>🪔 Avadhana Session</Text>
        <Body style={{ marginBottom: spacing.sm, color: colors.textSecondary }}>
          Multi-stream practice with background bells, deferred recall, optional heckler.
        </Body>
        {PRESETS.map((p) => (
          <Button
            key={p.id}
            label={p.label}
            variant={p.id === 'dvi' ? 'primary' : 'secondary'}
            onPress={() =>
              router.push({
                pathname: '/practice/session',
                params: {
                  drills: p.drills,
                  bell: '1',
                  heckler: p.heckler ? '1' : '0',
                },
              })
            }
            style={{ marginBottom: spacing.sm }}
          />
        ))}
        <Button
          label="Custom session builder"
          variant="ghost"
          onPress={() => router.push('/practice/builder')}
        />
      </Card>

      <View style={styles.filters}>
        {(['all', 'smriti', 'sahitya', 'dharana'] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterOn]}
          >
            <Caption style={{ color: colors.text, textTransform: 'capitalize' }}>{f}</Caption>
          </Pressable>
        ))}
      </View>

      {filter === 'all' ? (
        (['smriti', 'sahitya', 'dharana'] as const).map((pillar) => (
          <View key={pillar}>
            <SectionHeader
              title={
                pillar === 'smriti'
                  ? `Smriti — memory (${byPillar.smriti.length})`
                  : pillar === 'sahitya'
                    ? `Sahitya — literary (${byPillar.sahitya.length})`
                    : `Dharana — attention (${byPillar.dharana.length})`
              }
            />
            {byPillar[pillar].map((drill) => (
              <DrillCard
                key={drill.meta.id}
                drill={drill}
                onPress={() => router.push(`/practice/${drill.meta.id}`)}
              />
            ))}
          </View>
        ))
      ) : (
        <>
          <SectionHeader title={`${filter} drills`} />
          {filtered.map((drill) => (
            <DrillCard
              key={drill.meta.id}
              drill={drill}
              onPress={() => router.push(`/practice/${drill.meta.id}`)}
            />
          ))}
        </>
      )}
    </ScrollView>
  );
}

function DrillCard({
  drill,
  onPress,
}: {
  drill: ReturnType<typeof listDrills>[0];
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <Text style={styles.icon}>{drill.meta.icon}</Text>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Body style={styles.drillName}>{drill.meta.name}</Body>
            <PillarBadge pillar={drill.meta.pillar} />
          </View>
          <Caption numberOfLines={2}>{drill.meta.description}</Caption>
          <Caption style={{ marginTop: 4 }}>
            Phase {drill.meta.phase} · {drill.difficultyLadder.length} levels
            {drill.meta.parallelSafe ? ' · parallel-safe' : ' · solo-first'}
          </Caption>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  sessionTitle: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: spacing.md },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  filterOn: { borderColor: colors.saffron, backgroundColor: colors.saffron + '33' },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  icon: { fontSize: 28 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: 4,
  },
  drillName: { color: colors.text, fontWeight: '700', flex: 1 },
});
