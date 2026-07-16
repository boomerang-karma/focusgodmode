import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Body, Caption, Card, Input, SectionHeader, Title } from '../../src/components/ui';
import { useApp } from '../../src/context/AppContext';
import {
  cancelDailyReminder,
  ensureLocalUser,
  getRegistrySize,
  scheduleDailyReminder,
  updateUserSettings,
} from '../../src/modules';
import { colors, spacing } from '../../src/theme';

export default function SettingsScreen() {
  const { user, setUser } = useApp();
  const [name, setName] = useState(user?.displayName ?? '');

  if (!user) return null;

  const toggle = async (
    key: 'dailyReminderEnabled' | 'soundEnabled' | 'speechEnabled',
    value: boolean,
  ) => {
    const settings = await updateUserSettings(user.id, { [key]: value });
    setUser({ ...user, settings });
    if (key === 'dailyReminderEnabled') {
      if (value) {
        await scheduleDailyReminder(
          settings.dailyReminderHour,
          settings.dailyReminderMinute,
        );
      } else {
        await cancelDailyReminder();
      }
    }
  };

  const saveName = async () => {
    // lightweight: re-ensure and update via settings path isn't enough for name —
    // use raw path through ensure + manual update
    const { run } = await import('../../src/modules/db/client');
    await run(`UPDATE users SET display_name = ? WHERE id = ?`, [name.trim() || 'Sadhaka', user.id]);
    const refreshed = await ensureLocalUser();
    setUser(refreshed);
    Alert.alert('Saved', 'Display name updated.');
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Title>Settings</Title>
      <Body style={{ marginBottom: spacing.md }}>
        Local-first · offline · user_id on every row for future sync.
      </Body>

      <SectionHeader title="Profile" />
      <Card>
        <Caption>Display name</Caption>
        <Input
          value={name}
          onChangeText={setName}
          onBlur={() => void saveName()}
          style={{ marginTop: spacing.sm }}
        />
        <Caption style={{ marginTop: spacing.sm }}>User id: {user.id}</Caption>
        <Caption>Rank: {user.rank}</Caption>
      </Card>

      <SectionHeader title="Practice" />
      <Card>
        <Row
          label="Daily sadhana reminder"
          value={user.settings.dailyReminderEnabled}
          onChange={(v) => void toggle('dailyReminderEnabled', v)}
        />
        <Row
          label="Sound / haptics"
          value={user.settings.soundEnabled}
          onChange={(v) => void toggle('soundEnabled', v)}
        />
        <Row
          label="Speech prompts (TTS)"
          value={user.settings.speechEnabled}
          onChange={(v) => void toggle('speechEnabled', v)}
        />
      </Card>

      <SectionHeader title="Modules" />
      <Card>
        <Body style={{ color: colors.text }}>Registered drills: {getRegistrySize()}</Body>
        <Caption style={{ marginTop: spacing.sm }}>
          core · drills · session · tracking · content · audio · srs · db · notifications
        </Caption>
        <Caption style={{ marginTop: spacing.xs }}>
          Full catalog + Avadhana engine (deferred recall, bells, heckler, interference). Phase 3:
          Supabase sync. Phase 4: live rooms + AI judge.
        </Caption>
      </Card>

      <SectionHeader title="About" />
      <Card>
        <Body style={{ color: colors.text }}>Avadhan Vidya v1.1.0 — Full suite</Body>
        <Caption style={{ marginTop: spacing.sm }}>
          Smriti · Sahitya · Dharana. Ekavadhani → Shatavadhani. Drill-as-plugin architecture.
        </Caption>
      </Card>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Body style={{ color: colors.text, flex: 1 }}>{label}</Body>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.saffron, false: colors.bgMuted }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
});
