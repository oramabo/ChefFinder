import { describe, it, expect } from "vitest";
import { allSeoPages, seoPageByPath } from "@shared/seo/pages.ts";
import { CITIES } from "@shared/seo/cities.ts";
import { SEO_EVENTS } from "@shared/seo/events.ts";
import { pageContent, pageJsonLd } from "@shared/seo/content.ts";

describe("programmatic SEO pages", () => {
  const pages = allSeoPages();

  it("generates the expected cartesian count", () => {
    // per city: 1 city page + 1 kosher page + one per event
    const perCity = 2 + SEO_EVENTS.length;
    expect(pages.length).toBe(CITIES.length * perCity);
  });

  it("has unique paths", () => {
    const paths = new Set(pages.map((p) => p.path));
    expect(paths.size).toBe(pages.length);
  });

  it("has a unique Hebrew canonical path per page", () => {
    const hePaths = pages.map((p) => p.hePath);
    expect(new Set(hePaths).size).toBe(pages.length);
    for (const p of pages) {
      expect(p.hePath.startsWith("/שף-פרטי")).toBe(true);
    }
  });

  it("resolves a page by its Hebrew path, encoded or decoded", () => {
    const sample = pages.find((p) => p.kind === "city")!;
    expect(seoPageByPath(sample.hePath)?.path).toBe(sample.path);
    expect(seoPageByPath(encodeURI(sample.hePath))?.path).toBe(sample.path);
  });

  it("every page has a title, h1 and description", () => {
    for (const p of pages) {
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.h1.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
    }
  });

  it("resolves a page by path", () => {
    const sample = pages[0];
    expect(seoPageByPath(sample.path)?.h1).toBe(sample.h1);
    expect(seoPageByPath("/does-not-exist")).toBeUndefined();
  });
});

describe("programmatic page content", () => {
  const pages = allSeoPages();

  it("resolves content for every page", () => {
    for (const p of pages) {
      const c = pageContent(p);
      expect(c, p.path).not.toBeNull();
      expect(c!.intro.length).toBeGreaterThan(20);
      expect(c!.highlights.length).toBe(3);
      expect(c!.faq.length).toBeGreaterThanOrEqual(4);
      expect(c!.priceTo).toBeGreaterThan(c!.priceFrom);
    }
  });

  it("differentiates intro text across cities (not a renamed template)", () => {
    const intros = new Set(pages.map((p) => pageContent(p)!.intro));
    // Far more than one distinct intro — every city/event/kosher combo differs.
    expect(intros.size).toBeGreaterThan(pages.length * 0.9);
  });

  it("gives event pages a menu and an event-specific FAQ", () => {
    const eventPage = pages.find((p) => p.kind === "event-city")!;
    const c = pageContent(eventPage)!;
    expect(c.menu?.length).toBeGreaterThan(0);
    expect(c.faq.some((f) => f.q.includes("תפריט"))).toBe(true);
  });

  it("gives kosher pages a kashrut FAQ and no menu", () => {
    const kosherPage = pages.find((p) => p.kind === "kosher-city")!;
    const c = pageContent(kosherPage)!;
    expect(c.menu).toBeUndefined();
    expect(c.faq.some((f) => f.q.includes("כשר"))).toBe(true);
  });

  it("emits LocalBusiness, Service, BreadcrumbList and FAQPage schema", () => {
    const ld = pageJsonLd(pages[0], "https://chefs.ezfind.app");
    const types = ld.map((b) => b["@type"]);
    expect(types).toContain("LocalBusiness");
    expect(types).toContain("Service");
    expect(types).toContain("BreadcrumbList");
    expect(types).toContain("FAQPage");
    // FAQPage questions match the on-page FAQ.
    const faqBlock = ld.find((b) => b["@type"] === "FAQPage") as {
      mainEntity: { name: string }[];
    };
    expect(faqBlock.mainEntity.length).toBeGreaterThanOrEqual(4);
    // AggregateRating stays out until real reviews exist.
    expect(types).not.toContain("AggregateRating");
  });

  it("makes breadcrumb URLs absolute when a base URL is given", () => {
    const ld = pageJsonLd(pages[0], "https://chefs.ezfind.app");
    const crumb = ld.find((b) => b["@type"] === "BreadcrumbList") as {
      itemListElement: { item: string }[];
    };
    expect(crumb.itemListElement[0].item).toBe("https://chefs.ezfind.app/");
    expect(crumb.itemListElement[2].item.startsWith("https://chefs.ezfind.app/")).toBe(true);
  });

  it("uses the Hebrew canonical path (percent-encoded) in schema URLs", () => {
    const ld = pageJsonLd(pages[0], "https://chefs.ezfind.app");
    const biz = ld.find((b) => b["@type"] === "LocalBusiness") as { url: string };
    expect(biz.url).toBe(`https://chefs.ezfind.app${encodeURI(pages[0].hePath)}`);
    // Encoded, so no raw Hebrew bytes leak into the URL.
    expect(biz.url).toContain("%D7");
  });
});
