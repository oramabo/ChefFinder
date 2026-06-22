import { useLocation } from "react-router-dom";
import Seo from "../../components/Seo.tsx";
import { LinkButton } from "../../components/Button.tsx";
import { seoPageByPath } from "@shared/seo/pages.ts";
import { cityBySlug } from "@shared/seo/cities.ts";
import "./Programmatic.css";

// Single component that renders any programmatic SEO page by resolving its data
// from the current pathname. All such routes are emitted as concrete paths in
// routes.tsx, so each one is prerendered to static HTML at build time.
export default function ProgrammaticPage() {
  const { pathname } = useLocation();
  const page = seoPageByPath(pathname);

  if (!page) {
    return (
      <div className="section container">
        <h1>הדף לא נמצא</h1>
      </div>
    );
  }

  const city = cityBySlug(page.citySlug);
  const cityHe = city?.he ?? "";

  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "שף פרטי",
    areaServed: cityHe,
    provider: { "@type": "LocalBusiness", name: "Sofré" },
    description: page.description,
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `כמה עולה שף פרטי ב${cityHe}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `המחיר תלוי במספר האורחים ובתפריט, ולרוב נע בין ₪150 ל-₪400 לאורח. מלאו טופס וקבלו הצעות מדויקות משפים ב${cityHe}.`,
        },
      },
      {
        "@type": "Question",
        name: "כמה שפים יחזרו אליי?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "עד 3 שפים מקצועיים יחזרו אליכם עם הצעה מותאמת.",
        },
      },
    ],
  };

  return (
    <>
      <Seo
        title={page.title}
        description={page.description}
        jsonLd={[serviceLd, faqLd]}
        canonicalPath={page.path}
      />
      <section className="section container programmatic">
        <h1>{page.h1}</h1>
        <p className="lead-text" style={{ marginBlock: "var(--space-4)", maxInlineSize: "46ch" }}>
          {page.description}
        </p>
        <LinkButton to="/find-a-chef" variant="primary">
          קבלו הצעות משפים
        </LinkButton>

        <div className="grid grid-3" style={{ marginBlockStart: "var(--space-8)" }}>
          <div className="card">
            <h3>טווח מחירים</h3>
            <p>שף פרטי ב{cityHe} עולה לרוב ₪150–₪400 לאורח, בהתאם לתפריט ולמספר המשתתפים.</p>
          </div>
          <div className="card">
            <h3>איך זה עובד</h3>
            <p>ממלאים טופס קצר, ועד 3 שפים מקצועיים באזור {city?.region ?? cityHe} חוזרים אליכם.</p>
          </div>
          <div className="card">
            <h3>לכל אירוע</h3>
            <p>ימי הולדת, אירועים זוגיים, חגיגות משפחתיות ואירועים עסקיים — תפריט מותאם אישית.</p>
          </div>
        </div>

        <div className="card programmatic__faq" style={{ marginBlockStart: "var(--space-6)" }}>
          <h2>שאלות נפוצות — שף פרטי ב{cityHe}</h2>
          <details style={{ marginBlockStart: "var(--space-4)" }}>
            <summary>כמה עולה שף פרטי ב{cityHe}?</summary>
            <p>לרוב ₪150–₪400 לאורח. מלאו טופס וקבלו הצעות מדויקות.</p>
          </details>
          <details style={{ marginBlockStart: "var(--space-3)" }}>
            <summary>כמה שפים יחזרו אליי?</summary>
            <p>עד 3 שפים מקצועיים.</p>
          </details>
        </div>
      </section>
    </>
  );
}
