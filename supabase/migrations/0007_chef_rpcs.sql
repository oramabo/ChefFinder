-- Atomic credit operations for the prepaid lead bank.

-- Spend exactly one credit to unlock a lead. Does in a single transaction what
-- the pay-per-lead flow does across reserve + complete: lock the chef row, verify
-- an active account with credits, hold a slot (same guard as reserve_lead),
-- deduct the credit, record a paid purchase + ledger entry, and append the chef
-- to the lead's paid_by. Returns the new purchase id on success.
create or replace function chef_unlock_lead(
  p_token text,
  p_chef_id uuid,
  p_reveal_token text
)
returns table (ok boolean, reason text, purchase_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone   text;
  v_credits int;
  v_status  text;
  v_lead_id uuid;
  v_price   int;
  v_balance int;
  v_purchase uuid;
begin
  -- Lock the chef row for the duration of the transaction.
  select phone, credits, status
    into v_phone, v_credits, v_status
    from chefs
   where id = p_chef_id
   for update;

  if not found or v_status <> 'active' then
    return query select false, 'inactive', null::uuid;
    return;
  end if;

  if v_credits < 1 then
    return query select false, 'insufficient_credits', null::uuid;
    return;
  end if;

  -- Atomic capped reservation (identical guard to reserve_lead).
  update leads
     set buyers_count = buyers_count + 1,
         status = case
                    when buyers_count + 1 >= buyers_cap then 'sold_out'
                    else status
                  end
   where lead_token = p_token
     and buyers_count < buyers_cap
     and not (v_phone = any(coalesce(paid_by, '{}')))
   returning id, price into v_lead_id, v_price;

  if v_lead_id is null then
    if exists (
      select 1 from leads where lead_token = p_token and v_phone = any(coalesce(paid_by, '{}'))
    ) then
      return query select false, 'already_purchased', null::uuid;
    elsif exists (
      select 1 from leads where lead_token = p_token and buyers_count >= buyers_cap
    ) then
      return query select false, 'sold_out', null::uuid;
    else
      return query select false, 'not_found', null::uuid;
    end if;
    return;
  end if;

  -- Deduct the credit, record the paid purchase, append paid_by, log the ledger.
  update chefs
     set credits = credits - 1,
         updated_at = now()
   where id = p_chef_id
   returning credits into v_balance;

  insert into purchases (lead_id, chef_phone, amount, status, reveal_token, paid_from_credits)
       values (v_lead_id, v_phone, v_price, 'paid', p_reveal_token, true)
       returning id into v_purchase;

  update leads
     set paid_by = case
                     when v_phone = any(coalesce(paid_by, '{}')) then paid_by
                     else array_append(paid_by, v_phone)
                   end
   where id = v_lead_id;

  insert into chef_credit_ledger (chef_id, delta, reason, balance_after, ref)
       values (p_chef_id, -1, 'lead_unlock', v_balance, v_purchase::text);

  return query select true, 'unlocked', v_purchase;
end;
$$;

-- Adjust a chef's balance by p_delta (positive for top-up/refund/admin add,
-- negative for a correction) and append a ledger row, atomically. Rejects a
-- change that would drive the balance below zero.
create or replace function chef_add_credits(
  p_chef_id uuid,
  p_delta   int,
  p_reason  text,
  p_ref     text default null,
  p_note    text default null
)
returns table (ok boolean, balance_after int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_credits int;
  v_new     int;
begin
  select credits into v_credits from chefs where id = p_chef_id for update;
  if not found then
    return query select false, 0;
    return;
  end if;

  v_new := v_credits + p_delta;
  if v_new < 0 then
    return query select false, v_credits;  -- would go negative: reject
    return;
  end if;

  update chefs set credits = v_new, updated_at = now() where id = p_chef_id;

  insert into chef_credit_ledger (chef_id, delta, reason, balance_after, ref, note)
       values (p_chef_id, p_delta, p_reason, v_new, p_ref, p_note);

  return query select true, v_new;
end;
$$;

-- Complete a paid online credit-package order: transition pending -> paid and
-- grant the credits + ledger entry atomically. Idempotent (only a pending order
-- transitions), so webhook re-delivery and admin re-confirm are safe no-ops.
create or replace function complete_credit_order(
  p_order_id    uuid,
  p_invoice_ref text default null
)
returns table (ok boolean, credited int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chef_id uuid;
  v_credits int;
  v_balance int;
begin
  update credit_orders
     set status = 'paid',
         invoice_ref = coalesce(p_invoice_ref, invoice_ref)
   where id = p_order_id
     and status = 'pending'
   returning chef_id, credits into v_chef_id, v_credits;

  if v_chef_id is null then
    return query select false, 0;  -- already paid/failed or missing
    return;
  end if;

  update chefs
     set credits = credits + v_credits,
         updated_at = now()
   where id = v_chef_id
   returning credits into v_balance;

  insert into chef_credit_ledger (chef_id, delta, reason, balance_after, ref)
       values (v_chef_id, v_credits, 'package', v_balance, p_order_id::text);

  return query select true, v_credits;
end;
$$;

revoke all on function chef_unlock_lead(text, uuid, text) from public, anon, authenticated;
revoke all on function chef_add_credits(uuid, int, text, text, text) from public, anon, authenticated;
revoke all on function complete_credit_order(uuid, text) from public, anon, authenticated;
grant execute on function chef_unlock_lead(text, uuid, text) to service_role;
grant execute on function chef_add_credits(uuid, int, text, text, text) to service_role;
grant execute on function complete_credit_order(uuid, text) to service_role;
