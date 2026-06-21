import type { PaymentsPort } from "../ports/payments.ts";
import type { Env } from "../env.ts";

// Tranzila is the named fallback provider. Left as an interface-compatible stub
// for M1; implement when/if Tranzila is selected. Kept so the factory can switch
// providers without touching handlers.
export function createTranzilaPayments(_env: Env): PaymentsPort {
  const notImplemented = () => {
    throw new Error("Tranzila adapter not implemented yet");
  };
  return {
    createPayment: notImplemented,
    verifyWebhook: notImplemented,
    issueInvoice: notImplemented,
  };
}
