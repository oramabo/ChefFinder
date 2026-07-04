-- Client phone verification (OTP over WhatsApp), feature-flagged by OTP_ENABLED.
--
-- One active code per phone (normalized E.164-without-plus). Codes are stored
-- hashed (SHA-256); the app never persists the plaintext code. Both operations
-- are RPCs so rate limiting and attempt counting are atomic under concurrency:
--
--   save_otp    — upsert a fresh code unless one was created too recently
--                 (anti WhatsApp-spam; each template message costs money).
--   verify_otp  — single round-trip check that expires, counts attempts, and
--                 consumes the code on success.

create table if not exists phone_otps (
  phone       text primary key,               -- normalized, e.g. 972501234567
  code_hash   text not null,                  -- sha256 hex of the 6-digit code
  attempts    int  not null default 0,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

alter table phone_otps enable row level security;
-- No policies: service_role only (same posture as leads/purchases).

create or replace function save_otp(
  p_phone text,
  p_code_hash text,
  p_ttl_minutes int,
  p_min_interval_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last timestamptz;
begin
  select created_at into v_last from phone_otps where phone = p_phone for update;

  if v_last is not null
     and v_last > now() - make_interval(secs => p_min_interval_seconds) then
    return false; -- resend requested too soon
  end if;

  insert into phone_otps (phone, code_hash, attempts, expires_at, created_at)
  values (p_phone, p_code_hash, 0, now() + make_interval(mins => p_ttl_minutes), now())
  on conflict (phone) do update
    set code_hash = excluded.code_hash,
        attempts = 0,
        expires_at = excluded.expires_at,
        created_at = excluded.created_at;

  return true;
end;
$$;

create or replace function verify_otp(
  p_phone text,
  p_code_hash text,
  p_max_attempts int
)
returns text -- 'ok' | 'not_found' | 'expired' | 'too_many_attempts' | 'mismatch'
language plpgsql
security definer
set search_path = public
as $$
declare
  r phone_otps%rowtype;
begin
  select * into r from phone_otps where phone = p_phone for update;

  if r.phone is null then
    return 'not_found';
  end if;

  if r.expires_at < now() then
    delete from phone_otps where phone = p_phone;
    return 'expired';
  end if;

  if r.attempts >= p_max_attempts then
    delete from phone_otps where phone = p_phone;
    return 'too_many_attempts';
  end if;

  if r.code_hash <> p_code_hash then
    update phone_otps set attempts = attempts + 1 where phone = p_phone;
    return 'mismatch';
  end if;

  delete from phone_otps where phone = p_phone; -- single use
  return 'ok';
end;
$$;

revoke all on function save_otp(text, text, int, int) from public, anon, authenticated;
revoke all on function verify_otp(text, text, int) from public, anon, authenticated;
grant execute on function save_otp(text, text, int, int) to service_role;
grant execute on function verify_otp(text, text, int) to service_role;
