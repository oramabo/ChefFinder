import { describe, it, expect, beforeEach } from "vitest";
import { createMockDb, createMockStore, type MockStore } from "../../functions-lib/adapters/db.mock.ts";
import type { DbPort } from "../../functions-lib/ports/db.ts";

function makeLead(db: DbPort, cap = 3) {
  return db.insertLead({
    lead_token: "tok_" + Math.random().toString(36).slice(2),
    kosher: false,
    client_name: "לקוח",
    client_phone: "0500000000",
    price: 30,
    buyers_cap: cap,
  });
}

describe("mock reserveLead semantics", () => {
  let store: MockStore;
  let db: DbPort;
  beforeEach(() => {
    store = createMockStore();
    db = createMockDb(store);
  });

  it("returns not_found for an unknown token", async () => {
    const r = await db.reserveLead("nope", "0521111111");
    expect(r).toEqual({ ok: false, reason: "not_found" });
  });

  it("reserves up to the cap then reports sold_out", async () => {
    const lead = await makeLead(db, 3);
    expect((await db.reserveLead(lead.lead_token, "0521111111")).reason).toBe("reserved");
    expect((await db.reserveLead(lead.lead_token, "0522222222")).reason).toBe("reserved");
    const third = await db.reserveLead(lead.lead_token, "0523333333");
    expect(third).toEqual({ ok: true, reason: "reserved" });

    const fourth = await db.reserveLead(lead.lead_token, "0524444444");
    expect(fourth).toEqual({ ok: false, reason: "sold_out" });

    const fresh = await db.getLeadByToken(lead.lead_token);
    expect(fresh?.status).toBe("sold_out");
    expect(fresh?.buyers_count).toBe(3);
  });

  it("blocks the same chef from reserving twice (after paying)", async () => {
    const lead = await makeLead(db, 3);
    const p = await db.createPurchase({ lead_id: lead.id, chef_phone: "0521111111", amount: 30 });
    await db.reserveLead(lead.lead_token, "0521111111");
    await db.completePurchase(p.id);
    const again = await db.reserveLead(lead.lead_token, "0521111111");
    expect(again).toEqual({ ok: false, reason: "already_purchased" });
  });

  it("release reopens a slot and is idempotent", async () => {
    const lead = await makeLead(db, 1);
    const p = await db.createPurchase({ lead_id: lead.id, chef_phone: "0521111111", amount: 30 });
    await db.reserveLead(lead.lead_token, "0521111111");
    let l = await db.getLeadByToken(lead.lead_token);
    expect(l?.status).toBe("sold_out");

    expect(await db.releasePurchase(p.id, "failed")).toBe(true);
    l = await db.getLeadByToken(lead.lead_token);
    expect(l?.buyers_count).toBe(0);
    expect(l?.status).toBe("available");

    // second release is a no-op
    expect(await db.releasePurchase(p.id, "failed")).toBe(false);
    l = await db.getLeadByToken(lead.lead_token);
    expect(l?.buyers_count).toBe(0);
  });

  it("completePurchase appends chef to paid_by exactly once", async () => {
    const lead = await makeLead(db, 3);
    const p = await db.createPurchase({ lead_id: lead.id, chef_phone: "0521111111", amount: 30 });
    await db.reserveLead(lead.lead_token, "0521111111");
    expect(await db.completePurchase(p.id, "inv-1")).toBe("completed");
    expect(await db.completePurchase(p.id, "inv-1")).toBe("noop"); // idempotent
    const l = await db.getLeadByToken(lead.lead_token);
    expect(l?.paid_by).toEqual(["0521111111"]);
  });

  it("recovers a payment that lands after the reservation expired (capacity left)", async () => {
    const lead = await makeLead(db, 3);
    const p = await db.createPurchase({ lead_id: lead.id, chef_phone: "0521111111", amount: 30 });
    await db.reserveLead(lead.lead_token, "0521111111");
    // Sweep expires the reservation before the payment arrives.
    expect(await db.releasePurchase(p.id, "expired")).toBe(true);

    expect(await db.completePurchase(p.id, "inv-late")).toBe("recovered");
    const l = await db.getLeadByToken(lead.lead_token);
    expect(l?.buyers_count).toBe(1); // slot retaken
    expect(l?.paid_by).toEqual(["0521111111"]);
    expect((await db.getPurchase(p.id))?.status).toBe("paid");
  });

  it("reports conflict when a late payment finds the lead sold to capacity", async () => {
    const lead = await makeLead(db, 1);
    const p1 = await db.createPurchase({ lead_id: lead.id, chef_phone: "0521111111", amount: 30 });
    await db.reserveLead(lead.lead_token, "0521111111");
    expect(await db.releasePurchase(p1.id, "expired")).toBe(true);

    // Someone else takes (and pays for) the reopened slot.
    const p2 = await db.createPurchase({ lead_id: lead.id, chef_phone: "0522222222", amount: 30 });
    await db.reserveLead(lead.lead_token, "0522222222");
    expect(await db.completePurchase(p2.id)).toBe("completed");

    // The late payment cannot be honoured — operator must refund.
    expect(await db.completePurchase(p1.id, "inv-late")).toBe("conflict");
    expect((await db.getPurchase(p1.id))?.status).toBe("expired");
    const l = await db.getLeadByToken(lead.lead_token);
    expect(l?.paid_by).toEqual(["0522222222"]);
  });

  it("returns not_found for an unknown purchase", async () => {
    expect(await db.completePurchase("missing")).toBe("not_found");
  });

  it("sweepStale expires old pending purchases", async () => {
    const lead = await makeLead(db, 3);
    const p = await db.createPurchase({ lead_id: lead.id, chef_phone: "0521111111", amount: 30 });
    await db.reserveLead(lead.lead_token, "0521111111");
    // Backdate the purchase beyond the TTL.
    store.purchases.get(p.id)!.created_at = new Date(Date.now() - 60 * 60_000).toISOString();
    const released = await db.sweepStale(20);
    expect(released).toBe(1);
    const l = await db.getLeadByToken(lead.lead_token);
    expect(l?.buyers_count).toBe(0);
  });
});
