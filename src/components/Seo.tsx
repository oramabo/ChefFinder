import { Head } from "vite-react-ssg";

interface Alternate {
  hrefLang: string; // "he" | "en" | "x-default"
  path: string; // route path for that language
}

interface SeoProps {
  title: string;
  description?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
  // Self path (e.g. "/private-chef/tel-aviv") for the canonical link. Absolute
  // when VITE_SITE_URL is set, otherwise relative (still valid, percent-encoded).
  canonicalPath?: string;
  // Page language + direction; set on <html> at prerender and on the client.
  lang?: string;
  dir?: "rtl" | "ltr";
  // hreflang alternates (the same content in the other language[s]). Emitted as
  // absolute URLs, so they require VITE_SITE_URL.
  alternates?: Alternate[];
  // Social share image path (under /public). Absolute og:image needs VITE_SITE_URL.
  image?: string;
}

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "");

// Renders <head> tags (and <html lang/dir>) at build time (prerendered) and on
// the client.
export default function Seo({
  title,
  description,
  jsonLd,
  noindex,
  canonicalPath,
  lang = "he",
  dir = "rtl",
  alternates,
  image = "/images/og.png",
}: SeoProps) {
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  // Percent-encode paths so Hebrew URLs stay valid. The canonical is absolute
  // when VITE_SITE_URL is set, otherwise relative. hreflang needs absolute URLs,
  // so alternates are only emitted when SITE_URL is present.
  const encodedPath = canonicalPath ? encodeURI(canonicalPath) : undefined;
  const canonicalAbs = SITE_URL && encodedPath ? `${SITE_URL}${encodedPath}` : undefined;
  const canonicalHref = canonicalAbs ?? encodedPath;
  const ogImage = SITE_URL ? `${SITE_URL}${image}` : undefined;
  const ogLocale = lang === "en" ? "en_US" : "he_IL";
  return (
    <Head>
      <html lang={lang} dir={dir} />
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {canonicalHref && <link rel="canonical" href={canonicalHref} />}
      {SITE_URL &&
        alternates?.map((a) => (
          <link
            key={a.hrefLang}
            rel="alternate"
            hrefLang={a.hrefLang}
            href={`${SITE_URL}${encodeURI(a.path)}`}
          />
        ))}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={ogLocale} />
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
