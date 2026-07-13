import type { MessagingPort, NotifyInput } from "../ports/messaging.ts";
import type { Env } from "../env.ts";
import { EVENT_TYPES, CUISINES } from "@shared/constants.ts";

const eventHe = (slug: string | null) =>
  EVENT_TYPES.find((e) => e.slug === slug)?.he ?? null;
const cuisineHe = (slug: string | null) =>
  CUISINES.find((c) => c.slug === slug)?.he ?? null;

// ISO date (YYYY-MM-DD) → DD/MM/YYYY for a Hebrew-reading audience; pass through
// anything unexpected untouched.
function heDate(iso: string | null): string | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

// Telegram Bot API. Posts the lead summary + unlock link to the chef group/channel
// (the bot must be an admin of TG_CHAT_ID). No client PII.
//
// The message is authored to be **copy-paste-ready for the WhatsApp group**: it is
// sent as PLAIN text (no parse_mode) so the WhatsApp markup characters survive the
// copy — `*…*` renders bold in WhatsApp — and the unlock link is inline text (not
// a Telegram inline button) so it comes along when the operator copies the message.
export function createTelegramMessaging(env: Env): Pick<MessagingPort, "sendTelegram"> {
  const token = env.TG_TOKEN ?? "";
  const chatId = env.TG_CHAT_ID ?? "";

  return {
    async sendTelegram(input: NotifyInput): Promise<void> {
      const l = input.lead;
      const ev = eventHe(l.event_type);
      const lines = [
        "🍽️ *ליד חדש – שף פרטי*",
        "",
        l.city ? `📍 עיר: ${l.city}` : null,
        heDate(l.event_date) ? `📅 תאריך: ${heDate(l.event_date)}` : null,
        l.guests ? `👥 אורחים: ${l.guests}` : null,
        ev ? `🎉 סוג אירוע: ${ev}` : null,
        cuisineHe(l.cuisine) ? `🥘 מטבח: ${cuisineHe(l.cuisine)}` : null,
        l.budget ? `💰 תקציב: ₪${l.budget}` : null,
        l.kosher ? "✡️ כשרות: נדרשת" : null,
        `🏷️ מחיר הליד: ₪${l.price}`,
        "",
        "🔓 לרכישת הליד וקבלת פרטי הלקוח:",
        input.unlockUrl,
      ].filter((v) => v !== null);

      const payload = {
        chat_id: chatId,
        text: lines.join("\n"),
        // Plain text on purpose (see header note) + don't collapse the link preview.
        disable_web_page_preview: true,
      };

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Telegram send failed HTTP ${res.status}: ${text}`);
      }
    },
  };
}
