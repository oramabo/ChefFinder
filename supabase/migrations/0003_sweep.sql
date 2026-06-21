-- Compensating release + TTL sweep for abandoned/failed reservations.

-- Release a single pending reservation: decrement the lead's buyers_count,
-- reopen the slot if it was sold_out, and move the purchase to a terminal state.
-- Idempotent: only a 'pending' purchase causes a decrement, and it is flipped to
-- a terminal status in the same transaction, so repeated calls are no-ops.
create or replace function release_lead(p_purchase_id uuid, p_status text default 'failed')
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead_id uuid;
begin
  if p_status not in ('failed', 'expired') then
    raise exception 'release_lead: invalid status %', p_status;
  end if;

  update purchases
     set status = p_status
   where id = p_purchase_id
     and status = 'pending'
   returning lead_id into v_lead_id;

  if v_lead_id is null then
    return false; -- already terminal (paid/failed/expired) or missing: no-op
  end if;

  update leads
     set buyers_count = greatest(0, buyers_count - 1),
         status = case
                    when greatest(0, buyers_count - 1) < buyers_cap then 'available'
                    else status
                  end
   where id = v_lead_id;

  return true;
end;
$$;

-- Mark a pending purchase paid and append the chef to paid_by (idempotently).
-- Returns true on the transition pending -> paid; false if already paid/terminal.
create or replace function complete_purchase(
  p_purchase_id uuid,
  p_invoice_ref text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead_id uuid;
  v_chef text;
begin
  update purchases
     set status = 'paid',
         invoice_ref = coalesce(p_invoice_ref, invoice_ref)
   where id = p_purchase_id
     and status = 'pending'
   returning lead_id, chef_phone into v_lead_id, v_chef;

  if v_lead_id is null then
    return false; -- already paid or not pending
  end if;

  update leads
     set paid_by = case
                     when v_chef = any(coalesce(paid_by, '{}')) then paid_by
                     else array_append(paid_by, v_chef)
                   end
   where id = v_lead_id;

  return true;
end;
$$;

-- Sweep: expire pending purchases older than the TTL and reopen their slots.
create or replace function sweep_stale_reservations(p_ttl_minutes int default 20)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int := 0;
  r record;
begin
  for r in
    select id from purchases
     where status = 'pending'
       and created_at < now() - make_interval(mins => p_ttl_minutes)
  loop
    if release_lead(r.id, 'expired') then
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$$;

revoke all on function release_lead(uuid, text) from public, anon, authenticated;
revoke all on function complete_purchase(uuid, text) from public, anon, authenticated;
revoke all on function sweep_stale_reservations(int) from public, anon, authenticated;
grant execute on function release_lead(uuid, text) to service_role;
grant execute on function complete_purchase(uuid, text) to service_role;
grant execute on function sweep_stale_reservations(int) to service_role;

-- Schedule the sweep every 5 minutes via pg_cron when available.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule(
      'chefleads-sweep-stale',
      '*/5 * * * *',
      $cron$ select sweep_stale_reservations(20); $cron$
    );
  end if;
exception when others then
  -- pg_cron not permitted in this environment; the sweep can be invoked
  -- manually or from a scheduled job. Don't fail the migration.
  raise notice 'pg_cron scheduling skipped: %', sqlerrm;
end;
$$;
