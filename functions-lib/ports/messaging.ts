import type { LeadSummary } from "@shared/types.ts";

export interface NotifyInput {
  lead: LeadSummary;
  unlockUrl: string;
}

// Distribution channels. Messages carry the event summary + unlock link only,
// never client PII (enforced in notifyLead).
//
// The two direct-message methods talk to an individual person (not the group):
// sendOtp delivers a verification code to a client's phone before their lead is
// accepted; sendAccessLink delivers the unlock/recovery link to a chef who paid.
// Both go out over WhatsApp Cloud API templates in production and are toggled
// per-feature by OTP_ENABLED / RECOVERY_ENABLED (see functions-lib/env.ts).
export interface MessagingPort {
  sendWhatsApp(input: NotifyInput): Promise<void>;
  sendTelegram(input: NotifyInput): Promise<void>;
  sendOtp(toPhone: string, code: string): Promise<void>;
  sendAccessLink(toPhone: string, url: string): Promise<void>;
}
