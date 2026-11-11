# Front Row Upgrade Queue

An explainable front-row ticket upgrade simulator built with React, TypeScript, Vite and Tailwind CSS. The core selection function is independent of React. No API keys, backend or external services are required. All sample fans and identifiers are fictional.

## Run locally

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173).

```sh
npm test              # 42 core cases, including the seven required scenarios
npm run benchmark     # 100,000 and 500,000-entry performance cases
npm run build         # strict TypeScript check and production bundle
npm run preview       # serve the production bundle after building
```

The lockfile is included for reproducible installs. `npm test` intentionally excludes the larger performance cases, which run separately.

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

## Design answers

### 1. How does the priority score work?

```text
score = floor(waitMinutes) × waitWeight
      + min(max(loyaltyPoints, 0), 1000) × 0.1
      + VIP bonus
      + min(ticketValue, 10000) / 1000
      - min(groupRecentUpgrades, 1000) × upgradePenalty
```

Default waiting weight is **2 points per whole minute**, VIP bonus is **20**, and upgrade penalty is **50**. The loyalty and ticket contributions are rounded to two decimals before summing; the total is also rounded to two decimals. `groupRecentUpgrades` is the maximum non-negative whole upgrade count reported by any eligible member of the group. Missing, negative and non-finite optional numeric values become zero.

Waiting points are unbounded, while loyalty contributes at most 100 and ticket value at most 10. This lets someone with a long wait overtake a newer high-value or VIP entry. The recent count is capped at 1,000 to keep malformed extreme values bounded. The result includes every component and textual reasons.

### 2. How do you stop one fan group from dominating?

Only **one representative per connected group** is considered for the winner and top three. A group's score is its best individual score; scores, waiting time and loyalty are never summed across accounts. A group with 100 identical accounts gets the same score and only one candidate slot as a group with one such account.

The recent-upgrade penalty uses the group's **maximum** count rather than the chosen representative's count, so creating a fresh linked account cannot erase known history. Maximum is a conservative proxy because the supplied data does not identify individual upgrade events; summing counts might double-count the same awards. Distinct award history would be preferable in production.

The function selects the next fan only. To enforce an absolute one-award-per-group-per-round limit across repeated awards, a production caller needs a round ID and a persistent group award ledger; that state is not supplied by this assessment's function signature. The UI therefore does not pretend that selecting a winner has issued an award.

### 3. How do you break ties?

Use the same comparator for group representatives and global candidates:

1. Higher rounded score.
2. Earlier exact queue join timestamp (including seconds and milliseconds).
3. Smaller unique entry ID using JavaScript code-unit string comparison.

No random values, current-time reads or locale-dependent sorting are used. Group IDs are the smallest member entry ID, independent of input order. Reordering input can change the display order of groups or which equally valid connection proof tree is retained, but cannot change the selected winner or top-three ordering.

### 4. What is the time complexity of your grouping logic?

**Map lookups plus Union-Find with path compression and union by size.** For each of three identifier fields, each eligible entry is examined once. A shared identifier unions its entry with the first entry that had that identifier. This captures indirect connections without comparing every pair.

For n entries, grouping takes **O(n α(n)) amortized time** and **O(n) space**, assuming bounded identifier/date string lengths and expected constant-time Map operations. At most n − 1 successful union edges are retained as sufficient evidence of connectivity, avoiding a quadratic list of redundant links. Eligibility and scoring are linear. Selecting the top three maintains a list of at most three candidates, avoiding a full group sort. The overall algorithm is O(n α(n)).

An initial benchmark on the development machine processed 100,000 mixed entries in about **258 ms**, and 500,000 in about **1,502 ms** (selection only; dataset construction excluded). These are measurements, not guarantees for other devices. Run `npm run benchmark` to reproduce on your machine. The benchmark validates membership counts and the winner as well as reporting elapsed time.

### 5. What may still feel unfair?

A household sharing a device or payment account can be incorrectly treated as one person. Conversely, a person with entirely separate identifiers can evade grouping. Taking the maximum recent history may penalize a household or undercount distinct awards. Taking the best individual score can still let a person with multiple different legitimate profiles choose their strongest profile, although account count itself never adds points.

VIP and loyalty bonuses are explicit product choices, not a claim of objective fairness. They should be tested against real queue outcomes. Phone normalization removes presentation punctuation only; local and international prefixes are not inferred without country context.

### 6. How do the modes work?

| Mode            | Effect                                                              |
| --------------- | ------------------------------------------------------------------- |
| Rush Hour       | Waiting weight increases from 2 to 4 points per minute.             |
| VIP Hour        | VIP bonus increases from 20 to 30 points.                           |
| Fair Queue Mode | Recent-upgrade penalty increases from 50 to 100 points per upgrade. |

Modes can be combined. Eligibility, grouping, contribution caps and tie-breaking stay the same.

### 7. What would you improve with more time?

- Move large-dataset recalculation into a Web Worker, with cancellation for superseded requests. The shipped UI uses a small sample and calculates synchronously; pagination bounds rendered elements but does not eliminate computation or O(n) memory.
- Add a persistent award ledger with atomic selection/award handling to prevent races and enforce round-level limits.
- Use verified country-aware phone normalization and distinguish trusted identifiers from shared household identifiers.
- Validate imported runtime data against a schema, add representative real-world benchmark fixtures and measure memory as well as time.
- Add browser interaction tests to CI and measure fairness outcomes for different fan cohorts.

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

## Verification

- 42 core tests passed, including the seven required scenarios and additional empty-key, tie, invalid-date, no-mutation, shared-history and empty-result cases.
- Two performance cases passed (100k and 500k mixed entries).
- Strict TypeScript check and production build passed.
- In-app browser smoke checks cover time advance, Rush Hour, loyalty changes, eligibility changes at event start, VIP Hour, Fair Queue Mode and reset. Desktop and narrow-screen rendering were inspected; no application console errors were observed. Automated browser tests are not bundled.

## GitHub submission

Upload this directory, including `package-lock.json`, to your repository. Do not upload `node_modules` or `dist` (both are ignored). Share the repository link in the email reply, grant reviewer access if it is private, and include your expected salary as requested. No repository URL or expected salary has been invented in this project.
