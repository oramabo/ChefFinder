import type { MessagingPort } from "./ports/messaging.ts";
import type { Lead } from "@shared/types.ts";
import { toLeadSummary } from "@shared/types.ts";

export interface NotifyResult {
  whatsapp: "sent" | "failed";
  telegram: "sent" | "failed";
}

// Fan out the new-lead notification to WhatsApp (to operator) and Telegram in
// parallel. One channel failing must not block the other (Promise.allSettled).
// The payload is built from a PII-free LeadSummary — client name/phone/email
// never leave this boundary.
export async function notifyLead(
  messaging: MessagingPort,
  lead: Lead,
  baseUrl: string,
): Promise<NotifyResult> {
  const summary = toLeadSummary(lead);
  const unlockUrl = `${baseUrl.replace(/\/$/, "")}/lead/${lead.lead_token}`;
  const input = { lead: summary, unlockUrl };

  const [wa, tg] = await Promise.allSettled([
    messaging.sendWhatsApp(input),
    messaging.sendTelegram(input),
  ]);

  if (wa.status === "rejected") console.error("notifyLead WhatsApp failed:", wa.reason);
  if (tg.status === "rejected") console.error("notifyLead Telegram failed:", tg.reason);

  return {
    whatsapp: wa.status === "fulfilled" ? "sent" : "failed",
    telegram: tg.status === "fulfilled" ? "sent" : "failed",
  };
}
