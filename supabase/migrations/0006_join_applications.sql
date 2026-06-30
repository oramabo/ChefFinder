-- ezfind "join the network" applications: professionals/businesses who applied
-- via the umbrella landing form. Operator-managed lifecycle status. No public
-- access (RLS deny-all); reached only by Functions using the service role.

create table if not exists join_applications (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  business_name text,
  category      text not null,
  city          text not null,
  phone         text not null,
  email         text,
  message       text,
  source        text,                              -- e.g. ezfind-landing / utm
  status        text not null default 'new',       -- new | contacted | approved | rejected
  created_at    timestamptz not null default now(),
  constraint join_applications_status_chk
    check (status in ('new', 'contacted', 'approved', 'rejected'))
);

create index if not exists join_applications_created_idx
  on join_applications (created_at desc);

-- Defense in depth: deny all to anon/authenticated (service_role bypasses RLS).
alter table join_applications enable row level security;
