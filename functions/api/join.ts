import { notifyJoin } from "../../functions-lib/joinAlert.ts";
import { json, readJson, validate } from "../../functions-lib/http.ts";
import type { Handler } from "../../functions-lib/handler.ts";
import { JoinInput } from "@shared/schema.ts";
import { JOIN_CATEGORIES } from "@shared/constants.ts";

// POST /api/join — a professional applies to join the ezfind network. The
// submission is delivered to the operator's admin Telegram channel. We never
// store PII here; this is a lightweight intake that an operator follows up on.
export const onRequestPost: Handler = async ({ request, env }) => {
  const body = await readJson(request);
  const parsed = validate(JoinInput, body);
  if (!parsed.success) return parsed.response;
  const input = parsed.data;

  // Map the category slug to its Hebrew label for a readable alert.
  const category =
    JOIN_CATEGORIES.find((c) => c.slug === input.category)?.he ?? input.category;

  try {
    await notifyJoin(env, {
      fullName: input.full_name,
      businessName: input.business_name ? input.business_name : null,
      category,
      city: input.city,
      phone: input.phone,
      email: input.email ? input.email : null,
      message: input.message ? input.message : null,
    });
  } catch (err) {
    // Best-effort: never fail the applicant's submission on a delivery error.
    console.error("join notify failed:", err);
  }

  return json({ ok: true });
};
