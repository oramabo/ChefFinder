import { buildContainer } from "../../../../functions-lib/factory.ts";
import { json, error, readJson, validate } from "../../../../functions-lib/http.ts";
import { publicBaseUrl, paymentsAvailable } from "../../../../functions-lib/env.ts";
import { generateLeadToken } from "../../../../functions-lib/crypto.ts";
import type { Handler } from "../../../../functions-lib/handler.ts";
import { ReserveInput } from "@shared/schema.ts";
import { toLeadSummary, isLeadExpired } from "@shared/types.ts";
import { RESERVE_REASON } from "@shared/constants.ts";
import { notifyReservation } from "../../../../functions-lib/adminAlert.ts";

// POST /api/lead/:token/reserve — atomically reserve a slot then start payment.
// Convention: validation errors -> 422; business outcomes (sold_out, etc.) ->
// 200 with { ok:false, reason } so the SPA renders states uniformly.
export const onRequestPost: Handler = async ({ request, env, params, waitUntil }) => {
  const token = String(params.token);
  const body = await readJson(request);
  const parsed = validate(ReserveInput, body);
  if (!parsed.success) return parsed.response;
  const { chef_phone, turnstile_token } = parsed.data;

  // Fail closed when no checkout is available (no real provider AND not in a
  // stub/placeholder mode): never reserve a slot for a flow that cannot complete,
  // which would otherwise let a chef reach contact details without paying.
  if (!paymentsAvailable(env)) {
    return json({ ok: false, reason: "payments_unavailable" });
  }

  const { db, payments, turnstile } = buildContainer(env, request);

  // Anti-abuse: a reservation holds one of the lead's few slots for the TTL,
  // so it gets the same Turnstile gate as lead creation — otherwise anyone with
  // the group link could keep every lead "sold out" for free.
  const remoteIp = request.headers.get("cf-connecting-ip") ?? undefined;
  const human = await turnstile.verify(turnstile_token, remoteIp);
  if (!human) return error("אימות אנטי-ספאם נכשל", 403, { reason: "turnstile_failed" });

  const lead = await db.getLeadByToken(token);
  if (!lead) return json({ ok: false, reason: "not_found" });

  // A lead whose event has passed (or that went stale) can't be sold; chefs who
  // already paid keep contact access via the contact endpoint.
  if (isLeadExpired(lead)) {
    return json({ ok: false, reason: RESERVE_REASON.expired });
  }

  const reserved = await db.reserveLead(token, chef_phone);
  if (!reserved.ok) return json({ ok: false, reason: reserved.reason });

  // Slot held (buyers_count incremented). Create the pending purchase + payment.
  // The reveal_token is the chef's bearer secret for unlocking contact details
  // once paid. It is returned here, and after payment confirmation the operator
  // gets a recovery link containing it (admin confirm) to send privately to the
  // paying chef — it is never broadcast to the group.
  const reveal_token = generateLeadToken(32);
  const purchase = await db.createPurchase({
    lead_id: lead.id,
    chef_phone,
    amount: lead.price,
    reveal_token,
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

    // Manual Bit: alert the operator's admin Telegram channel that a payment is
    // pending. Fire-and-forget so it never delays the chef's response.
    if (payment.manual_bit) {
      waitUntil(
        notifyReservation(env, {
          chefPhone: chef_phone,
          amount: lead.price,
          city: lead.city,
          reference: purchase.id,
        }),
      );
    }

    return json({
      ok: true,
      reason: "reserved",
      payment_url: payment.payment_url,
      // Manual Bit mode: instructions for the in-page Bit panel (no redirect).
      manual_bit: payment.manual_bit
        ? { ...payment.manual_bit, amount: lead.price, reference: purchase.id }
        : undefined,
      purchase_id: purchase.id,
      reveal_token,
    });
  } catch (err) {
    // Payment couldn't be started — release the held slot so it isn't lost.
    console.error("createPayment failed:", err);
    await db.releasePurchase(purchase.id, "failed");
    return error("יצירת התשלום נכשלה", 502, { reason: "payment_init_failed" });
  }
};
