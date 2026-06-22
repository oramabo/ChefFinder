import type { MessagingPort, NotifyInput } from "../ports/messaging.ts";
import type { Env } from "../env.ts";

// Parse one or more recipient numbers from a single env value. Accepts a comma-,
// space-, semicolon-, or newline-separated list of E.164 numbers, so multiple
// operators/distributors can each receive the alert.
export function parseRecipients(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// WhatsApp Cloud API. Sends an approved utility template to the operator number(s)
// in WA_MY_NUMBER (each operator forwards to the chef group manually — ban-safe).
// WA_MY_NUMBER may list several numbers; the template is sent to each. The
// `new_lead` template body params must match the template approved in Meta, in
// order.
export function createWhatsAppMessaging(env: Env): Pick<MessagingPort, "sendWhatsApp"> {
  const token = env.WA_CLOUD_TOKEN ?? "";
  const phoneNumberId = env.WA_PHONE_NUMBER_ID ?? "";
  const recipients = parseRecipients(env.WA_MY_NUMBER);
  const templateName = env.WA_TEMPLATE_NAME || "new_lead";
  // Must match the approved template's language exactly (Meta error #132001 means
  // no template with this name+language exists). Configurable for e.g. "he_IL".
  const templateLang = env.WA_TEMPLATE_LANG || "he";

  return {
    async sendWhatsApp(input: NotifyInput): Promise<void> {
      if (recipients.length === 0) {
        throw new Error("WhatsApp send failed: no recipient numbers in WA_MY_NUMBER");
      }

      const l = input.lead;
      // Named template parameters (the template body uses {{city}}, {{date}}, …).
      // `parameter_name` must match the variable names in the approved template
      // exactly. Budget/price already include ₪; missing fields send "-".
      const bodyParams = [
        { parameter_name: "city", text: l.city ?? "-" },
        { parameter_name: "date", text: l.event_date ?? "-" },
        { parameter_name: "guests", text: l.guests != null ? String(l.guests) : "-" },
        { parameter_name: "cuisine", text: l.cuisine ?? "-" },
        { parameter_name: "budget", text: l.budget != null ? `₪${l.budget}` : "-" },
        { parameter_name: "price", text: `₪${l.price}` },
      ].map((p) => ({ type: "text", ...p }));

      const sendOne = async (to: string): Promise<void> => {
        const payload = {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: templateName,
            language: { code: templateLang },
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
          throw new Error(`WhatsApp send to ${to} failed HTTP ${res.status}: ${text}`);
        }
      };

      // Fan out to every recipient; one failing must not stop the others. Resolve
      // if at least one delivered; throw only when every recipient failed (so the
      // channel is reported "failed" only when nobody received it).
      const settled = await Promise.allSettled(recipients.map(sendOne));
      const failures = settled.filter((s) => s.status === "rejected") as PromiseRejectedResult[];
      for (const f of failures) console.error("WhatsApp recipient failed:", f.reason);
      if (failures.length === recipients.length) {
        throw new Error(
          `WhatsApp send failed for all ${recipients.length} recipient(s): ${failures
            .map((f) => (f.reason instanceof Error ? f.reason.message : String(f.reason)))
            .join("; ")}`,
        );
      }
    },
  };
}
