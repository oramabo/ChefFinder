import { describe, it, expect } from "vitest";
import { createLemonSqueezyPayments } from "../../functions-lib/adapters/payments.lemonsqueezy.ts";
import { hmacSha256Hex } from "../../functions-lib/crypto.ts";
import type { Env } from "../../functions-lib/env.ts";

const SECRET = "ls-webhook-secret";
const env = {
  LEMONSQUEEZY_ENABLED: "true",
  LEMONSQUEEZY_API_KEY: "k",
  LEMONSQUEEZY_STORE_ID: "1",
  LEMONSQUEEZY_VARIANT_ID: "2",
  LEMONSQUEEZY_WEBHOOK_SECRET: SECRET,
} as Env;

interface WebhookBody {
  meta?: { custom_data?: { purchase_id?: string } };
  data?: { id?: string; attributes?: { status?: string } };
}

// Build a Lemon Squeezy webhook Request with a valid (or tamperable) signature.
async function webhookRequest(
  body: WebhookBody,
  { secret = SECRET, event = "order_created" }: { secret?: string; event?: string } = {},
) {
  const raw = JSON.stringify({ ...body, meta: { event_name: event, ...body.meta } });
  const signature = await hmacSha256Hex(secret, raw);
  return new Request("http://localhost/api/payment/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", "x-signature": signature },
    body: raw,
  });
}

const paidBody: WebhookBody = {
  meta: { custom_data: { purchase_id: "pur_123" } },
  data: { id: "order_999", attributes: { status: "paid" } },
};

describe("Lemon Squeezy webhook verification", () => {
  it("accepts a correctly signed paid order and correlates the purchase", async () => {
    const ls = createLemonSqueezyPayments(env);
    const res = await ls.verifyWebhook(await webhookRequest(paidBody));
    expect(res).toEqual({
      ok: true,
      purchaseId: "pur_123",
      provider_ref: "order_999",
      status: "paid",
    });
  });

  it("rejects a body signed with the wrong secret", async () => {
    const ls = createLemonSqueezyPayments(env);
    const res = await ls.verifyWebhook(await webhookRequest(paidBody, { secret: "nope" }));
    expect(res).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("maps a non-paid order status to failed", async () => {
    const ls = createLemonSqueezyPayments(env);
    const body = { ...paidBody, data: { id: "order_999", attributes: { status: "refunded" } } };
    const res = await ls.verifyWebhook(await webhookRequest(body));
    expect(res).toMatchObject({ ok: true, status: "failed" });
  });

  it("ignores non-order events", async () => {
    const ls = createLemonSqueezyPayments(env);
    const res = await ls.verifyWebhook(
      await webhookRequest(paidBody, { event: "subscription_created" }),
    );
    expect(res).toEqual({ ok: false, reason: "ignored_event_subscription_created" });
  });

  it("rejects a valid signature with no purchase id", async () => {
    const ls = createLemonSqueezyPayments(env);
    const body = { meta: {}, data: { id: "order_999", attributes: { status: "paid" } } };
    const res = await ls.verifyWebhook(await webhookRequest(body));
    expect(res).toEqual({ ok: false, reason: "missing_fields" });
  });
});
