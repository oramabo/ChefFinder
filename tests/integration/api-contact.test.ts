import { describe, it, expect } from "vitest";
import { ctx } from "../helpers.ts";
import { onRequestGet as contact } from "../../functions/api/lead/[token]/contact.ts";
import { createMockDb } from "../../functions-lib/adapters/db.mock.ts";

const db = createMockDb();

let counter = 0;
async function paidLead(chef: string) {
  counter += 1;
  const reveal = `reveal_token_${counter}_${Math.random().toString(36).slice(2)}`;
  const lead = await db.insertLead({
    lead_token: "ct_" + Math.random().toString(36).slice(2),
    kosher: false,
    client_name: "נועה",
    client_phone: "0541112233",
    client_email: "noa@example.com",
    price: 30,
    buyers_cap: 3,
  });
  const p = await db.createPurchase({
    lead_id: lead.id,
    chef_phone: chef,
    amount: 30,
    reveal_token: reveal,
  });
  await db.reserveLead(lead.lead_token, chef);
  await db.completePurchase(p.id, "inv-1");
  return { token: lead.lead_token, reveal };
}

function getContact(token: string, query: string) {
  return contact(ctx({ url: `http://localhost/api/lead/${token}/contact?${query}`, params: { token } }));
}

describe("GET /api/lead/:token/contact", () => {
  it("returns PII for a valid paid reveal token", async () => {
    const { token, reveal } = await paidLead("0521111111");
    const res = await getContact(token, `reveal=${encodeURIComponent(reveal)}`);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.contact.client_phone).toBe("0541112233");
    expect(json.contact.client_name).toBe("נועה");
  });

  it("returns 403 for an unknown/guessed reveal token", async () => {
    const { token } = await paidLead("0521111111");
    const res = await getContact(token, "reveal=not-the-real-token");
    expect(res.status).toBe(403);
  });

  it("does NOT reveal when given a phone number (phone is not a credential)", async () => {
    const { token } = await paidLead("0521111111");
    // Even the paying chef's exact phone must not unlock PII anymore.
    const res = await getContact(token, "reveal=0521111111");
    expect(res.status).toBe(403);
  });

  it("returns 403 when a reveal token is for a pending (unpaid) purchase", async () => {
    const reveal = `pending_${Math.random().toString(36).slice(2)}`;
    const lead = await db.insertLead({
      lead_token: "ct_pending_" + Math.random().toString(36).slice(2),
      kosher: false,
      client_name: "דנה",
      client_phone: "0540000000",
      price: 30,
      buyers_cap: 3,
    });
    await db.createPurchase({ lead_id: lead.id, chef_phone: "0521111111", amount: 30, reveal_token: reveal });
    await db.reserveLead(lead.lead_token, "0521111111");
    const res = await getContact(lead.lead_token, `reveal=${reveal}`);
    expect(res.status).toBe(403);
  });

  it("returns 400 when the reveal token is missing", async () => {
    const { token } = await paidLead("0521111111");
    const res = await contact(ctx({ url: `http://localhost/api/lead/${token}/contact`, params: { token } }));
    expect(res.status).toBe(400);
  });
});
