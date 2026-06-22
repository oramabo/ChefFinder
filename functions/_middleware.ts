import { error } from "../functions-lib/http.ts";
import type { Handler } from "../functions-lib/handler.ts";

// Global middleware for all /api/* routes: catch unhandled errors and add a
// request id.
export const onRequest: Handler = async (context) => {
  const requestId = crypto.randomUUID();
  try {
    const res = await context.next();
    const headers = new Headers(res.headers);
    headers.set("x-request-id", requestId);
    return new Response(res.body, { status: res.status, headers });
  } catch (err) {
    console.error(`[${requestId}] unhandled error:`, err);
    return error("שגיאת שרת פנימית", 500, { request_id: requestId });
  }
};
