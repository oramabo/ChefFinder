import { describe, it, expect } from "vitest";
import { ctx } from "../helpers.ts";
import { onRequestPost as sendOtp } from "../../functions/api/otp/send.ts";
import { onRequestPost as createLead } from "../../functions/api/lead/index.ts";
import { onRequestPost as recover } from "../../functions/api/lead/[token]/recover.ts";
import { createMockDb } from "../../functions-lib/adapters/db.mock.ts";
import { sha256Hex } from "../../functions-lib/crypto.ts";

const db = createMockDb(); // shares the global mock store with the handlers

const OTP_ENV = { USE_STUBS: "true", OTP_ENABLED: "true" };

const leadBody = (phone: string, otp?: string) => ({
  kosher: false,
  client_name: "נועה",
  client_phone: phone,
  otp_code: otp,
});

describe("client phone verification (OTP_ENABLED)", () => {
  it("otp/send reports disabled when the flag is off", async () => {
    const res = await sendOtp(
      ctx({ method: "POST", url: "http://localhost/api/otp/send", body: { phone: "0501234567" } }),
    );
    expect((await res.json()) as any).toEqual({ ok: false, reason: "disabled" });
  });

  it("lead creation demands a code, then accepts the right one", async () => {
    const phone = "052000" + String(Math.floor(1000 + Math.random() * 9000));

    // No code yet → the SPA is told to run verification.
    const r1 = await createLead(
      ctx({ method: "POST", url: "http://localhost/api/lead", body: leadBody(phone), env: OTP_ENV }),
    );
    expect((await r1.json()) as any).toEqual({ ok: false, reason: "otp_required" });

    // The send endpoint stores a hashed code (and would WhatsApp it).
    const s1 = await sendOtp(
      ctx({ method: "POST", url: "http://localhost/api/otp/send", body: { phone }, env: OTP_ENV }),
    );
    expect(((await s1.json()) as any).ok).toBe(true);

    // An immediate resend is throttled.
    const s2 = await sendOtp(
      ctx({ method: "POST", url: "http://localhost/api/otp/send", body: { phone }, env: OTP_ENV }),
    );
    expect((await s2.json()) as any).toEqual({ ok: false, reason: "too_soon" });

    // Plant a known code (zero interval allows overwrite), keyed by the
    // normalized phone, exactly as the handler stores it.
    const normalized = "972" + phone.replace(/[\s-]/g, "").slice(1);
    await db.saveOtp(normalized, await sha256Hex("123456"), 10, 0);

    // Wrong code → otp_invalid.
    const r2 = await createLead(
      ctx({ method: "POST", url: "http://localhost/api/lead", body: leadBody(phone, "999999"), env: OTP_ENV }),
    );
    expect((await r2.json()) as any).toEqual({ ok: false, reason: "otp_invalid" });

    // Right code → the lead is created.
    const r3 = await createLead(
      ctx({ method: "POST", url: "http://localhost/api/lead", body: leadBody(phone, "123456"), env: OTP_ENV }),
    );
    const created = (await r3.json()) as any;
    expect(created.ok).toBe(true);

    // The code was consumed — replaying it is rejected.
    const r4 = await createLead(
      ctx({ method: "POST", url: "http://localhost/api/lead", body: leadBody(phone, "123456"), env: OTP_ENV }),
    );
    expect(((await r4.json()) as any).reason).toBe("otp_expired");
  });
});

describe("chef access-link recovery (RECOVERY_ENABLED)", () => {
  const RECOVER_ENV = { USE_STUBS: "true", RECOVERY_ENABLED: "true" };

  async function seedPaidPurchase() {
    const lead = await db.insertLead({
      lead_token: "rec_" + Math.random().toString(36).slice(2),
      kosher: false,
      client_name: "לקוח",
      client_phone: "0500000000",
      price: 30,
      buyers_cap: 3,
    });
    const purchase = await db.createPurchase({
      lead_id: lead.id,
      chef_phone: "0521111111",
      amount: 30,
      reveal_token: "rev_" + Math.random().toString(36).slice(2),
    });
    await db.reserveLead(lead.lead_token, "0521111111");
    await db.completePurchase(purchase.id);
    return lead.lead_token;
  }

  function doRecover(token: string, phone: string, env: Record<string, string>) {
    return recover(
      ctx({
        method: "POST",
        url: `http://localhost/api/lead/${token}/recover`,
        body: { chef_phone: phone },
        params: { token },
        env,
      }),
    );
  }

  it("reports disabled when the flag is off", async () => {
    const token = await seedPaidPurchase();
    const res = await doRecover(token, "0521111111", { USE_STUBS: "true" });
    expect((await res.json()) as any).toEqual({ ok: false, reason: "disabled" });
  });

  it("answers identically for matching and non-matching phones (no leak)", async () => {
    const token = await seedPaidPurchase();
    // Match — including a different formatting of the same number.
    const hit = await doRecover(token, "+972-52-111-1111", RECOVER_ENV);
    expect((await hit.json()) as any).toEqual({ ok: true });
    // Miss — same generic answer.
    const miss = await doRecover(token, "0529999999", RECOVER_ENV);
    expect((await miss.json()) as any).toEqual({ ok: true });
    // Unknown lead — still generic.
    const gone = await doRecover("missing", "0521111111", RECOVER_ENV);
    expect((await gone.json()) as any).toEqual({ ok: true });
  });
});
