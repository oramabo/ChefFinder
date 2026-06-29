import { adminAuthorized } from "../../../functions-lib/env.ts";
import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error } from "../../../functions-lib/http.ts";
import type { Handler } from "../../../functions-lib/handler.ts";

// GET /api/admin/chefs?query=&limit= — list chef accounts (admin-gated). No
// password hashes are returned. Optional case-insensitive match on phone/name/email.
export const onRequestGet: Handler = async ({ request, env }) => {
  const provided =
    request.headers.get("x-admin-token") ?? new URL(request.url).searchParams.get("token");
  if (!adminAuthorized(env, provided)) {
    return error("לא מורשה", 401, { reason: "unauthorized" });
  }

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 100), 1), 500);
  const query = url.searchParams.get("query");

  const { db } = buildContainer(env, request);
  const chefs = await db.listChefs(query, limit);
  return json({ ok: true, chefs });
};
