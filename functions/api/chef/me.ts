import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error } from "../../../functions-lib/http.ts";
import { requireChef } from "../../../functions-lib/chefAuth.ts";
import type { Handler } from "../../../functions-lib/handler.ts";
import { toChefPublic } from "@shared/types.ts";

// GET /api/chef/me — the signed-in chef's profile + live credit balance.
export const onRequestGet: Handler = async ({ request, env }) => {
  const claims = await requireChef(env, request);
  if (!claims) return error("לא מחובר", 401, { reason: "unauthorized" });

  const { db } = buildContainer(env, request);
  const chef = await db.getChefById(claims.sub);
  if (!chef) return error("החשבון לא נמצא", 401, { reason: "unauthorized" });

  return json({ ok: true, chef: toChefPublic(chef) });
};
