import { describe, it, expect } from "vitest";
import { LeadInput, ReserveInput } from "@shared/schema.ts";

describe("LeadInput", () => {
  it("accepts a valid lead", () => {
    const r = LeadInput.safeParse({
      event_type: "anniversary",
      event_date: "2026-08-01",
      city: "תל אביב",
      guests: 40,
      budget: 5000,
      cuisine: "mediterranean",
      kosher: false,
      client_name: "נועה",
      client_phone: "050-1234567",
      client_email: "noa@example.com",
      turnstile_token: "x",
    });
    expect(r.success).toBe(true);
  });

  it("requires name and phone", () => {
    const r = LeadInput.safeParse({ kosher: false });
    expect(r.success).toBe(false);
  });

  it("rejects a malformed phone", () => {
    const r = LeadInput.safeParse({ client_name: "נועה", client_phone: "abc" });
    expect(r.success).toBe(false);
  });

  it("rejects a malformed date", () => {
    const r = LeadInput.safeParse({
      client_name: "נועה",
      client_phone: "0501234567",
      event_date: "01/08/2026",
    });
    expect(r.success).toBe(false);
  });

  it("allows empty email string", () => {
    const r = LeadInput.safeParse({
      client_name: "נועה",
      client_phone: "0501234567",
      client_email: "",
    });
    expect(r.success).toBe(true);
  });
});

describe("ReserveInput", () => {
  it("accepts a valid chef phone", () => {
    expect(ReserveInput.safeParse({ chef_phone: "0521112233" }).success).toBe(true);
  });
  it("rejects a missing phone", () => {
    expect(ReserveInput.safeParse({}).success).toBe(false);
  });
});
