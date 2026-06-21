// Typed environment bindings for Cloudflare Pages Functions, plus helpers that
// decide whether a given integration should use its real adapter or a mock.

export interface Env {
  USE_STUBS?: string;

  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;

  GROW_API_KEY?: string;
  GROW_USER_ID?: string;
  GROW_PAGE_CODE?: string;
  GROW_WEBHOOK_SECRET?: string;
  PUBLIC_BASE_URL?: string;

  WA_CLOUD_TOKEN?: string;
  WA_PHONE_NUMBER_ID?: string;
  WA_MY_NUMBER?: string;
  WA_TEMPLATE_NAME?: string;

  TG_TOKEN?: string;
  TG_CHAT_ID?: string;

  TURNSTILE_SECRET?: string;
}

export function globalStubs(env: Env): boolean {
  return String(env.USE_STUBS).toLowerCase() === "true";
}

function present(...vals: Array<string | undefined>): boolean {
  return vals.every((v) => typeof v === "string" && v.trim().length > 0);
}

// Per-service readiness: real adapter only when global stubs are off AND the
// service's required keys are all present. Otherwise the mock is used.
export function useReal(env: Env, service: "db" | "payments" | "wa" | "tg" | "turnstile"): boolean {
  if (globalStubs(env)) return false;
  switch (service) {
    case "db":
      return present(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    case "payments":
      return present(env.GROW_API_KEY, env.GROW_USER_ID, env.GROW_PAGE_CODE);
    case "wa":
      return present(env.WA_CLOUD_TOKEN, env.WA_PHONE_NUMBER_ID, env.WA_MY_NUMBER);
    case "tg":
      return present(env.TG_TOKEN, env.TG_CHAT_ID);
    case "turnstile":
      return present(env.TURNSTILE_SECRET);
  }
}

export function publicBaseUrl(env: Env, request?: Request): string {
  if (present(env.PUBLIC_BASE_URL)) return env.PUBLIC_BASE_URL!.replace(/\/$/, "");
  if (request) return new URL(request.url).origin;
  return "http://localhost:8788";
}
