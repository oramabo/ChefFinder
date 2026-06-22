import { describe, it, expect } from "vitest";
import {
  globalStubs,
  mockPaymentsEnabled,
  paymentsAvailable,
  allowMockComplete,
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
});
