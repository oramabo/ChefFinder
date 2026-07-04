// Isomorphic constants shared by the browser SPA and the edge Functions.
// Keep this file free of Node and DOM APIs.

export const DEFAULT_PRICE = 30; // ILS per unlock
export const DEFAULT_CAP = 3; // chefs per lead

// Lead price (ILS) by the client's budget band — a bigger event is worth more
// to a chef. Ordered high→low; the first tier whose minBudget the lead's
// budget meets wins, otherwise DEFAULT_PRICE. Prices are stamped on the lead
// row at creation time, so tuning these never reprices existing leads.
export const LEAD_PRICE_TIERS: { minBudget: number; price: number }[] = [
  { minBudget: 12000, price: 50 },
  { minBudget: 5000, price: 40 },
];

export function leadPrice(budget?: number | null): number {
  if (budget == null) return DEFAULT_PRICE;
  return LEAD_PRICE_TIERS.find((t) => budget >= t.minBudget)?.price ?? DEFAULT_PRICE;
}

// Minutes a pending reservation holds a slot before the sweep reopens it.
export const RESERVATION_TTL_MINUTES = 20;

// A lead with no event date goes stale this many days after creation; a dated
// lead expires once its event date passes. Expired leads can't be reserved.
export const LEAD_MAX_AGE_DAYS = 30;

export const LEAD_STATUS = {
  available: "available",
  sold_out: "sold_out",
} as const;
export type LeadStatus = (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS];

export const PURCHASE_STATUS = {
  pending: "pending",
  paid: "paid",
  failed: "failed",
  expired: "expired",
} as const;
export type PurchaseStatus =
  (typeof PURCHASE_STATUS)[keyof typeof PURCHASE_STATUS];

export const RESERVE_REASON = {
  reserved: "reserved",
  already_purchased: "already_purchased",
  sold_out: "sold_out",
  not_found: "not_found",
  expired: "expired",
} as const;
export type ReserveReason =
  (typeof RESERVE_REASON)[keyof typeof RESERVE_REASON];

// Outcome of complete_purchase. `completed` is the normal pending→paid path.
// `recovered` means the payment landed after the reservation was released
// (expired/failed) and the slot was successfully retaken. `conflict` means the
// payment landed late AND the lead has since sold to capacity — the chef paid
// but can't be given the slot, so the operator must refund.
export const COMPLETE_RESULT = {
  completed: "completed",
  recovered: "recovered",
  conflict: "conflict",
  noop: "noop",
  not_found: "not_found",
} as const;
export type CompleteResult =
  (typeof COMPLETE_RESULT)[keyof typeof COMPLETE_RESULT];

// Event types offered in the qualifying form (slug + Hebrew label).
export const EVENT_TYPES = [
  { slug: "birthday", he: "יום הולדת" },
  { slug: "anniversary", he: "יום נישואין" },
  { slug: "family", he: "ארוחה משפחתית" },
  { slug: "business", he: "אירוע עסקי" },
  { slug: "romantic", he: "ארוחה זוגית" },
  { slug: "holiday", he: "אירוח חג" },
  { slug: "other", he: "אחר" },
] as const;

// Budget bands (ILS). Used by the form and shown to chefs as a range.
export const BUDGET_BANDS = [
  { value: 1500, he: "עד ₪1,500" },
  { value: 3000, he: "₪1,500–₪3,000" },
  { value: 5000, he: "₪3,000–₪5,000" },
  { value: 8000, he: "₪5,000–₪8,000" },
  { value: 12000, he: "₪8,000 ומעלה" },
] as const;

// Lifecycle status of a join application, managed by an operator in the admin.
export const JOIN_STATUS = {
  new: "new",
  contacted: "contacted",
  approved: "approved",
  rejected: "rejected",
} as const;
export type JoinStatus = (typeof JOIN_STATUS)[keyof typeof JOIN_STATUS];

// Service categories offered across the ezfind network. Used by the umbrella
// "join the service" landing form (slug + Hebrew label).
export const JOIN_CATEGORIES = [
  { slug: "chef", he: "שף פרטי" },
  { slug: "catering", he: "קייטרינג" },
  { slug: "photography", he: "צילום" },
  { slug: "music-dj", he: "מוזיקה / דיג'יי" },
  { slug: "events", he: "הפקת אירועים" },
  { slug: "beauty", he: "יופי ואיפור" },
  { slug: "cleaning", he: "ניקיון" },
  { slug: "other", he: "אחר" },
] as const;

export const CUISINES = [
  { slug: "italian", he: "איטלקי" },
  { slug: "mediterranean", he: "ים תיכוני" },
  { slug: "asian", he: "אסייתי" },
  { slug: "french", he: "צרפתי" },
  { slug: "meat", he: "על האש / בשרים" },
  { slug: "vegan", he: "טבעוני / צמחוני" },
  { slug: "chefs-choice", he: "בחירת השף" },
] as const;
