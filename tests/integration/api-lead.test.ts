import { describe, it, expect } from "vitest";
import { ctx } from "../helpers.ts";
import { onRequestPost as createLead } from "../../functions/api/lead/index.ts";

describe("POST /api/lead", () => {
  it("creates a lead and reports distribution", async () => {
    const res = await createLead(
      ctx({
        method: "POST",
        url: "http://localhost/api/lead",
        body: {
          event_type: "anniversary",
          event_date: "2026-08-01",
          city: "תל אביב",
          guests: 40,
          budget: 5000,
          cuisine: "mediterranean",
          kosher: false,
          client_name: "נועה",
          client_phone: "0541112233",
          turnstile_token: "dev-bypass",
        },
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; notify: { telegram: string } };
    expect(json.ok).toBe(true);
    expect(json.notify).toEqual({ telegram: "sent" });
  });

  it("rejects an invalid payload with 422", async () => {
    const res = await createLead(
      ctx({ method: "POST", url: "http://localhost/api/lead", body: { kosher: false } }),
    );
    expect(res.status).toBe(422);
  });
});
