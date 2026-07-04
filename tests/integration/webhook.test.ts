import { describe, it, expect } from "vitest";
import { ctx } from "../helpers.ts";
import { onRequestPost as reserve } from "../../functions/api/lead/[token]/reserve.ts";
import { onRequestPost as webhook } from "../../functions/api/payment/webhook.ts";
import { onRequestGet as contact } from "../../functions/api/lead/[token]/contact.ts";
import { createMockDb } from "../../functions-lib/adapters/db.mock.ts";
import { signMockWebhook } from "../../functions-lib/adapters/payments.mock.ts";

const db = createMockDb();

async function seedLead(cap = 3) {
  const lead = await db.insertLead({
    lead_token: "wh_" + Math.random().toString(36).slice(2),
    kosher: false,
    client_name: "נועה",
    client_phone: "0541112233",
    price: 30,
    buyers_cap: cap,
  });
  return lead.lead_token;
}

async function reserveOne(token: string, chef: string) {
  const res = await reserve(
    ctx({ method: "POST", url: `http://localhost/api/lead/${token}/reserve`, body: { chef_phone: chef }, params: { token } }),
  );
  return (await res.json()) as { ok: boolean; purchase_id: string; reveal_token: string };
}

function postWebhook(body: Record<string, string>) {
  return webhook(ctx({ method: "POST", url: "http://localhost/api/payment/webhook", body }));
}

describe("POST /api/payment/webhook", () => {
  it("marks paid, reveals contact, and is idempotent on replay", async () => {
    const token = await seedLead(3);
    const { purchase_id, reveal_token } = await reserveOne(token, "0521111111");
    const purchase = await db.getPurchase(purchase_id);
    const providerRef = purchase!.provider_ref!;

    const body = await signMockWebhook(purchase_id, providerRef, "paid");
    const res1 = (await (await postWebhook(body)).json()) as any;
    expect(res1).toEqual({ ok: true, status: "paid", transitioned: true, result: "completed" });

    // Contact now revealed via the reveal token (not the phone).
    const c = await contact(
      ctx({ url: `http://localhost/api/lead/${token}/contact?reveal=${reveal_token}`, params: { token } }),
    );
    expect(c.status).toBe(200);

    // Replay: no second transition.
    const res2 = (await (await postWebhook(body)).json()) as any;
    expect(res2.transitioned).toBe(false);
    expect(res2.result).toBe("noop");
  });

  it("recovers a payment that arrives after the sweep expired the reservation", async () => {
    const token = await seedLead(3);
    const { purchase_id, reveal_token } = await reserveOne(token, "0526666666");
    const purchase = await db.getPurchase(purchase_id);

    // The chef dawdled on the payment page: the sweep releases the slot.
    expect(await db.releasePurchase(purchase_id, "expired")).toBe(true);

    const body = await signMockWebhook(purchase_id, purchase!.provider_ref!, "paid");
    const res = (await (await postWebhook(body)).json()) as any;
    expect(res).toEqual({ ok: true, status: "paid", transitioned: true, result: "recovered" });

    // The chef still gets the contact.
    const c = await contact(
      ctx({ url: `http://localhost/api/lead/${token}/contact?reveal=${reveal_token}`, params: { token } }),
    );
    expect(c.status).toBe(200);
  });

  it("reports conflict (no unlock) when a late payment finds the lead sold out", async () => {
    const token = await seedLead(1);
    const { purchase_id, reveal_token } = await reserveOne(token, "0527777777");
    const purchase = await db.getPurchase(purchase_id);
    expect(await db.releasePurchase(purchase_id, "expired")).toBe(true);

    // Another chef takes and pays for the reopened single slot.
    const second = await reserveOne(token, "0528888888");
    const p2 = await db.getPurchase(second.purchase_id);
    const body2 = await signMockWebhook(second.purchase_id, p2!.provider_ref!, "paid");
    expect(((await (await postWebhook(body2)).json()) as any).transitioned).toBe(true);

    // The late payment can't be honoured; the response flags it for a refund.
    const late = await signMockWebhook(purchase_id, purchase!.provider_ref!, "paid");
    const res = (await (await postWebhook(late)).json()) as any;
    expect(res).toEqual({ ok: true, status: "paid", transitioned: false, result: "conflict" });

    // And the late chef's reveal token stays locked.
    const c = await contact(
      ctx({ url: `http://localhost/api/lead/${token}/contact?reveal=${reveal_token}`, params: { token } }),
    );
    expect(c.status).toBe(403);
  });

  it("rejects a bad signature", async () => {
    const token = await seedLead(3);
    const { purchase_id } = await reserveOne(token, "0521111111");
    const purchase = await db.getPurchase(purchase_id);
    const res = await postWebhook({
      purchaseId: purchase_id,
      provider_ref: purchase!.provider_ref!,
      status: "paid",
      signature: "wrong",
    });
    expect(res.status).toBe(400);
  });

  it("failed payment reopens the slot", async () => {
    const token = await seedLead(1);
    const { purchase_id } = await reserveOne(token, "0521111111");
    const purchase = await db.getPurchase(purchase_id);

    let lead = await db.getLeadByToken(token);
    expect(lead?.status).toBe("sold_out");

    const body = await signMockWebhook(purchase_id, purchase!.provider_ref!, "failed");
    const res = (await (await postWebhook(body)).json()) as any;
    expect(res).toEqual({ ok: true, status: "failed", released: true });

    lead = await db.getLeadByToken(token);
    expect(lead?.status).toBe("available");
    expect(lead?.buyers_count).toBe(0);
  });
});
