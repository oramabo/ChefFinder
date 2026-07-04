import type { MessagingPort, NotifyInput } from "../ports/messaging.ts";

export interface MockMessage {
  channel: "whatsapp" | "telegram" | "otp" | "access_link";
  text: string;
  input?: NotifyInput;
  to?: string;
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
    // Direct messages (client OTP / chef access link). The console log is the
    // "delivery" in stub mode — the dev reads the code from the terminal.
    async sendOtp(toPhone: string, code: string): Promise<void> {
      sink.push({ channel: "otp", text: code, to: toPhone });
      console.log(`[mock WhatsApp OTP] to ${toPhone}: ${code}`);
    },
    async sendAccessLink(toPhone: string, url: string): Promise<void> {
      sink.push({ channel: "access_link", text: url, to: toPhone });
      console.log(`[mock WhatsApp access link] to ${toPhone}: ${url}`);
    },
  };
}
