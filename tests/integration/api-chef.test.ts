import { describe, it, expect } from "vitest";
import { ctx } from "../helpers.ts";
import { onRequestPost as register } from "../../functions/api/chef/register.ts";
import { onRequestPost as login } from "../../functions/api/chef/login.ts";
import { onRequestGet as me } from "../../functions/api/chef/me.ts";
import { onRequestPost as checkout } from "../../functions/api/chef/checkout.ts";
import { onRequestPost as mockComplete } from "../../functions/api/payment/mock-complete.ts";
import { onRequestGet as marketplace } from "../../functions/api/chef/leads.ts";
import { onRequestPost as openLead } from "../../functions/api/chef/open.ts";
import { onRequestPost as adminCreate } from "../../functions/api/admin/chefCreate.ts";
import { onRequestPost as adminCredits } from "../../functions/api/admin/chefCredits.ts";
import { onRequestGet as adminChefs } from "../../functions/api/admin/chefs.ts";
import { createMockDb } from "../../functions-lib/adapters/db.mock.ts";

const db = createMockDb(); // global store, shared with the handlers

let phoneSeq = 0;
function uniquePhone(): string {
  phoneSeq += 1;
  return "0529" + String(100000 + phoneSeq).slice(-6);
}

const auth = (token: string) => ({ authorization: `Bearer ${token}` });

async function newChef(credits = 0): Promise<{ phone: string; token: string; id: string }> {
  const phone = uniquePhone();
  const res = await register(
    ctx({ method: "POST", url: "http://localhost/api/chef/register", body: { phone, name: "שף", password: "secret1" } }),
  );
  const body = (await res.json()) as { ok: boolean; token: string; chef: { id: string } };
  return { phone, token: body.token, id: body.chef.id };
}

async function seedLead(): Promise<string> {
  const lead = await db.insertLead({
    lead_token: "mk_" + Math.random().toString(36).slice(2),
    event_type: "birthday",
    city: "תל אביב",
    kosher: false,
    client_name: "דנה",
    client_phone: "0501234567",
    client_email: "dana@example.com",
    price: 30,
    buyers_cap: 3,
  });
  return lead.lead_token;
}

describe("chef portal", () => {
  it("registers, rejects a duplicate phone, and logs in", async () => {
    const phone = uniquePhone();
    const reg = (await (
      await register(ctx({ method: "POST", url: "http://localhost/api/chef/register", body: { phone, name: "שף", password: "secret1" } }))
    ).json()) as any;
    expect(reg.ok).toBe(true);
    expect(reg.token).toBeTruthy();
    expect(reg.chef.credits).toBe(0);

    const dup = await register(
      ctx({ method: "POST", url: "http://localhost/api/chef/register", body: { phone, name: "שף", password: "secret1" } }),
    );
    expect(dup.status).toBe(409);

    const badLogin = await login(
      ctx({ method: "POST", url: "http://localhost/api/chef/login", body: { phone, password: "wrongpw" } }),
    );
    expect(badLogin.status).toBe(401);

    const okLogin = (await (
      await login(ctx({ method: "POST", url: "http://localhost/api/chef/login", body: { phone, password: "secret1" } }))
    ).json()) as any;
    expect(okLogin.ok).toBe(true);
    expect(okLogin.token).toBeTruthy();
  });

  it("guards /me and returns the profile when authed", async () => {
    const chef = await newChef();
    const noAuth = await me(ctx({ url: "http://localhost/api/chef/me" }));
    expect(noAuth.status).toBe(401);

    const ok = (await (
      await me(ctx({ url: "http://localhost/api/chef/me", headers: auth(chef.token) }))
    ).json()) as any;
    expect(ok.ok).toBe(true);
    expect(ok.chef.phone).toBe(chef.phone);
  });

  it("buys a credit package (mock pay) and the balance increases", async () => {
    const chef = await newChef();
    const co = (await (
      await checkout(ctx({ method: "POST", url: "http://localhost/api/chef/credits/checkout", body: { package: "starter" }, headers: auth(chef.token) }))
    ).json()) as any;
    expect(co.ok).toBe(true);
    expect(co.payment_url).toContain("mock_pay=1");
    expect(co.order_id).toBeTruthy();
    expect(co.credits).toBe(10);

    const done = (await (
      await mockComplete(ctx({ method: "POST", url: "http://localhost/api/payment/mock-complete", body: { purchase_id: co.order_id } }))
    ).json()) as any;
    expect(done).toMatchObject({ ok: true, status: "paid", kind: "credits", credited: 10 });

    const prof = (await (
      await me(ctx({ url: "http://localhost/api/chef/me", headers: auth(chef.token) }))
    ).json()) as any;
    expect(prof.chef.credits).toBe(10);
  });

  it("opens a lead with one credit, reveals contact, and blocks a second open", async () => {
    const chef = await newChef();
    // Top up via the mock checkout.
    const co = (await (
      await checkout(ctx({ method: "POST", url: "http://localhost/api/chef/credits/checkout", body: { package: "starter" }, headers: auth(chef.token) }))
    ).json()) as any;
    await mockComplete(ctx({ method: "POST", url: "http://localhost/api/payment/mock-complete", body: { purchase_id: co.order_id } }));

    const token = await seedLead();

    // Marketplace lists the lead (PII-free).
    const mk = (await (
      await marketplace(ctx({ url: "http://localhost/api/chef/leads", headers: auth(chef.token) }))
    ).json()) as any;
    expect(mk.ok).toBe(true);
    expect(mk.leads.some((l: any) => l.lead_token === token)).toBe(true);
    expect(mk.leads[0].client_phone).toBeUndefined(); // never leaks PII

    // Open it: contact revealed, one credit spent.
    const open1 = (await (
      await openLead(ctx({ method: "POST", url: `http://localhost/api/chef/leads/${token}/open`, params: { token }, headers: auth(chef.token) }))
    ).json()) as any;
    expect(open1.ok).toBe(true);
    expect(open1.contact.client_phone).toBe("0501234567");
    expect(open1.credits).toBe(9);

    // Second open of the same lead is blocked.
    const open2 = (await (
      await openLead(ctx({ method: "POST", url: `http://localhost/api/chef/leads/${token}/open`, params: { token }, headers: auth(chef.token) }))
    ).json()) as any;
    expect(open2).toMatchObject({ ok: false, reason: "already_purchased" });
  });

  it("rejects opening a lead with no credits", async () => {
    const chef = await newChef(); // zero balance
    const token = await seedLead();
    const res = (await (
      await openLead(ctx({ method: "POST", url: `http://localhost/api/chef/leads/${token}/open`, params: { token }, headers: auth(chef.token) }))
    ).json()) as any;
    expect(res).toMatchObject({ ok: false, reason: "insufficient_credits" });
  });

  it("lets the admin create an account, grant credits, and list chefs", async () => {
    const phone = uniquePhone();
    const created = (await (
      await adminCreate(ctx({ method: "POST", url: "http://localhost/api/admin/chefs", body: { phone, name: "מנהל יצר", credits: 5 } }))
    ).json()) as any;
    expect(created.ok).toBe(true);
    expect(created.temp_password).toBeTruthy(); // generated, shown once
    expect(created.chef.credits).toBe(5);

    const adj = (await (
      await adminCredits(ctx({ method: "POST", url: `http://localhost/api/admin/chefs/${created.chef.id}/credits`, body: { delta: 3 }, params: { id: created.chef.id } }))
    ).json()) as any;
    expect(adj).toMatchObject({ ok: true, balance_after: 8 });

    const list = (await (
      await adminChefs(ctx({ url: `http://localhost/api/admin/chefs?query=${phone}` }))
    ).json()) as any;
    expect(list.ok).toBe(true);
    expect(list.chefs.some((c: any) => c.phone === phone)).toBe(true);
  });
});
