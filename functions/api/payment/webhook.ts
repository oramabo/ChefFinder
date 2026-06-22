import { buildContainer } from "../../../functions-lib/factory.ts";
import { json } from "../../../functions-lib/http.ts";
import type { Handler } from "../../../functions-lib/handler.ts";

// POST /api/payment/webhook — provider payment callback.
// Idempotent: re-delivery of the same result is a safe no-op (complete/release
// only transition a 'pending' purchase). Always 200 so the provider stops
// retrying once we've accepted the message.
export const onRequestPost: Handler = async ({ request, env }) => {
  const { db, payments } = buildContainer(env, request);

  const result = await payments.verifyWebhook(request);
  if (!result.ok) {
    console.error("webhook rejected:", result.reason);
    return json({ ok: false, reason: result.reason }, 400);
  }

  const purchase = await db.getPurchase(result.purchaseId);
  if (!purchase) {
    console.error("webhook: unknown purchase", result.purchaseId);
    return json({ ok: false, reason: "unknown_purchase" }, 404);
  }

  if (result.status === "paid") {
    const invoiceRef = await payments.issueInvoice({
      purchaseId: purchase.id,
      provider_ref: result.provider_ref,
      amount: purchase.amount,
    });
    const transitioned = await db.completePurchase(purchase.id, invoiceRef);
    return json({ ok: true, status: "paid", transitioned });
  }

  // failed: reopen the held slot.
  const released = await db.releasePurchase(purchase.id, "failed");
  return json({ ok: true, status: "failed", released });
};
