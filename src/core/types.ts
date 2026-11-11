export type TicketQueueEntry = {
  id: string;
  fanId: string;
  fanName: string;
  ticketValue: string | number | null;
  joinedQueueAt: string;
  eventStartsAt: string;
  status: "waiting" | "upgraded" | "cancelled";
  loyaltyPoints?: number | null;
  upgradesLast30Days?: number | null;
  membership?: "regular" | "vip" | "blocked";
  phoneNumber?: string | null;
  deviceId?: string | null;
  paymentAccount?: string | null;
};
export type PriorityModes = {
  rushHour: boolean;
  vipHour: boolean;
  fairQueue: boolean;
};
export type ScoreBreakdown = {
  waiting: number;
  loyalty: number;
  vip: number;
  ticket: number;
  recentUpgrades: number;
};
export type RankedEntry = {
  entry: TicketQueueEntry;
  score: number;
  reasons: string[];
  breakdown: ScoreBreakdown;
  waitMinutes: number;
  groupId: string;
};
export type FanGroup = {
  id: string;
  entries: TicketQueueEntry[];
  representative: RankedEntry;
  connectionReasons: string[];
  recentUpgrades: number;
};
export type ExcludedEntry = { entry: TicketQueueEntry; reason: string };
export type FrontRowUpgradeResult = {
  winner: RankedEntry | null;
  topCandidates: RankedEntry[];
  fanGroups: FanGroup[];
  excludedEntries: ExcludedEntry[];
  selectionReason: string;
};
