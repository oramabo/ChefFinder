// Edge-safe crypto helpers using WebCrypto only (no Node built-ins).

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

// Unguessable public token for lead URLs (~22 base62 chars ≈ 130 bits).
export function generateLeadToken(length = 22): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += BASE62[bytes[i] % BASE62.length];
  }
  return out;
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toHex(sig);
}

// Constant-time-ish comparison to avoid trivial timing leaks.
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function sha256Hex(message: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message));
  return toHex(digest);
}

// ── Password hashing (PBKDF2-SHA256, WebCrypto) ─────────────────────────────
const PBKDF2_ITERS = 100_000;

function b64encode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pbkdf2(password: string, salt: Uint8Array, iters: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: iters, hash: "SHA-256" },
    key,
    256,
  );
  return new Uint8Array(bits);
}

// Returns a self-describing string: pbkdf2$<iters>$<saltB64>$<hashB64>.
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt, PBKDF2_ITERS);
  return `pbkdf2$${PBKDF2_ITERS}$${b64encode(salt)}$${b64encode(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iters = Number(parts[1]);
  if (!Number.isFinite(iters) || iters < 1) return false;
  const salt = b64decode(parts[2]);
  const expected = parts[3];
  const hash = b64encode(await pbkdf2(password, salt, iters));
  return timingSafeEqual(hash, expected);
}

// ── Signed session tokens (HMAC) ────────────────────────────────────────────
// Compact `<payloadB64url>.<hmacHex>`. Claims are ASCII-only (uuid + phone +
// numeric timestamps), so plain btoa/atob is sufficient.
export interface SessionClaims {
  sub: string; // chef id
  phone: string;
  iat: number; // seconds
  exp: number; // seconds
}

function b64url(s: string): string {
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64url(s: string): string {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  return atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
}

export async function signSession(claims: SessionClaims, secret: string): Promise<string> {
  const payload = b64url(JSON.stringify(claims));
  const sig = await hmacSha256Hex(secret, payload);
  return `${payload}.${sig}`;
}

export async function verifySession(token: string, secret: string): Promise<SessionClaims | null> {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmacSha256Hex(secret, payload);
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const claims = JSON.parse(unb64url(payload)) as SessionClaims;
    if (
      typeof claims.sub !== "string" ||
      typeof claims.exp !== "number" ||
      claims.exp * 1000 < Date.now()
    ) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}
