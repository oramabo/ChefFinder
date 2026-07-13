import { useEffect, type ReactNode } from "react";
import Seo from "./Seo.tsx";
import Wordmark from "./Wordmark.tsx";
import Footer from "./Footer.tsx";
import CookieBanner from "./CookieBanner.tsx";
import { initAnalytics } from "../lib/analytics.ts";
import "./LandingPage.css";

export interface LandingStep {
  title: string;
  body: string;
  // Line icon from src/components/art.tsx, rendered above the step number.
  icon?: ReactNode;
}

export interface LandingConfig {
  // Wordmark: "ezfind" plus an optional Hebrew suffix, e.g. "שפים" → "ezfind שפים".
  brandSuffix?: string;
  // Where the logo links to (the site's own home). Umbrella → "/", a mini-site →
  // its own home, e.g. "/chefs". Defaults to "/".
  homeHref?: string;
  seoTitle: string;
  seoDescription: string;
  canonicalPath: string;
  heroEyebrow: string;
  heroTitle: ReactNode;
  heroSub: string;
  heroCta: string;
  // Optional hero visual, shown beside the hero copy on wide screens and below
  // it on mobile. Files live in public/images (see docs/IMAGE_PROMPTS.md for
  // the generation prompt of each placeholder).
  heroImage?: { src: string; alt: string };
  // Optional body paragraph shown between the hero and the 3-step explainer.
  intro?: ReactNode;
  steps: [LandingStep, LandingStep, LandingStep];
  // Optional closing line shown just above the form card.
  formLead?: string;
}

// Shared single-page landing template. The visual shell (bar, hero, 3-step
// explainer) is identical across audiences; only the copy (via `config`) and
// the embedded form (via `children`) differ. The form card lives at #join so
// the hero/bar CTAs anchor to it. The footer is the shared site Footer so the
// chrome matches every other page.
export default function LandingPage({
  config,
  children,
}: {
  config: LandingConfig;
  children: ReactNode;
}) {
  useEffect(() => {
    // Self-gated: only initializes if the visitor previously granted consent.
    initAnalytics();
  }, []);

  return (
    <div className="ez">
      <Seo
        title={config.seoTitle}
        description={config.seoDescription}
        canonicalPath={config.canonicalPath}
      />

      <header className="ez__bar">
        <div className="ez__bar-inner container">
          <a className="ez__bar-brand" href={config.homeHref ?? "/"} aria-label="דף הבית">
            <Wordmark suffix={config.brandSuffix} />
          </a>
          <a className="btn btn--primary ez__bar-cta" href="#join">
            {config.heroCta}
          </a>
        </div>
      </header>

      <main id="main">
        <section className="ez__hero">
          <div
            className={`container ez__hero-inner ${config.heroImage ? "ez__hero-inner--split" : ""}`}
          >
            <div className="ez__hero-copy">
              <p className="eyebrow">{config.heroEyebrow}</p>
              <h1 className="ez__title">{config.heroTitle}</h1>
              <p className="ez__sub lead-text">{config.heroSub}</p>
              <a className="btn btn--primary ez__hero-cta" href="#join">
                {config.heroCta}
              </a>
            </div>
            {config.heroImage && (
              <img
                className="ez__hero-img"
                src={config.heroImage.src}
                alt={config.heroImage.alt}
                width={800}
                height={600}
                loading="eager"
                decoding="async"
              />
            )}
          </div>
        </section>

        {config.intro && (
          <section className="container section ez__intro">
            <p className="lead-text">{config.intro}</p>
          </section>
        )}

        <section className="container section">
          <div className="grid grid-3">
            {config.steps.map((s, i) => (
              <div className="card" key={i}>
                <div className="ez__step-head">
                  <span className="ez__step-num">{i + 1}</span>
                  {s.icon && <span className="ez__step-icon">{s.icon}</span>}
                </div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="join" className="container section">
          {config.formLead && <p className="ez__form-lead">{config.formLead}</p>}
          <div className="card ez__form-card">{children}</div>
        </section>
      </main>

      <Footer />
      <CookieBanner />
    </div>
  );
}
