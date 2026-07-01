import { allSeoPages } from "@shared/seo/pages.ts";
import type { Handler } from "../functions-lib/handler.ts";

// GET /sitemap.xml — built from the same programmatic page data as the routes.
export const onRequestGet: Handler = async ({ request }) => {
  const origin = new URL(request.url).origin;
  const staticPaths = ["/", "/find-a-chef", "/how-it-works", "/chefs", "/faq"];
  // List the Hebrew (canonical) path for each programmatic page, percent-encoded
  // so the <loc> is a valid URL. The English paths canonicalise to these.
  const seoPaths = allSeoPages().map((p) => encodeURI(p.hePath));
  const all = [...staticPaths, ...seoPaths];

  const urls = all
    .map((p) => `  <url><loc>${origin}${p}</loc></url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
};
