import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error } from "../../../functions-lib/http.ts";
import { requireChef } from "../../../functions-lib/chefAuth.ts";
import type { Handler } from "../../../functions-lib/handler.ts";

// GET /api/chef/ledger — the signed-in chef's credit history (top-ups + spends).
export const onRequestGet: Handler = async ({ request, env }) => {
  const claims = await requireChef(env, request);
  if (!claims) return error("לא מחובר", 401, { reason: "unauthorized" });

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 200);

  const { db } = buildContainer(env, request);
  const ledger = await db.getChefLedger(claims.sub, limit);
  return json({ ok: true, ledger });
};
