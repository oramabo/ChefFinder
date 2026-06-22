# Deploying ChefLeads to Cloudflare Pages

This is the full go-live runbook with **all** integrations wired: Supabase,
Turnstile, Telegram, WhatsApp, Grow (payments), and PostHog. Deployment is via
**Cloudflare Pages Git integration** (auto-deploy on push).

The application needs no code changes to enable any integration — the container
factory (`functions-lib/factory.ts`, `functions-lib/env.ts`) uses the real
adapter for each service when its keys are present, and a safe mock otherwise.
In production (`USE_STUBS` unset) the app **fails closed** if the database or the
payment provider is missing, so half-configured states can't leak data.

> Security: never paste secrets into chat, commits, or screenshots. Enter them
> directly in the provider and Cloudflare dashboards.

## Recommended first deploy: full flow, placeholder checkout

To test the **complete flow** — lead capture, distribution, unlock-link
generation, slot reservation, and contact reveal — **before** wiring real
payments, deploy with everything real **except** payments:

- Set **`MOCK_PAYMENTS=true`**. The checkout becomes an instant click-through
  that completes the reservation and reveals the contact (the mock provider),
  while Supabase, Turnstile, Telegram, WhatsApp, and PostHog all run for real.
- Skip the Grow section (5) for now. When you're ready for real charges, remove
  `MOCK_PAYMENTS` and add the `GROW_*` secrets — the reserve flow switches to the
  real provider automatically and the placeholder endpoint becomes 404.

---

## Environment variables

Cloudflare Pages has two kinds of values. **Plaintext variables** are available
at build *and* runtime — `VITE_*` must be plaintext because Vite inlines them
into the bundle at build time. **Secrets** are encrypted and available only at
runtime (used by Functions).

### Plaintext build variables
| Name | Example / source |
|---|---|
| `VITE_TURNSTILE_SITE_KEY` | Turnstile widget site key |
| `VITE_POSTHOG_KEY` | PostHog project API key |
| `VITE_POSTHOG_HOST` | `https://eu.i.posthog.com` (or your region) |
| `VITE_SITE_URL` | `https://<project>.pages.dev` (for canonical + hreflang) |
| `PUBLIC_BASE_URL` | `https://<project>.pages.dev` (your live origin) |
| `MOCK_PAYMENTS` | `true` for the placeholder-checkout test deploy; remove for real payments |

> Do **not** set `USE_STUBS` in production (or set it to `false`).

### Runtime secrets (encrypted)
| Name | Source |
|---|---|
| `SUPABASE_URL` | Supabase → Settings → API |
| `SUPABASE_SERVICE_KEY` | Supabase → Settings → API → `service_role` key |
| `TURNSTILE_SECRET` | Turnstile widget secret |
| `TG_TOKEN` | @BotFather bot token |
| `TG_CHAT_ID` | Chef group/channel id |
| `WA_CLOUD_TOKEN` | Meta WhatsApp Cloud API token |
| `WA_PHONE_NUMBER_ID` | Meta WhatsApp phone number id |
| `WA_MY_NUMBER` | Operator's WhatsApp number (E.164) |
| `WA_TEMPLATE_NAME` | `new_lead` (the approved template name) |
| `GROW_API_KEY` | Grow/Meshulam API key |
| `GROW_USER_ID` | Grow user id |
| `GROW_PAGE_CODE` | Grow payment page code |
| `GROW_WEBHOOK_SECRET` | Grow webhook signing secret (if provided) |

After changing build variables, trigger a **new deployment** so Vite re-inlines
the `VITE_*` values.

---

## 1. Supabase (database)

1. Create a project; pick a region near Israel (e.g. Frankfurt / `eu-central`).
2. Apply migrations **in order**. Either with the CLI:
   ```bash
   supabase link --project-ref <your-ref>
   supabase db push
   ```
   or paste each file from `supabase/migrations/` (`0001_init.sql` →
   `0005_reveal_token.sql`) into the SQL editor, in order. **Do not** run
   `supabase/seed.sql` in production.
3. Enable the **`pg_cron`** extension: Database → Extensions → enable `pg_cron`.
   `0003_sweep.sql` schedules the abandoned-reservation sweep every 5 minutes.
   If the extension was off when migrations ran, re-run the `cron.schedule(...)`
   block at the bottom of `0003_sweep.sql` afterward.
4. Copy `SUPABASE_URL` and the `service_role` key (Settings → API). Row-Level
   Security is already deny-all to anon (`0004_rls.sql`); only the Functions use
   the service key, which never reaches the browser.

## 2. Turnstile (anti-spam)

Cloudflare dashboard → Turnstile → add a widget for your `*.pages.dev` hostname
(and any custom domain later). Record the **site key** (→ `VITE_TURNSTILE_SITE_KEY`)
and **secret** (→ `TURNSTILE_SECRET`). With these set, the form verifies
server-side and fails closed on invalid tokens.

## 3. Telegram (lead alerts)

1. Create a bot via **@BotFather** → `TG_TOKEN`.
2. Create the chef group/channel, add the bot as an **admin**.
3. Get the chat id (`TG_CHAT_ID`) — e.g. post a message and read
   `https://api.telegram.org/bot<TG_TOKEN>/getUpdates`, or use a chat-id helper
   bot. The bot posts the PII-free lead summary + unlock link on each new lead.

## 4. WhatsApp (Cloud API, to operator)

1. In Meta for Developers, set up a **WhatsApp Cloud API** app; get the access
   token (`WA_CLOUD_TOKEN`) and phone number id (`WA_PHONE_NUMBER_ID`).
2. `WA_MY_NUMBER` = the operator's own WhatsApp number (E.164, e.g. `9725…`).
   The operator forwards messages to the chef group manually (ban-safe; no
   automated group posting).
3. Create + get approval for a **utility template** named `new_lead`, language
   **Hebrew (`he`)**, with **6 body parameters** in this order:
   `city, date, guests, cuisine, budget, price`, and a **URL button** whose
   dynamic parameter is the `lead_token` (matching
   `functions-lib/adapters/messaging.whatsapp.ts`). Set `WA_TEMPLATE_NAME=new_lead`.

## 5. Grow / Meshulam (payments + invoice) — when ready for real charges

> Skip this for the placeholder test deploy (`MOCK_PAYMENTS=true`). Do it when you
> want real payments; then remove `MOCK_PAYMENTS` and add the `GROW_*` secrets.


1. Create a Grow account; obtain `GROW_API_KEY`, `GROW_USER_ID`, `GROW_PAGE_CODE`
   (and a webhook signing secret if Grow provides one → `GROW_WEBHOOK_SECRET`).
2. In Grow, set the payment **notify/webhook URL** to
   `https://<your-domain>/api/payment/webhook` and the **return URL** to
   `https://<your-domain>/lead/:token` (the app passes the exact return URL per
   reservation).
3. **Verify the webhook contract.** `functions-lib/adapters/payments.grow.ts`
   implements Grow's "light server" flow with sensible field names
   (`cField1`=purchase id, `processId`/`transactionId`=provider ref, status code
   `1`=paid) and an HMAC-SHA256 signature check. The exact field names, success
   code, and signature scheme **must be confirmed against your Grow account's
   integration docs** and adjusted if they differ — this is isolated in that one
   file; handlers don't change. Also confirm whether the tax invoice is issued
   automatically on charge or needs an explicit API call (`issueInvoice`).

Once `GROW_*` are set, the reserve flow goes live automatically and the dev-only
`/api/payment/mock-complete` endpoint stays 404 in production.

## 6. PostHog (analytics)

Create a PostHog project; copy the project API key → `VITE_POSTHOG_KEY` and set
`VITE_POSTHOG_HOST` to your region host. Analytics is a no-op until the key is
present. Redeploy after setting (build-time inlining). The app emits the client
funnel (`form_start`, `form_step_completed`, `form_abandoned`, `lead_submitted`)
and chef funnel (`lead_page_viewed`, `pay_clicked`, `reserve_won`/`reserve_sold_out`,
`payment_started`, `payment_completed`, `phone_revealed`) and identifies the chef
by a **hashed** phone at purchase.

### Cloudflare Web Analytics (free, zero-config)

In the Cloudflare dashboard → Web Analytics, enable analytics for the Pages
project (automatic injection). No code change is needed — this is in addition to
PostHog and gives free edge traffic metrics.

## 6b. Rate limiting (abuse protection)

Turnstile already gates the lead form. For network-level protection of
`/api/lead` and `/api/lead/*/reserve`, add **Cloudflare Rate Limiting Rules**
(dashboard → Security → WAF → Rate limiting) — e.g. cap requests per IP per
minute on those paths. This is the edge-native approach (no app state / KV
required) and is the recommended mechanism for the DRP's rate-limit requirement.

---

## 7. Cloudflare Pages project

1. **Merge the PR into `main` first** — Pages builds the production branch and
   `main` must contain the app (it currently holds the empty initial commit).
2. Cloudflare dashboard → Workers & Pages → Create → Pages → **Connect to Git**
   → `oramabo/cheffinder`; set production branch = `main`.
3. Build settings: Framework preset **None**; **Build command** `npm run build`;
   **Build output directory** `dist`. Node 20 is read from `.nvmrc`.
4. Functions: ensure `nodejs_compat` and a recent `compatibility_date` are active
   (declared in the root `wrangler.toml`; confirm under Settings → Functions).
5. Add all variables and secrets from the tables above (Production environment).
6. Deploy. Note the `https://<project>.pages.dev` URL and set it as
   `PUBLIC_BASE_URL`, then redeploy if it changed.

## 8. Post-deploy smoke test (live)

- Submit `/find-a-chef` → a row appears in Supabase `leads`; the Telegram group
  and the operator's WhatsApp receive the alert (confirm **no** name/phone/email
  in either message).
- Open the unlock link `/lead/:token` → enter a chef phone → Pay. With
  `MOCK_PAYMENTS=true` this is an instant click-through that reveals the contact;
  with Grow it's a real (or sandbox) charge that reveals on webhook + issues a
  tax invoice. A 4th buyer beyond the cap of 3 sees "sold out".
- View-source `/private-chef/tel-aviv` → prerendered H1 + Service/FAQ JSON-LD;
  check `/sitemap.xml` and `/robots.txt`.
- Confirm PostHog receives `lead_submitted`, `pay_clicked`, `payment_completed`,
  `phone_revealed`.

## 9. Custom domain (when ready)

Pages → Custom domains → add your domain (DNS on Cloudflare). Then update
`PUBLIC_BASE_URL`, add the domain to the Turnstile widget, point Grow's
webhook/return URLs at it, and re-run the smoke test.
