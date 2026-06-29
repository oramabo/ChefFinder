import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  signSession,
  verifySession,
  type SessionClaims,
} from "../../functions-lib/crypto.ts";

describe("password hashing (PBKDF2)", () => {
  it("verifies a correct password and rejects a wrong one", async () => {
    const stored = await hashPassword("hunter2!");
    expect(stored.startsWith("pbkdf2$")).toBe(true);
    expect(await verifyPassword("hunter2!", stored)).toBe(true);
    expect(await verifyPassword("wrong", stored)).toBe(false);
  });

  it("produces a unique salt per hash", async () => {
    const a = await hashPassword("samepass");
    const b = await hashPassword("samepass");
    expect(a).not.toEqual(b); // different salts
    expect(await verifyPassword("samepass", a)).toBe(true);
    expect(await verifyPassword("samepass", b)).toBe(true);
  });

  it("rejects a malformed stored hash", async () => {
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });
});

describe("signed sessions (HMAC)", () => {
  const secret = "test-secret";
  const now = Math.floor(Date.now() / 1000);
  const claims: SessionClaims = { sub: "chef-1", phone: "0521234567", iat: now, exp: now + 3600 };

  it("round-trips valid claims", async () => {
    const token = await signSession(claims, secret);
    const out = await verifySession(token, secret);
    expect(out?.sub).toBe("chef-1");
    expect(out?.phone).toBe("0521234567");
  });

  it("rejects a tampered signature", async () => {
    const token = await signSession(claims, secret);
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    expect(await verifySession(tampered, secret)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signSession(claims, secret);
    expect(await verifySession(token, "other-secret")).toBeNull();
  });

  it("rejects an expired token", async () => {
    const expired: SessionClaims = { sub: "c", phone: "0500000000", iat: now - 7200, exp: now - 3600 };
    const token = await signSession(expired, secret);
    expect(await verifySession(token, secret)).toBeNull();
  });
});
