# Avadhan Vidya — Full Suite

Modular mobile app for practicing **Avadhan Vidya**: holding many streams of attention at once.

**Progression:** Ekavadhani (1) → Dvi-avadhani (2) → Chatur-avadhani (4) → Ashtavadhani (8) → Shatavadhani track.

Plan source: `../avadhan-vidya-app-plan.md`

---

## Quick start

```bash
cd avadhan-vidya
npm install --legacy-peer-deps
npx expo start
```

```bash
npm run typecheck
npm run smoke
```

---

## What's included (full build)

### 15 drill plugins

| Pillar | Drills |
|--------|--------|
| **Smriti** | Vyasta recall · Digit span · Verse recall |
| **Sahitya** | Samasya-purti · Nishedhakshari · Datta-padi · Ashu-kavitva · Aprastuta-prasanga · Puranapathana quiz |
| **Dharana** | Ghanta-ganana · Dual n-back · Schulte · Stroop · Task switch · Arithmetic under load |

### Avadhana Session engine

- 2–8 stream multi-drill sessions (presets + custom builder)
- Background **ghanta** (bell) schedule
- Optional **heckler** interruptions
- **Deferred recall** phase after streams
- End-of-session **bell count** report
- **Interference cost** (solo baseline − parallel accuracy)
- Parallelism index + rank labels

### Tracking & sadhana

- Streaks, minutes, weekly chart
- Per-drill adaptive difficulty
- Session journal
- Verse **SRS** (FSRS-inspired) with built-in verse pack
- Append-only **event log** → SQLite (offline-first, `user_id` on every row)

### App screens

Home · Practice catalog · Session builder · Solo / Avadhana runners · Results · Verse SRS · Progress · Journal · Settings

---

## Architecture (enhance module-by-module)

```
src/modules/
  core/           Drill contract, registry, RNG, event log
  drills/         One file per plugin (+ _template.ts)
  session/        Orchestrator (solo + avadhana)
  tracking/       Parallelism, streaks, interference
  content/        JSON packs (words, samasya, verses, quiz)
  audio/          Bells + TTS
  srs/            Cards + FSRS-lite + repo
  db/             Schema + repositories
  notifications/  Daily reminder
```

**Add a drill:** copy `drills/_template.ts` → implement → `registerDrill` in `drills/index.ts` → optional UI kinds in `DrillRunner.tsx`.

See `MODULES.md` for ownership boundaries and suggested PR-sized enhancements.

---

## Roadmap remaining (phase 3–4)

| Phase | Work |
|-------|------|
| **3** | Supabase auth + sync, leaderboards, content-pack sharing, store release |
| **4** | Live prichchhaka rooms, guru/student mode, AI samasya judge |

Phase 3 should be a new `sync/` module on top of repositories — not a rewrite.

---

## Tech

React Native · Expo · TypeScript · Expo Router · expo-sqlite · expo-speech · expo-notifications · haptics bells

---

*Tradition meets trainable practice. Sadhana first — metrics serve the path.*
