import { buildContainer } from "../../../functions-lib/factory.ts";
import { notifyPaymentIssue } from "../../../functions-lib/adminAlert.ts";
import { json } from "../../../functions-lib/http.ts";
import type { Handler } from "../../../functions-lib/handler.ts";
import { COMPLETE_RESULT } from "@shared/constants.ts";

// POST /api/payment/webhook — provider payment callback.
// Idempotent: re-delivery of the same result is a safe no-op. Always 200 once
// the message is accepted so the provider stops retrying. A payment that lands
// after the reservation TTL is recovered (slot retaken) when capacity remains;
// when the lead has since sold out, the operator is alerted to refund — that
// branch is money taken with no product, so it must never fail silently.
export const onRequestPost: Handler = async ({ request, env, waitUntil }) => {
  const { db, payments } = buildContainer(env, request);

  const result = await payments.verifyWebhook(request);
  if (!result.ok) {
    console.error("webhook rejected:", result.reason);
    return json({ ok: false, reason: result.reason }, 400);
  }

  const purchase = await db.getPurchase(result.purchaseId);
  if (!purchase) {
    console.error("webhook: unknown purchase", result.purchaseId);
    waitUntil(
      notifyPaymentIssue(env, {
        purchaseId: result.purchaseId,
        problem: "התקבל אישור תשלום לרכישה לא מוכרת",
      }),
    );
    return json({ ok: false, reason: "unknown_purchase" }, 404);
  }

  if (result.status === "paid") {
    const invoiceRef = await payments.issueInvoice({
      purchaseId: purchase.id,
      provider_ref: result.provider_ref,
      amount: purchase.amount,
    });
    const completion = await db.completePurchase(purchase.id, invoiceRef);
    if (completion === COMPLETE_RESULT.conflict) {
      waitUntil(
        notifyPaymentIssue(env, {
          purchaseId: purchase.id,
          chefPhone: purchase.chef_phone,
          amount: purchase.amount,
          problem: "תשלום התקבל באיחור והליד כבר נמכר עד התקרה — נדרש החזר כספי",
        }),
      );
    }
    const transitioned =
      completion === COMPLETE_RESULT.completed || completion === COMPLETE_RESULT.recovered;
    return json({ ok: true, status: "paid", transitioned, result: completion });
  }

  // failed: reopen the held slot.
  const released = await db.releasePurchase(purchase.id, "failed");
  return json({ ok: true, status: "failed", released });
};
