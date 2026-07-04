import { describe, it, expect } from "vitest";
import { leadPrice, DEFAULT_PRICE, LEAD_MAX_AGE_DAYS } from "@shared/constants.ts";
import { isLeadExpired } from "@shared/types.ts";

describe("leadPrice", () => {
  it("uses the default for missing or small budgets", () => {
    expect(leadPrice(undefined)).toBe(DEFAULT_PRICE);
    expect(leadPrice(null)).toBe(DEFAULT_PRICE);
    expect(leadPrice(1500)).toBe(DEFAULT_PRICE);
    expect(leadPrice(3000)).toBe(DEFAULT_PRICE);
  });

  it("prices mid and high budget bands higher", () => {
    expect(leadPrice(5000)).toBe(40);
    expect(leadPrice(8000)).toBe(40);
    expect(leadPrice(12000)).toBe(50);
  });
});

describe("isLeadExpired", () => {
  const now = Date.parse("2026-07-04T12:00:00Z");

  it("keeps a lead valid through its event day, expired after", () => {
    const base = { created_at: "2026-07-01T00:00:00Z" };
    expect(isLeadExpired({ ...base, event_date: "2026-07-04" }, now)).toBe(false);
    expect(isLeadExpired({ ...base, event_date: "2026-08-01" }, now)).toBe(false);
    expect(isLeadExpired({ ...base, event_date: "2026-07-03" }, now)).toBe(true);
  });

  it("expires an undated lead after LEAD_MAX_AGE_DAYS", () => {
    const fresh = new Date(now - 1 * 86_400_000).toISOString();
    const stale = new Date(now - (LEAD_MAX_AGE_DAYS + 1) * 86_400_000).toISOString();
    expect(isLeadExpired({ event_date: null, created_at: fresh }, now)).toBe(false);
    expect(isLeadExpired({ event_date: null, created_at: stale }, now)).toBe(true);
  });
});
