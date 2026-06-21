// Isomorphic constants shared by the browser SPA and the edge Functions.
// Keep this file free of Node and DOM APIs.

export const DEFAULT_PRICE = 30; // ILS per unlock
export const DEFAULT_CAP = 3; // chefs per lead

// Minutes a pending reservation holds a slot before the sweep reopens it.
export const RESERVATION_TTL_MINUTES = 20;

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
} as const;
export type ReserveReason =
  (typeof RESERVE_REASON)[keyof typeof RESERVE_REASON];

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

export const CUISINES = [
  { slug: "italian", he: "איטלקי" },
  { slug: "mediterranean", he: "ים תיכוני" },
  { slug: "asian", he: "אסייתי" },
  { slug: "french", he: "צרפתי" },
  { slug: "meat", he: "על האש / בשרים" },
  { slug: "vegan", he: "טבעוני / צמחוני" },
  { slug: "chefs-choice", he: "בחירת השף" },
] as const;
