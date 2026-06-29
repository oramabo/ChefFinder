import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error } from "../../../functions-lib/http.ts";
import { requireChef } from "../../../functions-lib/chefAuth.ts";
import type { Handler } from "../../../functions-lib/handler.ts";

// GET /api/chef/leads?city=&cuisine=&limit= — the marketplace: available leads
// (PII-free) the signed-in chef hasn't opened yet. Contact details are NEVER
// returned here; they're released only by spending a credit via /open.
export const onRequestGet: Handler = async ({ request, env }) => {
  const claims = await requireChef(env, request);
  if (!claims) return error("לא מחובר", 401, { reason: "unauthorized" });

  const { db } = buildContainer(env, request);
  const chef = await db.getChefById(claims.sub);
  if (!chef || chef.status !== "active") {
    return error("החשבון אינו פעיל", 403, { reason: "inactive" });
  }

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 60), 1), 100);
  const city = url.searchParams.get("city");
  const cuisine = url.searchParams.get("cuisine");

  const leads = await db.listAvailableLeadsForChef(chef.phone, { city, cuisine }, limit);
  return json({ ok: true, leads, credits: chef.credits });
};
