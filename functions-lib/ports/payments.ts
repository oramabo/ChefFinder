import type { LeadSummary } from "@shared/types.ts";

export interface CreatePaymentInput {
  purchaseId: string;
  amount: number;
  chefPhone: string;
  // Present for a lead unlock; absent for a credit-package order.
  lead?: LeadSummary;
  // Optional override for the checkout description (used by credit packages).
  description?: string;
  // URL to send the chef back to after payment.
  returnUrl: string;
  // URL the provider posts the payment result to.
  webhookUrl: string;
}

export interface CreatePaymentResult {
  // Hosted-checkout URL to redirect to. Empty for manual Bit (no redirect).
  payment_url: string;
  provider_ref: string;
  // Present only in manual Bit mode: instructions to show the chef in-page.
  manual_bit?: { phone: string; link?: string };
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
