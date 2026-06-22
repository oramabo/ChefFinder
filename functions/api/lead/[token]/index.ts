import { buildContainer } from "../../../../functions-lib/factory.ts";
import { json, error } from "../../../../functions-lib/http.ts";
import type { Handler } from "../../../../functions-lib/handler.ts";
import { toPublicLead } from "@shared/types.ts";

// GET /api/lead/:token — public lead view. NEVER returns client PII.
export const onRequestGet: Handler = async ({ env, params, request }) => {
  const token = String(params.token);
  const { db } = buildContainer(env, request);

  const lead = await db.getLeadByToken(token);
  if (!lead) return error("הליד לא נמצא", 404, { reason: "not_found" });

  return json({ ok: true, lead: toPublicLead(lead) });
};
