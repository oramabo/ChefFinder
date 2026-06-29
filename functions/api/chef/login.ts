import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, readJson, validate } from "../../../functions-lib/http.ts";
import { verifyPassword } from "../../../functions-lib/crypto.ts";
import { issueChefSession } from "../../../functions-lib/chefAuth.ts";
import type { Handler } from "../../../functions-lib/handler.ts";
import { ChefLoginInput } from "@shared/schema.ts";
import { toChefPublic } from "@shared/types.ts";

// POST /api/chef/login — verify phone + password and return a session token.
// A single { ok:false, reason:'invalid' } covers both unknown phone and wrong
// password (no account enumeration). Disabled accounts are rejected too.
export const onRequestPost: Handler = async ({ request, env }) => {
  const body = await readJson(request);
  const parsed = validate(ChefLoginInput, body);
  if (!parsed.success) return parsed.response;
  const { phone, password } = parsed.data;

  const { db } = buildContainer(env, request);
  const chef = await db.getChefByPhone(phone);
  if (!chef || !(await verifyPassword(password, chef.password_hash))) {
    return json({ ok: false, reason: "invalid" }, 401);
  }
  if (chef.status !== "active") {
    return json({ ok: false, reason: "disabled" }, 403);
  }

  const token = await issueChefSession(env, chef);
  return json({ ok: true, token, chef: toChefPublic(chef) });
};
