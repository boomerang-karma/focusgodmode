# Module map — full suite

Enhance one module at a time. Public API via each module’s `index.ts`.

## Drill catalog (15)

| Plugin | Pillar | Phase |
|--------|--------|-------|
| `vyasta_recall` | smriti | 1 |
| `digit_span` | smriti | 1 |
| `verse_recall` | smriti | 2 |
| `samasya_purti` | sahitya | 1 |
| `nishedhakshari` | sahitya | 2 |
| `datta_padi` | sahitya | 2 |
| `ashu_kavitva` | sahitya | 2 |
| `aprastuta_prasanga` | sahitya | 2 |
| `puranapathana` | sahitya | 2 |
| `ghanta_ganana` | dharana | 1 |
| `dual_n_back` | dharana | 1 |
| `schulte` | dharana | 2 |
| `stroop` | dharana | 2 |
| `task_switch` | dharana | 2 |
| `arithmetic_load` | dharana | 2 |

Template: `src/modules/drills/_template.ts`

## Session engine features

- Solo + Avadhana modes
- Stream chips / focus switch
- Background bells
- Live heckler (avadhana + flag)
- Deferred recall of encode items
- Bell count report
- `lastSummary` with interference hooks

## Content packs

- `words-en.json`
- `samasya-prompts.json`
- `verses.json`
- `purana-quiz.json`

## Next module-sized PRs

1. Real `bell.mp3` + voice recording in ashu-kavitva (`audio/`)
2. Full FSRS parameters (`srs/fsrs.ts`)
3. Supabase sync (`sync/` new module)
4. Live rooms (`realtime/` new module)
5. AI samasya judge (`ai/` new module)
