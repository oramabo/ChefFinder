import { buildContainer } from "../../../../functions-lib/factory.ts";
import { json, error, readJson, validate } from "../../../../functions-lib/http.ts";
import { publicBaseUrl } from "../../../../functions-lib/env.ts";
import type { Handler } from "../../../../functions-lib/handler.ts";
import { ReserveInput } from "@shared/schema.ts";
import { toLeadSummary } from "@shared/types.ts";

// POST /api/lead/:token/reserve — atomically reserve a slot then start payment.
// Convention: validation errors -> 422; business outcomes (sold_out, etc.) ->
// 200 with { ok:false, reason } so the SPA renders states uniformly.
export const onRequestPost: Handler = async ({ request, env, params }) => {
  const token = String(params.token);
  const body = await readJson(request);
  const parsed = validate(ReserveInput, body);
  if (!parsed.success) return parsed.response;
  const { chef_phone } = parsed.data;

  const { db, payments } = buildContainer(env, request);

  const lead = await db.getLeadByToken(token);
  if (!lead) return json({ ok: false, reason: "not_found" });

  const reserved = await db.reserveLead(token, chef_phone);
  if (!reserved.ok) return json({ ok: false, reason: reserved.reason });

  // Slot held (buyers_count incremented). Create the pending purchase + payment.
  const purchase = await db.createPurchase({
    lead_id: lead.id,
    chef_phone,
    amount: lead.price,
  });

  const base = publicBaseUrl(env, request);
  try {
    const payment = await payments.createPayment({
      purchaseId: purchase.id,
      amount: lead.price,
      chefPhone: chef_phone,
      lead: toLeadSummary(lead),
      returnUrl: `${base}/lead/${token}`,
      webhookUrl: `${base}/api/payment/webhook`,
    });
    await db.setPurchaseProviderRef(purchase.id, payment.provider_ref);
    return json({ ok: true, reason: "reserved", payment_url: payment.payment_url, purchase_id: purchase.id });
  } catch (err) {
    // Payment couldn't be started — release the held slot so it isn't lost.
    console.error("createPayment failed:", err);
    await db.releasePurchase(purchase.id, "failed");
    return error("יצירת התשלום נכשלה", 502, { reason: "payment_init_failed" });
  }
};
