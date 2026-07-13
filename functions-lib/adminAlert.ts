import type { Env } from "./env.ts";

// Operator-facing alerts when a chef reserves a lead and a Bit payment is
// pending approval. Delivered to the admin Telegram channel (TG_ADMIN_CHAT_ID,
// distinct from the chef-facing TG_CHAT_ID). WhatsApp is disabled for now.
// Best-effort: a failed alert must never break the reserve flow.
export interface ReservationAlert {
  chefPhone: string;
  amount: number;
  city: string | null;
  reference: string;
}

async function sendAdminTelegramText(env: Env, text: string): Promise<void> {
  const token = env.TG_TOKEN;
  const chatId = env.TG_ADMIN_CHAT_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

// A payment landed but could not be applied — late after the lead sold to
// capacity ("conflict": refund the chef), or for an unknown purchase. This is
// money already taken with no product delivered, so it must reach the operator
// even though the HTTP response stays a calm 200. Best-effort like all alerts.
export async function notifyPaymentIssue(
  env: Env,
  issue: { purchaseId: string; chefPhone?: string; amount?: number; problem: string },
): Promise<void> {
  const lines = [
    "🚨 בעיה בתשלום — נדרש טיפול ידני",
    `בעיה: ${issue.problem}`,
    issue.chefPhone ? `טלפון השף: ${issue.chefPhone}` : null,
    issue.amount != null ? `סכום: ₪${issue.amount}` : null,
    `אסמכתא: ${issue.purchaseId}`,
  ].filter(Boolean);
  try {
    await sendAdminTelegramText(env, lines.join("\n"));
  } catch (err) {
    console.error("notifyPaymentIssue failed:", err);
  }
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

export async function notifyReservation(env: Env, a: ReservationAlert): Promise<void> {
  try {
    await sendTelegram(env, a);
  } catch (err) {
    console.error("notifyReservation failed:", err);
  }
}
