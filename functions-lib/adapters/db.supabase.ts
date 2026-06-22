import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Lead, Purchase, ReserveResult } from "@shared/types.ts";
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
  };
}
