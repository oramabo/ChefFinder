import { describe, it, expect } from "vitest";
import { ctx } from "../helpers.ts";
import { onRequestPost as submitJoin } from "../../functions/api/join.ts";
import { onRequestGet as listApps } from "../../functions/api/admin/joinApplications.ts";
import { onRequestPost as setStatus } from "../../functions/api/admin/joinApplicationStatus.ts";
import type { JoinApplication } from "@shared/types.ts";

async function apply(phone: string) {
  const res = await submitJoin(
    ctx({
      method: "POST",
      url: "http://localhost/api/join",
      body: { full_name: "דנה", category: "chef", city: "תל אביב", phone },
    }),
  );
  return res;
}

async function list(): Promise<JoinApplication[]> {
  const res = await listApps(ctx({ url: "http://localhost/api/admin/join-applications" }));
  const body = (await res.json()) as { ok: boolean; applications: JoinApplication[] };
  return body.applications;
}

describe("admin join applications", () => {
  it("persists a submitted application and lists it (newest first)", async () => {
    const phone = "0521000001";
    expect((await (await apply(phone)).json()).ok).toBe(true);
    const apps = await list();
    const mine = apps.find((a) => a.phone === phone);
    expect(mine).toBeTruthy();
    expect(mine!.status).toBe("new");
  });

  it("updates an application's status", async () => {
    const phone = "0521000002";
    await apply(phone);
    const id = (await list()).find((a) => a.phone === phone)!.id;

    const res = await setStatus(
      ctx({
        method: "POST",
        url: `http://localhost/api/admin/join-application/${id}/status`,
        body: { status: "contacted" },
        params: { id },
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);

    const after = (await list()).find((a) => a.id === id)!;
    expect(after.status).toBe("contacted");
  });

  it("rejects an invalid status", async () => {
    const phone = "0521000003";
    await apply(phone);
    const id = (await list()).find((a) => a.phone === phone)!.id;
    const res = await setStatus(
      ctx({
        method: "POST",
        url: `http://localhost/api/admin/join-application/${id}/status`,
        body: { status: "bogus" },
        params: { id },
      }),
    );
    expect(res.status).toBe(422);
  });

  it("returns 404 for an unknown application id", async () => {
    const res = await setStatus(
      ctx({
        method: "POST",
        url: "http://localhost/api/admin/join-application/nope/status",
        body: { status: "approved" },
        params: { id: "nope" },
      }),
    );
    expect(res.status).toBe(404);
  });
});
