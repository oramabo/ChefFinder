import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createWhatsAppMessaging,
  parseRecipients,
} from "../../functions-lib/adapters/messaging.whatsapp.ts";
import type { NotifyInput } from "../../functions-lib/ports/messaging.ts";

const input: NotifyInput = {
  lead: {
    lead_token: "tok123",
    event_type: "anniversary",
    event_date: "2026-08-01",
    city: "תל אביב",
    guests: 30,
    budget: 5000,
    cuisine: "mediterranean",
    kosher: false,
    price: 30,
  },
  unlockUrl: "https://example.com/lead/tok123",
};

const baseEnv = {
  WA_CLOUD_TOKEN: "tkn",
  WA_PHONE_NUMBER_ID: "pnid",
  WA_TEMPLATE_NAME: "new_lead",
};

afterEach(() => vi.restoreAllMocks());

describe("parseRecipients", () => {
  it("splits on commas, spaces, semicolons and newlines", () => {
    expect(parseRecipients("972500000001, 972500000002 ;972500000003\n972500000004")).toEqual([
      "972500000001",
      "972500000002",
      "972500000003",
      "972500000004",
    ]);
  });
  it("returns a single number unchanged and ignores blanks", () => {
    expect(parseRecipients("972500000001")).toEqual(["972500000001"]);
    expect(parseRecipients("  ")).toEqual([]);
    expect(parseRecipients(undefined)).toEqual([]);
  });
});

describe("createWhatsAppMessaging multi-recipient", () => {
  it("sends the template once per recipient", async () => {
    const fetchMock = vi.fn(
      async (_input: unknown, _init?: RequestInit) => new Response("{}", { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const wa = createWhatsAppMessaging({
      ...baseEnv,
      WA_MY_NUMBER: "972500000001,972500000002,972500000003",
    });
    await wa.sendWhatsApp(input);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const sentTo = fetchMock.mock.calls.map((c) => JSON.parse((c[1] as RequestInit).body as string).to);
    expect(sentTo).toEqual(["972500000001", "972500000002", "972500000003"]);
  });

  it("resolves when at least one recipient succeeds", async () => {
    let n = 0;
    const fetchMock = vi.fn(async () => {
      n += 1;
      return n === 1 ? new Response("bad", { status: 400 }) : new Response("{}", { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const wa = createWhatsAppMessaging({ ...baseEnv, WA_MY_NUMBER: "972500000001,972500000002" });
    await expect(wa.sendWhatsApp(input)).resolves.toBeUndefined();
  });

  it("throws when every recipient fails", async () => {
    const fetchMock = vi.fn(async () => new Response("bad", { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);

    const wa = createWhatsAppMessaging({ ...baseEnv, WA_MY_NUMBER: "972500000001,972500000002" });
    await expect(wa.sendWhatsApp(input)).rejects.toThrow(/all 2 recipient/);
  });

  it("throws when no recipients are configured", async () => {
    const wa = createWhatsAppMessaging({ ...baseEnv, WA_MY_NUMBER: "" });
    await expect(wa.sendWhatsApp(input)).rejects.toThrow(/no recipient/);
  });
});
