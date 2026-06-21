import type { z } from "zod";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

export function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

export function error(message: string, status = 400, extra: Record<string, unknown> = {}): Response {
  return json({ ok: false, error: message, ...extra }, status);
}

export async function readJson(request: Request): Promise<unknown> {
  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      return await request.json();
    } catch {
      return null;
    }
  }
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const form = await request.formData();
    return Object.fromEntries(form.entries());
  }
  // Fall back to attempting JSON.
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export type ValidationOutcome<T> =
  | { success: true; data: T }
  | { success: false; response: Response };

export function validate<S extends z.ZodTypeAny>(
  schema: S,
  input: unknown,
): ValidationOutcome<z.infer<S>> {
  const parsed = schema.safeParse(input);
  if (parsed.success) return { success: true, data: parsed.data };
  return {
    success: false,
    response: error("ולידציה נכשלה", 422, {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    }),
  };
}
