# PRD / DRP Coverage

Maps every PRD and DRP requirement to its implementation. **Legend:** ✅ done ·
🟡 partial / config-time · ⏭️ deliberately deferred (PRD non-goal or later
milestone). Paths are repo-relative.

## PRD

### §2 Goals / non-goals
- ✅ Capture high-intent leads via form + SEO. Sell each lead to ≤3 chefs at a
  fixed ₪30 with invoicing hook. Buyer cap + fast notify + transparency.
- ✅ Ban-safe WhatsApp (official Cloud API to operator only; no group automation).
- ⏭️ Non-goals respected: no commission, no in-platform chat, no client/chef
  accounts, no chef recruitment.

### §4 Unit economics
- ✅ `DEFAULT_PRICE=30`, `DEFAULT_CAP=3` (`shared/constants.ts`). Revenue/cap math
  enforced by `reserve_lead`.

### §6.1 Client-facing
- ✅ Premium dark RTL landing (`src/pages/Home.tsx`, `src/styles/*`).
- ✅ Programmatic SEO pages `/private-chef/[city]`, `/private-chef/[event]-[city]`,
  `/kosher-private-chef/[city]` (`shared/seo/*`, `src/pages/programmatic/*`),
  prerendered via `vite-react-ssg`.
- ✅ Schema.org Service + LocalBusiness + FAQPage (programmatic pages, Home, FAQ).
  ⏭️ AggregateRating (PRD "later").
- ✅ Multi-step form, steps event→date→city→guests→budget→cuisine/kosher→contact
  (`src/pages/FindAChef.tsx`), with qualifying friction.
- ✅ Turnstile anti-spam (`src/components/Turnstile.tsx`, `adapters/turnstile.ts`).
- ✅ Thank-you page "up to 3 chefs will call" (`src/pages/LeadReceived.tsx`).

### §6.2 Chef-facing
- ✅ Unlock page states available / sold_out / purchased (`src/pages/LeadUnlock.tsx`).
- ✅ Phone gated behind payment; reveal via secret per-purchase token (hardened
  beyond phone-only — see §9 / `functions/api/lead/[token]/contact.ts`).
- ✅ Distribution: WhatsApp Cloud API → operator + Telegram → group, parallel,
  no PII (`functions-lib/notifyLead.ts`, `adapters/messaging.*`).

### §6.3 Operator-facing
- ✅ PostHog analytics; 🟡 Cloudflare Web Analytics (enable zero-config in
  dashboard — see DEPLOYMENT.md §6).
- ✅ Lead/sales data in Supabase (`leads`, `purchases`), plus a read-only in-app
  operator view at `/admin` (token-gated, `functions/api/admin/leads.ts`,
  `src/pages/Admin.tsx`).
- ✅ Automated tax invoice per payment (`PaymentsPort.issueInvoice`, Grow adapter).

### §7 Flows
- ✅ Lead creation, capped multi-sell purchase, and concurrency all implemented
  (see DRP §4/§5 below).

### §8 SEO / GEO
- ✅ Prerendered Hebrew programmatic pages; localized H1/content/FAQ + schema.
- ✅ Hebrew display typography (Heebo, `src/styles/global.css`).
- ✅ Edge performance via Cloudflare; semantic/accessible RTL HTML.
- 🟡 Bilingual-ready: `lang="he"`/`dir="rtl"`, logical CSS, and canonical +
  `hreflang` (he + x-default) when `VITE_SITE_URL` set (`src/components/Seo.tsx`).
  `/en/` itself is ⏭️ (PRD "later").
- ⏭️ Google Business Profile, citations, map embed — off-platform/local-SEO ops
  (M2).

### §9 Analytics & KPIs
- ✅ Client funnel: `form_start`, `form_step_completed`, `form_abandoned`
  (+ last_step), `lead_submitted` (`src/pages/FindAChef.tsx`); `page_view` via
  PostHog pageview capture.
- ✅ Chef funnel: `lead_page_viewed`, `pay_clicked`, `reserve_won` /
  `reserve_sold_out`, `payment_started`, `payment_completed`, `phone_revealed`
  (`src/pages/LeadUnlock.tsx`). `lead_link_clicked` is the external WA/TG click;
  approximated by `lead_page_viewed` on arrival.
- ✅ `source` tagged on every lead (UTM/query → `leads.source`).

### §10 Payments & invoicing
- ✅ Grow (Meshulam) adapter — Bit/cards + auto-invoice (`adapters/payments.grow.ts`);
  Tranzila placeholder. Fixed ₪30; webhook confirms before reveal. 🟡 Grow's exact
  signature/field/invoice contract to be confirmed against the live account.

### §11 Risks / mitigations
- ✅ Qualifying form + Turnstile (junk leads); cap 3 + fast notify (oversell);
  official WA to self (ban); atomic counter (concurrency); invoicing hook
  (compliance). Paid-ads-from-day-1 and CPL are ops, not code.

## DRP

### §3 Data model
- ✅ `leads` + `purchases` exactly per spec, plus `reveal_token`
  (`supabase/migrations/0001_init.sql`, `0005_reveal_token.sql`).

### §4 Atomic capped reservation
- ✅ `reserve_lead` conditional UPDATE; `release_lead` compensating decrement;
  `complete_purchase`; `sweep_stale_reservations` on `pg_cron`
  (`0002_reserve_rpc.sql`, `0003_sweep.sql`). Concurrency proven by
  `tests/db/reserve.test.sql`.

### §5 API surface
- ✅ `POST /api/lead`, `GET /api/lead/:token`, `POST …/reserve`,
  `POST /api/payment/webhook`, `GET …/contact` (`functions/api/**`). Contact uses
  the secret `reveal` token instead of `?chef=` (security improvement over spec).

### §6 notifyLead
- ✅ `Promise.allSettled` WA + TG, event summary + link, never PII; env vars per
  spec (`functions-lib/notifyLead.ts`, `env.ts`).

### §7 Frontend structure
- ✅ All routes present (`src/routes.tsx`). Programmatic pages use one
  `ProgrammaticPage` resolving by path (equivalent to the 3 spec'd components).
- ✅ Logical CSS / `dir="rtl"` default / `/en/`-ready structure.
- 🟡 i18n: copy is inline Hebrew, **not** extracted to i18n keys yet. Deliberate
  for v1 (English is "later"); recommend key extraction when `/en/` is built.
- ✅ Premium dark tokens, WCAG-minded (`src/styles/tokens.css`).

### §8 Analytics instrumentation
- ✅ Client + server events; chef identified by **hashed** phone at purchase
  (`src/lib/hash.ts` + `analytics.identify`); `source` tagged per lead.

### §9 Security & compliance
- ✅ Unguessable `lead_token`; PII only to paid chefs via reveal token; RLS
  deny-all to anon (`0004_rls.sql`); service key server-only; Turnstile; webhook
  signature verification; per-payment invoice; privacy policy + consent at submit.
- 🟡 Rate limiting on `/api/lead` + `/reserve`: recommended via Cloudflare Rate
  Limiting Rules (edge-native, no app state) — see DEPLOYMENT.md §6b.

### §10 Build order — ✅ complete (schema→APIs→reveal→payments→form→analytics→SEO).

### §11 Decisions — resolved: Grow (mock/placeholder default), phone identity
(+ reveal-token hardening), 20-min reservation TTL, pages.dev first.

## Summary of intentional gaps
- ⏭️ `/en/` localization + i18n key extraction (PRD: English later).
- ⏭️ Google Business Profile, citations, map embed, ad campaigns (M2 ops).
- ⏭️ AggregateRating schema (PRD later).
- 🟡 Cloudflare Web Analytics + rate-limiting: enabled via dashboard config.
- 🟡 Grow webhook contract: finalize against the live Grow account.
