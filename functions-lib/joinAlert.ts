import type { Env } from "./env.ts";

// Operator-facing alert when someone applies to join the ezfind network via the
// umbrella landing form. Delivered to the admin Telegram channel
// (TG_ADMIN_CHAT_ID). Best-effort: a failed alert must never break the form
// submission. No-op when Telegram isn't configured (e.g. under stubs).
export interface JoinAlert {
  fullName: string;
  businessName: string | null;
  category: string;
  city: string;
  phone: string;
  email: string | null;
  message: string | null;
}

async function sendTelegram(env: Env, a: JoinAlert): Promise<void> {
  const token = env.TG_TOKEN;
  const chatId = env.TG_ADMIN_CHAT_ID;
  if (!token || !chatId) return;
  const lines = [
    "🙋 בקשת הצטרפות חדשה — ezfind",
    `שם: ${a.fullName}`,
    a.businessName ? `עסק: ${a.businessName}` : null,
    `תחום: ${a.category}`,
    `עיר: ${a.city}`,
    `טלפון: ${a.phone}`,
    a.email ? `אימייל: ${a.email}` : null,
    a.message ? `הודעה: ${a.message}` : null,
  ].filter(Boolean);
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: lines.join("\n") }),
  });
}

export async function notifyJoin(env: Env, a: JoinAlert): Promise<void> {
  const results = await Promise.allSettled([sendTelegram(env, a)]);
  for (const r of results) {
    if (r.status === "rejected") console.error("notifyJoin channel failed:", r.reason);
  }
}
