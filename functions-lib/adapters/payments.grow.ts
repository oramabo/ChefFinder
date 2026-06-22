import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentsPort,
  WebhookResult,
} from "../ports/payments.ts";
import type { Env } from "../env.ts";
import { hmacSha256Hex, timingSafeEqual } from "../crypto.ts";

// Grow (Meshulam) "light server" API adapter.
//
// NOTE: The exact endpoint paths, field names, and webhook signature scheme are
// provider-specific and must be confirmed against current Grow docs before going
// live. They are isolated here so handlers never change. createPayment embeds our
// purchase id in a custom field (cField1) so the webhook can correlate it.
const GROW_BASE = "https://secure.meshulam.co.il/api/light/server/1.0";

export function createGrowPayments(env: Env): PaymentsPort {
  const apiKey = env.GROW_API_KEY ?? "";
  const userId = env.GROW_USER_ID ?? "";
  const pageCode = env.GROW_PAGE_CODE ?? "";
  const webhookSecret = env.GROW_WEBHOOK_SECRET ?? "";

  return {
    async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
      const form = new URLSearchParams({
        pageCode,
        userId,
        apiKey,
        sum: String(input.amount),
        description: `השף שלי lead ${input.lead.lead_token}`,
        successUrl: input.returnUrl,
        cancelUrl: input.returnUrl,
        notifyUrl: input.webhookUrl,
        cField1: input.purchaseId,
        chargeType: "1",
      });

      const res = await fetch(`${GROW_BASE}/createPaymentProcess`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      if (!res.ok) throw new Error(`Grow createPayment HTTP ${res.status}`);
      const data = (await res.json()) as {
        status?: number;
        data?: { url?: string; processId?: string; processToken?: string };
        err?: unknown;
      };
      const url = data?.data?.url;
      const processId = data?.data?.processId ?? data?.data?.processToken;
      if (!url || !processId) {
        throw new Error(`Grow createPayment: unexpected response ${JSON.stringify(data)}`);
      }
      return { payment_url: url, provider_ref: String(processId) };
    },

    async verifyWebhook(request: Request): Promise<WebhookResult> {
      const ct = request.headers.get("content-type") ?? "";
      let body: Record<string, string> = {};
      if (ct.includes("application/json")) {
        try {
          body = (await request.json()) as Record<string, string>;
        } catch {
          return { ok: false, reason: "bad_body" };
        }
      } else {
        const fd = await request.formData();
        body = Object.fromEntries([...fd.entries()].map(([k, v]) => [k, String(v)]));
      }

      const purchaseId = String(body.cField1 ?? body.purchaseId ?? "");
      const provider_ref = String(body.processId ?? body.transactionId ?? body.provider_ref ?? "");
      // Grow signals success via a status code; treat non-success as failed.
      const statusCode = String(body.status ?? body.statusCode ?? "");
      const status: "paid" | "failed" = statusCode === "1" || statusCode === "paid" ? "paid" : "failed";

      if (webhookSecret) {
        const provided = String(body.signature ?? request.headers.get("x-grow-signature") ?? "");
        const expected = await hmacSha256Hex(webhookSecret, `${purchaseId}:${provider_ref}:${statusCode}`);
        if (!provided || !timingSafeEqual(provided, expected)) {
          return { ok: false, reason: "bad_signature" };
        }
      }

      if (!purchaseId || !provider_ref) return { ok: false, reason: "missing_fields" };
      return { ok: true, purchaseId, provider_ref, status };
    },

    async issueInvoice(input): Promise<string | null> {
      // Grow can auto-issue a tax invoice on successful charge; if a separate
      // call is required it goes here. For now return the provider ref as a
      // placeholder reference until the exact invoice API is wired.
      return `grow-invoice-${input.provider_ref}`;
    },
  };
}
