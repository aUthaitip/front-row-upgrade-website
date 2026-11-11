import type {
  TicketQueueEntry,
  PriorityModes,
  ScoreBreakdown,
  RankedEntry,
  FanGroup,
  ExcludedEntry,
  FrontRowUpgradeResult,
} from "./types";

export const DEFAULT_MODES: PriorityModes = {
  rushHour: false,
  vipHour: false,
  fairQueue: false,
};
const decimal = /^\+?(?:\d+(?:\.\d*)?|\.\d+)$/;
const round = (n: number) => Math.round(n * 100) / 100;
export const nonNegative = (n: number | null | undefined) =>
  typeof n === "number" && Number.isFinite(n) ? Math.max(0, n) : 0;
export function ticketAmount(
  value: TicketQueueEntry["ticketValue"],
): number | null {
  if (typeof value === "string" && !decimal.test(value.trim())) return null;
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : NaN;
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}
export function normalizePhone(value?: string | null): string | null {
  if (!value || !/^[\d\s()+.\-]+$/.test(value)) return null;
  return value.replace(/\D/g, "") || null;
}
const normalizedId = (value?: string | null) => value?.trim() || null;

function exclusion(entry: TicketQueueEntry, now: number): string | null {
  if (entry.status === "cancelled") return "Cancelled entry";
  if (entry.status === "upgraded") return "Already upgraded";
  if (entry.membership === "blocked") return "Blocked fan";
  const start = Date.parse(entry.eventStartsAt);
  const joined = Date.parse(entry.joinedQueueAt);
  if (!Number.isFinite(start)) return "Invalid event start time";
  if (start <= now) return "Concert has started";
  if (!Number.isFinite(joined)) return "Invalid queue join time";
  if (joined > now) return "Queue join time is in the future";
  if (ticketAmount(entry.ticketValue) === null) return "Invalid ticket value";
  return null;
}

/** Path compression and union by size. Each successful union records one proof edge. */
class UnionFind {
  private parent: Int32Array;
  private sizes: Int32Array;
  constructor(length: number) {
    this.parent = Int32Array.from({ length }, (_, i) => i);
    this.sizes = new Int32Array(length).fill(1);
  }
  find(index: number): number {
    while (this.parent[index] !== index) {
      this.parent[index] = this.parent[this.parent[index]];
      index = this.parent[index];
    }
    return index;
  }
  union(a: number, b: number): boolean {
    let x = this.find(a),
      y = this.find(b);
    if (x === y) return false;
    if (this.sizes[x] < this.sizes[y]) [x, y] = [y, x];
    this.parent[y] = x;
    this.sizes[x] += this.sizes[y];
    return true;
  }
}

function score(
  entry: TicketQueueEntry,
  now: number,
  recent: number,
  modes: PriorityModes,
) {
  const waitMinutes = Math.floor(
    (now - Date.parse(entry.joinedQueueAt)) / 60_000,
  );
  const breakdown: ScoreBreakdown = {
    waiting: waitMinutes * (modes.rushHour ? 4 : 2),
    loyalty: round(Math.min(nonNegative(entry.loyaltyPoints), 1000) * 0.1),
    vip: entry.membership === "vip" ? (modes.vipHour ? 30 : 20) : 0,
    ticket: round(Math.min(ticketAmount(entry.ticketValue)!, 10_000) / 1000),
    recentUpgrades:
      recent > 0 ? -Math.min(recent, 1000) * (modes.fairQueue ? 100 : 50) : 0,
  };
  return {
    waitMinutes,
    breakdown,
    score: round(Object.values(breakdown).reduce((a, b) => a + b, 0)),
  };
}
/** Negative means a ranks ahead of b. No locale-dependent collation or array order ties. */
export function compareCandidates(a: RankedEntry, b: RankedEntry): number {
  return (
    b.score - a.score ||
    Date.parse(a.entry.joinedQueueAt) - Date.parse(b.entry.joinedQueueAt) ||
    (a.entry.id < b.entry.id ? -1 : a.entry.id > b.entry.id ? 1 : 0)
  );
}
function explain(b: ScoreBreakdown, wait: number, recent: number): string[] {
  return [
    `Waiting ${wait} min: +${b.waiting}`,
    `Loyalty (capped at 1,000): +${b.loyalty}`,
    `VIP membership: +${b.vip}`,
    `Ticket value (bonus capped at 10): +${b.ticket}`,
    `Group recent upgrades ${recent} (penalty count capped at 1,000): ${b.recentUpgrades}`,
  ];
}

/** Pure selection: never changes input, never reads the wall clock, never uses randomness. */
export function buildFrontRowUpgradeQueue(
  entries: readonly TicketQueueEntry[],
  now: Date,
  modes: PriorityModes = DEFAULT_MODES,
): FrontRowUpgradeResult {
  const timestamp = now.getTime();
  if (!Number.isFinite(timestamp)) throw new Error("now must be a valid Date");
  const eligible: TicketQueueEntry[] = [];
  const excludedEntries: ExcludedEntry[] = [];
  const ids = new Set<string>();
  for (const entry of entries) {
    if (!entry.id.trim() || ids.has(entry.id))
      throw new Error("Entry IDs must be non-empty and unique");
    ids.add(entry.id);
    const reason = exclusion(entry, timestamp);
    if (reason) excludedEntries.push({ entry, reason });
    else eligible.push(entry);
  }
  const uf = new UnionFind(eligible.length);
  const fields = ["phoneNumber", "deviceId", "paymentAccount"] as const;
  const edges: { a: number; b: number; kind: string }[] = [];
  // Separate namespaces prevent a phone number matching a device or payment ID.
  for (const field of fields) {
    const seen = new Map<string, number>();
    eligible.forEach((entry, index) => {
      const key =
        field === "phoneNumber"
          ? normalizePhone(entry[field])
          : normalizedId(entry[field]);
      if (!key) return;
      const previous = seen.get(key);
      if (previous === undefined) seen.set(key, index);
      else if (uf.union(previous, index))
        edges.push({ a: previous, b: index, kind: field });
    });
  }
  const byRoot = new Map<number, TicketQueueEntry[]>();
  eligible.forEach((entry, index) => {
    const root = uf.find(index);
    const group = byRoot.get(root);
    if (group) group.push(entry);
    else byRoot.set(root, [entry]);
  });
  const connections = new Map<number, string[]>();
  const labels: Record<string, string> = {
    phoneNumber: "phone number",
    deviceId: "device ID",
    paymentAccount: "payment account",
  };
  for (const edge of edges) {
    const root = uf.find(edge.a);
    const text = `${eligible[edge.a].id} ↔ ${eligible[edge.b].id}: shared ${labels[edge.kind]}`;
    const reasons = connections.get(root);
    if (reasons) reasons.push(text);
    else connections.set(root, [text]);
  }
  const fanGroups: FanGroup[] = [];
  const topCandidates: RankedEntry[] = [];
  for (const [root, members] of byRoot) {
    let id = members[0].id,
      recent = 0;
    for (const member of members) {
      if (member.id < id) id = member.id;
      recent = Math.max(
        recent,
        Math.floor(nonNegative(member.upgradesLast30Days)),
      );
    }
    let best: RankedEntry | null = null;
    for (const entry of members) {
      const candidate: RankedEntry = {
        entry,
        ...score(entry, timestamp, recent, modes),
        reasons: [],
        groupId: id,
      };
      if (!best || compareCandidates(candidate, best) < 0) best = candidate;
    }
    const representative = best!;
    representative.reasons = explain(
      representative.breakdown,
      representative.waitMinutes,
      recent,
    );
    fanGroups.push({
      id,
      entries: members,
      representative,
      connectionReasons: connections.get(root) ?? [],
      recentUpgrades: recent,
    });
    // Keep only three, avoiding a full O(g log g) sort of all representatives.
    const insertion = topCandidates.findIndex(
      (candidate) => compareCandidates(representative, candidate) < 0,
    );
    if (insertion >= 0) topCandidates.splice(insertion, 0, representative);
    else if (topCandidates.length < 3) topCandidates.push(representative);
    if (topCandidates.length > 3) topCandidates.pop();
  }
  return {
    winner: topCandidates[0] ?? null,
    topCandidates,
    fanGroups,
    excludedEntries,
    selectionReason: topCandidates.length
      ? "Highest-scoring group representative. Ties: earliest queue join, then smallest entry ID."
      : "No eligible entries remain.",
  };
}
