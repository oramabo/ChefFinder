// Persisted cookie-consent choice for non-essential (analytics) cookies.
// Essential/security cookies (e.g. Turnstile) are not gated by this.
const KEY = "cookie_consent";

export type Consent = "granted" | "denied";

export function getConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEY);
  return v === "granted" || v === "denied" ? v : null;
}

export function setConsent(value: Consent): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, value);
}
