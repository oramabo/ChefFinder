import { describe, it, expect } from "vitest";
import { allSeoPages, seoPageByPath } from "@shared/seo/pages.ts";
import { CITIES } from "@shared/seo/cities.ts";
import { SEO_EVENTS } from "@shared/seo/events.ts";

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
