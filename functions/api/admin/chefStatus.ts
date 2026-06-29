import { adminAuthorized } from "../../../functions-lib/env.ts";
import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error, readJson, validate } from "../../../functions-lib/http.ts";
import type { Handler } from "../../../functions-lib/handler.ts";
import { AdminSetStatusInput } from "@shared/schema.ts";

// POST /api/admin/chefs/:id/status — enable or disable a chef account. A disabled
// chef cannot log in, browse the marketplace, or spend credits.
export const onRequestPost: Handler = async ({ request, env, params }) => {
  const provided =
    request.headers.get("x-admin-token") ?? new URL(request.url).searchParams.get("token");
  if (!adminAuthorized(env, provided)) {
    return error("לא מורשה", 401, { reason: "unauthorized" });
  }

  const id = String(params.id);
  const body = await readJson(request);
  const parsed = validate(AdminSetStatusInput, body);
  if (!parsed.success) return parsed.response;

  const { db } = buildContainer(env, request);
  const chef = await db.getChefById(id);
  if (!chef) return error("החשבון לא נמצא", 404, { reason: "not_found" });

  await db.updateChefStatus(id, parsed.data.status);
  return json({ ok: true, status: parsed.data.status });
};
