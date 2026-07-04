# Deploying ChefLeads to Cloudflare Workers

This is the full go-live runbook with **all** integrations wired: Supabase,
Turnstile, Telegram, WhatsApp, Grow (payments), and PostHog. Deployment is via
**Cloudflare Workers Builds Git integration** (auto-deploy on push): `npm run
build` produces the static site in `dist/`, and `npx wrangler deploy` publishes
the Worker (`worker/index.ts`) together with those assets.

The app is a single Worker with [Static Assets](https://developers.cloudflare.com/workers/static-assets/):
`worker/index.ts` routes `/api/*` and `/sitemap.xml` to the request handlers in
`functions/`, while every other path is served from `dist/` (with an SPA shell
fallback). Routing and the assets binding are declared in `wrangler.toml`.

The application needs no code changes to enable any integration — the container
factory (`functions-lib/factory.ts`, `functions-lib/env.ts`) uses the real
adapter for each service when its keys are present, and a safe mock otherwise.
In production (`USE_STUBS` unset) the app **fails closed** if the database or the
payment provider is missing, so half-configured states can't leak data.

> Security: never paste secrets into chat, commits, or screenshots. Enter them
> directly in the provider and Cloudflare dashboards.

## 🚀 Launch checklist (Bit-only start)

Everything on this list must be done before real chefs pay real money:

1. **Remove `MOCK_PAYMENTS = "true"` from `wrangler.toml`.** While it is set,
   `/api/payment/mock-complete` lets anyone unlock client contacts without
   paying.
2. **Set the `BIT_PHONE` secret** (and optionally `BIT_LINK`). With Grow unset,
   the reserve flow shows Bit instructions and you confirm payments in `/admin`.
3. **Set `TURNSTILE_SECRET` (secret) + `VITE_TURNSTILE_SITE_KEY` (build var).**
   Turnstile now gates **both** the lead form and the reserve endpoint. Without
   the secret, the factory logs an error on every request and anti-spam is
   effectively off.
4. **Set `ADMIN_TOKEN`** (strong secret; the admin API accepts it via the
   `x-admin-token` header only — query-param tokens are rejected).
5. **Set `PUBLIC_BASE_URL`** to the real domain (`https://ezfind.app`) so unlock
   and recovery links point at the canonical host.
6. **Add WAF rate-limiting rules** on `/api/lead` and `/api/lead/*/reserve`
   (section 6b) — Turnstile raises the cost of abuse; the WAF caps its volume.
7. **Apply migrations** through `0008` (late-payment recovery + multi-vertical
   columns). The reservation sweep runs via pg_cron when available **and** via
   the Worker cron trigger (every 10 min, `wrangler.toml [triggers]`) as a
   backstop.
8. **After confirming a Bit payment in `/admin`, send the chef the recovery
   link** the panel shows — it restores contact access from any device (chefs
   often pay inside in-app browsers that lose local storage).
9. **Reviews stay off** (`REVIEWS_ARE_REAL=false` in `shared/seo/reviews.ts`)
   until the seed reviews are replaced with real, verifiable customer reviews.

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

> ⚠️ **Variables vs Secrets on Workers — important.** Workers Builds runs
> `wrangler deploy` on every push, and a deploy **resets plaintext Variables to
> exactly what `wrangler.toml` declares**. So plaintext Variables typed into the
> dashboard get **wiped on the next build**. Only two kinds of values survive:
> **Secrets** (encrypted; never touched by a deploy) and plaintext vars declared
> in `wrangler.toml` under `[vars]`. Put every sensitive value in **Secrets**.

There are three places a value can live:

1. **`wrangler.toml [vars]`** — non-secret runtime values, version-controlled.
   `PUBLIC_BASE_URL` and `MOCK_PAYMENTS` already live here; edit them in the file.
2. **Secrets** (dashboard → Settings → Variables and Secrets, *Secret* type, or
   `wrangler secret put NAME`) — all sensitive runtime values. Preserved across
   deploys.
3. **Build variables** (Workers Builds → build settings) — the `VITE_*` values,
   which Vite inlines into the bundle at **build time**. After changing one,
   trigger a new build so it re-inlines.

### Build variables (set in Workers Builds → build settings)
| Name | Example / source |
|---|---|
| `VITE_TURNSTILE_SITE_KEY` | Turnstile widget site key |
| `VITE_POSTHOG_KEY` | PostHog project API key |
| `VITE_POSTHOG_HOST` | `https://eu.i.posthog.com` (or your region) |
| `VITE_SITE_URL` | `https://<name>.<subdomain>.workers.dev` (for canonical + hreflang) |

### Non-secret runtime vars (in `wrangler.toml` `[vars]`)
| Name | Notes |
|---|---|
| `PUBLIC_BASE_URL` | `https://<name>.<subdomain>.workers.dev` (your live origin) |
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
| `ADMIN_TOKEN` | Secret to access the read-only `/admin` leads view (shows PII) |
| `WA_MY_NUMBER` | Operator WhatsApp number(s), E.164. Multiple allowed — separate with commas (e.g. `9725...,9725...`) |
| `WA_TEMPLATE_NAME` | `new_lead` (the approved template name) |
| `WA_TEMPLATE_LANG` | Template language code, must match Meta exactly (default `he`; e.g. `he_IL`) |
| `WA_RESERVATION_TEMPLATE` | Operator reservation-alert template (default `new_reservation`; named params `chef_phone, city, amount, reference`) |
| `TG_ADMIN_CHAT_ID` | Separate **operator** Telegram channel id for reservation/payment alerts (uses the same `TG_TOKEN`) |
| `BIT_PHONE` | Your Bit phone number (manual Bit mode — shown to chefs). Setting it enables Bit checkout |
| `BIT_LINK` | Optional Bit payment-request link (adds an "open Bit" button) |
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

Cloudflare dashboard → Turnstile → add a widget for your `*.workers.dev` hostname
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
   automated group posting). **Multiple recipients:** list several numbers
   separated by commas (also spaces/semicolons/newlines), e.g.
   `972500000001,972500000002` — the template is sent to each one. Every number
   must have opted in / be a valid WhatsApp recipient for your Cloud API app.
3. Create + get approval for a **utility template** named `new_lead`, language
   **Hebrew (`he`)**, using **named** body variables (not numbered):
   `{{city}}, {{date}}, {{guests}}, {{cuisine}}, {{budget}}, {{price}}`, and a
   **URL button** whose dynamic parameter is the `lead_token` (matching
   `functions-lib/adapters/messaging.whatsapp.ts`). Set `WA_TEMPLATE_NAME=new_lead`.
   The template must be **Approved** before it can send.
4. **Language must match exactly.** The app sends the template in `WA_TEMPLATE_LANG`
   (default `he`). If Meta returns **`(#132001) template name (new_lead) does not
   exist in he`**, the template either isn't approved yet, has a different name
   (`WA_TEMPLATE_NAME`), or was created under a different language code — set
   `WA_TEMPLATE_LANG` to the exact code shown in WhatsApp Manager (e.g. `he_IL`).

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

In the Cloudflare dashboard → Web Analytics, enable analytics for the Worker
(automatic injection). No code change is needed — this is in addition to
PostHog and gives free edge traffic metrics.

## 6b. Rate limiting (abuse protection)

Turnstile already gates the lead form. For network-level protection of
`/api/lead` and `/api/lead/*/reserve`, add **Cloudflare Rate Limiting Rules**
(dashboard → Security → WAF → Rate limiting) — e.g. cap requests per IP per
minute on those paths. This is the edge-native approach (no app state / KV
required) and is the recommended mechanism for the DRP's rate-limit requirement.

---

## 6c. Operator view (`/admin`)

A read-only recent-leads table lives at `/admin` (shows PII: name, phone, email,
status, buyers). Set **`ADMIN_TOKEN`** to a strong secret; the operator enters it
once on the page (stored in their browser). Without `ADMIN_TOKEN` set, `/admin`
is denied in production (it's open only under `USE_STUBS`). The page is `noindex`
and disallowed in `robots.txt`.

## 7. Cloudflare Worker project

1. **Merge the PR into `main` first** — Workers Builds builds the production
   branch and `main` must contain the app.
2. Cloudflare dashboard → Workers & Pages → **Create** → **Workers** → **Connect
   to Git** (Import a repository) → `oramabo/cheffinder`; set production branch =
   `main`. (Pick **Worker**, not Pages — this repo is a Worker.)
3. Build settings:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy` (the dashboard default — it now
     works because `wrangler.toml` declares a Worker with a `[assets]` directory,
     not a Pages project). Node 22 is read from `.nvmrc` (required by Wrangler v4).
   - No "build output directory" field — the assets directory comes from
     `wrangler.toml` (`[assets] directory = "./dist"`).
4. The Worker config in `wrangler.toml` already sets `nodejs_compat`, a recent
   `compatibility_date`, the `ASSETS` binding, `not_found_handling =
   "single-page-application"`, and `run_worker_first = ["/api/*", "/sitemap.xml"]`
   (so API routes hit the Worker while everything else is served statically).
   `_headers` (security/CSP) is honoured natively from `dist/`.
5. Add all variables and secrets from the tables above (Production environment).
6. Deploy. Note the `https://<name>.<subdomain>.workers.dev` URL and set it as
   `PUBLIC_BASE_URL`, then redeploy if it changed.

> Migrated from Pages? Delete any old Pages project for this repo so the two
> don't both build on push. The old Pages-only files (`_routes.json`,
> `_redirects`) have been removed; SPA fallback is handled by
> `not_found_handling` and API routing by `run_worker_first`.

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

Your Worker → Settings → **Domains & Routes** → add a custom domain (DNS on
Cloudflare). Then update
`PUBLIC_BASE_URL`, add the domain to the Turnstile widget, point Grow's
webhook/return URLs at it, and re-run the smoke test.
