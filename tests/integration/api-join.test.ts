import { describe, it, expect } from "vitest";
import { ctx } from "../helpers.ts";
import { onRequestPost as join } from "../../functions/api/join.ts";

function doJoin(body: unknown) {
  return join(ctx({ method: "POST", url: "http://localhost/api/join", body }));
}

const valid = {
  full_name: "דנה כהן",
  category: "chef",
  city: "תל אביב",
  phone: "0521234567",
};

describe("POST /api/join", () => {
  it("accepts a valid application (Telegram unconfigured → best-effort no-op)", async () => {
    const res = await doJoin(valid);
    expect(res.status).toBe(200);
    expect(((await res.json()) as { ok: boolean }).ok).toBe(true);
  });

  it("accepts optional business name, email and message", async () => {
    const res = await doJoin({
      ...valid,
      business_name: "המטבח של דנה",
      email: "dana@example.com",
      message: "זמינה לסופי שבוע",
    });
    expect(((await res.json()) as { ok: boolean }).ok).toBe(true);
  });

  it("rejects a missing required field (no full_name)", async () => {
    const { full_name, ...rest } = valid;
    void full_name;
    const res = await doJoin(rest);
    expect(res.status).toBe(422);
    expect(((await res.json()) as { ok: boolean }).ok).toBe(false);
  });

  it("rejects an invalid phone", async () => {
    const res = await doJoin({ ...valid, phone: "x" });
    expect(res.status).toBe(422);
  });

  it("rejects an invalid email when provided", async () => {
    const res = await doJoin({ ...valid, email: "not-an-email" });
    expect(res.status).toBe(422);
  });
});
