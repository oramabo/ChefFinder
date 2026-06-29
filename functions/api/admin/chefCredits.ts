import { adminAuthorized } from "../../../functions-lib/env.ts";
import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error, readJson, validate } from "../../../functions-lib/http.ts";
import type { Handler } from "../../../functions-lib/handler.ts";
import { AdminAdjustCreditsInput } from "@shared/schema.ts";

// POST /api/admin/chefs/:id/credits — add or remove credits (top-up / refund /
// correction). Atomic via the chef_add_credits RPC; a negative delta that would
// drive the balance below zero is rejected.
export const onRequestPost: Handler = async ({ request, env, params }) => {
  const provided =
    request.headers.get("x-admin-token") ?? new URL(request.url).searchParams.get("token");
  if (!adminAuthorized(env, provided)) {
    return error("לא מורשה", 401, { reason: "unauthorized" });
  }

  const id = String(params.id);
  const body = await readJson(request);
  const parsed = validate(AdminAdjustCreditsInput, body);
  if (!parsed.success) return parsed.response;
  const { delta, note } = parsed.data;

  const { db } = buildContainer(env, request);
  const chef = await db.getChefById(id);
  if (!chef) return error("החשבון לא נמצא", 404, { reason: "not_found" });

  const r = await db.addCredits(id, delta, "admin_adjust", null, note ?? null);
  if (!r.ok) {
    return json({ ok: false, reason: "insufficient_balance", balance_after: r.balance_after });
  }
  return json({ ok: true, balance_after: r.balance_after });
};
