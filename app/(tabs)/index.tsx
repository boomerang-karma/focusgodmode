import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Body,
  Button,
  Caption,
  Card,
  Loading,
  ProgressBar,
  SectionHeader,
  StatChip,
  Title,
} from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import {
  getDashboardStats,
  getRegistrySize,
  listDrills,
  RANK_LABELS,
  rankProgress,
  srsStats,
} from '../../src/modules';
import { colors, spacing } from '../../src/theme';

export default function HomeScreen() {
  const { ready, user, error } = useApp();
  const router = useRouter();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null);
  const [dueVerses, setDueVerses] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [s, vs] = await Promise.all([getDashboardStats(user.id), srsStats(user.id)]);
    setStats(s);
    setDueVerses(vs.due);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (error) {
    return (
      <View style={styles.center}>
        <Body>Failed to start: {error}</Body>
      </View>
    );
  }

  if (!ready || !user || !stats) {
    return <Loading label="Preparing sadhana…" />;
  }

  const rankInfo = rankProgress(stats.maxParallelism);
  const drillCount = listDrills({ enabledOnly: true }).length;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.saffron}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
    >
      <Caption style={styles.kicker}>Avadhan Vidya · Full practice suite</Caption>
      <Title style={styles.greet}>Namaste, {user.displayName}</Title>
      <Body style={{ marginBottom: spacing.md }}>
        {drillCount} drills registered · hold many streams · measure everything.
      </Body>

      <Card>
        <Caption>Progression</Caption>
        <Text style={styles.rank}>{RANK_LABELS[rankInfo.rank]}</Text>
        <ProgressBar progress={Math.min(1, (stats.maxParallelism || 0.25) / 8)} />
        <Caption style={{ marginTop: spacing.sm }}>
          Parallelism index: {stats.maxParallelism}
          {rankInfo.nextStreams != null
            ? ` · next: ${rankInfo.nextStreams} streams`
            : ' · top track'}
        </Caption>
      </Card>

      <View style={styles.statsRow}>
        <StatChip label="Day streak" value={stats.streak} accent={colors.saffron} />
        <StatChip label="Sessions" value={stats.totalSessions} accent={colors.gold} />
        <StatChip label="Minutes" value={Math.round(stats.totalMinutes)} accent={colors.info} />
      </View>

      <SectionHeader title="Today's sadhana" />
      <Card>
        <Body style={{ marginBottom: spacing.md, color: colors.text }}>
          Ten focused minutes. Solo drills build baseline; Avadhana sessions build the skill.
        </Body>
        <Button label="Practice catalog" onPress={() => router.push('/(tabs)/practice')} />
        <Button
          label="Dvi-avadhani (2 streams)"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: '/practice/session',
              params: { drills: 'vyasta_recall,digit_span', bell: '1', heckler: '0' },
            })
          }
          style={{ marginTop: spacing.sm }}
        />
        <Button
          label={dueVerses > 0 ? `Review ${dueVerses} verses` : 'Verse SRS'}
          variant="secondary"
          onPress={() => router.push('/(tabs)/srs')}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <SectionHeader title="Recent sessions" />
      {stats.recentSessions.length === 0 ? (
        <Card>
          <Body>No sessions yet. Your event log awaits the first prompt.</Body>
        </Card>
      ) : (
        stats.recentSessions.slice(0, 5).map((s) => (
          <Card key={s.sessionId}>
            <View style={styles.rowBetween}>
              <Body style={{ color: colors.text, fontWeight: '600', flex: 1 }}>
                {s.mode === 'avadhana' ? 'Avadhana' : 'Solo'} ·{' '}
                {s.drillIds.map((d) => d.replace(/_/g, ' ')).join(', ')}
              </Body>
              <Caption>{Math.round(s.overallAccuracy * 100)}%</Caption>
            </View>
            <Caption>
              {new Date(s.startedAt).toLocaleString()} · {Math.round(s.durationMs / 60000)} min ·
              PI {s.parallelismIndex}
            </Caption>
          </Card>
        ))
      )}

      <Caption style={{ marginTop: spacing.lg, textAlign: 'center' }}>
        Engine: {getRegistrySize()} drill plugins · modular architecture
      </Caption>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  kicker: {
    color: colors.saffronLight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 4,
  },
  greet: { marginBottom: spacing.xs },
  rank: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: '700',
    marginVertical: spacing.sm,
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
});
