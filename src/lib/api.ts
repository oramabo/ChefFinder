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

export interface ReserveResponse {
  ok: boolean;
  reason?: string;
  payment_url?: string;
  purchase_id?: string;
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

export function getContact(token: string, chefPhone: string): Promise<ContactResponse> {
  return getJson<ContactResponse>(
    `/api/lead/${encodeURIComponent(token)}/contact?chef=${encodeURIComponent(chefPhone)}`,
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
