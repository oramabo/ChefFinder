import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error, readJson, validate } from "../../../functions-lib/http.ts";
import { publicBaseUrl, paymentsAvailable } from "../../../functions-lib/env.ts";
import { requireChef } from "../../../functions-lib/chefAuth.ts";
import { notifyReservation } from "../../../functions-lib/adminAlert.ts";
import type { Handler } from "../../../functions-lib/handler.ts";
import { CheckoutInput } from "@shared/schema.ts";
import { CREDIT_PACKAGES } from "@shared/constants.ts";

// POST /api/chef/credits/checkout — buy a credit package ("bank of leads").
// Creates a pending credit_order and starts a payment via the same provider
// abstraction as a lead purchase (Grow / manual Bit / mock). Credits are granted
// ONLY once the payment is confirmed (webhook / admin-confirm / mock-complete).
export const onRequestPost: Handler = async ({ request, env, waitUntil }) => {
  const claims = await requireChef(env, request);
  if (!claims) return error("לא מחובר", 401, { reason: "unauthorized" });

  const body = await readJson(request);
  const parsed = validate(CheckoutInput, body);
  if (!parsed.success) return parsed.response;

  if (!paymentsAvailable(env)) {
    return json({ ok: false, reason: "payments_unavailable" });
  }

  const pkg = CREDIT_PACKAGES.find((p) => p.id === parsed.data.package);
  if (!pkg) return json({ ok: false, reason: "unknown_package" });

  const { db, payments } = buildContainer(env, request);
  const chef = await db.getChefById(claims.sub);
  if (!chef || chef.status !== "active") {
    return error("החשבון אינו פעיל", 403, { reason: "inactive" });
  }

  const order = await db.createCreditOrder({
    chef_id: chef.id,
    credits: pkg.credits,
    amount: pkg.price,
  });

  const base = publicBaseUrl(env, request);
  try {
    const payment = await payments.createPayment({
      purchaseId: order.id,
      amount: pkg.price,
      chefPhone: chef.phone,
      description: `השף שלי — חבילת ${pkg.credits} לידים`,
      returnUrl: `${base}/chef?order=${order.id}`,
      webhookUrl: `${base}/api/payment/webhook`,
    });
    await db.setCreditOrderProviderRef(order.id, payment.provider_ref);

    // Manual Bit: alert the operator so they can confirm once the transfer lands.
    if (payment.manual_bit) {
      waitUntil(
        notifyReservation(env, {
          chefPhone: chef.phone,
          amount: pkg.price,
          city: `חבילת ${pkg.credits} קרדיטים`,
          reference: order.id,
        }),
      );
    }

    return json({
      ok: true,
      order_id: order.id,
      credits: pkg.credits,
      amount: pkg.price,
      payment_url: payment.payment_url,
      manual_bit: payment.manual_bit
        ? { ...payment.manual_bit, amount: pkg.price, reference: order.id }
        : undefined,
    });
  } catch (err) {
    console.error("credit checkout createPayment failed:", err);
    await db.failCreditOrder(order.id);
    return error("יצירת התשלום נכשלה", 502, { reason: "payment_init_failed" });
  }
};
