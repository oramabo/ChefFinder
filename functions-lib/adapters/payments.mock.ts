import type {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentsPort,
  WebhookResult,
} from "../ports/payments.ts";
import { hmacSha256Hex } from "../crypto.ts";

const MOCK_SECRET = "mock-webhook-secret";

// Mock payment provider. createPayment returns a fake hosted-payment URL that
// points back at our own app with a flag, and a synthetic provider_ref. Tests
// (and the dev flow) call signMockWebhook() to forge a valid webhook body.
export function createMockPayments(): PaymentsPort {
  return {
    async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
      const provider_ref = `mock_${input.purchaseId}`;
      // A clickable mock "payment page": returns the chef to the lead with a flag.
      const url = new URL(input.returnUrl);
      url.searchParams.set("mock_pay", "1");
      url.searchParams.set("ref", provider_ref);
      return { payment_url: url.toString(), provider_ref };
    },

    async verifyWebhook(request: Request): Promise<WebhookResult> {
      let body: Record<string, unknown>;
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return { ok: false, reason: "bad_body" };
      }
      const purchaseId = String(body.purchaseId ?? "");
      const provider_ref = String(body.provider_ref ?? "");
      const status = String(body.status ?? "paid") === "failed" ? "failed" : "paid";
      const sig = String(body.signature ?? "");
      const expected = await hmacSha256Hex(MOCK_SECRET, `${purchaseId}:${provider_ref}:${status}`);
      if (sig !== expected) return { ok: false, reason: "bad_signature" };
      if (!purchaseId || !provider_ref) return { ok: false, reason: "missing_fields" };
      return { ok: true, purchaseId, provider_ref, status };
    },

    async issueInvoice(input): Promise<string | null> {
      return `mock-invoice-${input.purchaseId}`;
    },
  };
}

// Helper for tests / the dev mock-pay page to produce a valid webhook body.
export async function signMockWebhook(
  purchaseId: string,
  provider_ref: string,
  status: "paid" | "failed" = "paid",
): Promise<Record<string, string>> {
  const signature = await hmacSha256Hex(MOCK_SECRET, `${purchaseId}:${provider_ref}:${status}`);
  return { purchaseId, provider_ref, status, signature };
}
