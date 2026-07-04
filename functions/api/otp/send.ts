import { buildContainer } from "../../../functions-lib/factory.ts";
import { otpEnabled } from "../../../functions-lib/env.ts";
import { generateOtpCode, sha256Hex } from "../../../functions-lib/crypto.ts";
import { normalizeIlPhone } from "../../../functions-lib/phone.ts";
import { json, error, readJson, validate } from "../../../functions-lib/http.ts";
import type { Handler } from "../../../functions-lib/handler.ts";
import { OtpSendInput } from "@shared/schema.ts";
import { OTP_TTL_MINUTES, OTP_MIN_RESEND_SECONDS, OTP_LENGTH } from "@shared/constants.ts";

// POST /api/otp/send — send a verification code to the client's WhatsApp.
// Active only when OTP_ENABLED=true (404-like {disabled} otherwise, so the SPA
// can fall back to the no-verification flow). Turnstile-gated: every send costs
// a WhatsApp template message, so bots must not be able to trigger it. Resends
// are throttled per phone (OTP_MIN_RESEND_SECONDS) inside the DB, atomically.
export const onRequestPost: Handler = async ({ request, env }) => {
  if (!otpEnabled(env)) return json({ ok: false, reason: "disabled" });

  const body = await readJson(request);
  const parsed = validate(OtpSendInput, body);
  if (!parsed.success) return parsed.response;

  const { db, messaging, turnstile } = buildContainer(env, request);

  const remoteIp = request.headers.get("cf-connecting-ip") ?? undefined;
  const human = await turnstile.verify(parsed.data.turnstile_token, remoteIp);
  if (!human) return error("אימות אנטי-ספאם נכשל", 403, { reason: "turnstile_failed" });

  const phone = normalizeIlPhone(parsed.data.phone);
  const code = generateOtpCode(OTP_LENGTH);
  const saved = await db.saveOtp(phone, await sha256Hex(code), OTP_TTL_MINUTES, OTP_MIN_RESEND_SECONDS);
  if (!saved) return json({ ok: false, reason: "too_soon" });

  try {
    await messaging.sendOtp(phone, code);
  } catch (err) {
    console.error("otp send failed:", err);
    return json({ ok: false, reason: "send_failed" });
  }

  return json({ ok: true });
};
