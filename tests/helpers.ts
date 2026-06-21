import type { Env } from "../functions-lib/env.ts";

interface CtxOptions {
  method?: string;
  url: string;
  body?: unknown;
  params?: Record<string, string>;
  env?: Partial<Env>;
}

// Builds a minimal Pages Functions EventContext for calling handlers directly.
export function ctx(opts: CtxOptions): any {
  const { method = "GET", url, body, params = {}, env = { USE_STUBS: "true" } } = opts;
  const init: RequestInit = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { "content-type": "application/json" };
  }
  const request = new Request(url, init);
  return {
    request,
    env: { USE_STUBS: "true", ...env },
    params,
    data: {},
    waitUntil: () => {},
    passThroughOnException: () => {},
    next: async () => new Response(null),
  };
}
