import type { TurnstilePort } from "../ports/turnstile.ts";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Real Turnstile verification. Fails closed: an invalid/empty token returns false
// when a secret is configured.
export function createTurnstile(secret: string): TurnstilePort {
  return {
    async verify(token: string, remoteIp?: string): Promise<boolean> {
      if (!token) return false;
      const form = new URLSearchParams({ secret, response: token });
      if (remoteIp) form.set("remoteip", remoteIp);
      const res = await fetch(VERIFY_URL, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { success?: boolean };
      return Boolean(data.success);
    },
  };
}

// Mock: always passes. Used under USE_STUBs / when no secret is configured.
export function createMockTurnstile(): TurnstilePort {
  return {
    async verify(): Promise<boolean> {
      return true;
    },
  };
}
