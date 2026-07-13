import type { DbPort } from "./ports/db.ts";
import type { PaymentsPort } from "./ports/payments.ts";
import type { MessagingPort } from "./ports/messaging.ts";
import type { TurnstilePort } from "./ports/turnstile.ts";
import { type Env, globalStubs, useReal, bitManualEnabled, lemonSqueezyEnabled } from "./env.ts";

import { createMockDb } from "./adapters/db.mock.ts";
import { createSupabaseDb } from "./adapters/db.supabase.ts";
import { createMockPayments } from "./adapters/payments.mock.ts";
import { createGrowPayments } from "./adapters/payments.grow.ts";
import { createLemonSqueezyPayments } from "./adapters/payments.lemonsqueezy.ts";
import { createBitPayments } from "./adapters/payments.bit.ts";
import { createMockMessaging } from "./adapters/messaging.mock.ts";
import { createWhatsAppMessaging, createWhatsAppDirect } from "./adapters/messaging.whatsapp.ts";
import { createTelegramMessaging } from "./adapters/messaging.telegram.ts";
import { createTurnstile, createMockTurnstile } from "./adapters/turnstile.ts";

export interface Container {
  db: DbPort;
  payments: PaymentsPort;
  messaging: MessagingPort;
  turnstile: TurnstilePort;
}

// Build the dependency container for a request. Each service independently uses
// its real adapter only when configured; otherwise it falls back to a mock, so a
// partially-configured environment still runs end-to-end.
export function buildContainer(env: Env, _request?: Request): Container {
  // Fail loud in production: a missing Supabase config would otherwise silently
  // use the in-memory mock and lose all data. Only allowed under explicit stubs.
  if (!globalStubs(env) && !useReal(env, "db")) {
    throw new Error("Database not configured: set SUPABASE_URL + SUPABASE_SERVICE_KEY (or USE_STUBS=true)");
  }

  const db: DbPort = useReal(env, "db")
    ? createSupabaseDb(env.SUPABASE_URL!, env.SUPABASE_SERVICE_KEY!)
    : createMockDb();

  // Provider precedence: the explicit Lemon Squeezy toggle wins, then a
  // configured Grow aggregator, then manual Bit, else the mock checkout.
  const payments: PaymentsPort = lemonSqueezyEnabled(env)
    ? createLemonSqueezyPayments(env)
    : useReal(env, "payments")
      ? createGrowPayments(env)
      : bitManualEnabled(env)
        ? createBitPayments(env)
        : createMockPayments();

  // The Turnstile mock passes everything, which in a real deployment means
  // unthrottled spam straight into the WhatsApp/Telegram groups — shout about
  // it on every request so a missing TURNSTILE_SECRET can't go unnoticed.
  if (!globalStubs(env) && !useReal(env, "turnstile")) {
    console.error(
      "TURNSTILE_SECRET is not set in a non-stub deployment — anti-spam is DISABLED",
    );
  }
  const turnstile: TurnstilePort = useReal(env, "turnstile")
    ? createTurnstile(env.TURNSTILE_SECRET!)
    : createMockTurnstile();

  // Messaging is per-channel: WhatsApp and Telegram each go real or mock. The
  // direct-to-user messages (OTP, access link) ride the WhatsApp credentials;
  // whether they are used at all is decided per-feature by OTP_ENABLED /
  // RECOVERY_ENABLED in the handlers.
  const mock = createMockMessaging();
  const wa = useReal(env, "wa") ? createWhatsAppMessaging(env) : mock;
  const tg = useReal(env, "tg") ? createTelegramMessaging(env) : mock;
  const direct = useReal(env, "wa") ? createWhatsAppDirect(env) : mock;
  const messaging: MessagingPort = {
    sendWhatsApp: (input) => wa.sendWhatsApp(input),
    sendTelegram: (input) => tg.sendTelegram(input),
    sendOtp: (to, code) => direct.sendOtp(to, code),
    sendAccessLink: (to, url) => direct.sendAccessLink(to, url),
  };

  return { db, payments, messaging, turnstile };
}
