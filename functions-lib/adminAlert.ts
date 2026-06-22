import type { Env } from "./env.ts";

// Operator-facing alert sent to a SEPARATE admin Telegram channel
// (TG_ADMIN_CHAT_ID) — distinct from the chef-facing TG_CHAT_ID. Used to notify
// the operator that a chef reserved a lead and a Bit payment is pending approval.
// Best-effort: never throws (a failed alert must not break the reserve flow).
export interface ReservationAlert {
  chefPhone: string;
  amount: number;
  city: string | null;
  reference: string;
}

export async function notifyReservation(env: Env, a: ReservationAlert): Promise<void> {
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

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: lines.join("\n") }),
    });
  } catch (err) {
    console.error("notifyReservation failed:", err);
  }
}
