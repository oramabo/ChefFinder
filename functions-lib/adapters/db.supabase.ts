import { createClient, type SupabaseClient } from "@supabase/supabase-js";
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
import { toPublicLead } from "@shared/types.ts";
import { RESERVE_REASON } from "@shared/constants.ts";
import type { DbPort, InsertLeadInput } from "../ports/db.ts";

export function createSupabaseDb(url: string, serviceKey: string): DbPort {
  const sb: SupabaseClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return {
    async insertLead(input: InsertLeadInput): Promise<Lead> {
      const { data, error } = await sb.from("leads").insert(input).select("*").single();
      if (error) throw new Error(`insertLead: ${error.message}`);
      return data as Lead;
    },

    async getLeadByToken(token: string): Promise<Lead | null> {
      const { data, error } = await sb
        .from("leads")
        .select("*")
        .eq("lead_token", token)
        .maybeSingle();
      if (error) throw new Error(`getLeadByToken: ${error.message}`);
      return (data as Lead) ?? null;
    },

    async listRecentLeads(limit: number): Promise<Lead[]> {
      const { data, error } = await sb
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(`listRecentLeads: ${error.message}`);
      return (data as Lead[]) ?? [];
    },

    async listPendingPurchases(limit: number) {
      const { data, error } = await sb
        .from("purchases")
        .select("id, chef_phone, amount, created_at, leads(lead_token, city, event_type)")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(`listPendingPurchases: ${error.message}`);
      return (data ?? []).map((r) => {
        const row = r as unknown as {
          id: string;
          chef_phone: string;
          amount: number;
          created_at: string;
          leads: { lead_token: string; city: string | null; event_type: string | null } | null;
        };
        return {
          id: row.id,
          chef_phone: row.chef_phone,
          amount: row.amount,
          created_at: row.created_at,
          lead_token: row.leads?.lead_token ?? "",
          city: row.leads?.city ?? null,
          event_type: row.leads?.event_type ?? null,
        };
      });
    },

    async reserveLead(token: string, chefPhone: string): Promise<ReserveResult> {
      const { data, error } = await sb.rpc("reserve_lead", {
        p_token: token,
        p_chef: chefPhone,
      });
      if (error) throw new Error(`reserveLead: ${error.message}`);
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return { ok: false, reason: RESERVE_REASON.not_found };
      return { ok: Boolean(row.ok), reason: row.reason as ReserveResult["reason"] };
    },

    async createPurchase(input): Promise<Purchase> {
      const { data, error } = await sb
        .from("purchases")
        .insert({ ...input, status: "pending" })
        .select("*")
        .single();
      if (error) throw new Error(`createPurchase: ${error.message}`);
      return data as Purchase;
    },

    async getPurchase(id: string): Promise<Purchase | null> {
      const { data, error } = await sb.from("purchases").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(`getPurchase: ${error.message}`);
      return (data as Purchase) ?? null;
    },

    async getPurchaseByProviderRef(ref: string): Promise<Purchase | null> {
      const { data, error } = await sb
        .from("purchases")
        .select("*")
        .eq("provider_ref", ref)
        .maybeSingle();
      if (error) throw new Error(`getPurchaseByProviderRef: ${error.message}`);
      return (data as Purchase) ?? null;
    },

    async getPurchaseByRevealToken(revealToken: string): Promise<Purchase | null> {
      const { data, error } = await sb
        .from("purchases")
        .select("*")
        .eq("reveal_token", revealToken)
        .maybeSingle();
      if (error) throw new Error(`getPurchaseByRevealToken: ${error.message}`);
      return (data as Purchase) ?? null;
    },

    async setPurchaseProviderRef(id: string, providerRef: string): Promise<void> {
      const { error } = await sb.from("purchases").update({ provider_ref: providerRef }).eq("id", id);
      if (error) throw new Error(`setPurchaseProviderRef: ${error.message}`);
    },

    async completePurchase(id: string, invoiceRef?: string | null): Promise<boolean> {
      const { data, error } = await sb.rpc("complete_purchase", {
        p_purchase_id: id,
        p_invoice_ref: invoiceRef ?? null,
      });
      if (error) throw new Error(`completePurchase: ${error.message}`);
      return Boolean(data);
    },

    async releasePurchase(id: string, status: "failed" | "expired"): Promise<boolean> {
      const { data, error } = await sb.rpc("release_lead", {
        p_purchase_id: id,
        p_status: status,
      });
      if (error) throw new Error(`releasePurchase: ${error.message}`);
      return Boolean(data);
    },

    async sweepStale(ttlMinutes: number): Promise<number> {
      const { data, error } = await sb.rpc("sweep_stale_reservations", {
        p_ttl_minutes: ttlMinutes,
      });
      if (error) throw new Error(`sweepStale: ${error.message}`);
      return Number(data ?? 0);
    },

    // ── Prepaid lead bank ─────────────────────────────────────────────────
    async createChef(input): Promise<Chef> {
      const { data, error } = await sb
        .from("chefs")
        .insert({
          phone: input.phone,
          name: input.name ?? null,
          email: input.email ?? null,
          password_hash: input.password_hash,
          credits: input.credits ?? 0,
        })
        .select("*")
        .single();
      if (error) throw new Error(`createChef: ${error.message}`);
      return data as Chef;
    },

    async getChefByPhone(phone): Promise<Chef | null> {
      const { data, error } = await sb.from("chefs").select("*").eq("phone", phone).maybeSingle();
      if (error) throw new Error(`getChefByPhone: ${error.message}`);
      return (data as Chef) ?? null;
    },

    async getChefById(id): Promise<Chef | null> {
      const { data, error } = await sb.from("chefs").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(`getChefById: ${error.message}`);
      return (data as Chef) ?? null;
    },

    async listChefs(query, limit): Promise<ChefPublic[]> {
      let q = sb
        .from("chefs")
        .select("id, phone, name, email, credits, status, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (query && query.trim()) {
        const like = `%${query.trim()}%`;
        q = q.or(`phone.ilike.${like},name.ilike.${like},email.ilike.${like}`);
      }
      const { data, error } = await q;
      if (error) throw new Error(`listChefs: ${error.message}`);
      return (data as ChefPublic[]) ?? [];
    },

    async updateChefPassword(id, passwordHash): Promise<void> {
      const { error } = await sb
        .from("chefs")
        .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(`updateChefPassword: ${error.message}`);
    },

    async updateChefStatus(id, status): Promise<void> {
      const { error } = await sb
        .from("chefs")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(`updateChefStatus: ${error.message}`);
    },

    async addCredits(chefId, delta, reason, ref, note): Promise<{ ok: boolean; balance_after: number }> {
      const { data, error } = await sb.rpc("chef_add_credits", {
        p_chef_id: chefId,
        p_delta: delta,
        p_reason: reason,
        p_ref: ref ?? null,
        p_note: note ?? null,
      });
      if (error) throw new Error(`addCredits: ${error.message}`);
      const row = Array.isArray(data) ? data[0] : data;
      return { ok: Boolean(row?.ok), balance_after: Number(row?.balance_after ?? 0) };
    },

    async unlockLeadWithCredit(token, chefId, revealToken): Promise<ChefUnlockResult> {
      const { data, error } = await sb.rpc("chef_unlock_lead", {
        p_token: token,
        p_chef_id: chefId,
        p_reveal_token: revealToken,
      });
      if (error) throw new Error(`unlockLeadWithCredit: ${error.message}`);
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return { ok: false, reason: "not_found", purchase_id: null };
      return {
        ok: Boolean(row.ok),
        reason: row.reason as ChefUnlockResult["reason"],
        purchase_id: (row.purchase_id as string | null) ?? null,
      };
    },

    async getChefLedger(chefId, limit): Promise<CreditLedgerEntry[]> {
      const { data, error } = await sb
        .from("chef_credit_ledger")
        .select("*")
        .eq("chef_id", chefId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(`getChefLedger: ${error.message}`);
      return (data as CreditLedgerEntry[]) ?? [];
    },

    async listChefLeadPurchases(chefPhone, limit): Promise<ChefLeadPurchase[]> {
      const { data, error } = await sb
        .from("purchases")
        .select(
          "id, created_at, paid_from_credits, leads(lead_token, event_type, event_date, city, client_name, client_phone, client_email)",
        )
        .eq("chef_phone", chefPhone)
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(`listChefLeadPurchases: ${error.message}`);
      return (data ?? []).map((r) => {
        const row = r as unknown as {
          id: string;
          created_at: string;
          paid_from_credits: boolean;
          leads: {
            lead_token: string;
            event_type: string | null;
            event_date: string | null;
            city: string | null;
            client_name: string;
            client_phone: string;
            client_email: string | null;
          } | null;
        };
        return {
          purchase_id: row.id,
          lead_token: row.leads?.lead_token ?? "",
          event_type: row.leads?.event_type ?? null,
          event_date: row.leads?.event_date ?? null,
          city: row.leads?.city ?? null,
          created_at: row.created_at,
          paid_from_credits: row.paid_from_credits,
          contact: {
            client_name: row.leads?.client_name ?? "",
            client_phone: row.leads?.client_phone ?? "",
            client_email: row.leads?.client_email ?? null,
          },
        };
      });
    },

    async listAvailableLeadsForChef(chefPhone, filters, limit): Promise<PublicLead[]> {
      let q = sb
        .from("leads")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (filters.city && filters.city.trim()) q = q.ilike("city", `%${filters.city.trim()}%`);
      if (filters.cuisine && filters.cuisine.trim()) q = q.eq("cuisine", filters.cuisine.trim());
      const { data, error } = await q;
      if (error) throw new Error(`listAvailableLeadsForChef: ${error.message}`);
      const leads = (data as Lead[]) ?? [];
      return leads
        .filter((l) => l.buyers_count < l.buyers_cap && !(l.paid_by ?? []).includes(chefPhone))
        .map(toPublicLead);
    },

    async createCreditOrder(input): Promise<CreditOrder> {
      const { data, error } = await sb
        .from("credit_orders")
        .insert({
          chef_id: input.chef_id,
          credits: input.credits,
          amount: input.amount,
          provider_ref: input.provider_ref ?? null,
          status: "pending",
        })
        .select("*")
        .single();
      if (error) throw new Error(`createCreditOrder: ${error.message}`);
      return data as CreditOrder;
    },

    async getCreditOrder(id): Promise<CreditOrder | null> {
      const { data, error } = await sb.from("credit_orders").select("*").eq("id", id).maybeSingle();
      if (error) throw new Error(`getCreditOrder: ${error.message}`);
      return (data as CreditOrder) ?? null;
    },

    async getCreditOrderByProviderRef(ref): Promise<CreditOrder | null> {
      const { data, error } = await sb
        .from("credit_orders")
        .select("*")
        .eq("provider_ref", ref)
        .maybeSingle();
      if (error) throw new Error(`getCreditOrderByProviderRef: ${error.message}`);
      return (data as CreditOrder) ?? null;
    },

    async setCreditOrderProviderRef(id, providerRef): Promise<void> {
      const { error } = await sb
        .from("credit_orders")
        .update({ provider_ref: providerRef })
        .eq("id", id);
      if (error) throw new Error(`setCreditOrderProviderRef: ${error.message}`);
    },

    async completeCreditOrder(id, invoiceRef): Promise<{ ok: boolean; credited: number }> {
      const { data, error } = await sb.rpc("complete_credit_order", {
        p_order_id: id,
        p_invoice_ref: invoiceRef ?? null,
      });
      if (error) throw new Error(`completeCreditOrder: ${error.message}`);
      const row = Array.isArray(data) ? data[0] : data;
      return { ok: Boolean(row?.ok), credited: Number(row?.credited ?? 0) };
    },

    async failCreditOrder(id): Promise<boolean> {
      const { data, error } = await sb
        .from("credit_orders")
        .update({ status: "failed" })
        .eq("id", id)
        .eq("status", "pending")
        .select("id");
      if (error) throw new Error(`failCreditOrder: ${error.message}`);
      return Array.isArray(data) && data.length > 0;
    },

    async listPendingCreditOrders(limit): Promise<PendingCreditOrder[]> {
      const { data, error } = await sb
        .from("credit_orders")
        .select("id, chef_id, credits, amount, created_at, chefs(phone, name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(`listPendingCreditOrders: ${error.message}`);
      return (data ?? []).map((r) => {
        const row = r as unknown as {
          id: string;
          chef_id: string;
          credits: number;
          amount: number;
          created_at: string;
          chefs: { phone: string; name: string | null } | null;
        };
        return {
          id: row.id,
          chef_id: row.chef_id,
          chef_phone: row.chefs?.phone ?? "",
          chef_name: row.chefs?.name ?? null,
          credits: row.credits,
          amount: row.amount,
          created_at: row.created_at,
        };
      });
    },
  };
}
