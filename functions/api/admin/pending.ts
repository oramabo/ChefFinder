import { adminAuthorized } from "../../../functions-lib/env.ts";
import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error } from "../../../functions-lib/http.ts";
import type { Handler } from "../../../functions-lib/handler.ts";

// GET /api/admin/pending — pending purchases awaiting manual (Bit) confirmation.
// Admin-gated. Each row carries the chef's phone + lead summary so the operator
// can approve by phone from the list.
export const onRequestGet: Handler = async ({ request, env }) => {
  const provided =
    request.headers.get("x-admin-token") ??
    new URL(request.url).searchParams.get("token");
  if (!adminAuthorized(env, provided)) {
    return error("לא מורשה", 401, { reason: "unauthorized" });
  }

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 200);

  const { db } = buildContainer(env, request);
  const [pending, pending_credit_orders] = await Promise.all([
    db.listPendingPurchases(limit),
    db.listPendingCreditOrders(limit),
  ]);
  return json({ ok: true, pending, pending_credit_orders });
};
