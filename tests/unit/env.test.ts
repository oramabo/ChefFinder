import { describe, it, expect } from "vitest";
import {
  globalStubs,
  mockPaymentsEnabled,
  paymentsAvailable,
  allowMockComplete,
  bitManualEnabled,
  lemonSqueezyEnabled,
  useReal,
} from "../../functions-lib/env.ts";
import type { Env } from "../../functions-lib/env.ts";

const grow: Partial<Env> = {
  GROW_API_KEY: "k",
  GROW_USER_ID: "u",
  GROW_PAGE_CODE: "p",
};

const lemon: Partial<Env> = {
  LEMONSQUEEZY_ENABLED: "true",
  LEMONSQUEEZY_API_KEY: "k",
  LEMONSQUEEZY_STORE_ID: "1",
  LEMONSQUEEZY_VARIANT_ID: "2",
  LEMONSQUEEZY_WEBHOOK_SECRET: "s",
};

describe("payment-mode env helpers", () => {
  it("stub mode makes everything available/mockable", () => {
    const env = { USE_STUBS: "true" } as Env;
    expect(globalStubs(env)).toBe(true);
    expect(paymentsAvailable(env)).toBe(true);
    expect(allowMockComplete(env)).toBe(true);
  });

  it("placeholder mode allows checkout + mock-complete without a real provider", () => {
    const env = { MOCK_PAYMENTS: "true" } as Env;
    expect(mockPaymentsEnabled(env)).toBe(true);
    expect(useReal(env, "payments")).toBe(false);
    expect(paymentsAvailable(env)).toBe(true);
    expect(allowMockComplete(env)).toBe(true);
  });

  it("real provider makes payments available but disables mock-complete", () => {
    const env = { ...grow } as Env;
    expect(useReal(env, "payments")).toBe(true);
    expect(paymentsAvailable(env)).toBe(true);
    expect(allowMockComplete(env)).toBe(false);
  });

  it("production with no provider and no mock mode is unavailable + locked", () => {
    const env = {} as Env;
    expect(paymentsAvailable(env)).toBe(false);
    expect(allowMockComplete(env)).toBe(false);
  });

  it("manual Bit (BIT_PHONE set, no aggregator) makes payments available", () => {
    const env = { BIT_PHONE: "0541112233" } as Env;
    expect(bitManualEnabled(env)).toBe(true);
    expect(paymentsAvailable(env)).toBe(true);
    // No provider webhook in manual mode, so mock-complete stays off.
    expect(allowMockComplete(env)).toBe(false);
  });

  it("a real aggregator takes precedence over manual Bit", () => {
    const env = { ...grow, BIT_PHONE: "0541112233" } as Env;
    expect(bitManualEnabled(env)).toBe(false);
    expect(useReal(env, "payments")).toBe(true);
  });

  it("stub mode disables manual Bit", () => {
    const env = { USE_STUBS: "true", BIT_PHONE: "0541112233" } as Env;
    expect(bitManualEnabled(env)).toBe(false);
  });

  it("Lemon Squeezy enabled (flag + keys) makes payments available, no mock-complete", () => {
    const env = { ...lemon } as Env;
    expect(lemonSqueezyEnabled(env)).toBe(true);
    expect(paymentsAvailable(env)).toBe(true);
    expect(allowMockComplete(env)).toBe(false);
  });

  it("Lemon Squeezy disabled by flag falls back (toggle off)", () => {
    const env = { ...lemon, LEMONSQUEEZY_ENABLED: "false" } as Env;
    expect(lemonSqueezyEnabled(env)).toBe(false);
    expect(paymentsAvailable(env)).toBe(false);
  });

  it("Lemon Squeezy enabled but missing a key stays disabled", () => {
    const env = { ...lemon, LEMONSQUEEZY_WEBHOOK_SECRET: "" } as Env;
    expect(lemonSqueezyEnabled(env)).toBe(false);
  });

  it("Lemon Squeezy takes precedence over Grow and manual Bit", () => {
    const env = { ...lemon, ...grow, BIT_PHONE: "0541112233" } as Env;
    expect(lemonSqueezyEnabled(env)).toBe(true);
    expect(bitManualEnabled(env)).toBe(false);
  });

  it("stub mode disables Lemon Squeezy", () => {
    const env = { USE_STUBS: "true", ...lemon } as Env;
    expect(lemonSqueezyEnabled(env)).toBe(false);
  });
});
