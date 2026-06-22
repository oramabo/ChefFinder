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
    expect(res1).toEqual({ ok: true, status: "paid", transitioned: true });

    // Contact now revealed via the reveal token (not the phone).
    const c = await contact(
      ctx({ url: `http://localhost/api/lead/${token}/contact?reveal=${reveal_token}`, params: { token } }),
    );
    expect(c.status).toBe(200);

    // Replay: no second transition.
    const res2 = (await (await postWebhook(body)).json()) as any;
    expect(res2.transitioned).toBe(false);
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
