import type {
  LeadStatus,
  PurchaseStatus,
  ReserveReason,
  ChefStatus,
  CreditReason,
  CreditOrderStatus,
  UnlockReason,
} from "./constants.ts";

// Full lead row (server-side; contains PII).
export interface Lead {
  id: string;
  lead_token: string;
  event_type: string | null;
  event_date: string | null; // ISO date
  city: string | null;
  guests: number | null;
  budget: number | null;
  cuisine: string | null;
  kosher: boolean;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  price: number;
  buyers_cap: number;
  buyers_count: number;
  paid_by: string[];
  status: LeadStatus;
  source: string | null;
  created_at: string;
}

// Public view of a lead — what chefs see before paying. NEVER contains PII.
export interface PublicLead {
  lead_token: string;
  event_type: string | null;
  event_date: string | null;
  city: string | null;
  guests: number | null;
  budget: number | null;
  cuisine: string | null;
  kosher: boolean;
  price: number;
  status: LeadStatus;
  slots_left: number;
}

// Client contact details — only ever returned to a chef who paid.
export interface LeadContact {
  client_name: string;
  client_phone: string;
  client_email: string | null;
}

export interface Purchase {
  id: string;
  lead_id: string;
  chef_phone: string;
  amount: number;
  provider_ref: string | null;
  invoice_ref: string | null;
  reveal_token: string | null;
  status: PurchaseStatus;
  // True when unlocked by spending a credit from the chef's bank (vs. paying).
  paid_from_credits: boolean;
  created_at: string;
}

export interface ReserveResult {
  ok: boolean;
  reason: ReserveReason;
}

// Summary handed to the distribution module. Deliberately PII-free.
export interface LeadSummary {
  lead_token: string;
  event_type: string | null;
  event_date: string | null;
  city: string | null;
  guests: number | null;
  budget: number | null;
  cuisine: string | null;
  kosher: boolean;
  price: number;
}

export function toPublicLead(lead: Lead): PublicLead {
  return {
    lead_token: lead.lead_token,
    event_type: lead.event_type,
    event_date: lead.event_date,
    city: lead.city,
    guests: lead.guests,
    budget: lead.budget,
    cuisine: lead.cuisine,
    kosher: lead.kosher,
    price: lead.price,
    status: lead.status,
    slots_left: Math.max(0, lead.buyers_cap - lead.buyers_count),
  };
}

// A pending purchase awaiting manual confirmation, joined with its lead for the
// operator's pending-payments view.
export interface PendingPurchase {
  id: string;
  chef_phone: string;
  amount: number;
  created_at: string;
  lead_token: string;
  city: string | null;
  event_type: string | null;
}

export function toLeadSummary(lead: Lead): LeadSummary {
  return {
    lead_token: lead.lead_token,
    event_type: lead.event_type,
    event_date: lead.event_date,
    city: lead.city,
    guests: lead.guests,
    budget: lead.budget,
    cuisine: lead.cuisine,
    kosher: lead.kosher,
    price: lead.price,
  };
}

// ── Prepaid lead bank ───────────────────────────────────────────────────────

// Full chef account row (server-side; includes the password hash).
export interface Chef {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  password_hash: string;
  credits: number;
  status: ChefStatus;
  created_at: string;
  updated_at: string;
}

// Chef account without secrets — safe to return to the chef or admin UI.
export interface ChefPublic {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  credits: number;
  status: ChefStatus;
  created_at: string;
}

export function toChefPublic(c: Chef): ChefPublic {
  return {
    id: c.id,
    phone: c.phone,
    name: c.name,
    email: c.email,
    credits: c.credits,
    status: c.status,
    created_at: c.created_at,
  };
}

export interface CreditLedgerEntry {
  id: string;
  chef_id: string;
  delta: number;
  reason: CreditReason;
  balance_after: number;
  ref: string | null;
  note: string | null;
  created_at: string;
}

export interface CreditOrder {
  id: string;
  chef_id: string;
  credits: number;
  amount: number;
  provider_ref: string | null;
  invoice_ref: string | null;
  status: CreditOrderStatus;
  created_at: string;
}

// Result of a credit-based unlock (mirrors the chef_unlock_lead RPC).
export interface ChefUnlockResult {
  ok: boolean;
  reason: UnlockReason;
  purchase_id: string | null;
}

// A lead the chef has unlocked, with its (now-accessible) contact. Used by the
// chef's "my leads" view.
export interface ChefLeadPurchase {
  purchase_id: string;
  lead_token: string;
  event_type: string | null;
  event_date: string | null;
  city: string | null;
  created_at: string;
  paid_from_credits: boolean;
  contact: LeadContact;
}

// A pending online credit-package order awaiting manual (Bit) confirmation,
// joined with the chef for the operator's pending view.
export interface PendingCreditOrder {
  id: string;
  chef_id: string;
  chef_phone: string;
  chef_name: string | null;
  credits: number;
  amount: number;
  created_at: string;
}
