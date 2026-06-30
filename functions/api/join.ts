import { notifyJoin } from "../../functions-lib/joinAlert.ts";
import { buildContainer } from "../../functions-lib/factory.ts";
import { json, readJson, validate } from "../../functions-lib/http.ts";
import type { Handler } from "../../functions-lib/handler.ts";
import { JoinInput } from "@shared/schema.ts";
import { JOIN_CATEGORIES } from "@shared/constants.ts";

// POST /api/join — a professional applies to join the ezfind network. The
// application is persisted (for the admin panel) and the operator is alerted on
// the admin Telegram channel. Both steps are best-effort: a storage or delivery
// failure must never reject the applicant.
export const onRequestPost: Handler = async ({ request, env }) => {
  const body = await readJson(request);
  const parsed = validate(JoinInput, body);
  if (!parsed.success) return parsed.response;
  const input = parsed.data;

  // Map the category slug to its Hebrew label for a readable alert.
  const category =
    JOIN_CATEGORIES.find((c) => c.slug === input.category)?.he ?? input.category;

  // Persist the application so it shows up in the admin panel. Best-effort.
  try {
    const { db } = buildContainer(env, request);
    await db.insertJoinApplication({
      full_name: input.full_name,
      business_name: input.business_name ? input.business_name : null,
      category: input.category,
      city: input.city,
      phone: input.phone,
      email: input.email ? input.email : null,
      message: input.message ? input.message : null,
      source: input.source ?? null,
    });
  } catch (err) {
    console.error("join persist failed:", err);
  }

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
