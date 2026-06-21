import type { MessagingPort, NotifyInput } from "../ports/messaging.ts";

export interface MockMessage {
  channel: "whatsapp" | "telegram";
  text: string;
  input: NotifyInput;
}

// Records every message so tests can assert both channels fired and that no PII
// leaked. Also logs to console for the local dev flow.
export function createMockMessaging(sink: MockMessage[] = []): MessagingPort & { sink: MockMessage[] } {
  function render(input: NotifyInput): string {
    const l = input.lead;
    return [
      "ליד חדש 🔔",
      l.city ? `עיר: ${l.city}` : null,
      l.event_date ? `תאריך: ${l.event_date}` : null,
      l.guests ? `אורחים: ${l.guests}` : null,
      l.cuisine ? `מטבח: ${l.cuisine}` : null,
      l.budget ? `תקציב: ₪${l.budget}` : null,
      l.kosher ? "כשר: כן" : null,
      `מחיר ליד: ₪${l.price}`,
      `קישור: ${input.unlockUrl}`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return {
    sink,
    async sendWhatsApp(input: NotifyInput): Promise<void> {
      const text = render(input);
      sink.push({ channel: "whatsapp", text, input });
      console.log("[mock WhatsApp]\n" + text);
    },
    async sendTelegram(input: NotifyInput): Promise<void> {
      const text = render(input);
      sink.push({ channel: "telegram", text, input });
      console.log("[mock Telegram]\n" + text);
    },
  };
}
