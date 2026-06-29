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

// ── Prepaid lead bank ───────────────────────────────────────────────────────
// Credit packages a chef can buy online (1 credit = 1 lead unlock). Owner-tunable.
export const CREDIT_PACKAGES = [
  { id: "starter", credits: 10, price: 250 },
  { id: "pro", credits: 25, price: 550 },
  { id: "max", credits: 50, price: 1000 },
] as const;
export type CreditPackageId = (typeof CREDIT_PACKAGES)[number]["id"];

export const CHEF_STATUS = {
  active: "active",
  disabled: "disabled",
} as const;
export type ChefStatus = (typeof CHEF_STATUS)[keyof typeof CHEF_STATUS];

export const CREDIT_ORDER_STATUS = {
  pending: "pending",
  paid: "paid",
  failed: "failed",
} as const;
export type CreditOrderStatus =
  (typeof CREDIT_ORDER_STATUS)[keyof typeof CREDIT_ORDER_STATUS];

// Ledger reasons (must match the chef_credit_ledger_reason_chk constraint).
export const CREDIT_REASON = {
  package: "package",
  admin_adjust: "admin_adjust",
  lead_unlock: "lead_unlock",
  refund: "refund",
} as const;
export type CreditReason = (typeof CREDIT_REASON)[keyof typeof CREDIT_REASON];

// Outcomes of a credit-based unlock (mirrors chef_unlock_lead's reason values).
export const UNLOCK_REASON = {
  unlocked: "unlocked",
  inactive: "inactive",
  insufficient_credits: "insufficient_credits",
  already_purchased: "already_purchased",
  sold_out: "sold_out",
  not_found: "not_found",
} as const;
export type UnlockReason = (typeof UNLOCK_REASON)[keyof typeof UNLOCK_REASON];
