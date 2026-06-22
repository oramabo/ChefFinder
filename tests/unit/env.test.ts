import { describe, it, expect } from "vitest";
import {
  globalStubs,
  mockPaymentsEnabled,
  paymentsAvailable,
  allowMockComplete,
  bitManualEnabled,
  useReal,
} from "../../functions-lib/env.ts";
import type { Env } from "../../functions-lib/env.ts";

const grow: Partial<Env> = {
  GROW_API_KEY: "k",
  GROW_USER_ID: "u",
  GROW_PAGE_CODE: "p",
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
});
