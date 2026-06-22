import type { MessagingPort, NotifyInput } from "../ports/messaging.ts";
import type { Env } from "../env.ts";

// WhatsApp Cloud API. Sends an approved utility template to the operator's OWN
// number (operator forwards to the chef group manually — ban-safe). The template
// `new_lead` body params must match the template approved in Meta, in order.
export function createWhatsAppMessaging(env: Env): Pick<MessagingPort, "sendWhatsApp"> {
  const token = env.WA_CLOUD_TOKEN ?? "";
  const phoneNumberId = env.WA_PHONE_NUMBER_ID ?? "";
  const to = env.WA_MY_NUMBER ?? "";
  const templateName = env.WA_TEMPLATE_NAME || "new_lead";

  return {
    async sendWhatsApp(input: NotifyInput): Promise<void> {
      const l = input.lead;
      const bodyParams = [
        l.city ?? "-",
        l.event_date ?? "-",
        l.guests != null ? String(l.guests) : "-",
        l.cuisine ?? "-",
        l.budget != null ? `₪${l.budget}` : "-",
        `₪${l.price}`,
      ].map((text) => ({ type: "text", text }));

      const payload = {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: "he" },
          components: [
            { type: "body", parameters: bodyParams },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: l.lead_token }],
            },
          ],
        },
      };

      const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`WhatsApp send failed HTTP ${res.status}: ${text}`);
      }
    },
  };
}
