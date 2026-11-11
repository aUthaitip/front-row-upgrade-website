# Front Row Upgrade Queue

A front-row ticket upgrade simulator built with React, TypeScript, Vite and Tailwind CSS. The selection function is independent of React and needs no backend or API keys. All sample fans and identifiers are fictional.

## Run and test

Requires Node.js 22.12+ and npm.

```sh
npm ci
npm run dev           # open the local URL printed by Vite
npm test              # 42 core tests
npm run benchmark     # separate 100,000 and 500,000-entry cases
npm run build         # strict TypeScript check and production bundle
npm run preview       # serve the production build
```

## Try it

The sample starts at **11 November 2026, 12:00 UTC** with 12 entries, four eligible groups and five exclusions. Maya wins with **174 points**.

- Change Riley's loyalty to **1,000** under **Fan groups**: Riley wins with **242 points**.
- Advance **+1 hour**: Riley is excluded because the concert has started.
- Try **+5 min**, **+15 min**, the three priority modes and **Reset**.
- Use **TH/EN** to switch languages. Inspect the winner's breakdown, top three, group connections and exclusions.

The app selects the next winner; it does not issue tickets or persist awards. Refreshing restores the sample.

## Design answers

### 1. How does the priority score work?

```text
score = wholeWaitMinutes × 2
      + min(loyaltyPoints, 1000) × 0.1
      + (VIP ? 20 : 0)
      + min(ticketValue, 10000) / 1000
      - min(groupRecentUpgrades, 1000) × 50
```

Missing, negative or non-finite optional numbers become zero. Recent upgrades use the maximum whole count among eligible group members. Loyalty and ticket contributions, then the total, are rounded to two decimals. Waiting points grow without a cap, allowing long waits to outweigh capped loyalty, VIP and ticket bonuses. Results include scores, component breakdowns and reasons.

### 2. How do you stop one fan group from dominating?

Accounts sharing a meaningful phone, device or payment identifier form one group, including indirect connections. Empty keys never connect accounts; phone formatting is normalized. Only the best individual representative occupies a candidate slot, and account scores are never added together. All members receive the group's maximum recent-upgrade penalty.

This enforces one candidate per group per selection. Preventing repeat awards in a round requires a persistent group award ledger and round ID, which this simulator does not maintain. Filtering happens before grouping, so excluded accounts cannot connect groups or contribute history.

### 3. How do you break ties?

Higher rounded score wins, then earlier exact queue join time, then smaller unique entry ID using JavaScript code-unit comparison. The same comparator selects representatives and the winner. The function uses the supplied time, has no randomness and does not mutate input.

### 4. What is the time complexity of your grouping logic?

Maps plus Union-Find with path compression and union by size give **O(n α(n)) amortized time** and **O(n) space**, assuming bounded string lengths and expected constant-time Map operations. There are no all-pairs comparisons. Keeping only the top three avoids sorting every group.

The 100k and 500k benchmarks passed. See [measurement scope and results](docs/implementation-notes.md#verification); these measure core selection, not browser responsiveness.

### 5. What may still feel unfair?

A household sharing a device or payment account may be grouped as one person, while someone with entirely separate identifiers can evade grouping. Maximum group history can undercount distinct awards or penalize a household. VIP and loyalty bonuses are product choices that should be evaluated against real outcomes.

### 6. How do the modes work?

| Mode | Effect |
| --- | --- |
| Rush Hour | Waiting weight rises from 2 to 4 points per minute. |
| VIP Hour | VIP bonus rises from 20 to 30 points. |
| Fair Queue Mode | Recent-upgrade penalty rises from 50 to 100 points per upgrade. |

Modes can be combined; eligibility, grouping, caps and tie-breaking stay the same.

### 7. What would you improve with more time?

- Use a Web Worker: the current UI recalculates synchronously and can block on large inputs, despite pagination.
- Add persistent award history and atomic award handling to enforce round limits.
- Improve country-aware phone normalization and runtime input validation.
- Add automated browser tests, memory measurements and fairness evaluation.

## Verification and further details

All **42 core tests**, both performance cases and the production build passed during the review on 11 November 2026. Tests cover all seven required scenarios plus additional edge cases. Browser interactions were not rechecked in that review; automated browser tests are not bundled.

- [API examples, input policies and implementation notes](docs/implementation-notes.md)
- [Use cases, diagrams and manual acceptance scenario](docs/use-cases-and-diagrams.md)
- [Core implementation](src/core/queue.ts) and [automated tests](src/core/queue.test.ts)

Submit the source code, this README, tests and `package-lock.json`. Exclude `node_modules` and `dist` (both are ignored).
