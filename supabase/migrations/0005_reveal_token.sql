-- Per-purchase secret reveal token. Gates the contact endpoint instead of the
-- chef's (guessable) phone number. Set at reserve time, activated once the
-- purchase is paid; never placed in any URL or distributed message.

alter table purchases add column if not exists reveal_token text;

create unique index if not exists purchases_reveal_token_uniq
  on purchases (reveal_token) where reveal_token is not null;
