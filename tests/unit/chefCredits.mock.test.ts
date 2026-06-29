import { describe, it, expect, beforeEach } from "vitest";
import { createMockDb, createMockStore, type MockStore } from "../../functions-lib/adapters/db.mock.ts";
import type { DbPort } from "../../functions-lib/ports/db.ts";

function makeLead(db: DbPort, cap = 3) {
  return db.insertLead({
    lead_token: "tok_" + Math.random().toString(36).slice(2),
    kosher: false,
    client_name: "לקוח",
    client_phone: "0500000000",
    client_email: "c@example.com",
    price: 30,
    buyers_cap: cap,
  });
}

function makeChef(db: DbPort, phone = "0521111111", credits = 0) {
  return db.createChef({ phone, name: "שף", password_hash: "x", credits });
}

describe("mock credit semantics", () => {
  let store: MockStore;
  let db: DbPort;
  beforeEach(() => {
    store = createMockStore();
    db = createMockDb(store);
  });

  it("addCredits adjusts the balance and rejects going negative", async () => {
    const chef = await makeChef(db);
    expect((await db.addCredits(chef.id, 10, "package")).balance_after).toBe(10);
    expect((await db.addCredits(chef.id, -3, "lead_unlock")).balance_after).toBe(7);
    const bad = await db.addCredits(chef.id, -100, "admin_adjust");
    expect(bad.ok).toBe(false);
    expect(bad.balance_after).toBe(7); // unchanged
  });

  it("unlockLeadWithCredit deducts a credit, reveals contact, and blocks re-open", async () => {
    const chef = await makeChef(db, "0521111111", 2);
    const lead = await makeLead(db, 3);

    const r = await db.unlockLeadWithCredit(lead.lead_token, chef.id, "rev_abc");
    expect(r.ok).toBe(true);
    expect(r.reason).toBe("unlocked");
    expect(r.purchase_id).toBeTruthy();

    const after = await db.getChefById(chef.id);
    expect(after?.credits).toBe(1); // one spent

    const fresh = await db.getLeadByToken(lead.lead_token);
    expect(fresh?.paid_by).toContain("0521111111");
    expect(fresh?.buyers_count).toBe(1);

    // Same chef can't open the same lead again.
    const again = await db.unlockLeadWithCredit(lead.lead_token, chef.id, "rev_def");
    expect(again).toMatchObject({ ok: false, reason: "already_purchased" });

    // The purchase is paid + flagged as credit-funded, and reveals the contact.
    const purchases = await db.listChefLeadPurchases("0521111111", 50);
    expect(purchases).toHaveLength(1);
    expect(purchases[0].paid_from_credits).toBe(true);
    expect(purchases[0].contact.client_phone).toBe("0500000000");
  });

  it("rejects an unlock with no credits", async () => {
    const chef = await makeChef(db, "0522222222", 0);
    const lead = await makeLead(db, 3);
    const r = await db.unlockLeadWithCredit(lead.lead_token, chef.id, "rev");
    expect(r).toMatchObject({ ok: false, reason: "insufficient_credits" });
  });

  it("rejects an unlock for a disabled account", async () => {
    const chef = await makeChef(db, "0523333333", 5);
    await db.updateChefStatus(chef.id, "disabled");
    const lead = await makeLead(db, 3);
    const r = await db.unlockLeadWithCredit(lead.lead_token, chef.id, "rev");
    expect(r).toMatchObject({ ok: false, reason: "inactive" });
  });

  it("reports sold_out when the cap is exhausted", async () => {
    const lead = await makeLead(db, 1);
    const a = await makeChef(db, "0524444444", 5);
    const b = await makeChef(db, "0525555555", 5);
    expect((await db.unlockLeadWithCredit(lead.lead_token, a.id, "r1")).ok).toBe(true);
    const second = await db.unlockLeadWithCredit(lead.lead_token, b.id, "r2");
    expect(second).toMatchObject({ ok: false, reason: "sold_out" });
  });

  it("completeCreditOrder grants credits once (idempotent)", async () => {
    const chef = await makeChef(db, "0526666666", 0);
    const order = await db.createCreditOrder({ chef_id: chef.id, credits: 10, amount: 250 });

    const first = await db.completeCreditOrder(order.id, "inv-1");
    expect(first).toEqual({ ok: true, credited: 10 });
    expect((await db.getChefById(chef.id))?.credits).toBe(10);

    // A second confirmation is a safe no-op (no double credit).
    const second = await db.completeCreditOrder(order.id, "inv-1");
    expect(second.ok).toBe(false);
    expect((await db.getChefById(chef.id))?.credits).toBe(10);
  });

  it("excludes already-opened and sold-out leads from the marketplace", async () => {
    const chef = await makeChef(db, "0527777777", 5);
    const open = await makeLead(db, 3);
    const sold = await makeLead(db, 1);
    // Exhaust `sold` with a different chef.
    const other = await makeChef(db, "0528888888", 5);
    await db.unlockLeadWithCredit(sold.lead_token, other.id, "r");

    let listed = await db.listAvailableLeadsForChef("0527777777", {}, 50);
    const tokens = listed.map((l) => l.lead_token);
    expect(tokens).toContain(open.lead_token);
    expect(tokens).not.toContain(sold.lead_token); // sold out

    // After this chef opens `open`, it disappears from their marketplace.
    await db.unlockLeadWithCredit(open.lead_token, chef.id, "r2");
    listed = await db.listAvailableLeadsForChef("0527777777", {}, 50);
    expect(listed.map((l) => l.lead_token)).not.toContain(open.lead_token);
  });
});
