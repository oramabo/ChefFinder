import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error } from "../../../functions-lib/http.ts";
import { requireChef } from "../../../functions-lib/chefAuth.ts";
import type { Handler } from "../../../functions-lib/handler.ts";

// GET /api/chef/purchases — leads the signed-in chef has unlocked, with their
// (now-accessible) contact details. Keyed by the chef's phone.
export const onRequestGet: Handler = async ({ request, env }) => {
  const claims = await requireChef(env, request);
  if (!claims) return error("לא מחובר", 401, { reason: "unauthorized" });

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 100), 1), 200);

  const { db } = buildContainer(env, request);
  const purchases = await db.listChefLeadPurchases(claims.phone, limit);
  return json({ ok: true, purchases });
};
