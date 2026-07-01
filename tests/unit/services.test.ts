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
  it("registers the private-chef vertical", () => {
    const chef = serviceBySlug("private-chef");
    expect(chef).toBeDefined();
    expect(chef!.heSlug).toBe("שף-פרטי");
    expect(chef!.subdomain).toBe("chef");
  });

  it("has unique slugs and subdomains", () => {
    expect(new Set(SERVICES.map((s) => s.slug)).size).toBe(SERVICES.length);
    expect(new Set(SERVICES.map((s) => s.subdomain)).size).toBe(SERVICES.length);
  });

  it("resolves a service by subdomain", () => {
    expect(serviceBySubdomain("chef")?.slug).toBe("private-chef");
    expect(serviceBySubdomain("nope")).toBeUndefined();
  });

  it("derives the canonical path and subdomain host", () => {
    const chef = serviceBySlug("private-chef")!;
    expect(servicePath(chef)).toBe("/private-chef");
    expect(serviceSubdomainHost(chef)).toBe("chef.ezfind.app");
  });

  it("builds the subdomain→path redirect map for the Worker", () => {
    expect(subdomainRedirects()).toEqual({ "chef.ezfind.app": "/private-chef" });
  });
});

describe("programmatic pages are service-tagged", () => {
  it("stamps every page with its service and derives paths from the slug", () => {
    const pages = allSeoPages();
    expect(pages.length).toBeGreaterThan(0);
    for (const p of pages) {
      expect(serviceBySlug(p.serviceSlug)).toBeDefined();
      // English path lives under the service slug (kosher is a variant prefix).
      expect(p.path.startsWith(`/${p.serviceSlug}/`) || p.path.startsWith(`/kosher-${p.serviceSlug}/`)).toBe(true);
    }
  });

  it("keeps the private-chef URL space byte-identical to before the refactor", () => {
    const pages = allSeoPages();
    expect(pages.some((p) => p.path === "/private-chef/tel-aviv")).toBe(true);
    expect(pages.some((p) => p.path === "/kosher-private-chef/jerusalem")).toBe(true);
    expect(pages.some((p) => p.path === "/private-chef/birthday-tel-aviv")).toBe(true);
    expect(pages.some((p) => p.hePath === "/שף-פרטי/תל-אביב")).toBe(true);
    expect(pages.some((p) => p.hePath === "/שף-פרטי-כשר/ירושלים")).toBe(true);
  });
});
