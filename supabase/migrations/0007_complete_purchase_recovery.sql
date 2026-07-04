-- complete_purchase v2: recover payments that land after the reservation TTL.
--
-- Previously complete_purchase only transitioned a 'pending' purchase, so a
-- chef who paid after the sweep expired their reservation (or after a transient
-- 'failed') was charged with no unlock and no signal. Now the function returns
-- a text outcome and handles the late-payment case explicitly:
--
--   'completed' — normal pending → paid (slot already held).
--   'recovered' — the purchase was expired/failed but capacity remained on the
--                 lead, so the slot was retaken and the purchase marked paid.
--   'conflict'  — the purchase was expired/failed and the lead has since sold
--                 to capacity. The purchase is left untouched; the caller must
--                 alert the operator so the chef can be refunded.
--   'noop'      — already paid (idempotent re-delivery).
--   'not_found' — unknown purchase id.

drop function if exists complete_purchase(uuid, text);

create function complete_purchase(
  p_purchase_id uuid,
  p_invoice_ref text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead_id uuid;
  v_chef text;
  v_status text;
  v_retaken uuid;
begin
  -- Lock the purchase row so a concurrent sweep/webhook can't race the check.
  select lead_id, chef_phone, status
    into v_lead_id, v_chef, v_status
    from purchases
   where id = p_purchase_id
   for update;

  if v_lead_id is null then
    return 'not_found';
  end if;

  if v_status = 'paid' then
    return 'noop';
  end if;

  if v_status in ('expired', 'failed') then
    -- The held slot was released; retake it only if capacity remains.
    update leads
       set buyers_count = buyers_count + 1,
           status = case
                      when buyers_count + 1 >= buyers_cap then 'sold_out'
                      else status
                    end
     where id = v_lead_id
       and buyers_count < buyers_cap
     returning id into v_retaken;

    if v_retaken is null then
      return 'conflict';
    end if;
  end if;

  update purchases
     set status = 'paid',
         invoice_ref = coalesce(p_invoice_ref, invoice_ref)
   where id = p_purchase_id;

  update leads
     set paid_by = case
                     when v_chef = any(coalesce(paid_by, '{}')) then paid_by
                     else array_append(paid_by, v_chef)
                   end
   where id = v_lead_id;

  return case when v_status = 'pending' then 'completed' else 'recovered' end;
end;
$$;

revoke all on function complete_purchase(uuid, text) from public, anon, authenticated;
grant execute on function complete_purchase(uuid, text) to service_role;
