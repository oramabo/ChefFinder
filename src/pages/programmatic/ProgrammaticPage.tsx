import { useLocation } from "react-router-dom";
import Seo from "../../components/Seo.tsx";
import { LinkButton } from "../../components/Button.tsx";
import { seoPageByPath, localeForPath, pathForLocale } from "@shared/seo/pages.ts";
import { pageContent, pageJsonLd } from "@shared/seo/content.ts";
import "./Programmatic.css";

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "");

// Renders any programmatic SEO page by resolving its data and language from the
// current pathname. The English path (/private-chef/…) renders English content;
// the Hebrew path (/שף-פרטי/…) renders Hebrew. The two are prerendered as
// separate, indexable, hreflang-linked pages. All body copy, FAQ and JSON-LD are
// built from the city/event data (see shared/seo/content) so no page is thin.
export default function ProgrammaticPage() {
  const { pathname } = useLocation();
  const page = seoPageByPath(pathname);
  const locale = page ? localeForPath(page, pathname) : "he";
  const content = page ? pageContent(page, locale) : null;

  if (!page || !content) {
    return (
      <div className="section container">
        <h1>הדף לא נמצא</h1>
      </div>
    );
  }

  const he = locale === "he";
  const { event, cuisines, highlights, menu, faq, reviews, rating } = content;

  // Small UI-string table for the bits of chrome around the generated content.
  const t = {
    cta: he ? "קבלו הצעות משפים" : "Get chef quotes",
    cuisinesLabel: he ? "סוגי מטבח" : "Cuisine styles",
    served: he ? `מה מגישים ל${event?.heFor}?` : `What's served for ${event?.enFor}?`,
    faqHeading: he ? "שאלות נפוצות" : "Frequently asked questions",
    reviewsOutOf: (n: number) => (he ? `מתוך ${n} ביקורות` : `from ${n} reviews`),
    ratingAria: (n: number) => (he ? `${n} מתוך 5` : `${n} out of 5`),
  };

  // Rounded 5-star row for a given rating (whole + empty stars).
  const stars = (value: number) => "★★★★★☆☆☆☆☆".slice(5 - Math.round(value), 10 - Math.round(value));

  // Both language URLs are hreflang alternates of one another; x-default → he.
  const alternates = [
    { hrefLang: "he", path: page.hePath },
    { hrefLang: "en", path: page.path },
    { hrefLang: "x-default", path: page.hePath },
  ];

  return (
    <>
      <Seo
        title={content.title}
        description={content.description}
        jsonLd={pageJsonLd(page, locale, SITE_URL)}
        canonicalPath={pathForLocale(page, locale)}
        lang={locale}
        dir={content.dir}
        alternates={alternates}
      />
      <section className="section container programmatic" dir={content.dir}>
        <h1>{content.h1}</h1>
        <p className="programmatic__intro">{content.intro}</p>
        <LinkButton to="/find-a-chef" variant="primary">
          {t.cta}
        </LinkButton>

        <ul className="programmatic__cuisines" aria-label={t.cuisinesLabel}>
          {cuisines.map((c) => (
            <li key={c} className="programmatic__chip">
              {c}
            </li>
          ))}
        </ul>

        <div className="grid grid-3 programmatic__cards">
          {highlights.map((h) => (
            <div key={h.title} className="card">
              <h3>{h.title}</h3>
              <p>{h.body}</p>
            </div>
          ))}
        </div>

        {event && menu && (
          <div className="card programmatic__menu">
            <h2>{t.served}</h2>
            <ul>
              {menu.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        {rating && reviews.length > 0 && (
          <div className="programmatic__reviews">
            <div className="programmatic__rating">
              <span className="programmatic__stars" aria-hidden="true">
                {stars(rating.ratingValue)}
              </span>
              <strong>{rating.ratingValue.toFixed(1)}</strong>
              <span>{t.reviewsOutOf(rating.reviewCount)}</span>
            </div>
            <div className="grid grid-3">
              {reviews.map((r) => (
                <blockquote
                  key={`${r.author}-${r.text}`}
                  className="card programmatic__review"
                >
                  <span className="programmatic__stars" aria-label={t.ratingAria(r.rating)}>
                    {stars(r.rating)}
                  </span>
                  <p>{he ? r.text : r.textEn}</p>
                  <footer>
                    {(he ? r.author : r.authorEn)} · {he ? r.monthYear : r.monthYearEn}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        )}

        <div className="card programmatic__faq">
          <h2>
            {t.faqHeading} — {content.h1}
          </h2>
          {faq.map((f, i) => (
            <details key={f.q} open={i === 0}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
