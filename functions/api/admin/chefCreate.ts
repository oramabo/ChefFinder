import { adminAuthorized } from "../../../functions-lib/env.ts";
import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error, readJson, validate } from "../../../functions-lib/http.ts";
import { hashPassword, generateLeadToken } from "../../../functions-lib/crypto.ts";
import type { Handler } from "../../../functions-lib/handler.ts";
import { AdminCreateChefInput } from "@shared/schema.ts";
import { toChefPublic } from "@shared/types.ts";

// POST /api/admin/chefs — operator creates a chef account (admin-issued). When no
// password is supplied a temporary one is generated and returned ONCE so the
// operator can hand it to the chef. Optional initial credits are granted + logged.
export const onRequestPost: Handler = async ({ request, env }) => {
  const provided =
    request.headers.get("x-admin-token") ?? new URL(request.url).searchParams.get("token");
  if (!adminAuthorized(env, provided)) {
    return error("לא מורשה", 401, { reason: "unauthorized" });
  }

  const body = await readJson(request);
  const parsed = validate(AdminCreateChefInput, body);
  if (!parsed.success) return parsed.response;
  const { phone, name, email, password, credits } = parsed.data;

  const { db } = buildContainer(env, request);
  if (await db.getChefByPhone(phone)) {
    return json({ ok: false, reason: "phone_taken" }, 409);
  }

  const tempPassword = password ?? generateLeadToken(10);
  const password_hash = await hashPassword(tempPassword);
  const chef = await db.createChef({
    phone,
    name: name ?? null,
    email: email || null,
    password_hash,
  });

  let balance = 0;
  if (credits && credits > 0) {
    const r = await db.addCredits(chef.id, credits, "admin_adjust", null, "initial credits");
    balance = r.balance_after;
  }

  return json({
    ok: true,
    chef: { ...toChefPublic(chef), credits: balance },
    // Only returned when the operator didn't set a password themselves.
    temp_password: password ? undefined : tempPassword,
  });
};
