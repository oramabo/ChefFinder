// Chef session helpers: derive the signing secret and resolve the chef behind a
// request's session token. Mirrors the lightweight, token-based model used for
// the admin view (no cookies/JWT library), but signed + expiring.
import { type Env, globalStubs } from "./env.ts";
import { verifySession, signSession, type SessionClaims } from "./crypto.ts";

const DEV_SECRET = "dev-chef-session-secret";

export const CHEF_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Mint a fresh signed session token for a chef (used by register + login).
export function issueChefSession(env: Env, chef: { id: string; phone: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return signSession(
    { sub: chef.id, phone: chef.phone, iat: now, exp: now + CHEF_SESSION_TTL_SECONDS },
    chefSessionSecret(env),
  );
}

// Use the explicit secret when configured; otherwise a deterministic fallback so
// tokens stay valid across requests within a deployment. In stub/dev mode a
// constant keeps local development friction-free.
export function chefSessionSecret(env: Env): string {
  if (env.CHEF_SESSION_SECRET && env.CHEF_SESSION_SECRET.trim()) {
    return env.CHEF_SESSION_SECRET.trim();
  }
  if (globalStubs(env)) return DEV_SECRET;
  if (env.ADMIN_TOKEN && env.ADMIN_TOKEN.trim()) return `chef:${env.ADMIN_TOKEN.trim()}`;
  return DEV_SECRET;
}

// Read + verify the session token from `Authorization: Bearer` or `x-chef-token`.
// Returns the claims (chef id + phone) or null when missing/invalid/expired.
export async function requireChef(env: Env, request: Request): Promise<SessionClaims | null> {
  const auth = request.headers.get("authorization") ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const token = bearer || request.headers.get("x-chef-token") || "";
  if (!token) return null;
  return verifySession(token, chefSessionSecret(env));
}
