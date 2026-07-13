import { describe, it, expect } from "vitest";
import { notifyLead } from "../../functions-lib/notifyLead.ts";
import { createMockMessaging } from "../../functions-lib/adapters/messaging.mock.ts";
import type { Lead } from "@shared/types.ts";

const lead: Lead = {
  id: "l1",
  lead_token: "tok123",
  event_type: "anniversary",
  event_date: "2026-08-01",
  city: "תל אביב",
  guests: 40,
  budget: 5000,
  cuisine: "mediterranean",
  kosher: false,
  client_name: "נועה כהן",
  client_phone: "0541112233",
  client_email: "noa@example.com",
  price: 30,
  buyers_cap: 3,
  buyers_count: 0,
  paid_by: [],
  status: "available",
  service_slug: "chefs",
  details: null,
  source: "seed",
  created_at: new Date().toISOString(),
};

describe("notifyLead", () => {
  it("sends to Telegram and never leaks PII", async () => {
    const messaging = createMockMessaging();
    const result = await notifyLead(messaging, lead, "https://chefleads.test");

    expect(result).toEqual({ telegram: "sent" });
    // WhatsApp is disabled — only the Telegram message is emitted.
    expect(messaging.sink).toHaveLength(1);

    const serialized = JSON.stringify(messaging.sink);
    expect(serialized).not.toContain("נועה כהן");
    expect(serialized).not.toContain("0541112233");
    expect(serialized).not.toContain("noa@example.com");
    // Carries the unlock link + city.
    expect(serialized).toContain("https://chefleads.test/lead/tok123");
    expect(serialized).toContain("תל אביב");
  });

  it("reports failed when Telegram throws", async () => {
    const messaging = createMockMessaging();
    messaging.sendTelegram = async () => {
      throw new Error("TG down");
    };
    const result = await notifyLead(messaging, lead, "https://chefleads.test");
    expect(result.telegram).toBe("failed");
  });
});
