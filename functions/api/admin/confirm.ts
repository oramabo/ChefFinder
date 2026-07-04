import { adminAuthorized, publicBaseUrl } from "../../../functions-lib/env.ts";
import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error } from "../../../functions-lib/http.ts";
import type { Handler } from "../../../functions-lib/handler.ts";
import { COMPLETE_RESULT } from "@shared/constants.ts";

// POST /api/admin/purchase/:ref/confirm — operator confirms a manual Bit payment.
// Admin-gated (header x-admin-token only — never a query param, which would leak
// the token into logs and history). Marks the purchase paid, which unlocks the
// contact for the chef holding the matching reveal_token.
//
// The response carries `recovery_url`: the unlock page with the chef's reveal
// token, for the operator to send to the chef over the existing Bit/WhatsApp
// thread. Chefs typically open leads inside in-app browsers, so the localStorage
// copy of the reveal token is easily lost — this link is how a paying chef gets
// back in from any device. It contains a paid credential; share it only with
// the paying chef.
export const onRequestPost: Handler = async ({ request, env, params }) => {
  const provided = request.headers.get("x-admin-token");
  if (!adminAuthorized(env, provided)) {
    return error("לא מורשה", 401, { reason: "unauthorized" });
  }

  const ref = String(params.ref);
  const { db, payments } = buildContainer(env, request);

  const purchase = await db.getPurchase(ref);
  if (!purchase) return error("הרכישה לא נמצאה", 404, { reason: "unknown_purchase" });

  const invoiceRef = await payments.issueInvoice({
    purchaseId: purchase.id,
    provider_ref: purchase.provider_ref ?? `bit_${purchase.id}`,
    amount: purchase.amount,
  });
  const result = await db.completePurchase(purchase.id, invoiceRef);

  // Payment arrived after the reservation expired AND the lead has since sold
  // to capacity: the chef can't be given the slot — surface it for a refund.
  if (result === COMPLETE_RESULT.conflict) {
    return json({ ok: false, reason: "conflict_sold_out", result });
  }

  const transitioned =
    result === COMPLETE_RESULT.completed || result === COMPLETE_RESULT.recovered;

  let recovery_url: string | undefined;
  if (purchase.reveal_token) {
    const lead = await db.getLeadById(purchase.lead_id);
    if (lead) {
      const base = publicBaseUrl(env, request);
      recovery_url = `${base}/lead/${lead.lead_token}?reveal=${purchase.reveal_token}`;
    }
  }

  return json({ ok: true, status: "paid", transitioned, result, recovery_url });
};
