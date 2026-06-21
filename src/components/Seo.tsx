import { Head } from "vite-react-ssg";

interface SeoProps {
  title: string;
  description?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
}

// Renders <head> tags at build time (prerendered) and on the client.
export default function Seo({ title, description, jsonLd, noindex }: SeoProps) {
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Head>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
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
