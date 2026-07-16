/**
 * Generic drill UI host — renders all prompt kinds across the catalog.
 * Scoring stays in drill plugins; this file is presentation only.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Body,
  Button,
  Caption,
  Card,
  Input,
  ProgressBar,
  Subtitle,
  Title,
} from './ui';
import { colors, radius, spacing } from '../theme';
import {
  scheduleBells,
  sessionOrchestrator,
  speak,
  type Prompt,
  type Score,
  type SessionSummary,
} from '../modules';

interface Props {
  onComplete: (summary: SessionSummary) => void;
  onAbort: () => void;
}

export function DrillRunner({ onComplete, onAbort }: Props) {
  const state = sessionOrchestrator.getState();
  const [, tick] = useState(0);
  const force = useCallback(() => tick((n) => n + 1), []);
  const [input, setInput] = useState('');
  const [nback, setNback] = useState({ positionMatch: false, letterMatch: false });
  const [selfScore, setSelfScore] = useState<Record<string, boolean>>({});
  const [schulteNext, setSchulteNext] = useState(1);
  const [schulteTaps, setSchulteTaps] = useState<number[]>([]);
  const [schulteStart] = useState(Date.now());
  const [verseOrder, setVerseOrder] = useState<string[]>([]);
  const [showResult, setShowResult] = useState<{
    score: Score;
    summary: SessionSummary;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAt = useRef(Date.now());
  const nbackRef = useRef(nback);
  nbackRef.current = nback;

  useEffect(() => {
    const unsub = sessionOrchestrator.subscribe((s) => {
      force();
      if (s.status === 'completed' && s.lastSummary && !showResult) {
        const scores = Object.values(s.lastSummary.scores).filter(
          (sc) => sc && !Number.isNaN(sc.accuracy),
        );
        const first = scores[0] ?? {
          correct: 0,
          total: 0,
          accuracy: s.lastSummary.overallAccuracy,
          details: {},
          difficultyDelta: 0 as const,
        };
        setShowResult({ score: first, summary: s.lastSummary });
      }
    });
    return unsub;
  }, [force, showResult]);

  useEffect(() => {
    const s = sessionOrchestrator.getState();
    if (!s || s.bells.length === 0) return;
    const cancel = scheduleBells(
      s.startedAt,
      s.bells.map((b) => b.atMs),
      (atMs) => sessionOrchestrator.fireBell(atMs),
    );
    return cancel;
  }, []);

  const prompt = sessionOrchestrator.currentPrompt();
  const ar = sessionOrchestrator.currentRound();
  const liveState = sessionOrchestrator.getState();

  useEffect(() => {
    if (!prompt || showResult) return;
    shownAt.current = Date.now();
    setInput('');
    setNback({ positionMatch: false, letterMatch: false });
    if (prompt.kind === 'schulte_grid') {
      setSchulteNext(1);
      setSchulteTaps([]);
    }
    if (prompt.kind === 'verse_order') {
      setVerseOrder([]);
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    const autoKinds = [
      'encode',
      'digit_show',
      'delay',
      'bell_listen',
      'nback_stimulus',
      'verse_show',
    ];
    if (autoKinds.includes(prompt.kind) || prompt.payload.phase === 'encode') {
      if (prompt.kind === 'nback_stimulus' && prompt.payload.canRespond) {
        timerRef.current = setTimeout(() => {
          void sessionOrchestrator.submitResponse(
            { ...nbackRef.current },
            prompt.timeLimitMs,
          );
        }, prompt.timeLimitMs ?? 2000);
      } else if (prompt.kind === 'stroop_trial' || prompt.kind === 'task_switch_trial') {
        // user must respond; optional timeout as miss
        timerRef.current = setTimeout(() => {
          void sessionOrchestrator.submitResponse('', prompt.timeLimitMs);
        }, prompt.timeLimitMs ?? 2500);
      } else {
        const ms = prompt.timeLimitMs ?? 2000;
        if (prompt.kind === 'encode' && prompt.payload.word) {
          speak(`Item ${prompt.payload.position}: ${prompt.payload.word}`);
        }
        if (prompt.kind === 'digit_show') speak(String(prompt.payload.digit));
        if (prompt.kind === 'verse_show') {
          const lines = (prompt.payload.lines as string[]) || [];
          speak(lines.join('. '));
        }
        timerRef.current = setTimeout(() => {
          void sessionOrchestrator.advanceTimedPrompt(null);
        }, ms);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [prompt?.id, showResult]);

  const progress = useMemo(() => {
    const s = sessionOrchestrator.getState();
    if (!s) return 0;
    if (s.status === 'recall') {
      return s.deferredPromptIndex / Math.max(1, s.deferredPrompts.length);
    }
    if (s.status === 'bell_report') return 0.95;
    if (!ar) return 0;
    const done = s.activeRounds.filter((r) => r.completed).length;
    const local = ar.promptIndex / Math.max(1, ar.round.prompts.length);
    return (done + local) / Math.max(1, s.activeRounds.length);
  }, [ar?.promptIndex, ar?.round.prompts.length, liveState?.status, liveState?.deferredPromptIndex]);

  const submit = async (value: unknown) => {
    const latency = Date.now() - shownAt.current;
    await sessionOrchestrator.submitResponse(value, latency);
    const st = sessionOrchestrator.getState();
    if (st?.status === 'completed' && st.lastSummary) {
      const scores = Object.values(st.lastSummary.scores);
      setShowResult({
        score: scores[0] ?? {
          correct: 0,
          total: 0,
          accuracy: st.lastSummary.overallAccuracy,
          details: {},
          difficultyDelta: 0,
        },
        summary: st.lastSummary,
      });
    }
    force();
  };

  if (!state) {
    return (
      <View style={styles.center}>
        <Body>No active session.</Body>
        <Button label="Back" onPress={onAbort} variant="secondary" />
      </View>
    );
  }

  if (showResult) {
    const pct = Math.round(showResult.summary.overallAccuracy * 100);
    return (
      <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: 40 }}>
        <Title style={{ textAlign: 'center', marginBottom: spacing.md }}>
          Session complete
        </Title>
        <Card>
          <Text style={styles.bigScore}>{pct}%</Text>
          <Caption style={{ textAlign: 'center' }}>
            Parallelism index: {showResult.summary.parallelismIndex}
          </Caption>
          {showResult.summary.deferredRecallAccuracy != null && (
            <Caption style={{ textAlign: 'center', marginTop: 4 }}>
              Deferred recall: {Math.round(showResult.summary.deferredRecallAccuracy * 100)}%
            </Caption>
          )}
          {showResult.summary.bellAccuracy != null && (
            <Caption style={{ textAlign: 'center', marginTop: 4 }}>
              Bell count: {showResult.summary.reportedBellCount}/
              {showResult.summary.trueBellCount} (
              {Math.round(showResult.summary.bellAccuracy * 100)}%)
            </Caption>
          )}
          {showResult.score.difficultyDelta > 0 && (
            <Body style={{ textAlign: 'center', color: colors.success, marginTop: spacing.sm }}>
              Difficulty ↑ on active drills
            </Body>
          )}
        </Card>
        <Button label="Continue" onPress={() => onComplete(showResult.summary)} />
        <Button label="Leave" onPress={onAbort} variant="ghost" />
      </ScrollView>
    );
  }

  if (!prompt) {
    return (
      <View style={styles.center}>
        <Body>Preparing…</Body>
      </View>
    );
  }

  const statusLabel =
    liveState?.status === 'recall'
      ? 'Deferred recall'
      : liveState?.status === 'bell_report'
        ? 'Bell report'
        : ar
          ? `${ar.drillId.replace(/_/g, ' ')} · L${ar.round.difficulty.level}`
          : 'Session';

  return (
    <View style={styles.wrap}>
      <View style={styles.topBar}>
        <Caption>{statusLabel}</Caption>
        <Pressable
          onPress={() => {
            void sessionOrchestrator.abandon();
            onAbort();
          }}
        >
          <Caption style={{ color: colors.danger }}>Exit</Caption>
        </Pressable>
      </View>
      <ProgressBar progress={progress} />

      {liveState?.config.mode === 'avadhana' && liveState.status === 'active' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.streamBar}>
          {liveState.activeRounds.map((r, i) => (
            <Pressable
              key={r.round.id}
              onPress={() => sessionOrchestrator.focusStream(i)}
              style={[
                styles.streamChip,
                i === liveState.currentRoundIndex && styles.streamChipOn,
                r.completed && styles.streamChipDone,
              ]}
            >
              <Caption style={{ color: colors.text }}>
                {r.completed ? '✓' : i + 1} {r.drillId.split('_')[0]}
              </Caption>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <ScrollView style={styles.promptArea} contentContainerStyle={{ paddingBottom: 24 }}>
        {renderPrompt(prompt)}
        {renderInput(prompt)}
      </ScrollView>
    </View>
  );

  function renderPrompt(p: Prompt) {
    switch (p.kind) {
      case 'encode':
        return (
          <Card style={styles.focusCard}>
            <Caption>Item #{String(p.payload.position ?? '')}</Caption>
            <Text style={styles.heroWord}>{String(p.payload.word)}</Text>
          </Card>
        );
      case 'digit_show':
        return (
          <Card style={styles.focusCard}>
            <Text style={styles.heroWord}>{String(p.payload.digit)}</Text>
          </Card>
        );
      case 'delay':
        return (
          <Card style={styles.focusCard}>
            <Subtitle>Hold the sequence…</Subtitle>
          </Card>
        );
      case 'bell_listen':
        return (
          <Card style={styles.focusCard}>
            <Text style={styles.heroEmoji}>🔔</Text>
            <Subtitle>Listen for bells</Subtitle>
            <Caption>Count silently</Caption>
          </Card>
        );
      case 'nback_stimulus': {
        const pos = Number(p.payload.position);
        const letter = String(p.payload.letter || '');
        return (
          <Card style={styles.focusCard}>
            <Caption>{p.instruction}</Caption>
            <View style={styles.grid}>
              {Array.from({ length: 9 }).map((_, i) => (
                <View key={i} style={[styles.cell, i === pos && styles.cellActive]} />
              ))}
            </View>
            {letter ? <Text style={styles.heroWord}>{letter}</Text> : null}
          </Card>
        );
      }
      case 'samasya_compose':
        return (
          <Card>
            <Caption>Last line (end with this)</Caption>
            <Subtitle style={{ color: colors.gold, marginVertical: spacing.sm }}>
              “{String(p.payload.lastLine)}”
            </Subtitle>
            {p.payload.hint ? (
              <Caption style={{ fontStyle: 'italic' }}>Hint: {String(p.payload.hint)}</Caption>
            ) : null}
          </Card>
        );
      case 'nishedha_compose':
        return (
          <Card>
            <Subtitle>Forbidden: {(p.payload.forbidden as string[]).join(', ')}</Subtitle>
            <Body style={{ color: colors.text, marginTop: spacing.sm }}>{p.instruction}</Body>
          </Card>
        );
      case 'datta_compose':
        return (
          <Card>
            <Caption>Given words</Caption>
            <Text style={styles.wordTags}>{(p.payload.given as string[]).join(' · ')}</Text>
            <Body style={{ marginTop: spacing.sm }}>{p.instruction}</Body>
          </Card>
        );
      case 'ashu_compose':
        return (
          <Card>
            <Caption>Surprise topic</Caption>
            <Subtitle style={{ color: colors.gold, marginTop: spacing.sm }}>
              {String(p.payload.topic)}
            </Subtitle>
            <Caption style={{ marginTop: spacing.sm }}>
              Min ~{String(p.payload.minWords)} words · timer on
            </Caption>
          </Card>
        );
      case 'heckle':
      case 'heckle_live':
        return (
          <Card style={{ borderColor: colors.danger }}>
            <Caption style={{ color: colors.danger }}>Aprastuta-prasanga</Caption>
            <Subtitle style={{ marginTop: spacing.sm }}>
              {String(p.payload.question)}
            </Subtitle>
          </Card>
        );
      case 'quiz_mcq':
        return (
          <Card>
            <Caption>{String(p.payload.topic || 'quiz')}</Caption>
            <Subtitle style={{ marginTop: spacing.sm }}>{p.instruction}</Subtitle>
          </Card>
        );
      case 'schulte_grid': {
        const size = Number(p.payload.size) || 4;
        const cells = (p.payload.cells as number[]) || [];
        return (
          <Card>
            <Caption>
              Next: {schulteNext} / {size * size}
            </Caption>
            <View style={[styles.schulte, { width: '100%' }]}>
              {cells.map((num, i) => (
                <Pressable
                  key={`${num}-${i}`}
                  onPress={() => {
                    if (num === schulteNext) {
                      const taps = [...schulteTaps, num];
                      setSchulteTaps(taps);
                      const next = schulteNext + 1;
                      setSchulteNext(next);
                      if (next > size * size) {
                        void submit({
                          taps,
                          completed: true,
                          elapsedMs: Date.now() - schulteStart,
                        });
                      }
                    }
                  }}
                  style={[
                    styles.schulteCell,
                    { width: `${100 / size}%` as unknown as number, aspectRatio: 1 },
                    schulteTaps.includes(num) && styles.schulteDone,
                  ]}
                >
                  <Text style={styles.schulteNum}>{num}</Text>
                </Pressable>
              ))}
            </View>
          </Card>
        );
      }
      case 'stroop_trial':
        return (
          <Card style={styles.focusCard}>
            <Caption>Tap the INK color</Caption>
            <Text
              style={[
                styles.heroWord,
                { color: String(p.payload.inkHex), marginTop: spacing.md },
              ]}
            >
              {String(p.payload.word)}
            </Text>
          </Card>
        );
      case 'task_switch_trial':
        return (
          <Card style={styles.focusCard}>
            <Caption style={{ color: colors.gold }}>
              {String(p.payload.task).toUpperCase()}
            </Caption>
            <Text style={styles.heroWord}>{String(p.payload.number)}</Text>
            <Body>{p.instruction}</Body>
          </Card>
        );
      case 'math_q':
        return (
          <Card style={styles.focusCard}>
            <Subtitle>{String(p.payload.expr)}</Subtitle>
            <Caption>Keep the words in mind</Caption>
          </Card>
        );
      case 'verse_show':
        return (
          <Card>
            <Caption>
              {String(p.payload.title)} · {String(p.payload.language)}
            </Caption>
            {(p.payload.lines as string[]).map((line, i) => (
              <Text key={i} style={styles.verseLine}>
                {line}
              </Text>
            ))}
            <Caption style={{ marginTop: spacing.sm, fontStyle: 'italic' }}>
              {String(p.payload.translation)}
            </Caption>
          </Card>
        );
      case 'verse_order':
        return (
          <Card>
            <Subtitle>Tap lines in correct order</Subtitle>
            <Caption style={{ marginBottom: spacing.sm }}>
              Selected: {verseOrder.length}/{(p.payload.shuffled as string[]).length}
            </Caption>
          </Card>
        );
      case 'deferred_recall':
        return (
          <Card style={{ borderColor: colors.gold }}>
            <Caption>Deferred recall phase</Caption>
            <Subtitle style={{ marginTop: spacing.sm }}>{p.instruction}</Subtitle>
          </Card>
        );
      default:
        return (
          <Card>
            <Subtitle>{p.instruction}</Subtitle>
          </Card>
        );
    }
  }

  function renderInput(p: Prompt) {
    if (
      ['encode', 'digit_show', 'delay', 'bell_listen', 'verse_show'].includes(p.kind)
    ) {
      return <Caption style={{ textAlign: 'center', marginTop: spacing.lg }}>…</Caption>;
    }

    if (p.kind === 'schulte_grid') {
      return (
        <Button
          label="Give up / submit partial"
          variant="ghost"
          onPress={() =>
            void submit({
              taps: schulteTaps,
              completed: false,
              elapsedMs: Date.now() - schulteStart,
            })
          }
        />
      );
    }

    if (p.kind === 'nback_stimulus') {
      if (!p.payload.canRespond) {
        return <Caption style={{ textAlign: 'center' }}>Encoding…</Caption>;
      }
      return (
        <View style={styles.nbackBtns}>
          <Pressable
            onPress={() => setNback((s) => ({ ...s, positionMatch: !s.positionMatch }))}
            style={[styles.matchBtn, nback.positionMatch && styles.matchBtnOn]}
          >
            <Text style={styles.matchLabel}>Position match</Text>
          </Pressable>
          {p.payload.dual ? (
            <Pressable
              onPress={() => setNback((s) => ({ ...s, letterMatch: !s.letterMatch }))}
              style={[styles.matchBtn, nback.letterMatch && styles.matchBtnOn]}
            >
              <Text style={styles.matchLabel}>Letter match</Text>
            </Pressable>
          ) : null}
        </View>
      );
    }

    if (p.kind === 'quiz_mcq') {
      const options = (p.payload.options as string[]) || [];
      return (
        <View style={{ gap: spacing.sm }}>
          {options.map((opt, i) => (
            <Pressable key={opt} style={styles.matchBtn} onPress={() => void submit(i)}>
              <Text style={styles.matchLabel}>
                {String.fromCharCode(65 + i)}. {opt}
              </Text>
            </Pressable>
          ))}
        </View>
      );
    }

    if (p.kind === 'stroop_trial') {
      const options = (p.payload.options as string[]) || [];
      return (
        <View style={styles.optionRow}>
          {options.map((opt) => (
            <Pressable key={opt} style={styles.optionBtn} onPress={() => void submit(opt)}>
              <Text style={styles.matchLabel}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      );
    }

    if (p.kind === 'task_switch_trial') {
      const options = (p.payload.options as string[]) || [];
      return (
        <View style={styles.optionRow}>
          {options.map((opt) => (
            <Pressable key={opt} style={styles.optionBtn} onPress={() => void submit(opt)}>
              <Text style={styles.matchLabel}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      );
    }

    if (p.kind === 'verse_order') {
      const shuffled = (p.payload.shuffled as string[]) || [];
      const remaining = shuffled.filter((l) => !verseOrder.includes(l));
      return (
        <View>
          {verseOrder.map((l, i) => (
            <Caption key={`sel-${i}`} style={{ color: colors.success }}>
              {i + 1}. {l}
            </Caption>
          ))}
          {remaining.map((l) => (
            <Pressable
              key={l}
              style={styles.matchBtn}
              onPress={() => {
                const next = [...verseOrder, l];
                setVerseOrder(next);
                if (next.length === shuffled.length) void submit(next);
              }}
            >
              <Text style={styles.matchLabel}>{l}</Text>
            </Pressable>
          ))}
          {verseOrder.length > 0 && (
            <Button label="Reset order" variant="ghost" onPress={() => setVerseOrder([])} />
          )}
        </View>
      );
    }

    if (
      p.kind === 'samasya_self_score' ||
      p.kind === 'sahitya_self_score'
    ) {
      const criteria = (p.payload.criteria as { id: string; label: string }[]) || [];
      return (
        <View>
          {criteria.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setSelfScore((s) => ({ ...s, [c.id]: !s[c.id] }))}
              style={[styles.checkRow, selfScore[c.id] && styles.checkRowOn]}
            >
              <Text style={styles.checkMark}>{selfScore[c.id] ? '✓' : '○'}</Text>
              <Body style={{ flex: 1, color: colors.text }}>{c.label}</Body>
            </Pressable>
          ))}
          <Button
            label="Submit self-score"
            onPress={() => void submit(selfScore)}
            style={{ marginTop: spacing.md }}
          />
        </View>
      );
    }

    if (
      p.kind === 'samasya_compose' ||
      p.kind === 'nishedha_compose' ||
      p.kind === 'datta_compose' ||
      p.kind === 'ashu_compose' ||
      p.kind === 'verse_type'
    ) {
      return (
        <View>
          <Input
            value={input}
            onChangeText={setInput}
            multiline
            numberOfLines={6}
            placeholder="Write here…"
            style={{ minHeight: 140, textAlignVertical: 'top' }}
          />
          <Button
            label="Submit"
            onPress={() => void submit(input)}
            style={{ marginTop: spacing.md }}
            disabled={!input.trim()}
          />
        </View>
      );
    }

    const numeric =
      p.kind === 'bell_report' ||
      p.kind === 'digit_recall' ||
      p.kind === 'math_q';

    return (
      <View>
        <Input
          value={input}
          onChangeText={setInput}
          placeholder={numeric ? 'Enter number…' : 'Your answer…'}
          keyboardType={numeric ? 'number-pad' : 'default'}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button
          label="Submit"
          onPress={() => void submit(input)}
          style={{ marginTop: spacing.md }}
          disabled={!input.trim()}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: spacing.md, backgroundColor: colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  streamBar: { maxHeight: 44, marginVertical: spacing.sm },
  streamChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: colors.bgCard,
  },
  streamChipOn: { borderColor: colors.saffron, backgroundColor: colors.saffron + '33' },
  streamChipDone: { opacity: 0.5 },
  promptArea: { flex: 1 },
  focusCard: { alignItems: 'center', paddingVertical: spacing.xl },
  heroWord: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.gold,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  heroEmoji: { fontSize: 56, marginBottom: spacing.sm },
  bigScore: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.saffron,
    textAlign: 'center',
  },
  grid: {
    width: 180,
    height: 180,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: spacing.md,
  },
  cell: {
    width: '33.33%',
    height: '33.33%',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  cellActive: { backgroundColor: colors.saffron },
  nbackBtns: { gap: spacing.sm, marginTop: spacing.md },
  matchBtn: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  matchBtnOn: {
    backgroundColor: colors.saffron,
    borderColor: colors.saffronLight,
  },
  matchLabel: { color: colors.text, fontWeight: '700' },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.bgCard,
  },
  checkRowOn: {
    borderColor: colors.success,
    backgroundColor: colors.success + '22',
  },
  checkMark: { color: colors.success, fontSize: 18, width: 24 },
  wordTags: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md },
  optionBtn: {
    flexGrow: 1,
    minWidth: '40%',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  schulte: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  schulteCell: {
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
  },
  schulteDone: { backgroundColor: colors.success + '44' },
  schulteNum: { color: colors.text, fontWeight: '700', fontSize: 16 },
  verseLine: {
    color: colors.text,
    fontSize: 17,
    marginTop: 6,
    lineHeight: 24,
  },
});
