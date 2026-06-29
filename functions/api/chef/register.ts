import { buildContainer } from "../../../functions-lib/factory.ts";
import { json, error, readJson, validate } from "../../../functions-lib/http.ts";
import { hashPassword } from "../../../functions-lib/crypto.ts";
import { issueChefSession } from "../../../functions-lib/chefAuth.ts";
import type { Handler } from "../../../functions-lib/handler.ts";
import { ChefRegisterInput } from "@shared/schema.ts";
import { toChefPublic } from "@shared/types.ts";

// POST /api/chef/register — create a chef account (active) and return a session.
// Turnstile-protected like lead creation. Business outcomes (phone already
// registered) come back as { ok:false, reason } so the SPA renders uniformly.
export const onRequestPost: Handler = async ({ request, env }) => {
  const body = await readJson(request);
  const parsed = validate(ChefRegisterInput, body);
  if (!parsed.success) return parsed.response;
  const { phone, name, email, password, turnstile_token } = parsed.data;

  const { db, turnstile } = buildContainer(env, request);

  const remoteIp = request.headers.get("cf-connecting-ip") ?? undefined;
  const ok = await turnstile.verify(turnstile_token, remoteIp);
  if (!ok) return error("אימות אנטי-ספאם נכשל", 403, { reason: "turnstile_failed" });

  if (await db.getChefByPhone(phone)) {
    return json({ ok: false, reason: "phone_taken" }, 409);
  }

  const password_hash = await hashPassword(password);
  const chef = await db.createChef({ phone, name, email: email || null, password_hash });

  const token = await issueChefSession(env, chef);
  return json({ ok: true, token, chef: toChefPublic(chef) });
};
