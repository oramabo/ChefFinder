import { globalStubs } from "../../../functions-lib/env.ts";
import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error, readJson } from "../../../functions-lib/http.ts";
import type { Handler } from "../../../functions-lib/handler.ts";

// POST /api/payment/mock-complete — dev-only helper to finish the mock payment
// flow (the mock "payment page" redirects back here). Available ONLY in explicit
// stub mode (USE_STUBS=true); always 404 in production so it can never be used to
// unlock contact details without a real payment.
export const onRequestPost: Handler = async ({ request, env }) => {
  if (!globalStubs(env)) {
    return error("לא זמין", 404, { reason: "disabled" });
  }

  const body = (await readJson(request)) as { purchase_id?: string; status?: string } | null;
  const purchaseId = body?.purchase_id ?? "";
  const status = body?.status === "failed" ? "failed" : "paid";
  if (!purchaseId) return error("חסר מזהה רכישה", 400, { reason: "missing_purchase" });

  const { db, payments } = buildContainer(env, request);
  const purchase = await db.getPurchase(purchaseId);
  if (!purchase) return error("הרכישה לא נמצאה", 404, { reason: "unknown_purchase" });

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
};
