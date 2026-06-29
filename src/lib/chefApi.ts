import type {
  ChefPublic,
  ChefLeadPurchase,
  CreditLedgerEntry,
  LeadContact,
  PublicLead,
  PendingCreditOrder,
} from "@shared/types.ts";
import type { ManualBit } from "./api.ts";
import { chefAuthHeaders } from "./chefSession.ts";

type Wrapped<T> = { status: number; body: T };

async function authedGet<T>(url: string): Promise<Wrapped<T>> {
  const res = await fetch(url, { headers: { ...chefAuthHeaders() } });
  return { status: res.status, body: (await res.json()) as T };
}

async function authedPost<T>(url: string, body: unknown = {}): Promise<Wrapped<T>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...chefAuthHeaders() },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as T };
}

async function adminGet<T>(url: string, token: string): Promise<Wrapped<T>> {
  const res = await fetch(url, { headers: token ? { "x-admin-token": token } : {} });
  return { status: res.status, body: (await res.json()) as T };
}

async function adminPost<T>(url: string, token: string, body: unknown = {}): Promise<Wrapped<T>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { "x-admin-token": token } : {}) },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as T };
}

// ── Chef portal ─────────────────────────────────────────────────────────────
export interface ChefAuthResponse {
  ok: boolean;
  token?: string;
  chef?: ChefPublic;
  reason?: string;
}

export function chefRegister(input: {
  phone: string;
  name: string;
  email?: string;
  password: string;
  turnstile_token?: string;
}): Promise<Wrapped<ChefAuthResponse>> {
  return authedPost<ChefAuthResponse>("/api/chef/register", input);
}

export function chefLogin(input: { phone: string; password: string }): Promise<Wrapped<ChefAuthResponse>> {
  return authedPost<ChefAuthResponse>("/api/chef/login", input);
}

export interface ChefMeResponse {
  ok: boolean;
  chef?: ChefPublic;
  reason?: string;
}
export function chefMe(): Promise<Wrapped<ChefMeResponse>> {
  return authedGet<ChefMeResponse>("/api/chef/me");
}

export interface MarketplaceResponse {
  ok: boolean;
  leads?: PublicLead[];
  credits?: number;
  reason?: string;
}
export function chefMarketplace(filters: { city?: string; cuisine?: string } = {}): Promise<
  Wrapped<MarketplaceResponse>
> {
  const qs = new URLSearchParams();
  if (filters.city) qs.set("city", filters.city);
  if (filters.cuisine) qs.set("cuisine", filters.cuisine);
  const q = qs.toString();
  return authedGet<MarketplaceResponse>(`/api/chef/leads${q ? `?${q}` : ""}`);
}

export interface OpenLeadResponse {
  ok: boolean;
  reveal_token?: string;
  credits?: number;
  contact?: LeadContact;
  reason?: string;
}
export function chefOpenLead(token: string): Promise<Wrapped<OpenLeadResponse>> {
  return authedPost<OpenLeadResponse>(`/api/chef/leads/${encodeURIComponent(token)}/open`);
}

export interface ChefPurchasesResponse {
  ok: boolean;
  purchases?: ChefLeadPurchase[];
}
export function chefPurchases(): Promise<Wrapped<ChefPurchasesResponse>> {
  return authedGet<ChefPurchasesResponse>("/api/chef/purchases");
}

export interface ChefLedgerResponse {
  ok: boolean;
  ledger?: CreditLedgerEntry[];
}
export function chefLedger(): Promise<Wrapped<ChefLedgerResponse>> {
  return authedGet<ChefLedgerResponse>("/api/chef/ledger");
}

export interface CheckoutResponse {
  ok: boolean;
  order_id?: string;
  credits?: number;
  amount?: number;
  payment_url?: string;
  manual_bit?: ManualBit;
  reason?: string;
}
export function chefCheckout(packageId: string): Promise<Wrapped<CheckoutResponse>> {
  return authedPost<CheckoutResponse>("/api/chef/credits/checkout", { package: packageId });
}

// ── Admin: chef accounts ─────────────────────────────────────────────────────
export interface AdminChefsResponse {
  ok: boolean;
  chefs?: ChefPublic[];
  error?: string;
  reason?: string;
}
export function adminListChefs(token: string, query = ""): Promise<Wrapped<AdminChefsResponse>> {
  const q = query.trim() ? `&query=${encodeURIComponent(query.trim())}` : "";
  return adminGet<AdminChefsResponse>(`/api/admin/chefs?limit=200${q}`, token);
}

export interface AdminCreateChefResponse {
  ok: boolean;
  chef?: ChefPublic;
  temp_password?: string;
  reason?: string;
}
export function adminCreateChef(
  token: string,
  input: { phone: string; name?: string; email?: string; password?: string; credits?: number },
): Promise<Wrapped<AdminCreateChefResponse>> {
  return adminPost<AdminCreateChefResponse>("/api/admin/chefs", token, input);
}

export interface AdminChefDetailResponse {
  ok: boolean;
  chef?: ChefPublic;
  ledger?: CreditLedgerEntry[];
  purchases?: ChefLeadPurchase[];
  reason?: string;
}
export function adminChefDetail(token: string, id: string): Promise<Wrapped<AdminChefDetailResponse>> {
  return adminGet<AdminChefDetailResponse>(`/api/admin/chefs/${encodeURIComponent(id)}`, token);
}

export interface AdminAdjustResponse {
  ok: boolean;
  balance_after?: number;
  reason?: string;
}
export function adminAdjustCredits(
  token: string,
  id: string,
  delta: number,
  note?: string,
): Promise<Wrapped<AdminAdjustResponse>> {
  return adminPost<AdminAdjustResponse>(`/api/admin/chefs/${encodeURIComponent(id)}/credits`, token, {
    delta,
    note,
  });
}

export function adminSetChefPassword(
  token: string,
  id: string,
  password: string,
): Promise<Wrapped<{ ok: boolean; reason?: string }>> {
  return adminPost(`/api/admin/chefs/${encodeURIComponent(id)}/password`, token, { password });
}

export function adminSetChefStatus(
  token: string,
  id: string,
  status: "active" | "disabled",
): Promise<Wrapped<{ ok: boolean; status?: string; reason?: string }>> {
  return adminPost(`/api/admin/chefs/${encodeURIComponent(id)}/status`, token, { status });
}

export type { PendingCreditOrder };
