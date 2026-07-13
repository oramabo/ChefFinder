// Typed environment bindings for Cloudflare Pages Functions, plus helpers that
// decide whether a given integration should use its real adapter or a mock.
import { timingSafeEqual } from "./crypto.ts";

export interface Env {
  USE_STUBS?: string;
  // Shared secret protecting the read-only operator/admin view (it returns PII).
  ADMIN_TOKEN?: string;
  // Placeholder-payments mode: use the mock checkout (no real provider) while
  // every other service runs for real. Lets the full lead → link → unlock flow
  // be tested end-to-end before Grow is wired.
  MOCK_PAYMENTS?: string;

  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;

  GROW_API_KEY?: string;
  GROW_USER_ID?: string;
  GROW_PAGE_CODE?: string;
  GROW_WEBHOOK_SECRET?: string;
  PUBLIC_BASE_URL?: string;

  // ── Lemon Squeezy (Merchant of Record) — feature-flagged provider ─────────
  // Master switch: "true" routes checkout through Lemon Squeezy (takes
  // precedence over Grow/Bit). Flip off to disable without removing the keys.
  LEMONSQUEEZY_ENABLED?: string;
  LEMONSQUEEZY_API_KEY?: string;
  LEMONSQUEEZY_STORE_ID?: string;
  LEMONSQUEEZY_VARIANT_ID?: string;
  LEMONSQUEEZY_WEBHOOK_SECRET?: string;

  WA_CLOUD_TOKEN?: string;
  WA_PHONE_NUMBER_ID?: string;
  WA_MY_NUMBER?: string;
  WA_TEMPLATE_NAME?: string;
  // Language code of the approved WhatsApp template (must match Meta exactly,
  // e.g. "he", "he_IL", "en"). Defaults to "he".
  WA_TEMPLATE_LANG?: string;
  // Template for the operator reservation alert (defaults to "new_reservation").
  WA_RESERVATION_TEMPLATE?: string;

  // ── WhatsApp direct messages to end users (feature-flagged) ───────────────
  // Client phone verification: "true" requires an OTP (sent to the client's
  // WhatsApp) before a lead is accepted. Flip off any time to return to
  // no-verification lead capture.
  OTP_ENABLED?: string;
  // Chef access links: "true" sends the paying chef their unlock/recovery link
  // on WhatsApp when a payment is confirmed, and enables the self-service
  // "send me my access link" endpoint on the lead page.
  RECOVERY_ENABLED?: string;
  // Meta AUTHENTICATION-category template for the OTP (default "otp_code").
  WA_OTP_TEMPLATE?: string;
  // Meta UTILITY-category template with a URL button for the access link
  // (default "lead_access").
  WA_ACCESS_TEMPLATE?: string;

  TG_TOKEN?: string;
  TG_CHAT_ID?: string;
  // Separate operator/admin Telegram channel for reservation + payment alerts.
  TG_ADMIN_CHAT_ID?: string;

  TURNSTILE_SECRET?: string;

  // Manual Bit payments (no aggregator): the operator's Bit phone number and an
  // optional Bit payment-request link. When set (and Grow is not configured), the
  // chef sees Bit instructions and the operator confirms payment in /admin.
  BIT_PHONE?: string;
  BIT_LINK?: string;
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

// Placeholder-payments mode is explicitly enabled (independent of USE_STUBS).
export function mockPaymentsEnabled(env: Env): boolean {
  return String(env.MOCK_PAYMENTS).toLowerCase() === "true";
}

// Lemon Squeezy is the active provider: the master switch is on AND every
// required key is present. Off (or a missing key) falls back to whatever else is
// configured, so it's a clean enable/disable toggle. Disabled under global stubs.
export function lemonSqueezyEnabled(env: Env): boolean {
  if (globalStubs(env)) return false;
  if (String(env.LEMONSQUEEZY_ENABLED).toLowerCase() !== "true") return false;
  return present(
    env.LEMONSQUEEZY_API_KEY,
    env.LEMONSQUEEZY_STORE_ID,
    env.LEMONSQUEEZY_VARIANT_ID,
    env.LEMONSQUEEZY_WEBHOOK_SECRET,
  );
}

// Client phone verification (OTP over WhatsApp) is on. Off by default so the
// funnel is unchanged until the operator flips it.
export function otpEnabled(env: Env): boolean {
  return String(env.OTP_ENABLED).toLowerCase() === "true";
}

// Chef access-link delivery/recovery over WhatsApp is on. Off by default.
export function recoveryEnabled(env: Env): boolean {
  return String(env.RECOVERY_ENABLED).toLowerCase() === "true";
}

// Manual Bit mode: a Bit phone number is configured and no automated provider
// (Lemon Squeezy or Grow) is active. The chef pays via Bit and the operator
// confirms the payment in /admin.
export function bitManualEnabled(env: Env): boolean {
  if (globalStubs(env) || lemonSqueezyEnabled(env) || useReal(env, "payments")) return false;
  return present(env.BIT_PHONE);
}

export function bitInfo(env: Env): { phone: string; link?: string } {
  return { phone: env.BIT_PHONE ?? "", link: present(env.BIT_LINK) ? env.BIT_LINK : undefined };
}

// A checkout flow can run: stubbed, explicitly mocked, manual Bit, or a real
// provider (Lemon Squeezy or Grow).
export function paymentsAvailable(env: Env): boolean {
  return (
    globalStubs(env) ||
    mockPaymentsEnabled(env) ||
    lemonSqueezyEnabled(env) ||
    bitManualEnabled(env) ||
    useReal(env, "payments")
  );
}

// The mock-complete helper may run only when payments are intentionally mocked.
export function allowMockComplete(env: Env): boolean {
  return globalStubs(env) || mockPaymentsEnabled(env);
}

// Operator/admin view auth. Open in stub/dev mode for convenience; otherwise
// requires ADMIN_TOKEN to be configured AND to match the provided token. Fails
// closed (denies) when no token is configured in a real deployment.
export function adminAuthorized(env: Env, provided: string | null): boolean {
  if (globalStubs(env)) return true;
  if (!present(env.ADMIN_TOKEN)) return false;
  return !!provided && timingSafeEqual(provided, env.ADMIN_TOKEN!);
}

export function publicBaseUrl(env: Env, request?: Request): string {
  if (present(env.PUBLIC_BASE_URL)) return env.PUBLIC_BASE_URL!.replace(/\/$/, "");
  if (request) return new URL(request.url).origin;
  return "http://localhost:8788";
}
