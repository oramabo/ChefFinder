# ChefLeads

A two-sided lead marketplace connecting clients who want a **private chef** for an
event with professional chefs who pay per lead. Hebrew-first (RTL), premium dark
design. This repo is the **M1 Core MVP**.

- **Client funnel:** premium landing + programmatic SEO pages → multi-step
  qualifying form → a *lead*.
- **Distribution:** on submit, a PII-free summary + unlock link goes to the
  operator's WhatsApp (forwarded to the chef group) and a Telegram group.
- **Chef funnel:** chef opens `/lead/:token`, pays a fixed fee (₪30) to unlock the
  client's phone. Each lead is sold to at most 3 chefs (atomic, oversell-proof).

## Stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React (RTL), prerendered via `vite-react-ssg` for SEO pages |
| API | Cloudflare Worker (`worker/`) routing handlers in `functions/` |
| DB | Supabase / Postgres (atomic `reserve_lead` RPC + TTL sweep) |
| Payments | Grow (Meshulam) — Bit + cards + invoice (mock by default) |
| Distribution | WhatsApp Cloud API (to operator) + Telegram Bot API |
| Anti-spam | Cloudflare Turnstile |
| Analytics | PostHog + Cloudflare Web Analytics |

## Architecture: ports & adapters

Every external integration sits behind an interface in `functions-lib/ports/`
with a real adapter and a mock adapter in `functions-lib/adapters/`.
`functions-lib/factory.ts` picks the real adapter only when its keys are present,
otherwise the mock. So the whole product **runs end-to-end with zero real keys**:

```bash
USE_STUBS=true   # forces all mocks (see .env.example)
```

## Develop

```bash
npm install
cp .env.example .dev.vars         # fill in or leave blank to run on stubs

# Fast UI loop (Vite only):
npm run dev:web

# Full edge loop (SPA + Worker API):
npm run dev                       # wrangler dev (build first: npm run build)

# With a real local database:
npm run db:start                  # supabase start
npm run db:reset                  # apply migrations + seed
```

## Test

```bash
npm run typecheck                 # 3 tsconfig projects (src / functions / node)
npm run test                      # vitest: unit + integration (mocks, no services)
npm run test:db                   # SQL reservation/concurrency test (needs local PG)
npm run build                     # prerender SEO pages to dist/
```

## End-to-end stub walkthrough

With `USE_STUBS=true npm run dev`: submit the `/find-a-chef` form (WhatsApp +
Telegram "sent" appear in the console, no PII), open the lead at `/lead/:token`,
enter a phone and pay (the mock payment page returns you and reveals the phone),
and a fourth buyer past the cap of 3 sees "sold out".

## Layout

```
src/                React SPA (pages, components, styles, lib)
worker/             Cloudflare Worker entry: routes /api/* + /sitemap.xml, serves assets
functions/          Request handlers (framework-agnostic FnCtx), wired by worker/
functions-lib/      Server domain logic: ports, adapters, factory, notifyLead
shared/             Isomorphic: zod schema, types, constants, SEO data
supabase/migrations Schema, reserve_lead RPC, sweep, RLS
tests/              Vitest unit + integration; SQL concurrency test
```
