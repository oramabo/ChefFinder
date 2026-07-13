import type { MessagingPort } from "./ports/messaging.ts";
import type { Lead } from "@shared/types.ts";
import { toLeadSummary } from "@shared/types.ts";

export interface NotifyResult {
  telegram: "sent" | "failed";
}

// Send the new-lead notification to the chef group on Telegram. WhatsApp is
// disabled for now — the operator copies the (WhatsApp-formatted) Telegram
// message into the WhatsApp group by hand. To re-enable automated WhatsApp,
// restore the sendWhatsApp call here (the adapter/port method still exist).
// The payload is a PII-free LeadSummary — client name/phone/email never leave
// this boundary.
export async function notifyLead(
  messaging: MessagingPort,
  lead: Lead,
  baseUrl: string,
): Promise<NotifyResult> {
  const summary = toLeadSummary(lead);
  const unlockUrl = `${baseUrl.replace(/\/$/, "")}/lead/${lead.lead_token}`;
  const input = { lead: summary, unlockUrl };

  const [tg] = await Promise.allSettled([messaging.sendTelegram(input)]);

  if (tg.status === "rejected") console.error("notifyLead Telegram failed:", tg.reason);

  return { telegram: tg.status === "fulfilled" ? "sent" : "failed" };
}
