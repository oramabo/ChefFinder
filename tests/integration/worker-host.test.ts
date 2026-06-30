import { describe, it, expect } from "vitest";
import worker from "../../worker/index.ts";

// A fake ASSETS binding that just echoes the path it was asked to serve, so we
// can assert which static file the Worker reaches for per host.
const ASSETS = {
  fetch: (input: Request | string) => {
    const u = new URL(typeof input === "string" ? input : input.url);
    return Promise.resolve(new Response(u.pathname));
  },
};
const env = { ASSETS } as unknown as Parameters<typeof worker.fetch>[1];
const ctx = {
  waitUntil: () => {},
  passThroughOnException: () => {},
} as unknown as Parameters<typeof worker.fetch>[2];

function get(url: string) {
  return worker.fetch(new Request(url, { method: "GET" }), env, ctx);
}

describe("Worker host-based serving", () => {
  it("serves the join landing at the ezfind.app apex", async () => {
    expect(await (await get("https://ezfind.app/")).text()).toBe("/join");
    expect(await (await get("https://www.ezfind.app/")).text()).toBe("/join");
    // Deep navigation paths on the apex also resolve to the landing (SPA).
    expect(await (await get("https://ezfind.app/anything")).text()).toBe("/join");
  });

  it("passes static assets through unchanged on the apex", async () => {
    expect(await (await get("https://ezfind.app/assets/app-abc.js")).text()).toBe(
      "/assets/app-abc.js",
    );
    expect(await (await get("https://ezfind.app/favicon.svg")).text()).toBe("/favicon.svg");
  });

  it("serves the admin panel at the admin.ezfind.app apex", async () => {
    expect(await (await get("https://admin.ezfind.app/")).text()).toBe("/admin");
    expect(await (await get("https://admin.ezfind.app/anything")).text()).toBe("/admin");
    // Assets still pass through on the admin host.
    expect(await (await get("https://admin.ezfind.app/assets/app-abc.js")).text()).toBe(
      "/assets/app-abc.js",
    );
  });

  it("serves the chef site untouched on the chef host and workers.dev", async () => {
    expect(await (await get("https://chefs.ezfind.app/")).text()).toBe("/");
    expect(await (await get("https://cheffinder.example.workers.dev/")).text()).toBe("/");
    expect(await (await get("https://chefs.ezfind.app/find-a-chef")).text()).toBe(
      "/find-a-chef",
    );
  });
});
