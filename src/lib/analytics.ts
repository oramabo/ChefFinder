import posthog from "posthog-js";
import { getConsent } from "./consent.ts";

let initialized = false;

// PostHog is gated twice: by env (no key → no-op for local/CI) and by the user's
// cookie consent (analytics only runs after explicit "granted"). Safe to call
// repeatedly — it self-guards.
export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return;
  if (getConsent() !== "granted") return;
  // Public project key (phc_ keys are client-side by design), defaulted so the
  // build ships a working key even where VITE_POSTHOG_KEY isn't set — the CF CI
  // build lacks the local .env; an env var still overrides.
  const key =
    (import.meta.env.VITE_POSTHOG_KEY as string | undefined) ||
    "phc_zS22NMwLBpDezRRTXba38hMEEkhAoTE93mnmciEAwXfo";
  if (!key) return;
  // Only trust a proper URL for the host; a malformed VITE_POSTHOG_HOST (e.g.
  // "r") would otherwise send every event to a dead endpoint. Project is EU.
  const envHost = import.meta.env.VITE_POSTHOG_HOST as string | undefined;
  const api_host = envHost && /^https?:\/\//.test(envHost) ? envHost : "https://eu.i.posthog.com";
  posthog.init(key, {
    api_host,
    capture_pageview: true,
    autocapture: false,
  });
  initialized = true;
}

export function track(event: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!initialized) return;
  posthog.capture(event, props);
}

// Identify the chef by a hashed phone (never the raw number) at purchase time.
export function identify(distinctId: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!initialized) return;
  posthog.identify(distinctId, props);
}
