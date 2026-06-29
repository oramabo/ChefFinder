import Seo from "../components/Seo.tsx";
import { LinkButton } from "../components/Button.tsx";
import "./LeadReceived.css";

export default function LeadReceived() {
  return (
    <div className="section container">
      <Seo title="הבקשה התקבלה — השף שלי" noindex />
      <div className="card card--raised leadreceived">
        <span className="leadreceived__medallion" aria-hidden="true">
          ✓
        </span>
        <p className="eyebrow leadreceived__eyebrow">הבקשה נשלחה</p>
        <h1 className="leadreceived__title">קיבלנו את הבקשה!</h1>
        <p className="lead-text leadreceived__lead">
          עד <strong className="accent">3 שפים מקצועיים</strong> יחזרו אליכם בקרוב עם
          הצעה אישית לאירוע. שווה לשמור את הטלפון בהישג יד.
        </p>
        <p className="leadreceived__note">
          בינתיים, אתם מוזמנים לקרוא איך השירות עובד ולמה כדאי.
        </p>
        <div className="leadreceived__cta">
          <LinkButton to="/how-it-works" variant="primary" size="lg">
            איך זה עובד
          </LinkButton>
          <LinkButton to="/" variant="ghost" size="lg">
            לדף הבית
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
