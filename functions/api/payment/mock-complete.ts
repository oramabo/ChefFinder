import { allowMockComplete } from "../../../functions-lib/env.ts";
import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error, readJson } from "../../../functions-lib/http.ts";
import type { Handler } from "../../../functions-lib/handler.ts";

// POST /api/payment/mock-complete — finishes the placeholder checkout (the mock
// "payment page" redirects back here). Allowed only when payments are mocked
// intentionally (USE_STUBS=true or MOCK_PAYMENTS=true); always 404 once a real
// provider is configured, so it can't unlock contacts without a real payment.
export const onRequestPost: Handler = async ({ request, env }) => {
  if (!allowMockComplete(env)) {
    return error("לא זמין", 404, { reason: "disabled" });
  }

  const body = (await readJson(request)) as { purchase_id?: string; status?: string } | null;
  const purchaseId = body?.purchase_id ?? "";
  const status = body?.status === "failed" ? "failed" : "paid";
  if (!purchaseId) return error("חסר מזהה רכישה", 400, { reason: "missing_purchase" });

  const { db, payments } = buildContainer(env, request);
  const purchase = await db.getPurchase(purchaseId);
  if (purchase) {
    if (status === "failed") {
      const released = await db.releasePurchase(purchaseId, "failed");
      return json({ ok: true, status: "failed", released });
    }
    const invoiceRef = await payments.issueInvoice({
      purchaseId,
      provider_ref: purchase.provider_ref ?? `mock_${purchaseId}`,
      amount: purchase.amount,
    });
    const transitioned = await db.completePurchase(purchaseId, invoiceRef);
    return json({ ok: true, status: "paid", transitioned });
  }

  // Maybe a credit-package order (the lead bank).
  const order = await db.getCreditOrder(purchaseId);
  if (!order) return error("הרכישה לא נמצאה", 404, { reason: "unknown_purchase" });

  if (status === "failed") {
    const released = await db.failCreditOrder(order.id);
    return json({ ok: true, status: "failed", kind: "credits", released });
  }
  const invoiceRef = await payments.issueInvoice({
    purchaseId: order.id,
    provider_ref: order.provider_ref ?? `mock_${order.id}`,
    amount: order.amount,
  });
  const { credited } = await db.completeCreditOrder(order.id, invoiceRef);
  return json({ ok: true, status: "paid", kind: "credits", credited });
};
