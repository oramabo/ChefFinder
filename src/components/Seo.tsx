import { Head } from "vite-react-ssg";

interface SeoProps {
  title: string;
  description?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
  // Route path (e.g. "/private-chef/tel-aviv") for canonical + hreflang. Absolute
  // URLs require VITE_SITE_URL; without it these tags are omitted.
  canonicalPath?: string;
}

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "");

// Renders <head> tags at build time (prerendered) and on the client.
export default function Seo({ title, description, jsonLd, noindex, canonicalPath }: SeoProps) {
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const canonical = SITE_URL && canonicalPath ? `${SITE_URL}${canonicalPath}` : undefined;
  return (
    <Head>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}
      {/* Hebrew is the default locale; /en/ added later. x-default points at he for now. */}
      {canonical && <link rel="alternate" hrefLang="he" href={canonical} />}
      {canonical && <link rel="alternate" hrefLang="x-default" href={canonical} />}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content="website" />
      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Head>
  );
}
