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
  it("serves the apex (registration + mini-site + marketplace) from static assets", async () => {
    // "/" is registration (index.html), /chefs is the chef mini-site, and the
    // functional/SEO pages live beneath — all fall through to the assets layer.
    expect(await (await get("https://ezfind.app/")).text()).toBe("/");
    expect(await (await get("https://ezfind.app/chefs")).text()).toBe("/chefs");
    expect(await (await get("https://ezfind.app/private-chef/tel-aviv")).text()).toBe(
      "/private-chef/tel-aviv",
    );
    expect(await (await get("https://ezfind.app/join")).text()).toBe("/join");
  });

  it("passes static assets through unchanged on the apex", async () => {
    expect(await (await get("https://ezfind.app/assets/app-abc.js")).text()).toBe(
      "/assets/app-abc.js",
    );
    expect(await (await get("https://ezfind.app/favicon.svg")).text()).toBe("/favicon.svg");
  });

  it("301-redirects the chef subdomain root to the mini-site path", async () => {
    const res = await get("https://chefs.ezfind.app/");
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("https://ezfind.app/chefs");
  });

  it("preserves the path (and query) on subdomain redirects", async () => {
    const res = await get("https://chefs.ezfind.app/private-chef/tel-aviv?x=1");
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("https://ezfind.app/private-chef/tel-aviv?x=1");
  });

  it("301-redirects www to the bare apex", async () => {
    expect((await get("https://www.ezfind.app/")).headers.get("location")).toBe(
      "https://ezfind.app/",
    );
    const res = await get("https://www.ezfind.app/faq");
    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe("https://ezfind.app/faq");
  });

  it("serves the admin panel at the admin.ezfind.app apex", async () => {
    expect(await (await get("https://admin.ezfind.app/")).text()).toBe("/admin");
    expect(await (await get("https://admin.ezfind.app/anything")).text()).toBe("/admin");
    expect(await (await get("https://admin.ezfind.app/assets/app-abc.js")).text()).toBe(
      "/assets/app-abc.js",
    );
  });

  it("serves the marketplace untouched on *.workers.dev", async () => {
    expect(await (await get("https://cheffinder.example.workers.dev/")).text()).toBe("/");
    expect(await (await get("https://cheffinder.example.workers.dev/chefs")).text()).toBe("/chefs");
  });

  it("routes the whole /sitemap*.xml family to the sitemap handler", async () => {
    const index = await get("https://ezfind.app/sitemap.xml");
    expect(index.status).toBe(200);
    expect(await index.text()).toContain("<sitemapindex");
    const child = await get("https://ezfind.app/sitemap-chefs.xml");
    expect(child.status).toBe(200);
    expect(await child.text()).toContain("<urlset");
  });
});
