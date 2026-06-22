-- ChefLeads core schema: leads + purchases.

create extension if not exists "pgcrypto";

create table if not exists leads (
  id            uuid primary key default gen_random_uuid(),
  lead_token    text unique not null,            -- public URL token (unguessable)
  -- event details (shown to chefs, no PII)
  event_type    text,
  event_date    date,
  city          text,
  guests        int,
  budget        int,
  cuisine       text,
  kosher        boolean not null default false,
  -- client PII (gated; never sent to group)
  client_name   text not null,
  client_phone  text not null,
  client_email  text,
  -- commerce
  price         int  not null default 30,        -- ILS per unlock
  buyers_cap    int  not null default 3,
  buyers_count  int  not null default 0,
  paid_by       text[] not null default '{}',    -- chef phones who unlocked
  status        text not null default 'available', -- available | sold_out
  -- meta
  source        text,                            -- ad campaign / seo page / utm
  created_at    timestamptz not null default now(),
  constraint leads_status_chk check (status in ('available', 'sold_out')),
  constraint leads_count_chk check (buyers_count >= 0 and buyers_count <= buyers_cap)
);

create index if not exists leads_lead_token_idx on leads (lead_token);
create index if not exists leads_status_idx on leads (status);

create table if not exists purchases (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references leads(id) on delete cascade,
  chef_phone    text not null,
  amount        int  not null,
  provider_ref  text,                            -- payment provider transaction id
  invoice_ref   text,                            -- issued invoice id
  status        text not null default 'pending', -- pending | paid | failed | expired
  created_at    timestamptz not null default now(),
  constraint purchases_status_chk
    check (status in ('pending', 'paid', 'failed', 'expired'))
);

create index if not exists purchases_lead_id_idx on purchases (lead_id);
create index if not exists purchases_status_idx on purchases (status);
create index if not exists purchases_provider_ref_idx on purchases (provider_ref);
-- A given provider transaction maps to at most one purchase (webhook idempotency).
create unique index if not exists purchases_provider_ref_uniq
  on purchases (provider_ref) where provider_ref is not null;
