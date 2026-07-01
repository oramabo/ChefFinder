import { describe, it, expect } from "vitest";
import {
  SERVICES,
  serviceBySlug,
  serviceBySubdomain,
  servicePath,
  serviceSubdomainHost,
  subdomainRedirects,
} from "@shared/services/registry.ts";
import { allSeoPages } from "@shared/seo/pages.ts";

describe("service registry", () => {
  it("registers the chefs vertical with its SEO keyword prefixes", () => {
    const chefs = serviceBySlug("chefs");
    expect(chefs).toBeDefined();
    expect(chefs!.seo.slug).toBe("private-chef");
    expect(chefs!.seo.heSlug).toBe("שף-פרטי");
  });

  it("has unique mini-site slugs", () => {
    expect(new Set(SERVICES.map((s) => s.slug)).size).toBe(SERVICES.length);
  });

  it("resolves a service by its subdomain label", () => {
    expect(serviceBySubdomain("chefs")?.slug).toBe("chefs");
    expect(serviceBySubdomain("nope")).toBeUndefined();
  });

  it("derives the canonical path and subdomain host", () => {
    const chefs = serviceBySlug("chefs")!;
    expect(servicePath(chefs)).toBe("/chefs");
    expect(serviceSubdomainHost(chefs)).toBe("chefs.ezfind.app");
  });

  it("builds the subdomain→path redirect map for the Worker", () => {
    expect(subdomainRedirects()).toEqual({ "chefs.ezfind.app": "/chefs" });
  });
});

describe("programmatic pages are service-tagged", () => {
  it("tags pages with the mini-site slug and keeps keyword-rich SEO paths", () => {
    const pages = allSeoPages();
    expect(pages.length).toBeGreaterThan(0);
    for (const p of pages) {
      const service = serviceBySlug(p.serviceSlug);
      expect(service, p.serviceSlug).toBeDefined();
      // Paths use the vertical's SEO slug (a kosher- variant of the same base),
      // not the mini-site hub slug.
      const seo = service!.seo.slug;
      expect(p.path.startsWith(`/${seo}/`) || p.path.startsWith(`/kosher-${seo}/`)).toBe(true);
    }
  });

  it("keeps the programmatic URL space byte-identical to before", () => {
    const pages = allSeoPages();
    expect(pages.some((p) => p.path === "/private-chef/tel-aviv")).toBe(true);
    expect(pages.some((p) => p.path === "/kosher-private-chef/jerusalem")).toBe(true);
    expect(pages.some((p) => p.path === "/private-chef/birthday-tel-aviv")).toBe(true);
    expect(pages.some((p) => p.hePath === "/שף-פרטי/תל-אביב")).toBe(true);
    expect(pages.some((p) => p.hePath === "/שף-פרטי-כשר/ירושלים")).toBe(true);
    // Every page belongs to the chefs mini-site.
    expect(pages.every((p) => p.serviceSlug === "chefs")).toBe(true);
  });
});
