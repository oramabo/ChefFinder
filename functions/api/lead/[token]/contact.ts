import { buildContainer } from "../../../../functions-lib/factory.ts";
import { json, error } from "../../../../functions-lib/http.ts";
import type { Handler } from "../../../../functions-lib/handler.ts";

// GET /api/lead/:token/contact?chef=... — the ONLY endpoint that returns client
// PII, and only to a chef whose phone is in the lead's paid_by list.
export const onRequestGet: Handler = async ({ env, params, request }) => {
  const token = String(params.token);
  const chef = new URL(request.url).searchParams.get("chef") ?? "";
  if (!chef) return error("חסר מזהה שף", 400, { reason: "missing_chef" });

  const { db } = buildContainer(env, request);
  const lead = await db.getLeadByToken(token);
  if (!lead) return error("הליד לא נמצא", 404, { reason: "not_found" });

  if (!lead.paid_by.includes(chef)) {
    return error("התשלום לא נמצא עבור מספר זה", 403, { reason: "not_paid" });
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
