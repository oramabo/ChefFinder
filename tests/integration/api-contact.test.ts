import { describe, it, expect } from "vitest";
import { ctx } from "../helpers.ts";
import { onRequestGet as contact } from "../../functions/api/lead/[token]/contact.ts";
import { createMockDb } from "../../functions-lib/adapters/db.mock.ts";

const db = createMockDb();

async function paidLead(chef: string) {
  const lead = await db.insertLead({
    lead_token: "ct_" + Math.random().toString(36).slice(2),
    kosher: false,
    client_name: "נועה",
    client_phone: "0541112233",
    client_email: "noa@example.com",
    price: 30,
    buyers_cap: 3,
  });
  const p = await db.createPurchase({ lead_id: lead.id, chef_phone: chef, amount: 30 });
  await db.reserveLead(lead.lead_token, chef);
  await db.completePurchase(p.id, "inv-1");
  return lead.lead_token;
}

function getContact(token: string, chef: string) {
  return contact(
    ctx({ url: `http://localhost/api/lead/${token}/contact?chef=${encodeURIComponent(chef)}`, params: { token } }),
  );
}

describe("GET /api/lead/:token/contact", () => {
  it("returns PII to a chef who paid", async () => {
    const token = await paidLead("0521111111");
    const res = await getContact(token, "0521111111");
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.contact.client_phone).toBe("0541112233");
    expect(json.contact.client_name).toBe("נועה");
  });

  it("returns 403 to a chef who did not pay", async () => {
    const token = await paidLead("0521111111");
    const res = await getContact(token, "0529999999");
    expect(res.status).toBe(403);
  });

  it("returns 400 when chef is missing", async () => {
    const token = await paidLead("0521111111");
    const res = await contact(ctx({ url: `http://localhost/api/lead/${token}/contact`, params: { token } }));
    expect(res.status).toBe(400);
  });
});
