import type {
  Lead,
  PublicLead,
  Purchase,
  PendingPurchase,
  ReserveResult,
  Chef,
  ChefPublic,
  ChefUnlockResult,
  ChefLeadPurchase,
  CreditLedgerEntry,
  CreditOrder,
  PendingCreditOrder,
} from "@shared/types.ts";
import type { ChefStatus, CreditReason } from "@shared/constants.ts";

export interface CreateChefInput {
  phone: string;
  name?: string | null;
  email?: string | null;
  password_hash: string;
  credits?: number;
}

export interface MarketplaceFilters {
  city?: string | null;
  cuisine?: string | null;
}

export interface InsertLeadInput {
  lead_token: string;
  event_type?: string | null;
  event_date?: string | null;
  city?: string | null;
  guests?: number | null;
  budget?: number | null;
  cuisine?: string | null;
  kosher: boolean;
  client_name: string;
  client_phone: string;
  client_email?: string | null;
  price: number;
  buyers_cap: number;
  source?: string | null;
}

// All database access goes through this port. Real adapter wraps Supabase RPC +
// REST; the mock implements identical semantics in memory for tests.
export interface DbPort {
  insertLead(input: InsertLeadInput): Promise<Lead>;
  getLeadByToken(token: string): Promise<Lead | null>;
  // Operator view: most-recent leads first (includes PII; admin-gated callers only).
  listRecentLeads(limit: number): Promise<Lead[]>;
  // Operator view: pending purchases awaiting manual confirmation, newest first.
  listPendingPurchases(limit: number): Promise<PendingPurchase[]>;
  reserveLead(token: string, chefPhone: string): Promise<ReserveResult>;
  createPurchase(input: {
    lead_id: string;
    chef_phone: string;
    amount: number;
    provider_ref?: string | null;
    reveal_token?: string | null;
  }): Promise<Purchase>;
  getPurchase(id: string): Promise<Purchase | null>;
  getPurchaseByProviderRef(ref: string): Promise<Purchase | null>;
  getPurchaseByRevealToken(revealToken: string): Promise<Purchase | null>;
  setPurchaseProviderRef(id: string, providerRef: string): Promise<void>;
  // pending -> paid, append chef to lead.paid_by (idempotent). true if transitioned.
  completePurchase(id: string, invoiceRef?: string | null): Promise<boolean>;
  // pending -> failed|expired, decrement buyers_count (idempotent). true if released.
  releasePurchase(id: string, status: "failed" | "expired"): Promise<boolean>;
  sweepStale(ttlMinutes: number): Promise<number>;

  // ── Prepaid lead bank ─────────────────────────────────────────────────────
  // Chef accounts (phone is the unique login id).
  createChef(input: CreateChefInput): Promise<Chef>;
  getChefByPhone(phone: string): Promise<Chef | null>;
  getChefById(id: string): Promise<Chef | null>;
  // Admin list; optional case-insensitive match on phone/name/email.
  listChefs(query: string | null, limit: number): Promise<ChefPublic[]>;
  updateChefPassword(id: string, passwordHash: string): Promise<void>;
  updateChefStatus(id: string, status: ChefStatus): Promise<void>;

  // Credit balance ops (atomic via RPC). addCredits adjusts by delta and logs a
  // ledger entry; unlockLeadWithCredit spends 1 credit + reveals a lead in one tx.
  addCredits(
    chefId: string,
    delta: number,
    reason: CreditReason,
    ref?: string | null,
    note?: string | null,
  ): Promise<{ ok: boolean; balance_after: number }>;
  unlockLeadWithCredit(token: string, chefId: string, revealToken: string): Promise<ChefUnlockResult>;
  getChefLedger(chefId: string, limit: number): Promise<CreditLedgerEntry[]>;
  // The chef's paid unlocks (keyed by their phone), with contact details.
  listChefLeadPurchases(chefPhone: string, limit: number): Promise<ChefLeadPurchase[]>;
  // Marketplace: available leads (PII-free) the chef hasn't already opened.
  listAvailableLeadsForChef(
    chefPhone: string,
    filters: MarketplaceFilters,
    limit: number,
  ): Promise<PublicLead[]>;

  // Online credit-package orders (reuse the payment provider + manual-Bit flow).
  createCreditOrder(input: {
    chef_id: string;
    credits: number;
    amount: number;
    provider_ref?: string | null;
  }): Promise<CreditOrder>;
  getCreditOrder(id: string): Promise<CreditOrder | null>;
  getCreditOrderByProviderRef(ref: string): Promise<CreditOrder | null>;
  setCreditOrderProviderRef(id: string, providerRef: string): Promise<void>;
  // pending -> paid + grant credits (idempotent). Returns credits granted (0 if no-op).
  completeCreditOrder(id: string, invoiceRef?: string | null): Promise<{ ok: boolean; credited: number }>;
  failCreditOrder(id: string): Promise<boolean>;
  listPendingCreditOrders(limit: number): Promise<PendingCreditOrder[]>;
}
