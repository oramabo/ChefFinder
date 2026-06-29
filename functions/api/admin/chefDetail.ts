import { adminAuthorized } from "../../../functions-lib/env.ts";
import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error } from "../../../functions-lib/http.ts";
import type { Handler } from "../../../functions-lib/handler.ts";
import { toChefPublic } from "@shared/types.ts";

// GET /api/admin/chefs/:id — a single chef with credit ledger + unlocked leads.
export const onRequestGet: Handler = async ({ request, env, params }) => {
  const provided =
    request.headers.get("x-admin-token") ?? new URL(request.url).searchParams.get("token");
  if (!adminAuthorized(env, provided)) {
    return error("לא מורשה", 401, { reason: "unauthorized" });
  }

  const id = String(params.id);
  const { db } = buildContainer(env, request);
  const chef = await db.getChefById(id);
  if (!chef) return error("החשבון לא נמצא", 404, { reason: "not_found" });

  const [ledger, purchases] = await Promise.all([
    db.getChefLedger(id, 100),
    db.listChefLeadPurchases(chef.phone, 100),
  ]);
  return json({ ok: true, chef: toChefPublic(chef), ledger, purchases });
};
