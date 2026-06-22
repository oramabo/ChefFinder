-- Defense in depth: enable RLS and deny all access to anon/authenticated.
-- The application reaches Postgres only through Cloudflare Functions using the
-- service role (which bypasses RLS), so no public policies are created. Any
-- direct browser connection with the anon key gets nothing.

alter table leads enable row level security;
alter table purchases enable row level security;

-- No policies for anon/authenticated == deny all for those roles.
-- (service_role bypasses RLS.)
