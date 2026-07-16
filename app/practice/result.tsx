import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Body, Button, Caption, Card, Input, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { run } from '../../src/modules/db/client';
import { colors, spacing } from '../../src/theme';

export default function ResultScreen() {
  const params = useLocalSearchParams<{
    sessionId: string;
    accuracy: string;
    parallelism: string;
    duration: string;
    drills: string;
    interference?: string;
    deferred?: string;
    bells?: string;
  }>();
  const { user } = useApp();
  const router = useRouter();
  const [journal, setJournal] = useState('');
  const [saved, setSaved] = useState(false);

  const accuracy = Math.round(parseFloat(params.accuracy || '0') * 100);
  const durationMin = Math.round(parseInt(params.duration || '0', 10) / 60000);
  const interference =
    params.interference && params.interference !== ''
      ? Math.round(parseFloat(params.interference) * 100)
      : null;
  const deferred =
    params.deferred && params.deferred !== ''
      ? Math.round(parseFloat(params.deferred) * 100)
      : null;

  const saveJournal = async () => {
    if (!user || !params.sessionId || !journal.trim()) {
      router.replace('/(tabs)');
      return;
    }
    await run(`UPDATE sessions SET journal = ? WHERE id = ? AND user_id = ?`, [
      journal.trim(),
      params.sessionId,
      user.id,
    ]);
    setSaved(true);
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.md }}>
      <Title>Session complete</Title>
      <Card style={{ marginTop: spacing.md, alignItems: 'center' }}>
        <Caption>Accuracy</Caption>
        <Title style={{ color: colors.saffron, fontSize: 48 }}>{accuracy}%</Title>
        <Body style={{ color: colors.text }}>
          Parallelism index: {params.parallelism ?? 0}
        </Body>
        {deferred != null && (
          <Caption style={{ marginTop: 4 }}>Deferred recall: {deferred}%</Caption>
        )}
        {params.bells ? (
          <Caption style={{ marginTop: 4 }}>Bells reported: {params.bells}</Caption>
        ) : null}
        {interference != null && (
          <Caption style={{ marginTop: 4, color: colors.warning }}>
            Interference cost: {interference}% (solo − parallel)
          </Caption>
        )}
        <Caption style={{ marginTop: spacing.sm }}>
          {durationMin} min · {(params.drills || '').replace(/_/g, ' ')}
        </Caption>
      </Card>

      <Caption style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
        One-line reflection (optional)
      </Caption>
      <Input
        value={journal}
        onChangeText={setJournal}
        placeholder="What held? What scattered?"
        maxLength={280}
      />

      <Button
        label={saved ? 'Saved' : 'Save & return home'}
        onPress={() => void saveJournal()}
        style={{ marginTop: spacing.md }}
      />
      <Button label="Skip" variant="ghost" onPress={() => router.replace('/(tabs)')} />
    </View>
  );
}
