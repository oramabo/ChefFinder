import type { LeadSummary } from "@shared/types.ts";

export interface CreatePaymentInput {
  purchaseId: string;
  amount: number;
  chefPhone: string;
  lead: LeadSummary;
  // URL to send the chef back to after payment.
  returnUrl: string;
  // URL the provider posts the payment result to.
  webhookUrl: string;
}

export interface CreatePaymentResult {
  payment_url: string;
  provider_ref: string;
}

export type WebhookResult =
  | { ok: true; purchaseId: string; provider_ref: string; status: "paid" | "failed"; invoiceRef?: string | null }
  | { ok: false; reason: string };

// Payment provider port (Grow today, Tranzila later). Adapters own the
// provider-specific request shapes and signature scheme.
export interface PaymentsPort {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  // Parse + verify a provider webhook request into a normalized result.
  verifyWebhook(request: Request): Promise<WebhookResult>;
  // Issue a tax invoice for a paid purchase; returns the invoice reference.
  issueInvoice(input: { purchaseId: string; provider_ref: string; amount: number }): Promise<string | null>;
}
