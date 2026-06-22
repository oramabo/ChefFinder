import type { Env } from "./env.ts";
import { parseRecipients } from "./adapters/messaging.whatsapp.ts";

// Operator-facing alerts when a chef reserves a lead and a Bit payment is
// pending approval. Delivered to a SEPARATE admin Telegram channel
// (TG_ADMIN_CHAT_ID, distinct from the chef-facing TG_CHAT_ID) and, if WhatsApp
// is configured, to the operator number(s) via a template. Best-effort: a failed
// alert must never break the reserve flow.
export interface ReservationAlert {
  chefPhone: string;
  amount: number;
  city: string | null;
  reference: string;
}

async function sendTelegram(env: Env, a: ReservationAlert): Promise<void> {
  const token = env.TG_TOKEN;
  const chatId = env.TG_ADMIN_CHAT_ID;
  if (!token || !chatId) return;
  const lines = [
    "💸 הזמנה חדשה — ממתינה לאישור תשלום בביט",
    `טלפון השף: ${a.chefPhone}`,
    a.city ? `עיר: ${a.city}` : null,
    `סכום: ₪${a.amount}`,
    `אסמכתא: ${a.reference}`,
    "אשרו בעמוד הניהול לאחר קבלת התשלום.",
  ].filter(Boolean);
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: lines.join("\n") }),
  });
}

async function sendWhatsApp(env: Env, a: ReservationAlert): Promise<void> {
  const token = env.WA_CLOUD_TOKEN;
  const phoneNumberId = env.WA_PHONE_NUMBER_ID;
  const recipients = parseRecipients(env.WA_MY_NUMBER);
  if (!token || !phoneNumberId || recipients.length === 0) return;

  const templateName = env.WA_RESERVATION_TEMPLATE || "new_reservation";
  const lang = env.WA_TEMPLATE_LANG || "he";
  // Named params: {{chef_phone}}, {{city}}, {{amount}}, {{reference}}.
  const bodyParams = [
    { parameter_name: "chef_phone", text: a.chefPhone },
    { parameter_name: "city", text: a.city ?? "-" },
    { parameter_name: "amount", text: `₪${a.amount}` },
    { parameter_name: "reference", text: a.reference },
  ].map((p) => ({ type: "text", ...p }));

  await Promise.allSettled(
    recipients.map((to) =>
      fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: { name: templateName, language: { code: lang }, components: [{ type: "body", parameters: bodyParams }] },
        }),
      }),
    ),
  );
}

export async function notifyReservation(env: Env, a: ReservationAlert): Promise<void> {
  const results = await Promise.allSettled([sendTelegram(env, a), sendWhatsApp(env, a)]);
  for (const r of results) {
    if (r.status === "rejected") console.error("notifyReservation channel failed:", r.reason);
  }
}
