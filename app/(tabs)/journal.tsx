import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Body, Caption, Card, Loading, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import { getJournalEntries } from '../../src/modules';
import { colors, spacing } from '../../src/theme';

export default function JournalScreen() {
  const { user, ready } = useApp();
  const [entries, setEntries] = useState<
    { sessionId: string; journal: string; startedAt: number }[]
  >([]);

  const load = useCallback(async () => {
    if (!user) return;
    setEntries(await getJournalEntries(user.id));
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!ready || !user) return <Loading />;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Title>Session journal</Title>
      <Body style={{ marginBottom: spacing.md }}>
        One-line reflection after practice — the tradition treats this as sadhana, not a game.
      </Body>

      {entries.length === 0 ? (
        <Card>
          <Body>
            No journal entries yet. After a session ends, you can leave a short reflection on the
            result screen.
          </Body>
        </Card>
      ) : (
        entries.map((e) => (
          <Card key={e.sessionId}>
            <Caption>{new Date(e.startedAt).toLocaleString()}</Caption>
            <Body style={{ color: colors.text, marginTop: spacing.xs }}>{e.journal}</Body>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
});
