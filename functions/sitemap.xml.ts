import { allSeoPages } from "@shared/seo/pages.ts";
import { SERVICES, serviceBySlug, type Service } from "@shared/services/registry.ts";
import type { Handler } from "../functions-lib/handler.ts";

// Sitemaps, served as an index + per-service children so the set scales with the
// platform: /sitemap.xml is the index; /sitemap-pages.xml lists the platform
// pages; /sitemap-{service}.xml lists one vertical's programmatic pages. Adding
// a service adds its child sitemap automatically (derived from the registry).
//
// Only the canonical (Hebrew) programmatic URL is listed; the English-slug URL
// canonicalises to it, so it stays out of the sitemap.

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';

// Platform-level pages that aren't specific to one vertical.
const PLATFORM_PATHS = ["/", "/chefs", "/find-a-chef", "/how-it-works", "/faq", "/for-chefs"];

function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}

function urlset(locs: string[]): string {
  const urls = locs.map((l) => `  <url><loc>${l}</loc></url>`).join("\n");
  return `${XML_HEADER}\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function sitemapIndex(origin: string): Response {
  const children = ["/sitemap-pages.xml", ...SERVICES.map((s) => `/sitemap-${s.slug}.xml`)];
  const body = children.map((c) => `  <sitemap><loc>${origin}${c}</loc></sitemap>`).join("\n");
  return xmlResponse(
    `${XML_HEADER}\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`,
  );
}

function pagesSitemap(origin: string): Response {
  return xmlResponse(urlset(PLATFORM_PATHS.map((p) => `${origin}${encodeURI(p)}`)));
}

function serviceSitemap(origin: string, service: Service): Response {
  const locs = allSeoPages()
    .filter((p) => p.serviceSlug === service.slug)
    .map((p) => `${origin}${encodeURI(p.hePath)}`);
  return xmlResponse(urlset(locs));
}

// GET /sitemap.xml (index) | /sitemap-pages.xml | /sitemap-{service}.xml.
export const onRequestGet: Handler = async ({ request }) => {
  const url = new URL(request.url);
  const { origin, pathname } = url;

  if (pathname === "/sitemap.xml") return sitemapIndex(origin);
  if (pathname === "/sitemap-pages.xml") return pagesSitemap(origin);

  const match = pathname.match(/^\/sitemap-([a-z0-9-]+)\.xml$/);
  const service = match ? serviceBySlug(match[1]) : undefined;
  if (service) return serviceSitemap(origin, service);

  return new Response("Not found", { status: 404, headers: { "content-type": "text/plain" } });
};
