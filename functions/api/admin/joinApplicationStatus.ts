import { adminAuthorized } from "../../../functions-lib/env.ts";
import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error, readJson } from "../../../functions-lib/http.ts";
import type { Handler } from "../../../functions-lib/handler.ts";
import { JOIN_STATUS, type JoinStatus } from "@shared/constants.ts";

// POST /api/admin/join-application/:id/status — update an application's
// lifecycle status (new | contacted | approved | rejected). Gated by ADMIN_TOKEN.
export const onRequestPost: Handler = async ({ request, env, params }) => {
  const provided = request.headers.get("x-admin-token");
  if (!adminAuthorized(env, provided)) {
    return error("לא מורשה", 401, { reason: "unauthorized" });
  }

  const id = params.id;
  if (!id) return error("מזהה חסר", 400, { reason: "missing_id" });

  const body = (await readJson(request)) as { status?: unknown } | null;
  const status = body?.status;
  const valid = Object.values(JOIN_STATUS) as string[];
  if (typeof status !== "string" || !valid.includes(status)) {
    return error("סטטוס לא תקין", 422, { reason: "invalid_status" });
  }

  const { db } = buildContainer(env, request);
  const updated = await db.updateJoinApplicationStatus(id, status as JoinStatus);
  if (!updated) return error("בקשה לא נמצאה", 404, { reason: "not_found" });

  return json({ ok: true, updated: true });
};
