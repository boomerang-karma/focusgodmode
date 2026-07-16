import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DrillRunner } from '../../src/components/DrillRunner';
import { Body, Button, Caption, Card, Loading, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import {
  appendEvent,
  getDrill,
  getDrillProgress,
  requireDrill,
  saveSessionSummary,
  sessionOrchestrator,
  type SessionSummary,
} from '../../src/modules';
import { colors, spacing } from '../../src/theme';

export default function SoloDrillScreen() {
  const { drillId } = useLocalSearchParams<{ drillId: string }>();
  const { user } = useApp();
  const router = useRouter();
  const [phase, setPhase] = useState<'intro' | 'run' | 'error'>('intro');
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);

  const drill = drillId ? getDrill(drillId) : undefined;

  useEffect(() => {
    if (!user || !drillId) return;
    void getDrillProgress(user.id).then((p) => {
      setLevel(p[drillId]?.difficultyLevel ?? 0);
    });
  }, [user, drillId]);

  if (!drillId || !drill) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.md, justifyContent: 'center' }}>
        <Title>Unknown drill</Title>
        <Body>{drillId}</Body>
        <Button label="Back" onPress={() => router.back()} style={{ marginTop: spacing.md }} />
      </View>
    );
  }

  const start = async () => {
    if (!user) return;
    try {
      const d = requireDrill(drillId);
      const difficulty = d.difficultyLadder[Math.min(level, d.difficultyLadder.length - 1)];
      await sessionOrchestrator.start(
        user.id,
        {
          mode: 'solo',
          drillIds: [drillId],
          streamCount: 1,
          enableBell: drillId === 'ghanta_ganana',
          enableHeckler: false,
        },
        { [drillId]: difficulty },
      );

      // Persist events as they arrive
      sessionOrchestrator.getState()?.eventLog.onEvent((ev) => {
        void appendEvent(ev);
      });

      setPhase('run');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase('error');
    }
  };

  const onComplete = async (summary: SessionSummary) => {
    if (!user) return;
    const state = sessionOrchestrator.getState();
    // Prefer orchestrator lastSummary (canonical) after finish()
    const final = state?.lastSummary ?? summary;
    await saveSessionSummary(user.id, final, state?.journal, 'completed');
    router.replace({
      pathname: '/practice/result',
      params: {
        sessionId: final.sessionId,
        accuracy: String(final.overallAccuracy),
        parallelism: String(final.parallelismIndex),
        duration: String(final.durationMs),
        drills: final.drillIds.join(','),
        deferred: String(final.deferredRecallAccuracy ?? ''),
        bells:
          final.trueBellCount != null
            ? `${final.reportedBellCount}/${final.trueBellCount}`
            : '',
      },
    });
  };

  if (phase === 'run') {
    return (
      <DrillRunner
        onComplete={(s) => void onComplete(s)}
        onAbort={() => router.back()}
      />
    );
  }

  if (phase === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.md }}>
        <Title>Could not start</Title>
        <Body>{error}</Body>
        <Button label="Back" onPress={() => router.back()} />
      </View>
    );
  }

  if (!user) return <Loading />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.md }}>
      <Title>
        {drill.meta.icon} {drill.meta.name}
      </Title>
      <Caption style={{ marginVertical: spacing.sm }}>
        {drill.meta.pillar.toUpperCase()} · Level {level} · {drill.difficultyLadder[level]?.label}
      </Caption>
      <Card>
        <Body style={{ color: colors.text }}>{drill.meta.description}</Body>
      </Card>
      <Button label="Begin" onPress={() => void start()} style={{ marginTop: spacing.md }} />
      <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
    </View>
  );
}
