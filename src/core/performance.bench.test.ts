import { expect, it } from "vitest";
import { buildFrontRowUpgradeQueue } from "./queue";
import type { TicketQueueEntry } from "./types";
for (const count of [100_000, 500_000]) {
  it(`selects from ${count.toLocaleString("en-US")} entries without pairwise comparisons`, () => {
    const entries: TicketQueueEntry[] = Array.from(
      { length: count },
      (_, i) => ({
        id: String(i).padStart(6, "0"),
        fanId: `fan-${i}`,
        fanName: `Fan ${i}`,
        status: "waiting",
        ticketValue: 1000,
        loyaltyPoints: i % 1000,
        joinedQueueAt: "2026-11-11T11:00:00Z",
        eventStartsAt: "2026-11-11T15:00:00Z",
        // Mix independent fans with groups of three, including indirect connections.
        deviceId: i % 5 === 0 ? null : `device-${Math.floor(i / 3)}`,
        paymentAccount: i % 5 === 0 ? null : `payment-${Math.floor(i / 3)}`,
      }),
    );
    const start = performance.now();
    const result = buildFrontRowUpgradeQueue(
      entries,
      new Date("2026-11-11T12:00:00Z"),
    );
    const elapsed = performance.now() - start;
    console.info(
      `${count} entries: ${elapsed.toFixed(0)} ms, ${result.fanGroups.length} groups`,
    );
    expect(
      result.fanGroups.reduce(
        (total, group) => total + group.entries.length,
        0,
      ),
    ).toBe(count);
    expect(result.winner?.entry.id).toBe("000999");
    expect(result.excludedEntries).toHaveLength(0);
    expect(result.topCandidates).toHaveLength(3);
  }, 60_000);
}
