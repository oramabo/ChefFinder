import { buildContainer } from "../../../functions-lib/factory.ts";
import { notifyLead } from "../../../functions-lib/notifyLead.ts";
import { generateLeadToken, sha256Hex } from "../../../functions-lib/crypto.ts";
import { normalizeIlPhone } from "../../../functions-lib/phone.ts";
import { json, error, readJson, validate } from "../../../functions-lib/http.ts";
import { publicBaseUrl, otpEnabled } from "../../../functions-lib/env.ts";
import type { Handler } from "../../../functions-lib/handler.ts";
import { LeadInput } from "@shared/schema.ts";
import { DEFAULT_CAP, OTP_MAX_ATTEMPTS, leadPrice } from "@shared/constants.ts";

// POST /api/lead — create a lead, then distribute (WhatsApp + Telegram).
//
// Anti-spam is one gate, not two: with OTP_ENABLED the client proves ownership
// of their phone (the code was Turnstile-gated at send time), which supersedes
// Turnstile here — a second widget token would already be consumed. With OTP
// off, Turnstile gates this endpoint directly, as before.
export const onRequestPost: Handler = async ({ request, env }) => {
  const body = await readJson(request);
  const parsed = validate(LeadInput, body);
  if (!parsed.success) return parsed.response;
  const input = parsed.data;

  const { db, messaging, turnstile } = buildContainer(env, request);

  if (otpEnabled(env)) {
    const code = input.otp_code.trim();
    // No code yet → tell the SPA to run the verification step. 200 with
    // ok:false so the form renders it as a flow state, not an error.
    if (!code) return json({ ok: false, reason: "otp_required" });
    const status = await db.verifyOtp(
      normalizeIlPhone(input.client_phone),
      await sha256Hex(code),
      OTP_MAX_ATTEMPTS,
    );
    if (status !== "ok") {
      const reason =
        status === "mismatch"
          ? "otp_invalid"
          : status === "too_many_attempts"
            ? "otp_too_many"
            : "otp_expired"; // expired / not_found → ask for a fresh code
      return json({ ok: false, reason });
    }
  } else {
    const remoteIp = request.headers.get("cf-connecting-ip") ?? undefined;
    const ok = await turnstile.verify(input.turnstile_token, remoteIp);
    if (!ok) return error("אימות אנטי-ספאם נכשל", 403, { reason: "turnstile_failed" });
  }

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
    // Tiered by the client's budget band — stamped on the row at creation.
    price: leadPrice(input.budget),
    buyers_cap: DEFAULT_CAP,
    source: input.source ?? null,
    // The qualifying form is the chef vertical; future verticals set their own
    // slug and put extra qualifying answers in `details`.
    service_slug: "chefs",
  });

  const notify = await notifyLead(messaging, lead, publicBaseUrl(env, request));

  return json({ ok: true, notify });
};
