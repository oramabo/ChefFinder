import type { Lead, Purchase, ReserveResult } from "@shared/types.ts";

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
  reserveLead(token: string, chefPhone: string): Promise<ReserveResult>;
  createPurchase(input: {
    lead_id: string;
    chef_phone: string;
    amount: number;
    provider_ref?: string | null;
  }): Promise<Purchase>;
  getPurchase(id: string): Promise<Purchase | null>;
  getPurchaseByProviderRef(ref: string): Promise<Purchase | null>;
  setPurchaseProviderRef(id: string, providerRef: string): Promise<void>;
  // pending -> paid, append chef to lead.paid_by (idempotent). true if transitioned.
  completePurchase(id: string, invoiceRef?: string | null): Promise<boolean>;
  // pending -> failed|expired, decrement buyers_count (idempotent). true if released.
  releasePurchase(id: string, status: "failed" | "expired"): Promise<boolean>;
  sweepStale(ttlMinutes: number): Promise<number>;
}
