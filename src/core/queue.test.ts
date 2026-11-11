import { describe, expect, it } from "vitest";
import {
  buildFrontRowUpgradeQueue,
  DEFAULT_MODES,
  normalizePhone,
} from "./queue";
import type { TicketQueueEntry } from "./types";
const now = new Date("2026-11-11T12:00:00Z");
const make = (
  id: string,
  patch: Partial<TicketQueueEntry> = {},
): TicketQueueEntry => ({
  id,
  fanId: `fan-${id}`,
  fanName: id,
  status: "waiting",
  ticketValue: 1000,
  joinedQueueAt: "2026-11-11T11:00:00Z",
  eventStartsAt: "2026-11-11T15:00:00Z",
  ...patch,
});
const run = (entries: TicketQueueEntry[]) =>
  buildFrontRowUpgradeQueue(entries, now);
describe("eligibility", () => {
  it.each([
    ["cancelled", { status: "cancelled" }, "Cancelled entry"],
    ["upgraded", { status: "upgraded" }, "Already upgraded"],
    [
      "started",
      { eventStartsAt: "2026-11-11T11:59:00Z" },
      "Concert has started",
    ],
    [
      "exact start",
      { eventStartsAt: now.toISOString() },
      "Concert has started",
    ],
    ["blocked", { membership: "blocked" }, "Blocked fan"],
    [
      "bad event date",
      { eventStartsAt: "invalid" },
      "Invalid event start time",
    ],
    ["bad join date", { joinedQueueAt: "invalid" }, "Invalid queue join time"],
    [
      "future join",
      { joinedQueueAt: "2026-11-11T12:01:00Z" },
      "Queue join time is in the future",
    ],
  ] as const)("excludes %s and keeps its reason", (_, patch, reason) => {
    const result = run([
      make("invalid", { ...patch, loyaltyPoints: 1000 }),
      make("valid"),
    ]);
    expect(result.winner?.entry.id).toBe("valid");
    expect(result.excludedEntries[0].reason).toBe(reason);
    expect(result.fanGroups).toHaveLength(1);
  });
  it.each([
    null,
    "",
    " ",
    "nope",
    "100abc",
    "0x10",
    "-1",
    0,
    -1,
    NaN,
    Infinity,
    "Infinity",
  ])("rejects invalid ticket value %s", (ticketValue) => {
    const result = run([make("bad", { ticketValue })]);
    expect(result.winner).toBeNull();
    expect(result.excludedEntries[0].reason).toBe("Invalid ticket value");
  });
  it("accepts positive numeric strings and decimals", () => {
    expect(
      run([make("a", { ticketValue: " 1200.50 " })]).winner,
    ).not.toBeNull();
  });
});
describe("grouping", () => {
  it("normalizes phone formatting", () => {
    const result = run(
      ["081-234-5678", "081 234 5678", "0812345678"].map((phoneNumber, i) =>
        make(String(i), { phoneNumber }),
      ),
    );
    expect(result.fanGroups).toHaveLength(1);
    expect(result.fanGroups[0].entries).toHaveLength(3);
    expect(result.fanGroups[0].connectionReasons).toHaveLength(2);
    expect(normalizePhone("----")).toBeNull();
  });
  it("connects indirect chains across all three fields", () => {
    const result = run([
      make("a", { phoneNumber: "0812345678" }),
      make("b", { phoneNumber: "081 234 5678", deviceId: "device-1" }),
      make("c", { deviceId: "device-1", paymentAccount: "pay-1" }),
      make("d", { paymentAccount: "pay-1" }),
    ]);
    expect(result.fanGroups).toHaveLength(1);
    expect(result.fanGroups[0].entries).toHaveLength(4);
    expect(result.fanGroups[0].connectionReasons).toHaveLength(3);
  });
  it("edge case: empty, whitespace and punctuation-only keys do not connect accounts", () => {
    expect(
      run([
        make("a", { phoneNumber: "---", deviceId: " ", paymentAccount: "" }),
        make("b", { phoneNumber: "", deviceId: " ", paymentAccount: null }),
      ]).fanGroups,
    ).toHaveLength(2);
  });
  it("keeps identity namespaces separate and opaque IDs case-sensitive", () => {
    expect(
      run([
        make("a", { deviceId: "123" }),
        make("b", { paymentAccount: "123", deviceId: "ABC" }),
        make("c", { deviceId: "abc" }),
      ]).fanGroups,
    ).toHaveLength(3);
  });
  it("trims meaningful device and payment keys", () => {
    expect(
      run([make("a", { deviceId: " x " }), make("b", { deviceId: "x" })])
        .fanGroups,
    ).toHaveLength(1);
  });
  it("filters ineligible entries before grouping, so excluded accounts cannot bridge groups", () => {
    const result = run([
      make("a", { phoneNumber: "123" }),
      make("bridge", {
        status: "cancelled",
        phoneNumber: "123",
        deviceId: "x",
      }),
      make("c", { deviceId: "x" }),
    ]);
    expect(result.fanGroups).toHaveLength(2);
  });
});
describe("priority and fairness", () => {
  it("produces the expected score and auditable components", () => {
    const winner = run([
      make("a", {
        loyaltyPoints: 320,
        membership: "vip",
        upgradesLast30Days: 1,
        ticketValue: 2000,
      }),
    ]).winner!;
    expect(winner.score).toBe(124);
    expect(winner.breakdown).toEqual({
      waiting: 120,
      loyalty: 32,
      vip: 20,
      ticket: 2,
      recentUpgrades: -50,
    });
    expect(winner.reasons).toHaveLength(5);
  });
  it("same input and time produce identical results without mutation", () => {
    const entries = [make("b"), make("a")];
    const before = structuredClone(entries);
    entries.forEach(Object.freeze);
    Object.freeze(entries);
    expect(run(entries)).toEqual(run(entries));
    expect(entries).toEqual(before);
  });
  it("edge case: ties use oldest join then lexical ID regardless of input order", () => {
    expect(run([make("b"), make("a")]).winner?.entry.id).toBe("a");
    expect(run([make("a"), make("b")]).winner?.entry.id).toBe("a");
    // Same whole-minute wait, but b joined earlier by 10 seconds.
    expect(
      run([
        make("a", { joinedQueueAt: "2026-11-11T11:00:20Z" }),
        make("b", { joinedQueueAt: "2026-11-11T11:00:10Z" }),
      ]).winner?.entry.id,
    ).toBe("b");
  });
  it("many linked accounts do not accumulate points or occupy multiple top-three positions", () => {
    const entries = Array.from({ length: 100 }, (_, i) =>
      make(`linked-${i}`, { deviceId: "same", loyaltyPoints: 100 }),
    );
    const result = run([...entries, make("solo", { loyaltyPoints: 200 })]);
    expect(result.winner?.entry.id).toBe("solo");
    expect(result.topCandidates).toHaveLength(2);
    expect(
      result.fanGroups.find((g) => g.entries.length === 100)?.representative
        .score,
    ).toBe(131);
  });
  it("applies maximum group recent history to every candidate, including fresh accounts", () => {
    const result = run([
      make("old", { deviceId: "shared", upgradesLast30Days: 3 }),
      make("fresh", { deviceId: "shared" }),
      make("solo"),
    ]);
    expect(result.winner?.entry.id).toBe("solo");
    expect(
      result.fanGroups.find((g) => g.id === "fresh")?.representative.breakdown
        .recentUpgrades,
    ).toBe(-150);
  });
  it("returns top three representatives sorted correctly across more than three groups", () => {
    expect(
      run(
        [1, 5, 2, 4, 3].map((n) => make(String(n), { loyaltyPoints: n * 100 })),
      ).topCandidates.map((r) => r.entry.id),
    ).toEqual(["5", "4", "3"]);
  });
  it("uses canonical group IDs regardless of member order", () => {
    const entries = [
      make("z", { deviceId: "x" }),
      make("a", { deviceId: "x" }),
    ];
    expect(run(entries).fanGroups[0].id).toBe("a");
    expect(run([...entries].reverse()).fanGroups[0].id).toBe("a");
  });
  it("caps loyalty, ticket and recent history and normalizes bad optional numbers", () => {
    const winner = run([
      make("a", { loyaltyPoints: Infinity, upgradesLast30Days: NaN }),
    ]).winner!;
    expect(Number.isFinite(winner.score)).toBe(true);
    expect(winner.score).toBe(121);
    expect(
      run([make("a", { loyaltyPoints: 1e9, ticketValue: 1e9 })]).winner?.score,
    ).toBe(230);
    expect(
      run([make("a", { upgradesLast30Days: 1e9 })]).winner?.breakdown
        .recentUpgrades,
    ).toBe(-50000);
  });
  it("waiting eventually outweighs capped loyalty and VIP advantages", () => {
    const result = run([
      make("waiting", { joinedQueueAt: "2026-11-11T08:00:00Z" }),
      make("vip", { membership: "vip", loyaltyPoints: 1e9, ticketValue: 1e9 }),
    ]);
    expect(result.winner?.entry.id).toBe("waiting");
  });
  it.each([
    ["rushHour", 244],
    ["vipHour", 134],
    ["fairQueue", 74],
  ] as const)(
    "%s changes the corresponding priority contribution",
    (mode, expected) => {
      const result = buildFrontRowUpgradeQueue(
        [
          make("a", {
            loyaltyPoints: 320,
            membership: "vip",
            upgradesLast30Days: 1,
            ticketValue: 2000,
          }),
        ],
        now,
        { ...DEFAULT_MODES, [mode]: true },
      );
      expect(result.winner?.score).toBe(expected);
    },
  );
  it("time advancement recalculates scores and excludes a concert at its exact start", () => {
    const entry = make("a", { eventStartsAt: "2026-11-11T12:15:00Z" });
    expect(
      buildFrontRowUpgradeQueue([entry], new Date("2026-11-11T12:05:00Z"))
        .winner?.score,
    ).toBe(131);
    expect(
      buildFrontRowUpgradeQueue([entry], new Date("2026-11-11T12:15:00Z"))
        .winner,
    ).toBeNull();
  });
  it("handles empty input and all-excluded input", () => {
    expect(run([])).toMatchObject({
      winner: null,
      topCandidates: [],
      fanGroups: [],
      excludedEntries: [],
    });
    expect(run([make("a", { status: "cancelled" })]).winner).toBeNull();
  });
  it("rejects ambiguous duplicate IDs and invalid current time explicitly", () => {
    expect(() => run([make("a"), make("a")])).toThrow("unique");
    expect(() => run([make(" ")])).toThrow("non-empty");
    expect(() => buildFrontRowUpgradeQueue([], new Date("bad"))).toThrow(
      "valid Date",
    );
  });
});
