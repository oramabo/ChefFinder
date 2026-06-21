import posthog from "posthog-js";

let initialized = false;

// PostHog is env-gated: with no key it is a no-op, so local/CI runs need nothing.
export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return;
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
