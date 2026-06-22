import type { LeadSummary } from "@shared/types.ts";

export interface NotifyInput {
  lead: LeadSummary;
  unlockUrl: string;
}

// Distribution channels. Messages carry the event summary + unlock link only,
// never client PII (enforced in notifyLead).
export interface MessagingPort {
  sendWhatsApp(input: NotifyInput): Promise<void>;
  sendTelegram(input: NotifyInput): Promise<void>;
}
