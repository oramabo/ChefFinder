import { buildContainer } from "../../../../functions-lib/factory.ts";
import { recoveryEnabled, publicBaseUrl } from "../../../../functions-lib/env.ts";
import { samePhone, normalizeIlPhone } from "../../../../functions-lib/phone.ts";
import { json, error, readJson, validate } from "../../../../functions-lib/http.ts";
import type { Handler } from "../../../../functions-lib/handler.ts";
import { RecoverInput } from "@shared/schema.ts";

// POST /api/lead/:token/recover — a chef who paid but lost access (new device,
// in-app browser dropped localStorage) asks for their access link again.
//
// The phone number is NOT treated as a credential: the link is only ever
// DELIVERED to the phone stored on the paid purchase, never returned in the
// response — so typing someone else's number gains nothing (the real chef just
// receives their own link). The response is intentionally identical whether or
// not a matching paid purchase exists, to avoid leaking who bought what.
// Active only when RECOVERY_ENABLED=true.
export const onRequestPost: Handler = async ({ request, env, params, waitUntil }) => {
  if (!recoveryEnabled(env)) return json({ ok: false, reason: "disabled" });

  const token = String(params.token);
  const body = await readJson(request);
  const parsed = validate(RecoverInput, body);
  if (!parsed.success) return parsed.response;

  const { db, messaging, turnstile } = buildContainer(env, request);

  // Turnstile-gated: each delivery costs a WhatsApp template message, and a bot
  // could otherwise spam a chef's phone.
  const remoteIp = request.headers.get("cf-connecting-ip") ?? undefined;
  const human = await turnstile.verify(parsed.data.turnstile_token, remoteIp);
  if (!human) return error("אימות אנטי-ספאם נכשל", 403, { reason: "turnstile_failed" });

  const lead = await db.getLeadByToken(token);
  if (lead) {
    const paid = await db.getPaidPurchasesForLead(lead.id);
    const match = paid.find(
      (p) => p.reveal_token && samePhone(p.chef_phone, parsed.data.chef_phone),
    );
    if (match) {
      const base = publicBaseUrl(env, request);
      const url = `${base}/lead/${lead.lead_token}?reveal=${match.reveal_token}`;
      // Fire-and-forget: delivery failures are logged, the response stays generic.
      waitUntil(
        messaging
          .sendAccessLink(normalizeIlPhone(match.chef_phone), url)
          .catch((err) => console.error("recover send failed:", err)),
      );
    }
  }

  // Same answer for hit and miss — see the privacy note above.
  return json({ ok: true });
};
