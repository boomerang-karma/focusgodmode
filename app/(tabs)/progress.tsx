import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  Body,
  Caption,
  Card,
  Loading,
  MiniBarChart,
  SectionHeader,
  StatChip,
  Title,
} from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import {
  getDashboardStats,
  listDrills,
  RANK_LABELS,
  rankFromParallelism,
  summarizeWeek,
} from '../../src/modules';
import { colors, spacing } from '../../src/theme';
import { format, parseISO } from 'date-fns';

export default function ProgressScreen() {
  const { user, ready } = useApp();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setStats(await getDashboardStats(user.id));
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!ready || !user || !stats) return <Loading />;

  const week = summarizeWeek(stats.recentSessions);
  const drills = listDrills({ enabledOnly: true });
  const chartData = week.byDay.map((d) => ({
    label: format(parseISO(d.date), 'EEE').slice(0, 1),
    value: d.minutes,
  }));

  const avadhanaSessions = stats.recentSessions.filter((s) => s.mode === 'avadhana');
  const avgInterference =
    avadhanaSessions.reduce((a, s) => a + (s.interferenceCost ?? 0), 0) /
    Math.max(1, avadhanaSessions.filter((s) => s.interferenceCost != null).length || 1);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={false} tintColor={colors.saffron} onRefresh={() => void load()} />
      }
    >
      <Title>Progress</Title>
      <Body style={{ marginBottom: spacing.md }}>
        Parallelism index is the headline — concurrent streams at ≥90% accuracy.
      </Body>

      <View style={styles.statsRow}>
        <StatChip label="Parallelism" value={stats.maxParallelism} accent={colors.saffron} />
        <StatChip
          label="Rank"
          value={RANK_LABELS[rankFromParallelism(stats.maxParallelism)].split(' ')[0]}
          accent={colors.gold}
        />
        <StatChip label="Streak" value={stats.streak} accent={colors.success} />
      </View>

      <SectionHeader title="This week (minutes)" />
      <Card>
        <MiniBarChart data={chartData} />
        <Caption style={{ marginTop: spacing.sm, textAlign: 'center' }}>
          {Math.round(week.totalMinutes)} min · {week.sessions} sessions · avg{' '}
          {Math.round(week.avgAccuracy * 100)}%
        </Caption>
      </Card>

      <SectionHeader title="Interference cost" />
      <Card>
        <Body style={{ color: colors.text }}>
          Avg drop under parallel load:{' '}
          {avadhanaSessions.some((s) => s.interferenceCost != null)
            ? `${Math.round(avgInterference * 100)}%`
            : '—'}
        </Body>
        <Caption style={{ marginTop: spacing.sm }}>
          Solo accuracy − parallel accuracy for the same drills. Lower is better avadhana skill.
          Complete solo drills first, then multi-stream sessions to measure this.
        </Caption>
      </Card>

      <SectionHeader title={`Per-drill (${drills.length})`} />
      {drills.map((d) => {
        const p = stats.drillProgress[d.meta.id];
        return (
          <Card key={d.meta.id}>
            <View style={styles.rowBetween}>
              <Body style={{ color: colors.text, fontWeight: '700', flex: 1 }}>
                {d.meta.icon} {d.meta.name}
              </Body>
              <Caption>L{p?.difficultyLevel ?? 0}</Caption>
            </View>
            <Caption>
              {p
                ? `${p.totalRounds} rounds · best ${Math.round(p.bestAccuracy * 100)}%`
                : 'Not practiced yet'}
            </Caption>
          </Card>
        );
      })}

      <SectionHeader title="Session history" />
      {stats.recentSessions.map((s) => (
        <Card key={s.sessionId}>
          <Body style={{ color: colors.text }}>
            {new Date(s.startedAt).toLocaleDateString()} · {s.mode}
          </Body>
          <Caption>
            {s.drillIds.join(', ')} · {Math.round(s.overallAccuracy * 100)}% · PI{' '}
            {s.parallelismIndex}
            {s.interferenceCost != null
              ? ` · IC ${Math.round(s.interferenceCost * 100)}%`
              : ''}
            {s.deferredRecallAccuracy != null
              ? ` · recall ${Math.round(s.deferredRecallAccuracy * 100)}%`
              : ''}
          </Caption>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
