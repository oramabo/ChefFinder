import { adminAuthorized } from "../../../functions-lib/env.ts";
import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error } from "../../../functions-lib/http.ts";
import type { Handler } from "../../../functions-lib/handler.ts";

// GET /api/admin/leads — read-only operator view of recent leads (includes PII).
// Gated by ADMIN_TOKEN (header `x-admin-token` only — a query param would leak
// the token into logs, history and referrers); open only in stub/dev mode.
export const onRequestGet: Handler = async ({ request, env }) => {
  const provided = request.headers.get("x-admin-token");
  if (!adminAuthorized(env, provided)) {
    return error("לא מורשה", 401, { reason: "unauthorized" });
  }

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 200);

  const { db } = buildContainer(env, request);
  const leads = await db.listRecentLeads(limit);

  return json({
    ok: true,
    leads: leads.map((l) => ({
      lead_token: l.lead_token,
      created_at: l.created_at,
      event_type: l.event_type,
      event_date: l.event_date,
      city: l.city,
      guests: l.guests,
      budget: l.budget,
      cuisine: l.cuisine,
      kosher: l.kosher,
      status: l.status,
      buyers_count: l.buyers_count,
      buyers_cap: l.buyers_cap,
      source: l.source,
      client_name: l.client_name,
      client_phone: l.client_phone,
      client_email: l.client_email,
    })),
  });
};
