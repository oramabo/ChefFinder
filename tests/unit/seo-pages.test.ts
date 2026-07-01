import { describe, it, expect } from "vitest";
import { allSeoPages, seoPageByPath, localeForPath, pathForLocale } from "@shared/seo/pages.ts";
import { CITIES } from "@shared/seo/cities.ts";
import { SEO_EVENTS } from "@shared/seo/events.ts";
import { pageContent, pageJsonLd } from "@shared/seo/content.ts";
import {
  REVIEWS,
  REVIEWS_ARE_REAL,
  aggregateRating,
  reviewsForCity,
  type Review,
} from "@shared/seo/reviews.ts";

describe("programmatic SEO pages", () => {
  const pages = allSeoPages();

  it("generates the expected cartesian count", () => {
    // per city: 1 city page + 1 kosher page + one per event
    const perCity = 2 + SEO_EVENTS.length;
    expect(pages.length).toBe(CITIES.length * perCity);
  });

  it("has unique English and Hebrew paths", () => {
    expect(new Set(pages.map((p) => p.path)).size).toBe(pages.length);
    expect(new Set(pages.map((p) => p.hePath)).size).toBe(pages.length);
    for (const p of pages) {
      expect(p.hePath.startsWith("/שף-פרטי")).toBe(true);
    }
  });

  it("resolves a page by either its English or Hebrew path, and knows the locale", () => {
    const sample = pages.find((p) => p.kind === "city")!;
    expect(seoPageByPath(sample.path)?.hePath).toBe(sample.hePath);
    expect(seoPageByPath(sample.hePath)?.path).toBe(sample.path);
    expect(seoPageByPath(encodeURI(sample.hePath))?.path).toBe(sample.path);
    expect(seoPageByPath("/does-not-exist")).toBeUndefined();
    // Locale is derived from which path matched.
    expect(localeForPath(sample, sample.path)).toBe("en");
    expect(localeForPath(sample, sample.hePath)).toBe("he");
    expect(localeForPath(sample, encodeURI(sample.hePath))).toBe("he");
    expect(pathForLocale(sample, "he")).toBe(sample.hePath);
    expect(pathForLocale(sample, "en")).toBe(sample.path);
  });

  it("every page has a Hebrew title, h1 and description", () => {
    for (const p of pages) {
      expect(p.title.length).toBeGreaterThan(0);
      expect(p.h1.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
    }
  });
});

describe("programmatic page content — bilingual", () => {
  const pages = allSeoPages();

  it("resolves content for every page in both languages", () => {
    for (const p of pages) {
      for (const locale of ["he", "en"] as const) {
        const c = pageContent(p, locale);
        expect(c, `${p.path} (${locale})`).not.toBeNull();
        expect(c!.title.length).toBeGreaterThan(0);
        expect(c!.h1.length).toBeGreaterThan(0);
        expect(c!.intro.length).toBeGreaterThan(20);
        expect(c!.highlights.length).toBe(3);
        expect(c!.faq.length).toBeGreaterThanOrEqual(4);
        expect(c!.priceTo).toBeGreaterThan(c!.priceFrom);
      }
    }
  });

  it("renders genuinely English content on English pages", () => {
    const c = pageContent(pages.find((p) => p.kind === "city")!, "en")!;
    expect(c.dir).toBe("ltr");
    expect(c.title).toMatch(/Private Chef in/);
    // No Hebrew characters in the English title/intro.
    expect(c.title).not.toMatch(/[֐-׿]/);
    expect(c.intro).not.toMatch(/[֐-׿]/);
    expect(c.h1).toMatch(/^Private Chef in /);
  });

  it("renders Hebrew content (RTL) on Hebrew pages", () => {
    const c = pageContent(pages.find((p) => p.kind === "city")!, "he")!;
    expect(c.dir).toBe("rtl");
    expect(c.h1).toMatch(/[֐-׿]/);
  });

  it("differentiates intro text across pages in each language", () => {
    for (const locale of ["he", "en"] as const) {
      const intros = new Set(pages.map((p) => pageContent(p, locale)!.intro));
      expect(intros.size).toBeGreaterThan(pages.length * 0.9);
    }
  });

  it("gives event pages a menu and an event-specific FAQ (both languages)", () => {
    const eventPage = pages.find((p) => p.kind === "event-city")!;
    const he = pageContent(eventPage, "he")!;
    expect(he.menu?.length).toBeGreaterThan(0);
    expect(he.faq.some((f) => f.q.includes("תפריט"))).toBe(true);
    const en = pageContent(eventPage, "en")!;
    expect(en.menu?.length).toBeGreaterThan(0);
    expect(en.faq.some((f) => f.q.toLowerCase().includes("menu"))).toBe(true);
  });

  it("gives kosher pages a kashrut FAQ and no menu (both languages)", () => {
    const kosherPage = pages.find((p) => p.kind === "kosher-city")!;
    expect(pageContent(kosherPage, "he")!.menu).toBeUndefined();
    expect(pageContent(kosherPage, "he")!.faq.some((f) => f.q.includes("כשר"))).toBe(true);
    expect(pageContent(kosherPage, "en")!.faq.some((f) => f.q.toLowerCase().includes("kosher"))).toBe(true);
  });
});

describe("programmatic page JSON-LD", () => {
  const pages = allSeoPages();

  it("emits LocalBusiness, Service, BreadcrumbList and FAQPage schema", () => {
    const ld = pageJsonLd(pages[0], "he", "https://ezfind.app");
    const types = ld.map((b) => b["@type"]);
    expect(types).toContain("LocalBusiness");
    expect(types).toContain("Service");
    expect(types).toContain("BreadcrumbList");
    expect(types).toContain("FAQPage");
    const faqBlock = ld.find((b) => b["@type"] === "FAQPage") as { mainEntity: unknown[] };
    expect(faqBlock.mainEntity.length).toBeGreaterThanOrEqual(4);
  });

  it("uses the language's own path + English name on the English page", () => {
    const en = pageJsonLd(pages[0], "en", "https://ezfind.app");
    const biz = en.find((b) => b["@type"] === "LocalBusiness") as { url: string };
    expect(biz.url).toBe(`https://ezfind.app${pages[0].path}`);
    const svc = en.find((b) => b["@type"] === "Service") as { name: string };
    expect(svc.name).toMatch(/Private Chef in/);
  });

  it("uses the Hebrew canonical path (percent-encoded) on the Hebrew page", () => {
    const he = pageJsonLd(pages[0], "he", "https://ezfind.app");
    const biz = he.find((b) => b["@type"] === "LocalBusiness") as { url: string };
    expect(biz.url).toBe(`https://ezfind.app${encodeURI(pages[0].hePath)}`);
    expect(biz.url).toContain("%D7");
  });

  it("makes breadcrumb URLs absolute when a base URL is given", () => {
    const crumb = pageJsonLd(pages[0], "en", "https://ezfind.app").find(
      (b) => b["@type"] === "BreadcrumbList",
    ) as { itemListElement: { item: string }[] };
    expect(crumb.itemListElement[0].item).toBe("https://ezfind.app/");
    expect(crumb.itemListElement[2].item.startsWith("https://ezfind.app/")).toBe(true);
  });
});

describe("reviews + ratings", () => {
  const seed = (over: Partial<Review>): Review => ({
    author: "א",
    authorEn: "A",
    rating: 5,
    text: "x",
    textEn: "x",
    monthYear: "מרץ 2026",
    monthYearEn: "March 2026",
    ...over,
  });

  it("computes the aggregate rating over a set of reviews", () => {
    const agg = aggregateRating([seed({ rating: 5 }), seed({ rating: 4 })]);
    expect(agg).toEqual({ ratingValue: 4.5, reviewCount: 2, bestRating: 5 });
    expect(aggregateRating([])).toBeNull();
  });

  it("keeps every review rating within 1..5 and carries both languages", () => {
    for (const r of REVIEWS) {
      expect(r.rating).toBeGreaterThanOrEqual(1);
      expect(r.rating).toBeLessThanOrEqual(5);
      expect(r.textEn.length).toBeGreaterThan(0);
      expect(r.authorEn.length).toBeGreaterThan(0);
    }
  });

  it("surfaces a city's own reviews first, capped", () => {
    const list = reviewsForCity("tel-aviv", 3);
    expect(list.length).toBe(3);
    expect(list[0].citySlug).toBe("tel-aviv");
  });

  it("gates rating UI + schema on REVIEWS_ARE_REAL", () => {
    // The gate flips ratings on/off together (content + JSON-LD), so seed data
    // can never leak rating schema while the flag is off. AggregateRating and
    // Review are nested inside the LocalBusiness block, not top-level @types.
    const page = allSeoPages()[0];
    const c = pageContent(page, "he")!;
    const biz = pageJsonLd(page, "he", "https://ezfind.app").find(
      (b) => b["@type"] === "LocalBusiness",
    ) as { aggregateRating?: unknown; review?: unknown[] };
    if (REVIEWS_ARE_REAL) {
      expect(c.reviews.length).toBeGreaterThan(0);
      expect(c.rating).not.toBeNull();
      expect(biz.aggregateRating).toBeDefined();
      expect(biz.review?.length).toBeGreaterThan(0);
    } else {
      expect(c.reviews).toEqual([]);
      expect(c.rating).toBeNull();
      expect(biz.aggregateRating).toBeUndefined();
      expect(biz.review).toBeUndefined();
    }
  });
});
