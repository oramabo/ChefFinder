import { buildContainer } from "../../../functions-lib/factory.ts";
import { notifyLead } from "../../../functions-lib/notifyLead.ts";
import { generateLeadToken } from "../../../functions-lib/crypto.ts";
import { json, error, readJson, validate } from "../../../functions-lib/http.ts";
import { publicBaseUrl } from "../../../functions-lib/env.ts";
import type { Handler } from "../../../functions-lib/handler.ts";
import { LeadInput } from "@shared/schema.ts";
import { DEFAULT_CAP, DEFAULT_PRICE } from "@shared/constants.ts";

// POST /api/lead — create a lead, then distribute (WhatsApp + Telegram).
export const onRequestPost: Handler = async ({ request, env }) => {
  const body = await readJson(request);
  const parsed = validate(LeadInput, body);
  if (!parsed.success) return parsed.response;
  const input = parsed.data;

  const { db, messaging, turnstile } = buildContainer(env, request);

  const remoteIp = request.headers.get("cf-connecting-ip") ?? undefined;
  const ok = await turnstile.verify(input.turnstile_token, remoteIp);
  if (!ok) return error("אימות אנטי-ספאם נכשל", 403, { reason: "turnstile_failed" });

  const lead = await db.insertLead({
    lead_token: generateLeadToken(),
    event_type: input.event_type ?? null,
    event_date: input.event_date ?? null,
    city: input.city ?? null,
    guests: input.guests ?? null,
    budget: input.budget ?? null,
    cuisine: input.cuisine ?? null,
    kosher: input.kosher,
    client_name: input.client_name,
    client_phone: input.client_phone,
    client_email: input.client_email ? input.client_email : null,
    price: DEFAULT_PRICE,
    buyers_cap: DEFAULT_CAP,
    source: input.source ?? null,
  });

  const notify = await notifyLead(messaging, lead, publicBaseUrl(env, request));

  return json({ ok: true, notify });
};
