import { allSeoPages } from "@shared/seo/pages.ts";
import type { Handler } from "../functions-lib/handler.ts";

// GET /sitemap.xml — built from the same programmatic page data as the routes.
// Each programmatic page ships in two languages (English at `path`, Hebrew at
// `hePath`); both are listed as their own <url> with xhtml:link hreflang
// alternates so Google treats them as one localized set. x-default → Hebrew.
export const onRequestGet: Handler = async ({ request }) => {
  const origin = new URL(request.url).origin;
  const staticPaths = ["/", "/find-a-chef", "/how-it-works", "/chefs", "/faq"];

  const abs = (path: string) => `${origin}${encodeURI(path)}`;
  const alt = (hrefLang: string, path: string) =>
    `    <xhtml:link rel="alternate" hreflang="${hrefLang}" href="${abs(path)}"/>`;

  const staticUrls = staticPaths.map((p) => `  <url><loc>${abs(p)}</loc></url>`);

  const seoUrls = allSeoPages().flatMap((p) => {
    const links = [
      alt("en", p.path),
      alt("he", p.hePath),
      alt("x-default", p.hePath),
    ].join("\n");
    // One <url> per language, each carrying the full set of alternates.
    return [p.path, p.hePath].map(
      (self) => `  <url>\n    <loc>${abs(self)}</loc>\n${links}\n  </url>`,
    );
  });

  const body = [...staticUrls, ...seoUrls].join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
};
