import { adminAuthorized } from "../../../functions-lib/env.ts";
import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error } from "../../../functions-lib/http.ts";
import type { Handler } from "../../../functions-lib/handler.ts";

// POST /api/admin/purchase/:ref/confirm — operator confirms a manual Bit payment.
// Admin-gated (x-admin-token). Marks the pending purchase paid, which unlocks the
// contact for the chef holding the matching reveal_token. Idempotent:
// completePurchase only transitions a 'pending' purchase.
export const onRequestPost: Handler = async ({ request, env, params }) => {
  const provided =
    request.headers.get("x-admin-token") ??
    new URL(request.url).searchParams.get("token");
  if (!adminAuthorized(env, provided)) {
    return error("לא מורשה", 401, { reason: "unauthorized" });
  }

  const ref = String(params.ref);
  const { db, payments } = buildContainer(env, request);

  const purchase = await db.getPurchase(ref);
  if (purchase) {
    const invoiceRef = await payments.issueInvoice({
      purchaseId: purchase.id,
      provider_ref: purchase.provider_ref ?? `bit_${purchase.id}`,
      amount: purchase.amount,
    });
    const transitioned = await db.completePurchase(purchase.id, invoiceRef);
    return json({ ok: true, status: "paid", transitioned });
  }

  // Maybe a manual-Bit credit-package order (the lead bank).
  const order = await db.getCreditOrder(ref);
  if (!order) return error("הרכישה לא נמצאה", 404, { reason: "unknown_purchase" });

  const invoiceRef = await payments.issueInvoice({
    purchaseId: order.id,
    provider_ref: order.provider_ref ?? `bit_${order.id}`,
    amount: order.amount,
  });
  const { credited } = await db.completeCreditOrder(order.id, invoiceRef);
  return json({ ok: true, status: "paid", kind: "credits", credited });
};
