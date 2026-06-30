import { Head } from "vite-react-ssg";

export interface GeoMeta {
  // ISO region code, e.g. "IL".
  region: string;
  // Human place name, e.g. "Israel" / "ישראל".
  placename: string;
  // "lat,long" (e.g. "31.5,34.75"). Rendered as ICBM + geo.position.
  position?: string;
}

interface SeoProps {
  title: string;
  description?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
  // Route path (e.g. "/private-chef/tel-aviv") for canonical + hreflang. Absolute
  // URLs require VITE_SITE_URL; without it these tags are omitted.
  canonicalPath?: string;
  // Absolute canonical URL — overrides canonicalPath/VITE_SITE_URL. Use this for
  // pages served on a specific host (e.g. https://chefs.ezfind.app/), where the
  // build-wide VITE_SITE_URL would point at the wrong domain.
  canonicalUrl?: string;
  // Geographic targeting meta (local SEO).
  geo?: GeoMeta;
  // Social share image path (under /public). Absolute og:image needs a base URL.
  image?: string;
}

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "");

// Renders <head> tags at build time (prerendered) and on the client.
export default function Seo({
  title,
  description,
  jsonLd,
  noindex,
  canonicalPath,
  canonicalUrl,
  geo,
  image = "/images/og.png",
}: SeoProps) {
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const canonical =
    canonicalUrl ?? (SITE_URL && canonicalPath ? `${SITE_URL}${canonicalPath}` : undefined);
  // Base the og:image on the canonical's origin when given, else VITE_SITE_URL.
  const imageBase = canonicalUrl ? new URL(canonicalUrl).origin : SITE_URL;
  const ogImage = imageBase ? `${imageBase}${image}` : undefined;
  return (
    <Head>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}
      {/* Hebrew is the default locale; /en/ added later. x-default points at he for now. */}
      {canonical && <link rel="alternate" hrefLang="he" href={canonical} />}
      {canonical && <link rel="alternate" hrefLang="x-default" href={canonical} />}
      {/* Geographic targeting (local SEO). */}
      {geo && <meta name="geo.region" content={geo.region} />}
      {geo && <meta name="geo.placename" content={geo.placename} />}
      {geo?.position && <meta name="geo.position" content={geo.position.replace(",", ";")} />}
      {geo?.position && <meta name="ICBM" content={geo.position} />}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="he_IL" />
      {canonical && <meta property="og:url" content={canonical} />}
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
