import type { MessagingPort, NotifyInput } from "../ports/messaging.ts";
import type { Env } from "../env.ts";

// Telegram Bot API. Posts the lead summary + unlock link to the chef group/channel
// (the bot must be an admin of TG_CHAT_ID). No client PII.
export function createTelegramMessaging(env: Env): Pick<MessagingPort, "sendTelegram"> {
  const token = env.TG_TOKEN ?? "";
  const chatId = env.TG_CHAT_ID ?? "";

  return {
    async sendTelegram(input: NotifyInput): Promise<void> {
      const l = input.lead;
      const lines = [
        "🔔 *ליד חדש*",
        l.city ? `עיר: ${l.city}` : null,
        l.event_date ? `תאריך: ${l.event_date}` : null,
        l.guests ? `אורחים: ${l.guests}` : null,
        l.cuisine ? `מטבח: ${l.cuisine}` : null,
        l.budget ? `תקציב: ₪${l.budget}` : null,
        l.kosher ? "כשר: כן" : null,
        `מחיר ליד: ₪${l.price}`,
      ].filter(Boolean);

      const payload = {
        chat_id: chatId,
        text: lines.join("\n"),
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "פתיחת הליד 🔓", url: input.unlockUrl }]],
        },
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
