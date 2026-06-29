import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error } from "../../../functions-lib/http.ts";
import { generateLeadToken } from "../../../functions-lib/crypto.ts";
import { requireChef } from "../../../functions-lib/chefAuth.ts";
import type { Handler } from "../../../functions-lib/handler.ts";

// POST /api/chef/leads/:token/open — spend one credit to unlock a lead. Atomic:
// the DB reserves a slot, deducts a credit, records a paid purchase + ledger
// entry, and appends the chef to paid_by — all in one transaction. On success we
// return the contact inline (the chef just paid) plus the new balance.
export const onRequestPost: Handler = async ({ request, env, params }) => {
  const claims = await requireChef(env, request);
  if (!claims) return error("לא מחובר", 401, { reason: "unauthorized" });
  const token = String(params.token);

  const { db } = buildContainer(env, request);
  const lead = await db.getLeadByToken(token);
  if (!lead) return json({ ok: false, reason: "not_found" });

  const reveal = generateLeadToken(32);
  const res = await db.unlockLeadWithCredit(token, claims.sub, reveal);
  if (!res.ok) return json({ ok: false, reason: res.reason });

  const chef = await db.getChefById(claims.sub);
  return json({
    ok: true,
    reveal_token: reveal,
    credits: chef?.credits ?? 0,
    contact: {
      client_name: lead.client_name,
      client_phone: lead.client_phone,
      client_email: lead.client_email,
    },
  });
};
