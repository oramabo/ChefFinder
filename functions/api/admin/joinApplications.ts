import { adminAuthorized } from "../../../functions-lib/env.ts";
import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error } from "../../../functions-lib/http.ts";
import type { Handler } from "../../../functions-lib/handler.ts";

// GET /api/admin/join-applications — operator view of ezfind join applications
// (includes contact details). Gated by ADMIN_TOKEN (header `x-admin-token`).
export const onRequestGet: Handler = async ({ request, env }) => {
  const provided = request.headers.get("x-admin-token");
  if (!adminAuthorized(env, provided)) {
    return error("לא מורשה", 401, { reason: "unauthorized" });
  }

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 100), 1), 500);

  const { db } = buildContainer(env, request);
  const applications = await db.listJoinApplications(limit);

  return json({ ok: true, applications });
};
