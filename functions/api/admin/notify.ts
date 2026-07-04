import { adminAuthorized, publicBaseUrl } from "../../../functions-lib/env.ts";
import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error, readJson } from "../../../functions-lib/http.ts";
import type { Handler } from "../../../functions-lib/handler.ts";
import { toLeadSummary } from "@shared/types.ts";

type Channel = "whatsapp" | "telegram";

// POST /api/admin/lead/:token/notify — re-send a lead's distribution message to
// Telegram and/or WhatsApp from the operator view. Admin-gated (x-admin-token,
// same as the leads list). The payload is the PII-free LeadSummary + unlock link,
// identical to the original new-lead notification — no client name/phone/email.
// Body: { channel?: "whatsapp" | "telegram" } — omit to send to both.
export const onRequestPost: Handler = async ({ request, env, params }) => {
  const provided = request.headers.get("x-admin-token");
  if (!adminAuthorized(env, provided)) {
    return error("לא מורשה", 401, { reason: "unauthorized" });
  }

  const token = String(params.token);
  const body = (await readJson(request)) as { channel?: string } | null;
  const only: Channel | null =
    body?.channel === "whatsapp" || body?.channel === "telegram" ? body.channel : null;

  const { db, messaging } = buildContainer(env, request);
  const lead = await db.getLeadByToken(token);
  if (!lead) return error("הליד לא נמצא", 404, { reason: "not_found" });

  const input = {
    lead: toLeadSummary(lead),
    unlockUrl: `${publicBaseUrl(env, request)}/lead/${lead.lead_token}`,
  };

  // Send only the requested channel, or both. One channel failing must not block
  // the other (Promise.allSettled), mirroring notifyLead.
  const channels: Channel[] = only ? [only] : ["whatsapp", "telegram"];
  const settled = await Promise.allSettled(
    channels.map((ch) =>
      ch === "whatsapp" ? messaging.sendWhatsApp(input) : messaging.sendTelegram(input),
    ),
  );

  const notify: Partial<Record<Channel, "sent" | "failed">> = {};
  settled.forEach((s, i) => {
    const ch = channels[i];
    if (s.status === "rejected") console.error(`admin re-notify ${ch} failed:`, s.reason);
    notify[ch] = s.status === "fulfilled" ? "sent" : "failed";
  });

  return json({ ok: true, notify });
};
