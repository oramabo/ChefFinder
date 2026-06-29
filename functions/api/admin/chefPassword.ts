import { adminAuthorized } from "../../../functions-lib/env.ts";
import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error, readJson, validate } from "../../../functions-lib/http.ts";
import { hashPassword } from "../../../functions-lib/crypto.ts";
import type { Handler } from "../../../functions-lib/handler.ts";
import { AdminSetPasswordInput } from "@shared/schema.ts";

// POST /api/admin/chefs/:id/password — operator resets a chef's password.
export const onRequestPost: Handler = async ({ request, env, params }) => {
  const provided =
    request.headers.get("x-admin-token") ?? new URL(request.url).searchParams.get("token");
  if (!adminAuthorized(env, provided)) {
    return error("לא מורשה", 401, { reason: "unauthorized" });
  }

  const id = String(params.id);
  const body = await readJson(request);
  const parsed = validate(AdminSetPasswordInput, body);
  if (!parsed.success) return parsed.response;

  const { db } = buildContainer(env, request);
  const chef = await db.getChefById(id);
  if (!chef) return error("החשבון לא נמצא", 404, { reason: "not_found" });

  await db.updateChefPassword(id, await hashPassword(parsed.data.password));
  return json({ ok: true });
};
