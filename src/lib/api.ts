import type { PublicLead, LeadContact } from "@shared/types.ts";
import type { LeadInputType } from "@shared/schema.ts";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as T;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return (await res.json()) as T;
}

export interface CreateLeadResponse {
  ok: boolean;
  error?: string;
  notify?: { whatsapp: string; telegram: string };
}

export function createLead(input: LeadInputType): Promise<CreateLeadResponse> {
  return postJson<CreateLeadResponse>("/api/lead", input);
}

export interface GetLeadResponse {
  ok: boolean;
  lead?: PublicLead;
  reason?: string;
}

export function getLead(token: string): Promise<GetLeadResponse> {
  return getJson<GetLeadResponse>(`/api/lead/${encodeURIComponent(token)}`);
}

export interface ManualBit {
  phone: string;
  link?: string;
  amount: number;
  reference: string;
}

export interface ReserveResponse {
  ok: boolean;
  reason?: string;
  payment_url?: string;
  manual_bit?: ManualBit;
  purchase_id?: string;
  reveal_token?: string;
  error?: string;
}

export function reserveLead(token: string, chefPhone: string): Promise<ReserveResponse> {
  return postJson<ReserveResponse>(`/api/lead/${encodeURIComponent(token)}/reserve`, {
    chef_phone: chefPhone,
  });
}

export interface ContactResponse {
  ok: boolean;
  contact?: LeadContact;
  reason?: string;
  error?: string;
}

export function getContact(token: string, revealToken: string): Promise<ContactResponse> {
  return getJson<ContactResponse>(
    `/api/lead/${encodeURIComponent(token)}/contact?reveal=${encodeURIComponent(revealToken)}`,
  );
}

export interface MockCompleteResponse {
  ok: boolean;
  status?: string;
  transitioned?: boolean;
}

// Dev-only: finish the mock payment flow. No-op (404) when a real provider runs.
export function mockComplete(purchaseId: string): Promise<MockCompleteResponse> {
  return postJson<MockCompleteResponse>("/api/payment/mock-complete", {
    purchase_id: purchaseId,
  });
}

export interface AdminLead {
  lead_token: string;
  created_at: string;
  event_type: string | null;
  event_date: string | null;
  city: string | null;
  guests: number | null;
  budget: number | null;
  cuisine: string | null;
  kosher: boolean;
  status: string;
  buyers_count: number;
  buyers_cap: number;
  source: string | null;
  client_name: string;
  client_phone: string;
  client_email: string | null;
}

export interface AdminLeadsResponse {
  ok: boolean;
  leads?: AdminLead[];
  error?: string;
  reason?: string;
}

// Operator view (admin-gated). Sends the shared token as a header.
export async function listRecentLeads(token: string): Promise<{ status: number; body: AdminLeadsResponse }> {
  const res = await fetch("/api/admin/leads?limit=100", {
    headers: token ? { "x-admin-token": token } : {},
  });
  return { status: res.status, body: (await res.json()) as AdminLeadsResponse };
}

export type NotifyChannel = "whatsapp" | "telegram";

export interface NotifyResponse {
  ok: boolean;
  notify?: Partial<Record<NotifyChannel, "sent" | "failed">>;
  error?: string;
  reason?: string;
}

// Operator action (admin-gated): confirm a manual Bit payment by its reference
// (the purchase id), which unlocks the contact for the paying chef.
export async function confirmPurchase(
  reference: string,
  adminToken: string,
): Promise<{ status: number; body: { ok: boolean; transitioned?: boolean; error?: string } }> {
  const res = await fetch(`/api/admin/purchase/${encodeURIComponent(reference)}/confirm`, {
    method: "POST",
    headers: adminToken ? { "x-admin-token": adminToken } : {},
  });
  return { status: res.status, body: (await res.json()) as { ok: boolean; transitioned?: boolean; error?: string } };
}

// Operator action (admin-gated): re-send a lead's distribution message. Omit
// `channel` to send to both. Sends the shared token as a header.
export async function resendNotify(
  leadToken: string,
  channel: NotifyChannel | undefined,
  adminToken: string,
): Promise<{ status: number; body: NotifyResponse }> {
  const res = await fetch(`/api/admin/lead/${encodeURIComponent(leadToken)}/notify`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(adminToken ? { "x-admin-token": adminToken } : {}),
    },
    body: JSON.stringify(channel ? { channel } : {}),
  });
  return { status: res.status, body: (await res.json()) as NotifyResponse };
}
