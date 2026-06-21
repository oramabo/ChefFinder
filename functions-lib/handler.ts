import type { Env } from "./env.ts";

// Minimal Cloudflare Pages Functions context. We type handlers against this
// instead of the ambient `PagesFunction` so the same files typecheck cleanly in
// the app/test projects without pulling in worker-only global type definitions.
// At runtime Cloudflare passes a superset of these fields.
export interface FnCtx<E = Env> {
  request: Request;
  env: E;
  params: Record<string, string>;
  next: () => Promise<Response>;
  waitUntil: (promise: Promise<unknown>) => void;
  data: Record<string, unknown>;
}

export type Handler<E = Env> = (ctx: FnCtx<E>) => Response | Promise<Response>;
