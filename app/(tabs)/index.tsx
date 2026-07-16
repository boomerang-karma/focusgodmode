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
import { AgeBandPicker, AgeBandSummaryCard } from '../../src/components/AgeBandPicker';
import { useApp } from '../../src/context/AppContext';
import {
  getAgeBand,
  getDashboardStats,
  getDrill,
  getRegistrySize,
  listDrills,
  RANK_LABELS,
  rankProgress,
  srsStats,
  updateUserSettings,
  type AgeBandId,
} from '../../src/modules';
import { colors, spacing } from '../../src/theme';

export default function HomeScreen() {
  const { ready, user, error, setUser } = useApp();
  const router = useRouter();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null);
  const [dueVerses, setDueVerses] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showAgePicker, setShowAgePicker] = useState(false);

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

  const bandId = (user.settings.ageBandId ?? 'adult') as AgeBandId;
  const band = getAgeBand(bandId);
  const rankInfo = rankProgress(stats.maxParallelism);
  const ageDrills = listDrills({ enabledOnly: true }).filter((d) =>
    band.drillIds.includes(d.meta.id),
  );

  const setBand = async (id: AgeBandId) => {
    const settings = await updateUserSettings(user.id, { ageBandId: id });
    setUser({ ...user, settings });
    setShowAgePicker(false);
  };

  const primaryPreset = band.sessionPresets[0];

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
      <Caption style={styles.kicker}>Avadhan Vidya · Age-wise practice</Caption>
      <Title style={styles.greet}>Namaste, {user.displayName}</Title>
      <Body style={{ marginBottom: spacing.md }}>
        {band.icon} {band.title} · {ageDrills.length} drills for {band.ageRange.toLowerCase()}
      </Body>

      <SectionHeader title="Who is practicing?" />
      <AgeBandSummaryCard bandId={bandId} onPressChange={() => setShowAgePicker((v) => !v)} />
      {showAgePicker && (
        <View style={{ marginTop: spacing.sm, marginBottom: spacing.sm }}>
          <AgeBandPicker value={bandId} onChange={(id) => void setBand(id)} />
          <Caption style={{ marginTop: spacing.sm }}>
            Example: age 7 → Child path · age 40 → Adult (householder) path
          </Caption>
        </View>
      )}

      <Card style={{ marginTop: spacing.sm }}>
        <Caption>Progression</Caption>
        <Text style={styles.rank}>{RANK_LABELS[rankInfo.rank]}</Text>
        <ProgressBar progress={Math.min(1, (stats.maxParallelism || 0.25) / 8)} />
        <Caption style={{ marginTop: spacing.sm }}>
          Parallelism: {stats.maxParallelism}
          {rankInfo.nextStreams != null ? ` · next: ${rankInfo.nextStreams} streams` : ''}
          {' · '}
          path max {band.maxStreams} stream{band.maxStreams > 1 ? 's' : ''}
        </Caption>
      </Card>

      <View style={styles.statsRow}>
        <StatChip label="Day streak" value={stats.streak} accent={colors.saffron} />
        <StatChip label="Sessions" value={stats.totalSessions} accent={colors.gold} />
        <StatChip label="Minutes" value={Math.round(stats.totalMinutes)} accent={colors.info} />
      </View>

      <SectionHeader title={band.kidFriendly ? "Today's play" : "Today's sadhana"} />
      <Card>
        <Body style={{ marginBottom: spacing.sm, color: colors.text }}>{band.description}</Body>
        <Caption style={{ marginBottom: spacing.md }}>
          Suggested ~{band.sessionMinutes} minutes · {band.focus}
        </Caption>
        {primaryPreset && (
          <Button
            label={primaryPreset.label}
            onPress={() => {
              if (primaryPreset.drillIds.length === 1) {
                router.push(`/practice/${primaryPreset.drillIds[0]}`);
                return;
              }
              router.push({
                pathname: '/practice/session',
                params: {
                  drills: primaryPreset.drillIds.join(','),
                  bell: band.enableBell ? '1' : '0',
                  heckler: primaryPreset.heckler && band.enableHeckler ? '1' : '0',
                },
              });
            }}
          />
        )}
        <Button
          label="Open age-wise catalog"
          variant="secondary"
          onPress={() => router.push('/(tabs)/practice')}
          style={{ marginTop: spacing.sm }}
        />
        {!band.kidFriendly && (
          <Button
            label={dueVerses > 0 ? `Review ${dueVerses} verses` : 'Verse SRS'}
            variant="secondary"
            onPress={() => router.push('/(tabs)/srs')}
            style={{ marginTop: spacing.sm }}
          />
        )}
      </Card>

      <SectionHeader title={band.kidFriendly ? 'Quick games' : 'Quick start'} />
      {band.starterDrillIds.map((id) => {
        const d = getDrill(id);
        if (!d) return null;
        return (
          <Card key={id} onPress={() => router.push(`/practice/${id}`)}>
            <Body style={{ color: colors.text, fontWeight: '700' }}>
              {d.meta.icon} {d.meta.name}
            </Body>
            <Caption numberOfLines={2}>{d.meta.description}</Caption>
          </Card>
        );
      })}

      <SectionHeader title="Compare paths" />
      <Card>
        <Body style={{ color: colors.text, fontWeight: '700' }}>🌱 Age ~7 (Child)</Body>
        <Caption style={{ marginTop: 4 }}>
          Short games, max 1 stream, no heckler, difficulty capped low — confidence first.
        </Caption>
        <Body style={{ color: colors.text, fontWeight: '700', marginTop: spacing.md }}>
          🪔 Age ~40 (Adult)
        </Body>
        <Caption style={{ marginTop: 4 }}>
          Full catalog, up to 4 streams, optional heckler, sustainable depth over heroics.
        </Caption>
        <Button
          label="Switch path above ↑"
          variant="ghost"
          onPress={() => setShowAgePicker(true)}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <SectionHeader title="Recent sessions" />
      {stats.recentSessions.length === 0 ? (
        <Card>
          <Body>
            {band.kidFriendly
              ? 'No games yet. Tap a quick game above!'
              : 'No sessions yet. Your event log awaits the first prompt.'}
          </Body>
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
        Engine: {getRegistrySize()} plugins · path: {band.label}
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
