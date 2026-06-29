-- SQL-level proof of the prepaid lead-bank invariants. Runnable against a local
-- Postgres with the migrations applied (see scripts/run-pgtap.mjs). Plain
-- assertions (RAISE EXCEPTION on failure); no pgTAP extension required.

begin;

insert into chefs (phone, name, password_hash, credits)
values ('0590000001', 'בדיקה', 'x', 2);

insert into leads (lead_token, kosher, client_name, client_phone, price, buyers_cap)
values ('credit_test_lead', false, 'לקוח', '0500000000', 30, 1);

-- chef_unlock_lead: spends a credit, holds the slot, records a paid credit-funded
-- purchase + ledger entry, and appends paid_by — all atomically.
do $$
declare
  v_chef uuid;
  r record;
  v_credits int;
  v_count int;
  v_status text;
begin
  select id into v_chef from chefs where phone = '0590000001';

  select * into r from chef_unlock_lead('credit_test_lead', v_chef, 'rev_token_1');
  if not (r.ok and r.reason = 'unlocked' and r.purchase_id is not null) then
    raise exception 'expected unlock to succeed, got %', r;
  end if;

  select credits into v_credits from chefs where id = v_chef;
  if v_credits <> 1 then raise exception 'expected 1 credit left, got %', v_credits; end if;

  select buyers_count, status into v_count, v_status from leads where lead_token = 'credit_test_lead';
  if v_count <> 1 or v_status <> 'sold_out' then
    raise exception 'expected count=1 sold_out, got count=% status=%', v_count, v_status;
  end if;

  if not exists (
    select 1 from purchases where id = r.purchase_id and status = 'paid' and paid_from_credits
  ) then raise exception 'expected a paid, credit-funded purchase'; end if;

  if not exists (
    select 1 from chef_credit_ledger where chef_id = v_chef and delta = -1 and reason = 'lead_unlock'
  ) then raise exception 'expected a lead_unlock ledger row'; end if;

  raise notice 'OK: chef_unlock_lead spends a credit and reveals atomically';
end $$;

-- A second unlock by the same chef is already_purchased (even with credits).
do $$
declare v_chef uuid; r record;
begin
  select id into v_chef from chefs where phone = '0590000001';
  update chefs set credits = credits + 1 where id = v_chef;
  select * into r from chef_unlock_lead('credit_test_lead', v_chef, 'rev_token_2');
  if r.ok or r.reason <> 'already_purchased' then
    raise exception 'expected already_purchased, got %', r;
  end if;
  raise notice 'OK: repeat unlock by same chef is already_purchased';
end $$;

-- A zero-balance chef cannot unlock.
do $$
declare v_chef uuid; r record;
begin
  insert into chefs (phone, name, password_hash, credits) values ('0590000002', 'אפס', 'x', 0)
  returning id into v_chef;
  insert into leads (lead_token, kosher, client_name, client_phone, price, buyers_cap)
  values ('credit_test_lead2', false, 'לקוח', '0500000000', 30, 3);
  select * into r from chef_unlock_lead('credit_test_lead2', v_chef, 'rev_x');
  if r.ok or r.reason <> 'insufficient_credits' then
    raise exception 'expected insufficient_credits, got %', r;
  end if;
  raise notice 'OK: zero-balance unlock rejected';
end $$;

-- chef_add_credits adjusts the balance and refuses to go negative.
do $$
declare v_chef uuid; r record;
begin
  insert into chefs (phone, name, password_hash, credits) values ('0590000003', 'יתרה', 'x', 5)
  returning id into v_chef;
  select * into r from chef_add_credits(v_chef, -2, 'admin_adjust', null, null);
  if not (r.ok and r.balance_after = 3) then raise exception 'expected balance 3, got %', r; end if;
  select * into r from chef_add_credits(v_chef, -100, 'admin_adjust', null, null);
  if r.ok then raise exception 'expected rejection when going negative'; end if;
  raise notice 'OK: chef_add_credits guards a negative balance';
end $$;

-- complete_credit_order grants credits exactly once (idempotent).
do $$
declare v_chef uuid; v_order uuid; r record; v_credits int;
begin
  insert into chefs (phone, name, password_hash, credits) values ('0590000004', 'הזמנה', 'x', 0)
  returning id into v_chef;
  insert into credit_orders (chef_id, credits, amount, status) values (v_chef, 10, 250, 'pending')
  returning id into v_order;

  select * into r from complete_credit_order(v_order, 'inv-1');
  if not (r.ok and r.credited = 10) then raise exception 'expected credited 10, got %', r; end if;
  select credits into v_credits from chefs where id = v_chef;
  if v_credits <> 10 then raise exception 'expected 10 credits, got %', v_credits; end if;

  select * into r from complete_credit_order(v_order, 'inv-1');
  if r.ok then raise exception 'expected second completion to be a no-op'; end if;
  select credits into v_credits from chefs where id = v_chef;
  if v_credits <> 10 then raise exception 'expected still 10 credits, got %', v_credits; end if;

  raise notice 'OK: complete_credit_order grants once and is idempotent';
end $$;

rollback;
