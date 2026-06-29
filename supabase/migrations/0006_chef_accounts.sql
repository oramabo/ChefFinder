-- Prepaid lead bank: chef accounts, an immutable credit ledger, and online
-- credit-package orders. Chefs log in (phone + password), hold a credit balance,
-- and spend 1 credit to open a lead. Admins manage accounts and balances.

create table if not exists chefs (
  id            uuid primary key default gen_random_uuid(),
  phone         text unique not null,            -- login id; matches purchases.chef_phone / leads.paid_by
  name          text,
  email         text,
  password_hash text not null,                   -- PBKDF2 (pbkdf2$iters$saltB64$hashB64)
  credits       int  not null default 0,
  status        text not null default 'active',  -- active | disabled
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint chefs_status_chk check (status in ('active', 'disabled')),
  constraint chefs_credits_chk check (credits >= 0)
);

create index if not exists chefs_phone_idx on chefs (phone);

-- Immutable audit of every balance change (top-up, spend, refund, admin adjust).
create table if not exists chef_credit_ledger (
  id            uuid primary key default gen_random_uuid(),
  chef_id       uuid not null references chefs(id) on delete cascade,
  delta         int  not null,                   -- + topup/refund/admin, - unlock
  reason        text not null,                   -- package | admin_adjust | lead_unlock | refund
  balance_after int  not null,
  ref           text,                            -- correlated purchase/order id
  note          text,
  created_at    timestamptz not null default now(),
  constraint chef_credit_ledger_reason_chk
    check (reason in ('package', 'admin_adjust', 'lead_unlock', 'refund'))
);

create index if not exists chef_credit_ledger_chef_idx
  on chef_credit_ledger (chef_id, created_at desc);

-- Online credit-package purchases (the "buy a bank of leads" checkout). Mirrors
-- the purchases lifecycle (pending -> paid) and reuses the same payment provider.
create table if not exists credit_orders (
  id            uuid primary key default gen_random_uuid(),
  chef_id       uuid not null references chefs(id) on delete cascade,
  credits       int  not null,
  amount        int  not null,                   -- ILS charged
  provider_ref  text,
  invoice_ref   text,
  status        text not null default 'pending', -- pending | paid | failed
  created_at    timestamptz not null default now(),
  constraint credit_orders_status_chk check (status in ('pending', 'paid', 'failed')),
  constraint credit_orders_credits_chk check (credits > 0)
);

create index if not exists credit_orders_chef_idx on credit_orders (chef_id, created_at desc);
create index if not exists credit_orders_status_idx on credit_orders (status);
-- A given provider transaction maps to at most one order (webhook idempotency).
create unique index if not exists credit_orders_provider_ref_uniq
  on credit_orders (provider_ref) where provider_ref is not null;

-- Distinguish lead unlocks paid from the credit bank vs. an external payment.
alter table purchases add column if not exists paid_from_credits boolean not null default false;

-- Defense in depth: enable RLS and deny all to anon/authenticated. The app
-- reaches Postgres only via the service role (which bypasses RLS), exactly like
-- leads/purchases in 0004.
alter table chefs enable row level security;
alter table chef_credit_ledger enable row level security;
alter table credit_orders enable row level security;
