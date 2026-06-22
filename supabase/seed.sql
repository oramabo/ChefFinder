-- Demo data for local development. Tokens are deterministic so they can be
-- opened directly at /lead/<token> while developing.

insert into leads (lead_token, event_type, event_date, city, guests, budget,
                   cuisine, kosher, client_name, client_phone, client_email,
                   price, buyers_cap, buyers_count, status, source)
values
  ('demo000000000000000001', 'anniversary', current_date + 21, 'תל אביב', 40, 5000,
   'mediterranean', false, 'נועה כהן', '0541112233', 'noa@example.com',
   30, 3, 0, 'available', 'seed'),
  ('demo000000000000000002', 'birthday', current_date + 10, 'ירושלים', 15, 3000,
   'meat', true, 'דוד לוי', '0529998877', null,
   30, 3, 2, 'available', 'seed'),
  ('demo000000000000000003', 'business', current_date + 30, 'הרצליה', 80, 12000,
   'chefs-choice', false, 'מיכל ברק', '0501234567', 'michal@example.com',
   30, 3, 3, 'sold_out', 'seed')
on conflict (lead_token) do nothing;
