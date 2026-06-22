import { describe, it, expect } from "vitest";
import { ctx } from "../helpers.ts";
import { onRequestGet as adminLeads } from "../../functions/api/admin/leads.ts";
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
