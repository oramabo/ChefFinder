import { adminAuthorized, publicBaseUrl } from "../../../functions-lib/env.ts";
import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error } from "../../../functions-lib/http.ts";
import type { Handler } from "../../../functions-lib/handler.ts";
import { toLeadSummary } from "@shared/types.ts";

// POST /api/admin/lead/:token/notify — re-send a lead's distribution message to
// the chef Telegram group from the operator view. Admin-gated (x-admin-token,
// same as the leads list). The payload is the PII-free LeadSummary + unlock link,
// identical to the original new-lead notification — no client name/phone/email.
// WhatsApp is disabled for now (operator copies the Telegram message by hand).
export const onRequestPost: Handler = async ({ request, env, params }) => {
  const provided = request.headers.get("x-admin-token");
  if (!adminAuthorized(env, provided)) {
    return error("לא מורשה", 401, { reason: "unauthorized" });
  }

  const token = String(params.token);
  const { db, messaging } = buildContainer(env, request);
  const lead = await db.getLeadByToken(token);
  if (!lead) return error("הליד לא נמצא", 404, { reason: "not_found" });

  const input = {
    lead: toLeadSummary(lead),
    unlockUrl: `${publicBaseUrl(env, request)}/lead/${lead.lead_token}`,
  };

  const [tg] = await Promise.allSettled([messaging.sendTelegram(input)]);
  if (tg.status === "rejected") console.error("admin re-notify Telegram failed:", tg.reason);

  return json({ ok: true, notify: { telegram: tg.status === "fulfilled" ? "sent" : "failed" } });
};
