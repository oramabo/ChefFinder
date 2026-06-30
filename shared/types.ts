import type {
  LeadStatus,
  PurchaseStatus,
  ReserveReason,
  JoinStatus,
} from "./constants.ts";

// A professional/business who applied to join the ezfind network via the
// umbrella landing form. Managed by an operator in the admin panel.
export interface JoinApplication {
  id: string;
  full_name: string;
  business_name: string | null;
  category: string;
  city: string;
  phone: string;
  email: string | null;
  message: string | null;
  source: string | null;
  status: JoinStatus;
  created_at: string;
}

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
