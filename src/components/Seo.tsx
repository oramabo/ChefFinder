import { Head } from "vite-react-ssg";

interface SeoProps {
  title: string;
  description?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
  // Route path (e.g. "/private-chef/tel-aviv") for canonical + hreflang. Absolute
  // URLs require VITE_SITE_URL; without it these tags are omitted.
  canonicalPath?: string;
  // Social share image path (under /public). Absolute og:image needs VITE_SITE_URL.
  image?: string;
}

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "");

// Renders <head> tags at build time (prerendered) and on the client.
export default function Seo({ title, description, jsonLd, noindex, canonicalPath, image = "/images/og.png" }: SeoProps) {
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  // Percent-encode the path so Hebrew canonical URLs are valid. Emit an absolute
  // canonical when VITE_SITE_URL is set, otherwise a relative one — either way
  // the English page consolidates onto the Hebrew canonical path. hreflang needs
  // absolute URLs, so those tags are only emitted when SITE_URL is present.
  const encodedPath = canonicalPath ? encodeURI(canonicalPath) : undefined;
  const canonicalAbs = SITE_URL && encodedPath ? `${SITE_URL}${encodedPath}` : undefined;
  const canonicalHref = canonicalAbs ?? encodedPath;
  const ogImage = SITE_URL ? `${SITE_URL}${image}` : undefined;
  return (
    <Head>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {canonicalHref && <link rel="canonical" href={canonicalHref} />}
      {/* Hebrew is the default locale; /en/ added later. x-default points at he for now. */}
      {canonicalAbs && <link rel="alternate" hrefLang="he" href={canonicalAbs} />}
      {canonicalAbs && <link rel="alternate" hrefLang="x-default" href={canonicalAbs} />}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="he_IL" />
      {canonicalAbs && <meta property="og:url" content={canonicalAbs} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta name="twitter:card" content={ogImage ? "summary_large_image" : "summary"} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Head>
  );
}
