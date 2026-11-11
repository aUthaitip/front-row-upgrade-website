# Implementation notes

[Back to README](../README.md) · [Use cases and diagrams](use-cases-and-diagrams.md)

Details of the current implementation, input assumptions and reproducible checks.

## Languages and styling

The header TH/EN buttons switch the entire interface between Thai (default) and English. Language preference is saved locally; switching languages keeps queue edits, modes and simulation time intact. Simulation reset does not reset the selected language.

All Thai and English UI copy lives in `src/data/translations.ts`. `src/i18n.tsx` provides translation lookup, interpolation and presentation of core result reasons. The core selection API stays independent of language.

Styles use Tailwind CSS utility classes directly in JSX `className` attributes. `src/styles.css` only imports Tailwind, compiled by `@tailwindcss/vite`.

## Try the simulator

The sample starts at **11 November 2026, 12:00 UTC**, independent of the wall clock or local timezone. Maya initially wins with 174 points. There are 12 entries, four eligible groups and five exclusions.

- **+5 min / +15 min / +1 hour** advance the explicit simulation time and recalculate eligibility and scores.
- **Reset** restores time, sample data and modes.
- Edit any eligible entry's loyalty points under **Fan groups**. For example, setting Riley's loyalty to 1,000 makes Riley the winner with 242 points. Advancing an hour excludes Riley because that concert starts at 12:45 UTC.
- Toggle **Rush Hour**, **VIP Hour** and **Fair Queue Mode** independently. The contribution table updates with the active modes.
- Groups show a representative and the actual identifier connections, including the indirect Maya chain. Raw phone/payment identifiers are not displayed in the connection evidence.
- Group lists, member editors, connection evidence and exclusions are paginated. Tables scroll horizontally on narrow screens.

This is a selection simulator: it calculates the next winner but does not issue tickets or persist awards. Refreshing restores the sample.

## Core API

```ts
import { buildFrontRowUpgradeQueue } from "./src/core/queue";
import type { TicketQueueEntry } from "./src/core/types";

const entries: TicketQueueEntry[] = []; // Supply your queue here.
const result = buildFrontRowUpgradeQueue(
  entries,
  new Date("2026-11-11T12:00:00Z"),
);
// result.winner, result.topCandidates, result.fanGroups,
// result.excludedEntries, result.selectionReason

const rushResult = buildFrontRowUpgradeQueue(
  entries,
  new Date("2026-11-11T12:00:00Z"),
  {
    rushHour: true,
    vipHour: false,
    fairQueue: false,
  },
);
```

The required two-argument API works; the third modes argument is optional. Returned entries reference the original read-only input objects; the function does not modify them. Consumers should treat those references as read-only as well.

## Input policy and assumptions

- Inputs follow `TicketQueueEntry`; entry IDs must be non-empty and unique, otherwise the function throws. An invalid `now` also throws.
- Cancelled, already-upgraded, blocked, started-event and invalid-ticket entries are excluded and returned with one deterministic primary reason.
- A concert is ineligible at **exactly** its start time (`eventStartsAt <= now`). Invalid event/join dates and future queue join times are also excluded explicitly.
- Dates should be ISO 8601 timestamps with an explicit timezone, such as `2026-11-11T12:00:00Z`. Parsing uses `Date.parse`; this is not a full runtime schema validator.
- Tickets accept finite positive numbers or plain decimal numeric strings after trimming (e.g. `"1200.50"`). Empty strings, null, NaN, infinity, hexadecimal, exponent strings, negative/zero values and strings with trailing text are rejected.
- Phone keys strip spaces, hyphens, parentheses, plus and dots; a key must contain digits and no other characters. This normalizes formatting, not national/international dialing equivalence. Device/payment keys are trimmed but case-sensitive. Identity namespaces are separate. Empty keys never connect entries.
- Filtering happens **before grouping**, following the specified required steps. Excluded accounts cannot act as bridges or contribute recent history. This tradeoff is tested; an identity/award ledger would preserve historical evidence in production.
- `fanId` is retained but does not create connections: the specified linking fields are phone number, device ID and payment account.
- The queue is treated as one selection pool, as the supplied API has no event ID or round ID.

## Project structure

```text
src/
  core/types.ts                   Input and output contracts
  core/queue.ts                   Eligibility, grouping, scoring and selection
  core/queue.test.ts              42 deterministic unit cases
  core/performance.bench.test.ts  100k and 500k performance cases
  components/QueueControls.tsx    Time and mode controls
  components/Results.tsx          Winner, top three and contribution table
  components/QueueDetails.tsx     Paginated groups, loyalty editors and exclusions
  sample-data.ts                 Fixed-time fictional sample
  App.tsx                        State and screen composition
  data/translations.ts           Thai and English UI copy
  i18n.tsx                       Language context and saved language preference
  styles.css                     Tailwind CSS import (utilities live in JSX)
```

## Grouping and ranking details

Grouping uses separate Maps for normalized phone numbers, device IDs and payment accounts, with Union-Find using path compression and union by size. Each identifier connects to the first entry with that identifier. Only successful union edges are retained as connection evidence: at most n - 1 edges, rather than every possible pair.

Grouping takes O(n α(n)) amortized time and O(n) space, assuming bounded identifier/date string lengths and expected constant-time Map operations. Eligibility and scoring are linear. Top-three selection maintains at most three candidates, so it does not sort all groups.

Group IDs use the smallest member entry ID. Reordering input can change group display order or the retained connection proof tree, but cannot change the winner or top-three ordering. Ties use the exact join timestamp, then JavaScript code-unit comparison of entry IDs; there is no randomness, wall-clock read or locale-dependent sorting.

Each group uses its best individual score, without summing account scores, waiting time or loyalty. The maximum recent-upgrade count among eligible members applies to every member. This prevents a fresh linked account from erasing the group's known history. Maximum is a proxy: summing counts could double-count awards, while maximum could undercount distinct awards. A person with different linked profiles can still benefit from their strongest profile, even though account count adds no points.

## Verification

The following commands passed during the review on 11 November 2026:

- `npm test`: 42 cases, including all seven required scenarios and additional empty-key, tie, invalid-date, no-mutation, shared-history and empty-result cases.
- `npm run benchmark`: both 100,000-entry and 500,000-entry cases.
- `npm run build`: strict TypeScript check and production bundle.

The benchmark measured approximately **275 ms for 100,000 entries** and **1,320 ms for 500,000 entries** on the review machine. Timings cover selection only, excluding dataset construction and browser rendering. They are observations, not guarantees for other devices. The benchmark also checks membership totals, the expected winner, exclusions and candidate count.

The UI recalculates synchronously on the main thread. Pagination limits rendered elements but does not remove computation or O(n) memory use; large inputs can temporarily block interaction. A Web Worker is a future improvement.

Automated browser tests are not bundled. Browser interactions and desktop/mobile layout were not rechecked during this review. The [acceptance scenario](use-cases-and-diagrams.md#example-acceptance-scenario) documents a manual smoke check.
