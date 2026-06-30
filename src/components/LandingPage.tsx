import type { ReactNode } from "react";
import Seo, { type GeoMeta } from "./Seo.tsx";
import "./LandingPage.css";

export interface LandingStep {
  title: string;
  body: string;
}

export interface LandingConfig {
  // Wordmark: "ezfind" plus an optional Hebrew suffix, e.g. "שפים" → "ezfind שפים".
  brandSuffix?: string;
  seoTitle: string;
  seoDescription: string;
  // Absolute canonical URL for this landing's host (e.g. https://ezfind.app/).
  canonicalUrl: string;
  // Geographic targeting (local SEO).
  geo?: GeoMeta;
  // JSON-LD structured data (Organization / Service …). A FAQPage block is
  // generated automatically from `faq` below — don't duplicate it here.
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  // Visible FAQ. Rendered on the page AND emitted as FAQPage structured data
  // (Google requires the marked-up Q&A to be visible to users).
  faq?: { q: string; a: string }[];
  heroEyebrow: string;
  heroTitle: ReactNode;
  heroSub: string;
  heroCta: string;
  steps: [LandingStep, LandingStep, LandingStep];
  footerText: string;
}

function Wordmark({ suffix, className }: { suffix?: string; className?: string }) {
  return (
    <span className={`ez__wordmark ${className ?? ""}`}>
      ez<span className="ez__wordmark-accent">find</span>
      {suffix ? <span className="ez__wordmark-suffix"> {suffix}</span> : null}
    </span>
  );
}

// Shared single-page landing template. The visual shell (bar, hero, 3-step
// explainer, footer) is identical across audiences; only the copy (via `config`)
// and the embedded form (via `children`) differ. The form card lives at #join so
// the hero/bar CTAs anchor to it.
export default function LandingPage({
  config,
  children,
}: {
  config: LandingConfig;
  children: ReactNode;
}) {
  // Combine the page's structured data with an auto-generated FAQPage (kept in
  // sync with the visible FAQ rendered below).
  const baseJsonLd = config.jsonLd
    ? Array.isArray(config.jsonLd)
      ? config.jsonLd
      : [config.jsonLd]
    : [];
  const jsonLd = config.faq?.length
    ? [
        ...baseJsonLd,
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: config.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
      ]
    : baseJsonLd;

  return (
    <div className="ez">
      <Seo
        title={config.seoTitle}
        description={config.seoDescription}
        canonicalUrl={config.canonicalUrl}
        geo={config.geo}
        jsonLd={jsonLd}
      />

      <header className="ez__bar">
        <div className="ez__bar-inner container">
          <Wordmark suffix={config.brandSuffix} />
          <a className="btn btn--primary ez__bar-cta" href="#join">
            {config.heroCta}
          </a>
        </div>
      </header>

      <main id="main">
        <section className="ez__hero">
          <div className="container ez__hero-inner">
            <p className="eyebrow">{config.heroEyebrow}</p>
            <h1 className="ez__title">{config.heroTitle}</h1>
            <p className="ez__sub lead-text">{config.heroSub}</p>
            <a className="btn btn--primary ez__hero-cta" href="#join">
              {config.heroCta}
            </a>
          </div>
        </section>

        <section className="container section">
          <div className="grid grid-3">
            {config.steps.map((s, i) => (
              <div className="card" key={i}>
                <span className="ez__step-num">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="join" className="container section">
          <div className="card ez__form-card">{children}</div>
        </section>

        {config.faq?.length ? (
          <section className="container section ez__faq">
            <h2 className="ez__faq-title">שאלות נפוצות</h2>
            <div className="ez__faq-list">
              {config.faq.map((f, i) => (
                <details className="card ez__faq-item" key={i}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <footer className="ez__footer">
        <div className="container">
          <Wordmark suffix={config.brandSuffix} className="ez__wordmark--sm" />
          <p className="ez__footer-copy">{config.footerText}</p>
        </div>
      </footer>
    </div>
  );
}
