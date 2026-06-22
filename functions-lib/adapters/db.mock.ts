import type { Lead, Purchase, ReserveResult } from "@shared/types.ts";
import { LEAD_STATUS, PURCHASE_STATUS, RESERVE_REASON } from "@shared/constants.ts";
import type { DbPort, InsertLeadInput } from "../ports/db.ts";

// In-memory DbPort with semantics identical to the SQL RPCs. Used under
// USE_STUBS and in tests. A module-level store keeps data across requests in a
// single worker/test process; pass a fresh store in tests for isolation.
export interface MockStore {
  leads: Map<string, Lead>; // keyed by id
  purchases: Map<string, Purchase>; // keyed by id
  tokenIndex: Map<string, string>; // lead_token -> lead id
}

export function createMockStore(): MockStore {
  return { leads: new Map(), purchases: new Map(), tokenIndex: new Map() };
}

const globalStore = createMockStore();

let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}

export function createMockDb(store: MockStore = globalStore): DbPort {
  function leadByToken(token: string): Lead | undefined {
    const id = store.tokenIndex.get(token);
    return id ? store.leads.get(id) : undefined;
  }

  return {
    async insertLead(input: InsertLeadInput): Promise<Lead> {
      const id = uid("lead");
      const lead: Lead = {
        id,
        lead_token: input.lead_token,
        event_type: input.event_type ?? null,
        event_date: input.event_date ?? null,
        city: input.city ?? null,
        guests: input.guests ?? null,
        budget: input.budget ?? null,
        cuisine: input.cuisine ?? null,
        kosher: input.kosher,
        client_name: input.client_name,
        client_phone: input.client_phone,
        client_email: input.client_email ?? null,
        price: input.price,
        buyers_cap: input.buyers_cap,
        buyers_count: 0,
        paid_by: [],
        status: LEAD_STATUS.available,
        source: input.source ?? null,
        created_at: new Date().toISOString(),
      };
      store.leads.set(id, lead);
      store.tokenIndex.set(lead.lead_token, id);
      return structuredClone(lead);
    },

    async getLeadByToken(token: string): Promise<Lead | null> {
      const lead = leadByToken(token);
      return lead ? structuredClone(lead) : null;
    },

    async listRecentLeads(limit: number): Promise<Lead[]> {
      return [...store.leads.values()]
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
        .slice(0, limit)
        .map((l) => structuredClone(l));
    },

    async reserveLead(token: string, chefPhone: string): Promise<ReserveResult> {
      const lead = leadByToken(token);
      if (!lead) return { ok: false, reason: RESERVE_REASON.not_found };
      if (lead.paid_by.includes(chefPhone)) {
        return { ok: false, reason: RESERVE_REASON.already_purchased };
      }
      if (lead.buyers_count >= lead.buyers_cap) {
        return { ok: false, reason: RESERVE_REASON.sold_out };
      }
      lead.buyers_count += 1;
      if (lead.buyers_count >= lead.buyers_cap) {
        lead.status = LEAD_STATUS.sold_out;
      }
      return { ok: true, reason: RESERVE_REASON.reserved };
    },

    async createPurchase(input): Promise<Purchase> {
      const id = uid("pur");
      const purchase: Purchase = {
        id,
        lead_id: input.lead_id,
        chef_phone: input.chef_phone,
        amount: input.amount,
        provider_ref: input.provider_ref ?? null,
        invoice_ref: null,
        reveal_token: input.reveal_token ?? null,
        status: PURCHASE_STATUS.pending,
        created_at: new Date().toISOString(),
      };
      store.purchases.set(id, purchase);
      return structuredClone(purchase);
    },

    async getPurchase(id: string): Promise<Purchase | null> {
      const p = store.purchases.get(id);
      return p ? structuredClone(p) : null;
    },

    async getPurchaseByProviderRef(ref: string): Promise<Purchase | null> {
      for (const p of store.purchases.values()) {
        if (p.provider_ref === ref) return structuredClone(p);
      }
      return null;
    },

    async getPurchaseByRevealToken(revealToken: string): Promise<Purchase | null> {
      for (const p of store.purchases.values()) {
        if (p.reveal_token === revealToken) return structuredClone(p);
      }
      return null;
    },

    async setPurchaseProviderRef(id: string, providerRef: string): Promise<void> {
      const p = store.purchases.get(id);
      if (p) p.provider_ref = providerRef;
    },

    async completePurchase(id: string, invoiceRef?: string | null): Promise<boolean> {
      const p = store.purchases.get(id);
      if (!p || p.status !== PURCHASE_STATUS.pending) return false;
      p.status = PURCHASE_STATUS.paid;
      if (invoiceRef) p.invoice_ref = invoiceRef;
      const lead = store.leads.get(p.lead_id);
      if (lead && !lead.paid_by.includes(p.chef_phone)) {
        lead.paid_by.push(p.chef_phone);
      }
      return true;
    },

    async releasePurchase(id: string, status: "failed" | "expired"): Promise<boolean> {
      const p = store.purchases.get(id);
      if (!p || p.status !== PURCHASE_STATUS.pending) return false;
      p.status = status;
      const lead = store.leads.get(p.lead_id);
      if (lead) {
        lead.buyers_count = Math.max(0, lead.buyers_count - 1);
        if (lead.buyers_count < lead.buyers_cap) lead.status = LEAD_STATUS.available;
      }
      return true;
    },

    async sweepStale(ttlMinutes: number): Promise<number> {
      const cutoff = Date.now() - ttlMinutes * 60_000;
      let released = 0;
      for (const p of store.purchases.values()) {
        if (p.status === PURCHASE_STATUS.pending && Date.parse(p.created_at) < cutoff) {
          if (await this.releasePurchase(p.id, "expired")) released += 1;
        }
      }
      return released;
    },
  };
}
