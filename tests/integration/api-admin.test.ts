import { describe, it, expect } from "vitest";
import { ctx } from "../helpers.ts";
import { onRequestGet as adminLeads } from "../../functions/api/admin/leads.ts";
import { onRequestPost as adminNotify } from "../../functions/api/admin/notify.ts";
import { createMockDb } from "../../functions-lib/adapters/db.mock.ts";

const db = createMockDb();

describe("GET /api/admin/leads", () => {
  it("returns recent leads with PII in stub/dev mode", async () => {
    await db.insertLead({
      lead_token: "adm_" + Math.random().toString(36).slice(2),
      kosher: false,
      client_name: "נועה",
      client_phone: "0541112233",
      client_email: "noa@example.com",
      price: 30,
      buyers_cap: 3,
    });
    const res = await adminLeads(ctx({ url: "http://localhost/api/admin/leads" }));
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.ok).toBe(true);
    expect(Array.isArray(json.leads)).toBe(true);
    expect(json.leads.length).toBeGreaterThan(0);
    // Operator view intentionally includes PII.
    expect(json.leads[0]).toHaveProperty("client_phone");
  });

  it("denies access in production without a token (401)", async () => {
    const res = await adminLeads(
      ctx({ url: "http://localhost/api/admin/leads", env: { USE_STUBS: "false" } }),
    );
    expect(res.status).toBe(401);
  });

  it("denies access with a wrong token when ADMIN_TOKEN is set (401)", async () => {
    const res = await adminLeads(
      ctx({
        url: "http://localhost/api/admin/leads",
        env: { USE_STUBS: "false", ADMIN_TOKEN: "s3cret" },
        headers: { "x-admin-token": "wrong" },
      }),
    );
    expect(res.status).toBe(401);
  });
});

describe("POST /api/admin/lead/:token/notify", () => {
  it("re-sends to both channels in stub/dev mode", async () => {
    const lead = await db.insertLead({
      lead_token: "ntfy_" + Math.random().toString(36).slice(2),
      kosher: false,
      client_name: "נועה",
      client_phone: "0541112233",
      price: 30,
      buyers_cap: 3,
    });
    const res = await adminNotify(
      ctx({
        method: "POST",
        url: `http://localhost/api/admin/lead/${lead.lead_token}/notify`,
        params: { token: lead.lead_token },
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.ok).toBe(true);
    expect(json.notify).toEqual({ whatsapp: "sent", telegram: "sent" });
  });

  it("re-sends to a single requested channel", async () => {
    const lead = await db.insertLead({
      lead_token: "ntfy1_" + Math.random().toString(36).slice(2),
      kosher: false,
      client_name: "דנה",
      client_phone: "0541112233",
      price: 30,
      buyers_cap: 3,
    });
    const res = await adminNotify(
      ctx({
        method: "POST",
        url: `http://localhost/api/admin/lead/${lead.lead_token}/notify`,
        params: { token: lead.lead_token },
        body: { channel: "telegram" },
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.notify).toEqual({ telegram: "sent" });
  });

  it("returns 404 for an unknown lead", async () => {
    const res = await adminNotify(
      ctx({
        method: "POST",
        url: "http://localhost/api/admin/lead/nope/notify",
        params: { token: "nope" },
      }),
    );
    expect(res.status).toBe(404);
  });

  it("denies without a valid token in production (401)", async () => {
    const res = await adminNotify(
      ctx({
        method: "POST",
        url: "http://localhost/api/admin/lead/x/notify",
        params: { token: "x" },
        env: { USE_STUBS: "false", ADMIN_TOKEN: "s3cret" },
        headers: { "x-admin-token": "wrong" },
      }),
    );
    expect(res.status).toBe(401);
  });
});
