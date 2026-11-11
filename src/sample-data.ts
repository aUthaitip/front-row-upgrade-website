import type { TicketQueueEntry } from "./core/types";
export const INITIAL_TIME = "2026-11-11T12:00:00.000Z";
const entry = (
  id: string,
  fanName: string,
  patch: Partial<TicketQueueEntry> = {},
): TicketQueueEntry => ({
  id,
  fanId: `fan-${id}`,
  fanName,
  status: "waiting",
  ticketValue: 2000,
  loyaltyPoints: 0,
  upgradesLast30Days: 0,
  membership: "regular",
  joinedQueueAt: "2026-11-11T11:00:00Z",
  eventStartsAt: "2026-11-11T15:00:00Z",
  ...patch,
});
export const SAMPLE_ENTRIES: TicketQueueEntry[] = [
  entry("q-001", "Maya Chen", {
    loyaltyPoints: 320,
    membership: "vip",
    phoneNumber: "081-234-5678",
  }),
  entry("q-002", "Maya · second account", {
    loyaltyPoints: 200,
    phoneNumber: "081 234 5678",
    deviceId: "device-maya",
    joinedQueueAt: "2026-11-11T11:20:00Z",
  }),
  entry("q-003", "Maya · mobile account", {
    loyaltyPoints: 100,
    deviceId: "device-maya",
    joinedQueueAt: "2026-11-11T11:30:00Z",
  }),
  entry("q-004", "Jordan Park", {
    loyaltyPoints: 500,
    membership: "vip",
    upgradesLast30Days: 1,
    joinedQueueAt: "2026-11-11T10:45:00Z",
  }),
  entry("q-005", "Riley Gomez", {
    loyaltyPoints: 200,
    joinedQueueAt: "2026-11-11T10:50:00Z",
    eventStartsAt: "2026-11-11T12:45:00Z",
  }),
  entry("q-006", "Alex Rivera", {
    loyaltyPoints: 400,
    paymentAccount: "payment-alex",
    joinedQueueAt: "2026-11-11T11:30:00Z",
  }),
  entry("q-007", "Alex · linked account", {
    loyaltyPoints: 100,
    paymentAccount: "payment-alex",
    joinedQueueAt: "2026-11-11T11:40:00Z",
  }),
  entry("q-008", "Casey Lin", { status: "cancelled" }),
  entry("q-009", "Sam Wilson", { status: "upgraded" }),
  entry("q-010", "Taylor Brooks", { membership: "blocked" }),
  entry("q-011", "Jamie Lee", { ticketValue: "invalid" }),
  entry("q-012", "Morgan Wells", { eventStartsAt: "2026-11-11T11:00:00Z" }),
];
