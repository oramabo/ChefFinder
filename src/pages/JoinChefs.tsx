import Seo from "../components/Seo.tsx";
import "./Join.css";

// Public invite links, set at build time (Workers Builds → build variables).
// They are public by nature (anyone with the link can join), so inlining them
// into the prerendered page is fine. When a link is unset the card shows a
// "coming soon" state instead of a dead button.
const WHATSAPP_URL = (import.meta.env.VITE_WHATSAPP_GROUP_URL as string | undefined)?.trim();
const TELEGRAM_URL = (import.meta.env.VITE_TELEGRAM_GROUP_URL as string | undefined)?.trim();

export default function JoinChefs() {
  return (
    <div className="section container">
      <Seo
        title="הצטרפות שפים לקבוצת הלידים | Sofré"
        description="שפים פרטיים: הצטרפו לקבוצת הוואטסאפ או הטלגרם שלנו וקבלו התראה על כל ליד חדש של לקוח שמחפש שף לאירוע."
        canonicalPath="/chefs/join"
      />
      <p className="eyebrow">לשפים</p>
      <h1>הצטרפו לקבוצת השפים</h1>
      <p className="lead-text" style={{ marginBlock: "var(--space-4)" }}>
        כל ליד חדש נשלח לקבוצות שלנו (ללא פרטי הלקוח). הצטרפו כדי לקבל התראה על
        לידים חדשים ראשונים — ולסגור עבודות.
      </p>

      <div className="grid grid-2" style={{ marginBlockStart: "var(--space-6)" }}>
        <div className="card join__card">
          <h3>וואטסאפ</h3>
          <p>קבוצת הוואטסאפ שלנו — סיכום של כל ליד חדש מיד עם פרסומו.</p>
          {WHATSAPP_URL ? (
            <a
              className="btn btn--primary btn--full join__btn"
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              הצטרפו בוואטסאפ
            </a>
          ) : (
            <span className="join__soon">בקרוב</span>
          )}
        </div>

        <div className="card join__card">
          <h3>טלגרם</h3>
          <p>ערוץ/קבוצת הטלגרם שלנו — אותם לידים, בערוץ שנוח לכם.</p>
          {TELEGRAM_URL ? (
            <a
              className="btn btn--primary btn--full join__btn"
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              הצטרפו בטלגרם
            </a>
          ) : (
            <span className="join__soon">בקרוב</span>
          )}
        </div>
      </div>

      <p className="join__note">
        ההצטרפות חינם. הלידים מופצים ללא פרטי הלקוח; חשיפת הטלפון מתבצעת לאחר תשלום
        דרך הקישור שבכל ליד.
      </p>
    </div>
  );
}
