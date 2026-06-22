-- SQL-level proof of the reservation invariants. Runnable against a local
-- Postgres that has the migrations applied (see scripts/run-pgtap.mjs). Uses
-- plain assertions (RAISE EXCEPTION on failure) so no pgTAP extension is needed.

begin;

-- Isolated fixture.
insert into leads (lead_token, kosher, client_name, client_phone, price, buyers_cap)
values ('test_cap1', false, 'בדיקה', '0500000000', 30, 1);

do $$
declare
  r1 record;
  r2 record;
  cnt int;
  l_status text;
begin
  -- Two chefs race for the single slot: exactly one wins.
  select * into r1 from reserve_lead('test_cap1', '0521111111');
  select * into r2 from reserve_lead('test_cap1', '0522222222');

  if not (r1.ok and r1.reason = 'reserved') then
    raise exception 'expected first reserve to succeed, got %', r1;
  end if;
  if r2.ok or r2.reason <> 'sold_out' then
    raise exception 'expected second reserve to be sold_out, got %', r2;
  end if;

  select buyers_count, status into cnt, l_status from leads where lead_token = 'test_cap1';
  if cnt <> 1 or l_status <> 'sold_out' then
    raise exception 'expected count=1 status=sold_out, got count=% status=%', cnt, l_status;
  end if;

  raise notice 'OK: atomic cap holds (one winner, one sold_out)';
end $$;

-- release_lead reopens the slot and is idempotent.
do $$
declare
  v_pid uuid;
  cnt int;
  released boolean;
begin
  insert into purchases (lead_id, chef_phone, amount, status)
  select id, '0521111111', 30, 'pending' from leads where lead_token = 'test_cap1'
  returning id into v_pid;

  released := release_lead(v_pid, 'failed');
  if not released then
    raise exception 'expected release to succeed';
  end if;

  select buyers_count into cnt from leads where lead_token = 'test_cap1';
  if cnt <> 0 then
    raise exception 'expected count=0 after release, got %', cnt;
  end if;

  -- second release must be a no-op
  released := release_lead(v_pid, 'failed');
  if released then
    raise exception 'expected second release to be a no-op';
  end if;

  raise notice 'OK: release decrements once and is idempotent';
end $$;

-- complete_purchase appends to paid_by exactly once.
do $$
declare
  v_pid uuid;
  arr text[];
  done boolean;
begin
  insert into purchases (lead_id, chef_phone, amount, status)
  select id, '0523333333', 30, 'pending' from leads where lead_token = 'test_cap1'
  returning id into v_pid;

  done := complete_purchase(v_pid, 'inv-1');
  if not done then raise exception 'expected complete to transition'; end if;
  done := complete_purchase(v_pid, 'inv-1');
  if done then raise exception 'expected second complete to be a no-op'; end if;

  select paid_by into arr from leads where lead_token = 'test_cap1';
  if array_length(arr, 1) <> 1 or arr[1] <> '0523333333' then
    raise exception 'expected paid_by=[0523333333], got %', arr;
  end if;

  raise notice 'OK: complete_purchase appends paid_by once';
end $$;

rollback;
