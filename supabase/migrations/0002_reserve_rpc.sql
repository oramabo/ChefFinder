-- Atomic capped reservation. A single conditional UPDATE locks the row, so
-- concurrent reservations can never push buyers_count past buyers_cap.

create or replace function reserve_lead(p_token text, p_chef text)
returns table (ok boolean, reason text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  update leads
     set buyers_count = buyers_count + 1,
         status = case
                    when buyers_count + 1 >= buyers_cap then 'sold_out'
                    else status
                  end
   where lead_token = p_token
     and buyers_count < buyers_cap
     and not (p_chef = any(coalesce(paid_by, '{}')))
   returning id into v_id;

  if v_id is null then
    if exists (
      select 1 from leads
       where lead_token = p_token and p_chef = any(coalesce(paid_by, '{}'))
    ) then
      return query select false, 'already_purchased';
    elsif exists (
      select 1 from leads
       where lead_token = p_token and buyers_count >= buyers_cap
    ) then
      return query select false, 'sold_out';
    else
      return query select false, 'not_found';
    end if;
  else
    return query select true, 'reserved';
  end if;
end;
$$;

revoke all on function reserve_lead(text, text) from public, anon, authenticated;
grant execute on function reserve_lead(text, text) to service_role;
