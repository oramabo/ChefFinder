import type {
  Lead,
  PublicLead,
  Purchase,
  ReserveResult,
  Chef,
  ChefPublic,
  ChefUnlockResult,
  ChefLeadPurchase,
  CreditLedgerEntry,
  CreditOrder,
  PendingCreditOrder,
} from "@shared/types.ts";
import { toChefPublic, toPublicLead } from "@shared/types.ts";
import { LEAD_STATUS, PURCHASE_STATUS, RESERVE_REASON } from "@shared/constants.ts";
import type { DbPort, InsertLeadInput } from "../ports/db.ts";

// In-memory DbPort with semantics identical to the SQL RPCs. Used under
// USE_STUBS and in tests. A module-level store keeps data across requests in a
// single worker/test process; pass a fresh store in tests for isolation.
export interface MockStore {
  leads: Map<string, Lead>; // keyed by id
  purchases: Map<string, Purchase>; // keyed by id
  tokenIndex: Map<string, string>; // lead_token -> lead id
  chefs: Map<string, Chef>; // keyed by id
  chefPhoneIndex: Map<string, string>; // phone -> chef id
  ledger: CreditLedgerEntry[];
  creditOrders: Map<string, CreditOrder>; // keyed by id
}

export function createMockStore(): MockStore {
  return {
    leads: new Map(),
    purchases: new Map(),
    tokenIndex: new Map(),
    chefs: new Map(),
    chefPhoneIndex: new Map(),
    ledger: [],
    creditOrders: new Map(),
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
        paid_from_credits: false,
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

    // ── Prepaid lead bank ─────────────────────────────────────────────────
    async createChef(input): Promise<Chef> {
      if (store.chefPhoneIndex.has(input.phone)) {
        throw new Error("createChef: phone already exists");
      }
      const id = uid("chef");
      const now = new Date().toISOString();
      const chef: Chef = {
        id,
        phone: input.phone,
        name: input.name ?? null,
        email: input.email ?? null,
        password_hash: input.password_hash,
        credits: input.credits ?? 0,
        status: "active",
        created_at: now,
        updated_at: now,
      };
      store.chefs.set(id, chef);
      store.chefPhoneIndex.set(chef.phone, id);
      return structuredClone(chef);
    },

    async getChefByPhone(phone): Promise<Chef | null> {
      const id = store.chefPhoneIndex.get(phone);
      const chef = id ? store.chefs.get(id) : undefined;
      return chef ? structuredClone(chef) : null;
    },

    async getChefById(id): Promise<Chef | null> {
      const chef = store.chefs.get(id);
      return chef ? structuredClone(chef) : null;
    },

    async listChefs(query, limit): Promise<ChefPublic[]> {
      const q = (query ?? "").trim().toLowerCase();
      return [...store.chefs.values()]
        .filter((c) =>
          !q ||
          c.phone.toLowerCase().includes(q) ||
          (c.name ?? "").toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q),
        )
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
        .slice(0, limit)
        .map((c) => toChefPublic(structuredClone(c)));
    },

    async updateChefPassword(id, passwordHash): Promise<void> {
      const chef = store.chefs.get(id);
      if (chef) {
        chef.password_hash = passwordHash;
        chef.updated_at = new Date().toISOString();
      }
    },

    async updateChefStatus(id, status): Promise<void> {
      const chef = store.chefs.get(id);
      if (chef) {
        chef.status = status;
        chef.updated_at = new Date().toISOString();
      }
    },

    async addCredits(chefId, delta, reason, ref, note): Promise<{ ok: boolean; balance_after: number }> {
      const chef = store.chefs.get(chefId);
      if (!chef) return { ok: false, balance_after: 0 };
      const next = chef.credits + delta;
      if (next < 0) return { ok: false, balance_after: chef.credits };
      chef.credits = next;
      chef.updated_at = new Date().toISOString();
      store.ledger.push({
        id: uid("led"),
        chef_id: chefId,
        delta,
        reason,
        balance_after: next,
        ref: ref ?? null,
        note: note ?? null,
        created_at: new Date().toISOString(),
      });
      return { ok: true, balance_after: next };
    },

    async unlockLeadWithCredit(token, chefId, revealToken): Promise<ChefUnlockResult> {
      const chef = store.chefs.get(chefId);
      if (!chef || chef.status !== "active") {
        return { ok: false, reason: "inactive", purchase_id: null };
      }
      if (chef.credits < 1) {
        return { ok: false, reason: "insufficient_credits", purchase_id: null };
      }
      const lead = leadByToken(token);
      if (!lead) return { ok: false, reason: "not_found", purchase_id: null };
      if (lead.paid_by.includes(chef.phone)) {
        return { ok: false, reason: "already_purchased", purchase_id: null };
      }
      if (lead.buyers_count >= lead.buyers_cap) {
        return { ok: false, reason: "sold_out", purchase_id: null };
      }

      // Hold the slot, deduct the credit, record a paid purchase + ledger.
      lead.buyers_count += 1;
      if (lead.buyers_count >= lead.buyers_cap) lead.status = LEAD_STATUS.sold_out;
      chef.credits -= 1;
      chef.updated_at = new Date().toISOString();

      const id = uid("pur");
      const purchase: Purchase = {
        id,
        lead_id: lead.id,
        chef_phone: chef.phone,
        amount: lead.price,
        provider_ref: null,
        invoice_ref: null,
        reveal_token: revealToken,
        status: PURCHASE_STATUS.paid,
        paid_from_credits: true,
        created_at: new Date().toISOString(),
      };
      store.purchases.set(id, purchase);
      lead.paid_by.push(chef.phone);
      store.ledger.push({
        id: uid("led"),
        chef_id: chefId,
        delta: -1,
        reason: "lead_unlock",
        balance_after: chef.credits,
        ref: id,
        note: null,
        created_at: new Date().toISOString(),
      });
      return { ok: true, reason: "unlocked", purchase_id: id };
    },

    async getChefLedger(chefId, limit): Promise<CreditLedgerEntry[]> {
      return store.ledger
        .filter((e) => e.chef_id === chefId)
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
        .slice(0, limit)
        .map((e) => structuredClone(e));
    },

    async listChefLeadPurchases(chefPhone, limit): Promise<ChefLeadPurchase[]> {
      return [...store.purchases.values()]
        .filter((p) => p.chef_phone === chefPhone && p.status === PURCHASE_STATUS.paid)
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
        .slice(0, limit)
        .map((p) => {
          const lead = store.leads.get(p.lead_id);
          return {
            purchase_id: p.id,
            lead_token: lead?.lead_token ?? "",
            event_type: lead?.event_type ?? null,
            event_date: lead?.event_date ?? null,
            city: lead?.city ?? null,
            created_at: p.created_at,
            paid_from_credits: p.paid_from_credits,
            contact: {
              client_name: lead?.client_name ?? "",
              client_phone: lead?.client_phone ?? "",
              client_email: lead?.client_email ?? null,
            },
          };
        });
    },

    async listAvailableLeadsForChef(chefPhone, filters, limit): Promise<PublicLead[]> {
      const city = (filters.city ?? "").trim().toLowerCase();
      const cuisine = (filters.cuisine ?? "").trim();
      return [...store.leads.values()]
        .filter(
          (l) =>
            l.status === LEAD_STATUS.available &&
            l.buyers_count < l.buyers_cap &&
            !l.paid_by.includes(chefPhone) &&
            (!city || (l.city ?? "").toLowerCase().includes(city)) &&
            (!cuisine || l.cuisine === cuisine),
        )
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
        .slice(0, limit)
        .map((l) => toPublicLead(structuredClone(l)));
    },

    async createCreditOrder(input): Promise<CreditOrder> {
      const id = uid("ord");
      const order: CreditOrder = {
        id,
        chef_id: input.chef_id,
        credits: input.credits,
        amount: input.amount,
        provider_ref: input.provider_ref ?? null,
        invoice_ref: null,
        status: "pending",
        created_at: new Date().toISOString(),
      };
      store.creditOrders.set(id, order);
      return structuredClone(order);
    },

    async getCreditOrder(id): Promise<CreditOrder | null> {
      const o = store.creditOrders.get(id);
      return o ? structuredClone(o) : null;
    },

    async getCreditOrderByProviderRef(ref): Promise<CreditOrder | null> {
      for (const o of store.creditOrders.values()) {
        if (o.provider_ref === ref) return structuredClone(o);
      }
      return null;
    },

    async setCreditOrderProviderRef(id, providerRef): Promise<void> {
      const o = store.creditOrders.get(id);
      if (o) o.provider_ref = providerRef;
    },

    async completeCreditOrder(id, invoiceRef): Promise<{ ok: boolean; credited: number }> {
      const order = store.creditOrders.get(id);
      if (!order || order.status !== "pending") return { ok: false, credited: 0 };
      order.status = "paid";
      if (invoiceRef) order.invoice_ref = invoiceRef;
      const chef = store.chefs.get(order.chef_id);
      if (chef) {
        chef.credits += order.credits;
        chef.updated_at = new Date().toISOString();
        store.ledger.push({
          id: uid("led"),
          chef_id: order.chef_id,
          delta: order.credits,
          reason: "package",
          balance_after: chef.credits,
          ref: order.id,
          note: null,
          created_at: new Date().toISOString(),
        });
      }
      return { ok: true, credited: order.credits };
    },

    async failCreditOrder(id): Promise<boolean> {
      const order = store.creditOrders.get(id);
      if (!order || order.status !== "pending") return false;
      order.status = "failed";
      return true;
    },

    async listPendingCreditOrders(limit): Promise<PendingCreditOrder[]> {
      return [...store.creditOrders.values()]
        .filter((o) => o.status === "pending")
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
        .slice(0, limit)
        .map((o) => {
          const chef = store.chefs.get(o.chef_id);
          return {
            id: o.id,
            chef_id: o.chef_id,
            chef_phone: chef?.phone ?? "",
            chef_name: chef?.name ?? null,
            credits: o.credits,
            amount: o.amount,
            created_at: o.created_at,
          };
        });
    },
  };
}
