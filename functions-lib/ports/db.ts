import type {
  Lead,
  Purchase,
  PendingPurchase,
  ReserveResult,
  JoinApplication,
} from "@shared/types.ts";
import type { JoinStatus, CompleteResult } from "@shared/constants.ts";

export interface InsertJoinApplicationInput {
  full_name: string;
  business_name?: string | null;
  category: string;
  city: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  source?: string | null;
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
  service_slug?: string;
  details?: Record<string, unknown> | null;
}

// All database access goes through this port. Real adapter wraps Supabase RPC +
// REST; the mock implements identical semantics in memory for tests.
export interface DbPort {
  insertLead(input: InsertLeadInput): Promise<Lead>;
  getLeadByToken(token: string): Promise<Lead | null>;
  getLeadById(id: string): Promise<Lead | null>;
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
  // Mark a purchase paid and append the chef to lead.paid_by. Handles late
  // payments on expired/failed purchases (slot retake) — see COMPLETE_RESULT.
  completePurchase(id: string, invoiceRef?: string | null): Promise<CompleteResult>;
  // pending -> failed|expired, decrement buyers_count (idempotent). true if released.
  releasePurchase(id: string, status: "failed" | "expired"): Promise<boolean>;
  sweepStale(ttlMinutes: number): Promise<number>;
  // ── Join applications (ezfind "join the network" intake) ─────────────────
  insertJoinApplication(input: InsertJoinApplicationInput): Promise<JoinApplication>;
  // Operator view: most-recent applications first (admin-gated callers only).
  listJoinApplications(limit: number): Promise<JoinApplication[]>;
  // Update an application's lifecycle status. true if a row was updated.
  updateJoinApplicationStatus(id: string, status: JoinStatus): Promise<boolean>;
}
