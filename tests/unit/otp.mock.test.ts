import { describe, it, expect, beforeEach } from "vitest";
import { createMockDb, createMockStore, type MockStore } from "../../functions-lib/adapters/db.mock.ts";
import type { DbPort } from "../../functions-lib/ports/db.ts";

const PHONE = "972501234567";

describe("mock OTP semantics (mirrors the save_otp/verify_otp RPCs)", () => {
  let store: MockStore;
  let db: DbPort;
  beforeEach(() => {
    store = createMockStore();
    db = createMockDb(store);
  });

  it("saves, verifies once, and consumes the code", async () => {
    expect(await db.saveOtp(PHONE, "hash1", 10, 60)).toBe(true);
    expect(await db.verifyOtp(PHONE, "hash1", 5)).toBe("ok");
    // single use — a replay of the same code fails
    expect(await db.verifyOtp(PHONE, "hash1", 5)).toBe("not_found");
  });

  it("throttles resends inside the minimum interval", async () => {
    expect(await db.saveOtp(PHONE, "hash1", 10, 60)).toBe(true);
    expect(await db.saveOtp(PHONE, "hash2", 10, 60)).toBe(false);
    // a zero interval allows overwrite (used to reset attempts on resend)
    expect(await db.saveOtp(PHONE, "hash3", 10, 0)).toBe(true);
  });

  it("counts wrong attempts and locks after the limit", async () => {
    await db.saveOtp(PHONE, "right", 10, 0);
    expect(await db.verifyOtp(PHONE, "wrong", 3)).toBe("mismatch");
    expect(await db.verifyOtp(PHONE, "wrong", 3)).toBe("mismatch");
    expect(await db.verifyOtp(PHONE, "wrong", 3)).toBe("mismatch");
    // limit reached — even the right code is rejected and the row is gone
    expect(await db.verifyOtp(PHONE, "right", 3)).toBe("too_many_attempts");
    expect(await db.verifyOtp(PHONE, "right", 3)).toBe("not_found");
  });

  it("expires stale codes", async () => {
    await db.saveOtp(PHONE, "hash1", 10, 0);
    store.otps.get(PHONE)!.expires_at = Date.now() - 1000;
    expect(await db.verifyOtp(PHONE, "hash1", 5)).toBe("expired");
  });
});
