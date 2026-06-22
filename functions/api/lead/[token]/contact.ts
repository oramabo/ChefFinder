import { buildContainer } from "../../../../functions-lib/factory.ts";
import { json, error } from "../../../../functions-lib/http.ts";
import type { Handler } from "../../../../functions-lib/handler.ts";

// GET /api/lead/:token/contact?reveal=... — the ONLY endpoint that returns client
// PII. Gated by the per-purchase reveal_token (an unguessable secret issued to
// the chef at reserve time), and only once that purchase is paid. The chef's
// phone is NOT an access credential.
export const onRequestGet: Handler = async ({ env, params, request }) => {
  const token = String(params.token);
  const reveal = new URL(request.url).searchParams.get("reveal") ?? "";
  if (!reveal) return error("חסר אסימון גישה", 400, { reason: "missing_reveal" });

  const { db } = buildContainer(env, request);
  const lead = await db.getLeadByToken(token);
  if (!lead) return error("הליד לא נמצא", 404, { reason: "not_found" });

  const purchase = await db.getPurchaseByRevealToken(reveal);
  if (!purchase || purchase.lead_id !== lead.id || purchase.status !== "paid") {
    return error("התשלום לא אומת", 403, { reason: "not_paid" });
  }

  return json({
    ok: true,
    contact: {
      client_name: lead.client_name,
      client_phone: lead.client_phone,
      client_email: lead.client_email,
    },
  });
};
