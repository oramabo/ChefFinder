import { describe, it, expect } from "vitest";
import { ctx } from "../helpers.ts";
import { onRequestPost as reserve } from "../../functions/api/lead/[token]/reserve.ts";
import { createMockDb } from "../../functions-lib/adapters/db.mock.ts";

const db = createMockDb(); // shares the global mock store with the handlers

async function seedLead(cap = 3) {
  const lead = await db.insertLead({
    lead_token: "rsv_" + Math.random().toString(36).slice(2),
    kosher: false,
    client_name: "לקוח",
    client_phone: "0500000000",
    price: 30,
    buyers_cap: cap,
  });
  return lead.lead_token;
}

function doReserve(token: string, chef: string) {
  return reserve(
    ctx({ method: "POST", url: `http://localhost/api/lead/${token}/reserve`, body: { chef_phone: chef }, params: { token } }),
  );
}

describe("POST /api/lead/:token/reserve", () => {
  it("reserves a slot and returns a payment url", async () => {
    const token = await seedLead(3);
    const res = await doReserve(token, "0521111111");
    const json = (await res.json()) as { ok: boolean; payment_url?: string; purchase_id?: string };
    expect(json.ok).toBe(true);
    expect(json.payment_url).toContain("mock_pay=1");
    expect(json.purchase_id).toBeTruthy();
  });

  it("reports sold_out once the cap is exhausted", async () => {
    const token = await seedLead(2);
    expect(((await (await doReserve(token, "0521111111")).json()) as any).ok).toBe(true);
    expect(((await (await doReserve(token, "0522222222")).json()) as any).ok).toBe(true);
    const third = (await (await doReserve(token, "0523333333")).json()) as any;
    expect(third).toEqual({ ok: false, reason: "sold_out" });
  });

  it("reports not_found for an unknown token", async () => {
    const res = await doReserve("missing", "0521111111");
    const json = (await res.json()) as any;
    expect(json).toEqual({ ok: false, reason: "not_found" });
  });

  it("rejects an invalid chef phone with 422", async () => {
    const token = await seedLead();
    const res = await reserve(
      ctx({ method: "POST", url: `http://localhost/api/lead/${token}/reserve`, body: { chef_phone: "x" }, params: { token } }),
    );
    expect(res.status).toBe(422);
  });
});
