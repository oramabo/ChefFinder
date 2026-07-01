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
import { onRequestGet as adminJoinApps } from "../functions/api/admin/joinApplications.ts";
import { onRequestPost as adminJoinAppStatus } from "../functions/api/admin/joinApplicationStatus.ts";
import { onRequestPost as submitJoin } from "../functions/api/join.ts";
import { onRequestGet as sitemap } from "../functions/sitemap.xml.ts";
import { APEX_HOST, subdomainRedirects } from "@shared/services/registry.ts";

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
  { method: "GET", pattern: "/api/admin/join-applications", handler: adminJoinApps },
  { method: "POST", pattern: "/api/admin/join-application/:id/status", handler: adminJoinAppStatus },
  // Sitemaps (/sitemap.xml + /sitemap-*.xml) are handled by a dedicated branch
  // in fetch(), not this table, so the whole family routes to one handler.
];

// Baseline security headers mirrored from `dist/_headers` (the `/*` block), so
// Worker-generated API/XML responses carry the same hardening that static and
// HTML responses get from the assets layer. CSP is intentionally omitted here —
// it is meaningful only for HTML, which this Worker never serves.
// Host architecture. All custom domains point at this one Worker; it
// differentiates by hostname. Keep in sync with the client routing in
// `src/routes.tsx`.
//   ezfind.app        → the client marketplace (find a chef) — our primary,
//                       canonical host, where all the SEO pages live. Chef
//                       recruitment lives beneath it at /join.
//   admin.ezfind.app  → the operator admin panel
//   *.workers.dev     → the marketplace (dev/preview), untouched
//
// The canonical host. Requests to an alias host are 301'd here so link equity
// consolidates on one host (subdirectory-style) instead of splitting across
// subdomains. Each value is the target for that host's ROOT ("/"); every other
// path is preserved. From the service registry, so a new service's subdomain
// (e.g. cleaners.ezfind.app → /cleaners) redirects automatically. www folds
// into the bare apex.
const CANONICAL_HOST = APEX_HOST;
const HOST_REDIRECTS: Record<string, string> = {
  "www.ezfind.app": "/",
  ...subdomainRedirects(),
};

// Per-host root: a hostname whose apex serves a specific prerendered page
// instead of the marketplace. Only the admin host remains special; the apex
// serves the marketplace directly (default asset serving).
const HOST_ROOT: Record<string, string> = {
  "admin.ezfind.app": "/admin",
};

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

// Build the framework-agnostic context leaf handlers expect.
function makeFnCtx(
  request: Request,
  env: WorkerEnv,
  params: Record<string, string>,
  ctx: ExecutionContext,
): FnCtx {
  return {
    request,
    env,
    params,
    data: {},
    waitUntil: (promise) => ctx.waitUntil(promise),
    // Leaf handlers never call next(); provide a sane fallback regardless.
    next: () => env.ASSETS.fetch(request),
  };
}

export default {
  async fetch(request: Request, env: WorkerEnv, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Permanent redirect of alias hosts (www, service subdomains) to the
    // canonical apex. The host's root goes to its mapped path (chefs.ezfind.app/
    // → ezfind.app/chefs); every other path — and the query — is preserved.
    // 301 so browsers and Google cache the move and authority consolidates.
    const rootTarget = HOST_REDIRECTS[url.hostname];
    if (rootTarget !== undefined) {
      const target = new URL(url.toString());
      target.hostname = CANONICAL_HOST;
      if (path === "/") target.pathname = rootTarget;
      return new Response(null, {
        status: 301,
        headers: { location: target.toString(), ...SECURITY_HEADERS },
      });
    }

    // The sitemap family (index + per-service children, /sitemap-{service}.xml)
    // is served by one handler that dispatches on the pathname, so a new
    // service's child sitemap works without a routing change.
    if (/^\/sitemap(-[a-z0-9-]+)?\.xml$/.test(path)) {
      return runWithMiddleware(sitemap, makeFnCtx(request, env, {}, ctx));
    }

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
      const fnCtx = makeFnCtx(request, env, matched.params as Record<string, string>, ctx);
      return runWithMiddleware(matched.route.handler, fnCtx);
    }

    // Host-based serving for the admin custom domain: a navigation request is
    // served that host's prerendered root page (admin.ezfind.app → the admin
    // panel). Static assets (anything with a file extension: .js/.css/.svg/
    // .woff2/…) pass straight through so the page's JS/CSS/fonts still load. The
    // apex (marketplace) and *.workers.dev are untouched.
    const hostRoot = HOST_ROOT[url.hostname];
    if (hostRoot && !/\.[a-z0-9]+$/i.test(path)) {
      const rootPage = new URL(hostRoot, url.origin);
      return env.ASSETS.fetch(new Request(rootPage.toString(), request));
    }

    // Not an API/sitemap route. With `run_worker_first` scoped to those paths
    // this is rarely reached, but fall back to the static assets (which apply
    // the SPA `not_found_handling`) so behaviour is correct either way.
    return env.ASSETS.fetch(request);
  },
};
