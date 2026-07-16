import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Body,
  Button,
  Caption,
  Card,
  GlowBackground,
  PillarBadge,
  SectionHeader,
  Title,
} from '../../src/components/ui';
import { AgeBandPicker, AgeBandSummaryCard } from '../../src/components/AgeBandPicker';
import { useApp } from '../../src/context/AppContext';
import {
  ageBandCopy,
  getAgeBand,
  getDrill,
  listDrills,
  updateUserSettings,
  type AgeBandId,
} from '../../src/modules';
import { colors, radius, spacing } from '../../src/theme';

export default function PracticeCatalogScreen() {
  const router = useRouter();
  const { user, setUser } = useApp();
  const [filter, setFilter] = useState<'all' | 'smriti' | 'sahitya' | 'dharana'>('all');
  const [showPicker, setShowPicker] = useState(false);

  const bandId = (user?.settings.ageBandId ?? 'adult') as AgeBandId;
  const band = getAgeBand(bandId);
  const copy = ageBandCopy(band);

  const allEnabled = useMemo(() => listDrills({ enabledOnly: true }), []);
  const drills = useMemo(
    () => allEnabled.filter((d) => band.drillIds.includes(d.meta.id)),
    [allEnabled, band.drillIds],
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return drills;
    return drills.filter((d) => d.meta.pillar === filter);
  }, [drills, filter]);

  const byPillar = useMemo(
    () => ({
      smriti: drills.filter((d) => d.meta.pillar === 'smriti'),
      sahitya: drills.filter((d) => d.meta.pillar === 'sahitya'),
      dharana: drills.filter((d) => d.meta.pillar === 'dharana'),
    }),
    [drills],
  );

  const setBand = async (id: AgeBandId) => {
    if (!user) return;
    const settings = await updateUserSettings(user.id, { ageBandId: id });
    setUser({ ...user, settings });
    setShowPicker(false);
  };

  return (
    <GlowBackground>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Title>Practice</Title>
      <Body style={{ marginBottom: spacing.md, color: colors.violetSoft }}>
        {copy.practiceTitle}. {copy.sessionHint}.
      </Body>

      <SectionHeader title="Age-wise path" />
      <AgeBandSummaryCard bandId={bandId} onPressChange={() => setShowPicker((v) => !v)} />
      {showPicker && (
        <View style={{ marginTop: spacing.sm }}>
          <AgeBandPicker value={bandId} onChange={(id) => void setBand(id)} />
        </View>
      )}

      <Card style={{ marginTop: spacing.md }}>
        <Body style={{ color: colors.text }}>{band.description}</Body>
        <Caption style={{ marginTop: spacing.sm }}>
          Difficulty capped at level {band.maxDifficultyLevel === 99 ? 'open' : band.maxDifficultyLevel}
          {band.enableHeckler ? ' · heckler on' : ' · no heckler'}
          {band.enableBell ? ' · bells ok' : ' · no background bells'}
        </Caption>
      </Card>

      <SectionHeader title={band.kidFriendly ? 'Play sessions' : 'Avadhana sessions'} />
      <Card>
        {band.sessionPresets.map((p, i) => (
          <Button
            key={p.id}
            label={p.label}
            variant={i === 0 ? 'primary' : 'secondary'}
            onPress={() => {
              if (p.drillIds.length === 1) {
                router.push(`/practice/${p.drillIds[0]}`);
                return;
              }
              router.push({
                pathname: '/practice/session',
                params: {
                  drills: p.drillIds.join(','),
                  bell: band.enableBell ? '1' : '0',
                  heckler: p.heckler && band.enableHeckler ? '1' : '0',
                },
              });
            }}
            style={{ marginBottom: spacing.sm }}
          />
        ))}
        {band.maxStreams >= 2 && (
          <Button
            label="Custom session builder"
            variant="ghost"
            onPress={() => router.push('/practice/builder')}
          />
        )}
      </Card>

      <SectionHeader title={band.kidFriendly ? 'Start here' : 'Recommended'} />
      <View style={styles.starterRow}>
        {band.starterDrillIds.map((id) => {
          const d = getDrill(id);
          if (!d) return null;
          return (
            <Pressable
              key={id}
              style={styles.starter}
              onPress={() => router.push(`/practice/${id}`)}
            >
              <Text style={{ fontSize: 22 }}>{d.meta.icon}</Text>
              <Caption style={{ color: colors.text, textAlign: 'center', marginTop: 4 }}>
                {d.meta.shortName}
              </Caption>
            </Pressable>
          );
        })}
      </View>

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
        (['smriti', 'sahitya', 'dharana'] as const).map((pillar) =>
          byPillar[pillar].length === 0 ? null : (
            <View key={pillar}>
              <SectionHeader
                title={
                  pillar === 'smriti'
                    ? `Smriti (${byPillar.smriti.length})`
                    : pillar === 'sahitya'
                      ? `Sahitya (${byPillar.sahitya.length})`
                      : `Dharana (${byPillar.dharana.length})`
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
          ),
        )
      ) : (
        <>
          <SectionHeader title={`${filter} drills`} />
          {filtered.length === 0 ? (
            <Card>
              <Body>{copy.emptyCatalog}</Body>
            </Card>
          ) : (
            filtered.map((drill) => (
              <DrillCard
                key={drill.meta.id}
                drill={drill}
                onPress={() => router.push(`/practice/${drill.meta.id}`)}
              />
            ))
          )}
        </>
      )}
    </ScrollView>
    </GlowBackground>
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
            {drill.difficultyLadder.length} levels
            {drill.meta.parallelSafe ? ' · parallel-safe' : ' · solo-first'}
          </Caption>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: spacing.md },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  filterOn: { borderColor: colors.magenta, backgroundColor: colors.magenta + '33' },
  row: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  icon: { fontSize: 28 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: 4,
  },
  drillName: { color: colors.text, fontWeight: '800', flex: 1 },
  starterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  starter: {
    width: 88,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.gold + '66',
    backgroundColor: colors.bgCard,
    alignItems: 'center',
  },
});
