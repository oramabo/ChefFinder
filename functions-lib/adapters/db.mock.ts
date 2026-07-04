import type { Lead, Purchase, ReserveResult, JoinApplication } from "@shared/types.ts";
import {
  LEAD_STATUS,
  PURCHASE_STATUS,
  RESERVE_REASON,
  JOIN_STATUS,
  COMPLETE_RESULT,
  type JoinStatus,
  type CompleteResult,
  type OtpVerifyStatus,
} from "@shared/constants.ts";
import type { DbPort, InsertLeadInput, InsertJoinApplicationInput } from "../ports/db.ts";

// In-memory DbPort with semantics identical to the SQL RPCs. Used under
// USE_STUBS and in tests. A module-level store keeps data across requests in a
// single worker/test process; pass a fresh store in tests for isolation.
interface MockOtp {
  code_hash: string;
  attempts: number;
  expires_at: number; // epoch ms
  created_at: number; // epoch ms
}

export interface MockStore {
  leads: Map<string, Lead>; // keyed by id
  purchases: Map<string, Purchase>; // keyed by id
  tokenIndex: Map<string, string>; // lead_token -> lead id
  joinApplications: Map<string, JoinApplication>; // keyed by id
  otps: Map<string, MockOtp>; // keyed by normalized phone
}

export function createMockStore(): MockStore {
  return {
    leads: new Map(),
    purchases: new Map(),
    tokenIndex: new Map(),
    joinApplications: new Map(),
    otps: new Map(),
  };
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
        service_slug: input.service_slug ?? "chefs",
        details: input.details ?? null,
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

    async getLeadById(id: string): Promise<Lead | null> {
      const lead = store.leads.get(id);
      return lead ? structuredClone(lead) : null;
    },

    async listRecentLeads(limit: number): Promise<Lead[]> {
      return [...store.leads.values()]
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
        .slice(0, limit)
        .map((l) => structuredClone(l));
    },

    async listPendingPurchases(limit: number) {
      return [...store.purchases.values()]
        .filter((p) => p.status === PURCHASE_STATUS.pending)
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
        .slice(0, limit)
        .map((p) => {
          const lead = store.leads.get(p.lead_id);
          return {
            id: p.id,
            chef_phone: p.chef_phone,
            amount: p.amount,
            created_at: p.created_at,
            lead_token: lead?.lead_token ?? "",
            city: lead?.city ?? null,
            event_type: lead?.event_type ?? null,
          };
        });
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

    async completePurchase(id: string, invoiceRef?: string | null): Promise<CompleteResult> {
      const p = store.purchases.get(id);
      if (!p) return COMPLETE_RESULT.not_found;
      if (p.status === PURCHASE_STATUS.paid) return COMPLETE_RESULT.noop;

      const lead = store.leads.get(p.lead_id);
      const wasReleased =
        p.status === PURCHASE_STATUS.expired || p.status === PURCHASE_STATUS.failed;
      if (wasReleased) {
        // Late payment: the held slot was released by the sweep/failure — retake
        // it only if capacity remains, otherwise the operator must refund.
        if (!lead || lead.buyers_count >= lead.buyers_cap) return COMPLETE_RESULT.conflict;
        lead.buyers_count += 1;
        if (lead.buyers_count >= lead.buyers_cap) lead.status = LEAD_STATUS.sold_out;
      }

      p.status = PURCHASE_STATUS.paid;
      if (invoiceRef) p.invoice_ref = invoiceRef;
      if (lead && !lead.paid_by.includes(p.chef_phone)) {
        lead.paid_by.push(p.chef_phone);
      }
      return wasReleased ? COMPLETE_RESULT.recovered : COMPLETE_RESULT.completed;
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

    async getPaidPurchasesForLead(leadId: string): Promise<Purchase[]> {
      return [...store.purchases.values()]
        .filter((p) => p.lead_id === leadId && p.status === PURCHASE_STATUS.paid)
        .map((p) => structuredClone(p));
    },

    async saveOtp(
      phone: string,
      codeHash: string,
      ttlMinutes: number,
      minIntervalSeconds: number,
    ): Promise<boolean> {
      const existing = store.otps.get(phone);
      const now = Date.now();
      if (existing && now - existing.created_at < minIntervalSeconds * 1000) {
        return false;
      }
      store.otps.set(phone, {
        code_hash: codeHash,
        attempts: 0,
        expires_at: now + ttlMinutes * 60_000,
        created_at: now,
      });
      return true;
    },

    async verifyOtp(
      phone: string,
      codeHash: string,
      maxAttempts: number,
    ): Promise<OtpVerifyStatus> {
      const r = store.otps.get(phone);
      if (!r) return "not_found";
      if (r.expires_at < Date.now()) {
        store.otps.delete(phone);
        return "expired";
      }
      if (r.attempts >= maxAttempts) {
        store.otps.delete(phone);
        return "too_many_attempts";
      }
      if (r.code_hash !== codeHash) {
        r.attempts += 1;
        return "mismatch";
      }
      store.otps.delete(phone); // single use
      return "ok";
    },

    async insertJoinApplication(input: InsertJoinApplicationInput): Promise<JoinApplication> {
      const id = uid("join");
      const app: JoinApplication = {
        id,
        full_name: input.full_name,
        business_name: input.business_name ?? null,
        category: input.category,
        city: input.city,
        phone: input.phone,
        email: input.email ?? null,
        message: input.message ?? null,
        source: input.source ?? null,
        status: JOIN_STATUS.new,
        created_at: new Date().toISOString(),
      };
      store.joinApplications.set(id, app);
      return structuredClone(app);
    },

    async listJoinApplications(limit: number): Promise<JoinApplication[]> {
      return [...store.joinApplications.values()]
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
        .slice(0, limit)
        .map((a) => structuredClone(a));
    },

    async updateJoinApplicationStatus(id: string, status: JoinStatus): Promise<boolean> {
      const app = store.joinApplications.get(id);
      if (!app) return false;
      app.status = status;
      return true;
    },
  };
}
