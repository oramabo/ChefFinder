import { useLocation } from "react-router-dom";
import Seo from "../../components/Seo.tsx";
import { LinkButton } from "../../components/Button.tsx";
import { seoPageByPath } from "@shared/seo/pages.ts";
import { pageContent, pageJsonLd } from "@shared/seo/content.ts";
import "./Programmatic.css";

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "");

// Single component that renders any programmatic SEO page by resolving its data
// from the current pathname. All such routes are emitted as concrete paths in
// routes.tsx, so each one is prerendered to static HTML at build time. The body,
// FAQ and JSON-LD are all built from the city/event data (see shared/seo/content)
// so every page's content is genuinely distinct — not one template renamed.
export default function ProgrammaticPage() {
  const { pathname } = useLocation();
  const page = seoPageByPath(pathname);
  const content = page ? pageContent(page) : null;

  if (!page || !content) {
    return (
      <div className="section container">
        <h1>הדף לא נמצא</h1>
      </div>
    );
  }

  const { event, cuisines, highlights, menu, faq } = content;

  return (
    <>
      <Seo
        title={page.title}
        description={page.description}
        jsonLd={pageJsonLd(page, SITE_URL)}
        canonicalPath={page.hePath}
      />
      <section className="section container programmatic">
        <h1>{page.h1}</h1>
        <p className="programmatic__intro">{content.intro}</p>
        <LinkButton to="/find-a-chef" variant="primary">
          קבלו הצעות משפים
        </LinkButton>

        <ul className="programmatic__cuisines" aria-label="סוגי מטבח">
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
            <h2>מה מגישים ל{event.heFor}?</h2>
            <ul>
              {menu.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="card programmatic__faq">
          <h2>שאלות נפוצות — {page.h1}</h2>
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
