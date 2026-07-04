-- Multi-vertical groundwork: tag every lead with its service and give future
-- verticals a JSONB home for their qualifying answers, so adding a service
-- (see shared/services/registry.ts) doesn't require lead-table surgery. The
-- chef vertical keeps its dedicated columns (cuisine, kosher, guests…).

alter table leads
  add column if not exists service_slug text not null default 'chefs',
  add column if not exists details jsonb;

create index if not exists leads_service_slug_idx on leads (service_slug);
