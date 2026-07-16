import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  Body,
  Button,
  Caption,
  Card,
  Loading,
  SectionHeader,
  StatChip,
  Title,
} from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import {
  getDueCards,
  rateCard,
  srsStats,
  type SrsCard,
  type SrsRating,
} from '../../src/modules';
import { colors, spacing } from '../../src/theme';

export default function SrsScreen() {
  const { user, ready } = useApp();
  const [stats, setStats] = useState<{
    total: number;
    due: number;
    newCount: number;
    reviewCount: number;
  } | null>(null);
  const [queue, setQueue] = useState<SrsCard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [st, due] = await Promise.all([srsStats(user.id), getDueCards(user.id, 30)]);
    setStats(st);
    setQueue(due);
    setIndex(0);
    setFlipped(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!ready || !user || !stats) return <Loading label="Loading verses…" />;

  const card = reviewing ? queue[index] : null;

  const rate = async (rating: SrsRating) => {
    if (!card) return;
    await rateCard(card, rating);
    setFlipped(false);
    if (index + 1 >= queue.length) {
      setReviewing(false);
      await load();
    } else {
      setIndex((i) => i + 1);
    }
  };

  if (reviewing && card) {
    return (
      <View style={styles.wrap}>
        <Caption>
          Card {index + 1} / {queue.length}
        </Caption>
        <Card style={{ marginTop: spacing.md, minHeight: 200 }}>
          <Body style={{ color: colors.text, fontSize: 17, lineHeight: 26 }}>{card.front}</Body>
          {flipped && (
            <Body
              style={{
                color: colors.gold,
                marginTop: spacing.lg,
                fontSize: 16,
                lineHeight: 24,
              }}
            >
              {card.back}
            </Body>
          )}
        </Card>
        {!flipped ? (
          <Button label="Show answer" onPress={() => setFlipped(true)} style={{ marginTop: spacing.md }} />
        ) : (
          <View style={styles.rateRow}>
            <Button label="Again" variant="danger" onPress={() => void rate('again')} style={styles.rateBtn} />
            <Button label="Hard" variant="secondary" onPress={() => void rate('hard')} style={styles.rateBtn} />
            <Button label="Good" onPress={() => void rate('good')} style={styles.rateBtn} />
            <Button label="Easy" variant="secondary" onPress={() => void rate('easy')} style={styles.rateBtn} />
          </View>
        )}
        <Button
          label="End review"
          variant="ghost"
          onPress={() => {
            setReviewing(false);
            void load();
          }}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Title>Verse SRS</Title>
      <Body style={{ marginBottom: spacing.md }}>
        Spaced repetition for shlokas and practice verses. FSRS-inspired scheduling.
      </Body>

      <View style={styles.statsRow}>
        <StatChip label="Due" value={stats.due} accent={colors.saffron} />
        <StatChip label="Total" value={stats.total} accent={colors.gold} />
        <StatChip label="New" value={stats.newCount} accent={colors.info} />
      </View>

      <SectionHeader title="Review" />
      <Card>
        {stats.due === 0 ? (
          <Body>No cards due. Practice a verse drill or check back later.</Body>
        ) : (
          <>
            <Body style={{ color: colors.text, marginBottom: spacing.md }}>
              {stats.due} cards ready. Short daily reviews compound into lasting smriti.
            </Body>
            <Button
              label={`Review ${Math.min(stats.due, 30)} cards`}
              onPress={() => {
                setReviewing(true);
                setIndex(0);
                setFlipped(false);
              }}
            />
          </>
        )}
      </Card>

      <SectionHeader title="How it works" />
      <Card>
        <Caption>
          Built-in pack: verses-classic (Gayatri opening, Gita karmanye, English practice quatrains).
          Rate Again / Hard / Good / Easy — intervals grow with stability. Swap in full FSRS later
          without changing the card schema.
        </Caption>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  wrap: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  rateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md },
  rateBtn: { flexGrow: 1, minWidth: '40%' },
});
