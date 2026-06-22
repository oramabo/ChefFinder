import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentsPort,
  WebhookResult,
} from "../ports/payments.ts";
import type { Env } from "../env.ts";
import { bitInfo } from "../env.ts";

// Manual Bit payments — no aggregator, no webhook.
//
// The chef is shown Bit instructions (the operator's Bit number / payment link)
// plus the purchase reference. The purchase stays "pending" until the operator
// verifies the Bit transfer and confirms it in /admin, which completes it. There
// is therefore no provider webhook; verifyWebhook always rejects.
export function createBitPayments(env: Env): PaymentsPort {
  const { phone, link } = bitInfo(env);

  return {
    async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
      // No redirect: the SPA renders the Bit panel from `manual_bit`.
      return {
        payment_url: "",
        provider_ref: `bit_${input.purchaseId}`,
        manual_bit: { phone, link },
      };
    },

    async verifyWebhook(): Promise<WebhookResult> {
      // Manual mode has no provider callback — confirmation is operator-driven.
      return { ok: false, reason: "manual_bit_no_webhook" };
    },

    async issueInvoice(input): Promise<string | null> {
      // No automated invoicing in manual mode; issue your own receipt out of band.
      return `bit-${input.provider_ref}`;
    },
  };
}
