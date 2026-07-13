import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentsPort,
  WebhookResult,
} from "../ports/payments.ts";
import type { Env } from "../env.ts";
import { hmacSha256Hex, timingSafeEqual } from "../crypto.ts";

// Lemon Squeezy (Merchant of Record) checkout adapter.
//
// Toggle-gated: the factory only picks this when LEMONSQUEEZY_ENABLED=true and
// the keys are present (see lemonSqueezyEnabled() in env.ts). Flip the flag off
// to fall back to whatever else is configured (Grow / Bit / mock) — no redeploy
// of code, just an env change.
//
// createPayment opens a hosted checkout and embeds our purchase id in
// checkout_data.custom so the webhook can correlate the paid order back to the
// pending purchase. As a Merchant of Record, Lemon Squeezy issues its own
// receipt/invoice on a paid order, so issueInvoice makes no extra API call.
//
// NOTE: dynamic per-lead pricing relies on `custom_price`, which Lemon Squeezy
// only honors when the target variant has "pay what you want" enabled. Enable it
// on the variant, otherwise the variant's fixed price is charged. See DEPLOYMENT.md.
const LS_BASE = "https://api.lemonsqueezy.com/v1";

export function createLemonSqueezyPayments(env: Env): PaymentsPort {
  const apiKey = env.LEMONSQUEEZY_API_KEY ?? "";
  const storeId = env.LEMONSQUEEZY_STORE_ID ?? "";
  const variantId = env.LEMONSQUEEZY_VARIANT_ID ?? "";
  const webhookSecret = env.LEMONSQUEEZY_WEBHOOK_SECRET ?? "";

  return {
    async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
      const payload = {
        data: {
          type: "checkouts",
          attributes: {
            // Amount is in the store currency's minor units (e.g. agorot/cents).
            custom_price: Math.round(input.amount * 100),
            product_options: {
              // Return the chef to the lead page after a successful payment.
              redirect_url: input.returnUrl,
            },
            checkout_data: {
              // Comes back on the webhook as meta.custom_data.purchase_id.
              custom: { purchase_id: input.purchaseId },
            },
          },
          relationships: {
            store: { data: { type: "stores", id: storeId } },
            variant: { data: { type: "variants", id: variantId } },
          },
        },
      };

      const res = await fetch(`${LS_BASE}/checkouts`, {
        method: "POST",
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`LemonSqueezy createCheckout HTTP ${res.status} ${detail}`.trim());
      }
      const data = (await res.json()) as {
        data?: { id?: string; attributes?: { url?: string } };
      };
      const url = data?.data?.attributes?.url;
      const ref = data?.data?.id;
      if (!url || !ref) {
        throw new Error(`LemonSqueezy createCheckout: unexpected response ${JSON.stringify(data)}`);
      }
      return { payment_url: url, provider_ref: String(ref) };
    },

    async verifyWebhook(request: Request): Promise<WebhookResult> {
      // The signature is an HMAC-SHA256 of the *raw* body, so read text (not
      // json) and hash it before parsing.
      const raw = await request.text();
      const provided = (request.headers.get("x-signature") ?? "").toLowerCase();
      const expected = await hmacSha256Hex(webhookSecret, raw);
      if (!provided || !timingSafeEqual(provided, expected)) {
        return { ok: false, reason: "bad_signature" };
      }

      let body: {
        meta?: { event_name?: string; custom_data?: { purchase_id?: string } };
        data?: { id?: string; attributes?: { status?: string } };
      };
      try {
        body = JSON.parse(raw);
      } catch {
        return { ok: false, reason: "bad_body" };
      }

      const eventName = String(body?.meta?.event_name ?? "");
      const purchaseId = String(body?.meta?.custom_data?.purchase_id ?? "");
      const provider_ref = String(body?.data?.id ?? "");
      // One-time lead purchases complete on order_created; ignore everything
      // else (subscription events, refunds — subscribe only to order_created).
      if (eventName !== "order_created") return { ok: false, reason: `ignored_event_${eventName}` };
      if (!purchaseId || !provider_ref) return { ok: false, reason: "missing_fields" };

      const orderStatus = String(body?.data?.attributes?.status ?? "");
      const status: "paid" | "failed" = orderStatus === "paid" ? "paid" : "failed";
      return { ok: true, purchaseId, provider_ref, status };
    },

    async issueInvoice(input): Promise<string | null> {
      // Merchant of Record: Lemon Squeezy emails the buyer a receipt/invoice
      // automatically on a paid order, so there's no separate invoice call.
      // Record the order id as the invoice reference.
      return `ls-${input.provider_ref}`;
    },
  };
}
