import type { ReactNode } from "react";
import Seo from "./Seo.tsx";
import Wordmark from "./Wordmark.tsx";
import "./LandingPage.css";

export interface LandingStep {
  title: string;
  body: string;
}

export interface LandingLink {
  href: string;
  label: string;
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
  // Optional body paragraph shown between the hero and the 3-step explainer.
  intro?: ReactNode;
  steps: [LandingStep, LandingStep, LandingStep];
  // Optional closing line shown just above the form card.
  formLead?: string;
  footerText: string;
  // Optional footer nav — used for umbrella↔mini-site internal linking (the
  // umbrella links to each service mini-site; a mini-site links to the umbrella
  // and its key pages). Plain <a> so they're crawlable.
  links?: LandingLink[];
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
          <div className="container ez__hero-inner">
            <p className="eyebrow">{config.heroEyebrow}</p>
            <h1 className="ez__title">{config.heroTitle}</h1>
            <p className="ez__sub lead-text">{config.heroSub}</p>
            <a className="btn btn--primary ez__hero-cta" href="#join">
              {config.heroCta}
            </a>
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
                <span className="ez__step-num">{i + 1}</span>
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

      <footer className="ez__footer">
        <div className="container">
          <Wordmark suffix={config.brandSuffix} className="ez__wordmark--sm" />
          {config.links && config.links.length > 0 && (
            <nav className="ez__footer-links" aria-label="קישורים">
              {config.links.map((l) => (
                <a key={l.href} href={l.href}>
                  {l.label}
                </a>
              ))}
            </nav>
          )}
          <p className="ez__footer-copy">{config.footerText}</p>
        </div>
      </footer>
    </div>
  );
}
