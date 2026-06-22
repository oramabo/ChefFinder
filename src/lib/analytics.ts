import posthog from "posthog-js";
import { getConsent } from "./consent.ts";

let initialized = false;

// PostHog is gated twice: by env (no key → no-op for local/CI) and by the user's
// cookie consent (analytics only runs after explicit "granted"). Safe to call
// repeatedly — it self-guards.
export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return;
  if (getConsent() !== "granted") return;
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key) return;
  posthog.init(key, {
    api_host: (import.meta.env.VITE_POSTHOG_HOST as string) || "https://eu.i.posthog.com",
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
