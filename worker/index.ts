// Cloudflare Worker entry point.
//
// This project's request handlers live in `functions/` and are written against
// a framework-agnostic `FnCtx` (see `functions-lib/handler.ts`). Previously they
// were wired up by Cloudflare Pages' file-based routing; here we wire the same
// handlers into a single Worker with a small explicit router, and serve the
// built SPA / prerendered pages via the Static Assets binding.
//
// Routing is split in `wrangler.toml`: `/api/*` and `/sitemap.xml` are sent to
// this Worker (`run_worker_first`), while every other path is served from
// `dist/` (with `not_found_handling = "single-page-application"` providing the
// SPA shell fallback). The `_headers` file in `dist/` applies the security
// headers to those static/HTML responses, exactly as it did on Pages.
import type { Env } from "../functions-lib/env.ts";
import type { FnCtx, Handler } from "../functions-lib/handler.ts";
import { error } from "../functions-lib/http.ts";

import { onRequestPost as createLead } from "../functions/api/lead/index.ts";
import { onRequestGet as getLead } from "../functions/api/lead/[token]/index.ts";
import { onRequestGet as getContact } from "../functions/api/lead/[token]/contact.ts";
import { onRequestPost as reserveLead } from "../functions/api/lead/[token]/reserve.ts";
import { onRequestPost as mockComplete } from "../functions/api/payment/mock-complete.ts";
import { onRequestPost as paymentWebhook } from "../functions/api/payment/webhook.ts";
import { onRequestGet as adminLeads } from "../functions/api/admin/leads.ts";
import { onRequestPost as adminNotify } from "../functions/api/admin/notify.ts";
import { onRequestPost as adminConfirm } from "../functions/api/admin/confirm.ts";
import { onRequestGet as adminPending } from "../functions/api/admin/pending.ts";
import { onRequestPost as submitJoin } from "../functions/api/join.ts";
import { onRequestGet as sitemap } from "../functions/sitemap.xml.ts";

// Minimal local typings for the Workers runtime, so this file typechecks under
// the existing (node + DOM) tsconfig without pulling in conflicting global
// worker type definitions.
interface Fetcher {
  fetch(input: Request | string, init?: RequestInit): Promise<Response>;
}
interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}
interface WorkerEnv extends Env {
  // Binding to the static assets in `dist/` (configured in wrangler.toml).
  ASSETS: Fetcher;
}

interface Route {
  method: string;
  // A path pattern where a single `:token` segment is captured into params.
  pattern: string;
  handler: Handler;
}

const routes: Route[] = [
  { method: "POST", pattern: "/api/lead", handler: createLead },
  { method: "POST", pattern: "/api/join", handler: submitJoin },
  { method: "GET", pattern: "/api/lead/:token", handler: getLead },
  { method: "GET", pattern: "/api/lead/:token/contact", handler: getContact },
  { method: "POST", pattern: "/api/lead/:token/reserve", handler: reserveLead },
  { method: "POST", pattern: "/api/payment/mock-complete", handler: mockComplete },
  { method: "POST", pattern: "/api/payment/webhook", handler: paymentWebhook },
  { method: "GET", pattern: "/api/admin/leads", handler: adminLeads },
  { method: "POST", pattern: "/api/admin/lead/:token/notify", handler: adminNotify },
  { method: "POST", pattern: "/api/admin/purchase/:ref/confirm", handler: adminConfirm },
  { method: "GET", pattern: "/api/admin/pending", handler: adminPending },
  { method: "GET", pattern: "/sitemap.xml", handler: sitemap },
];

// Baseline security headers mirrored from `dist/_headers` (the `/*` block), so
// Worker-generated API/XML responses carry the same hardening that static and
// HTML responses get from the assets layer. CSP is intentionally omitted here —
// it is meaningful only for HTML, which this Worker never serves.
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

// Match a request path against a route pattern, returning captured params or
// null when it doesn't match. Patterns only ever contain a single `:token`.
function matchPath(pattern: string, path: string): Record<string, string> | null {
  const pp = pattern.split("/");
  const ap = path.split("/");
  if (pp.length !== ap.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(":")) {
      const value = decodeURIComponent(ap[i]);
      if (!value) return null;
      params[pp[i].slice(1)] = value;
    } else if (pp[i] !== ap[i]) {
      return null;
    }
  }
  return params;
}

// Wraps a matched handler with the global middleware behaviour that used to live
// in `functions/_middleware.ts`: tag every response with a request id and turn
// any unhandled error into a 500 instead of leaking a stack trace.
async function runWithMiddleware(
  handler: Handler,
  ctx: FnCtx,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  let res: Response;
  try {
    res = await handler(ctx);
  } catch (err) {
    console.error(`[${requestId}] unhandled error:`, err);
    res = error("שגיאת שרת פנימית", 500, { request_id: requestId });
  }
  const headers = new Headers(res.headers);
  headers.set("x-request-id", requestId);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, headers });
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Find a route matching this path (ignoring method first, so a known path
    // with the wrong method yields 405 rather than falling through to assets).
    const pathMatches = routes
      .map((r) => ({ route: r, params: matchPath(r.pattern, path) }))
      .filter((m) => m.params !== null);

    if (pathMatches.length > 0) {
      const matched = pathMatches.find((m) => m.route.method === request.method);
      if (!matched) {
        return error("שיטה לא נתמכת", 405, { reason: "method_not_allowed" });
      }
      const fnCtx: FnCtx = {
        request,
        env,
        params: matched.params as Record<string, string>,
        data: {},
        waitUntil: (promise) => ctx.waitUntil(promise),
        // Leaf handlers never call next(); provide a sane fallback regardless.
        next: () => env.ASSETS.fetch(request),
      };
      return runWithMiddleware(matched.route.handler, fnCtx);
    }

    // Not an API/sitemap route. With `run_worker_first` scoped to those paths
    // this is rarely reached, but fall back to the static assets (which apply
    // the SPA `not_found_handling`) so behaviour is correct either way.
    return env.ASSETS.fetch(request);
  },
};
