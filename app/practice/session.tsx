import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DrillRunner } from '../../src/components/DrillRunner';
import { Body, Button, Caption, Card, Loading, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import {
  appendEvent,
  getDrill,
  saveSessionSummary,
  sessionOrchestrator,
  type SessionSummary,
} from '../../src/modules';
import { colors, spacing } from '../../src/theme';

export default function AvadhanaSessionScreen() {
  const params = useLocalSearchParams<{
    drills?: string;
    bell?: string;
    heckler?: string;
  }>();
  const { user } = useApp();
  const router = useRouter();
  const [phase, setPhase] = useState<'intro' | 'run'>('intro');

  const drillIds = (params.drills || 'vyasta_recall,digit_span')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const enableBell = params.bell !== '0';
  const enableHeckler = params.heckler === '1';

  const start = async () => {
    if (!user) return;
    await sessionOrchestrator.start(user.id, {
      mode: 'avadhana',
      drillIds,
      streamCount: drillIds.length,
      enableBell,
      enableHeckler,
    });
    sessionOrchestrator.getState()?.eventLog.onEvent((ev) => {
      void appendEvent(ev);
    });
    setPhase('run');
  };

  const onComplete = async (summary: SessionSummary) => {
    if (!user) return;
    await saveSessionSummary(user.id, summary, undefined, 'completed');
    router.replace({
      pathname: '/practice/result',
      params: {
        sessionId: summary.sessionId,
        accuracy: String(summary.overallAccuracy),
        parallelism: String(summary.parallelismIndex),
        duration: String(summary.durationMs),
        drills: summary.drillIds.join(','),
        interference: String(summary.interferenceCost ?? ''),
        deferred: String(summary.deferredRecallAccuracy ?? ''),
        bells: summary.trueBellCount != null
          ? `${summary.reportedBellCount}/${summary.trueBellCount}`
          : '',
      },
    });
  };

  if (!user) return <Loading />;

  if (phase === 'run') {
    return (
      <DrillRunner
        onComplete={(s) => void onComplete(s)}
        onAbort={() => router.back()}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.md }}>
      <Title>🪔 Avadhana Session</Title>
      <Body style={{ marginVertical: spacing.md }}>
        Streams interleaved like live prichchhakas. After all streams: deferred recall
        {enableBell ? ', then bell count' : ''}.
      </Body>
      <Card>
        <Caption>Streams ({drillIds.length})</Caption>
        {drillIds.map((id) => {
          const d = getDrill(id);
          return (
            <Body key={id} style={{ color: colors.text, marginTop: 4 }}>
              {d?.meta.icon} {d?.meta.name ?? id}
              {!d?.meta.parallelSafe ? ' ⚠ not parallel-safe' : ''}
            </Body>
          );
        })}
        <Caption style={{ marginTop: spacing.sm }}>
          Bells: {enableBell ? 'on' : 'off'} · Heckler: {enableHeckler ? 'on' : 'off'}
        </Caption>
      </Card>
      <Button label="Begin session" onPress={() => void start()} style={{ marginTop: spacing.md }} />
      <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
    </View>
  );
}
