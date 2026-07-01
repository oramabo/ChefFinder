import { describe, it, expect } from "vitest";
import { onRequestGet } from "../../functions/sitemap.xml.ts";
import type { FnCtx } from "../../functions-lib/handler.ts";

function get(url: string) {
  return onRequestGet({ request: new Request(url) } as unknown as FnCtx);
}

describe("sitemaps", () => {
  it("serves a sitemap index that references the per-service children", async () => {
    const xml = await (await get("https://ezfind.app/sitemap.xml")).text();
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("<loc>https://ezfind.app/sitemap-pages.xml</loc>");
    expect(xml).toContain("<loc>https://ezfind.app/sitemap-chefs.xml</loc>");
  });

  it("serves the platform pages sitemap", async () => {
    const xml = await (await get("https://ezfind.app/sitemap-pages.xml")).text();
    expect(xml).toContain("<urlset");
    expect(xml).toContain("<loc>https://ezfind.app/</loc>");
    expect(xml).toContain("<loc>https://ezfind.app/chefs</loc>");
  });

  it("serves a per-service sitemap with the vertical's canonical (Hebrew) URLs", async () => {
    const xml = await (await get("https://ezfind.app/sitemap-chefs.xml")).text();
    expect(xml).toContain("<urlset");
    // Canonical Hebrew URL, percent-encoded.
    expect(xml).toContain(`<loc>${encodeURI("https://ezfind.app/שף-פרטי/תל-אביב")}</loc>`);
    // English-slug pages canonicalise to Hebrew, so they stay out of the sitemap.
    expect(xml).not.toContain("/private-chef/");
  });

  it("404s an unknown service sitemap", async () => {
    expect((await get("https://ezfind.app/sitemap-nope.xml")).status).toBe(404);
  });
});
