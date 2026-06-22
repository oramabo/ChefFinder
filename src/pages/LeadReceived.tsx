import Seo from "../components/Seo.tsx";
import { LinkButton } from "../components/Button.tsx";

export default function LeadReceived() {
  return (
    <div className="section container">
      <Seo title="הבקשה התקבלה — Sofré" noindex />
      <div className="card" style={{ maxInlineSize: 640 }}>
        <h1>קיבלנו את הבקשה ✓</h1>
        <p className="lead-text" style={{ marginBlock: "var(--space-4)" }}>
          עד <strong className="accent">3 שפים מקצועיים</strong> יחזרו אליכם בקרוב
          עם הצעה מותאמת לאירוע. שמרו על הטלפון בהישג יד.
        </p>
        <p style={{ marginBlock: "var(--space-4)" }}>
          בינתיים תוכלו לקרוא עוד על איך השירות עובד.
        </p>
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <LinkButton to="/how-it-works" variant="primary">
            איך זה עובד
          </LinkButton>
          <LinkButton to="/" variant="ghost">
            לדף הבית
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
