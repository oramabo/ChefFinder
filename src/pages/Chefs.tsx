import Seo from "../components/Seo.tsx";
import { IconChat, IconSend } from "../components/art.tsx";
import { DEFAULT_PRICE, DEFAULT_CAP } from "@shared/constants.ts";
import { formatCurrency } from "../lib/format.ts";
import "./Join.css";

const WHATSAPP_URL = (import.meta.env.VITE_WHATSAPP_GROUP_URL as string | undefined)?.trim();
const TELEGRAM_URL = (import.meta.env.VITE_TELEGRAM_GROUP_URL as string | undefined)?.trim();

export default function Chefs() {
  return (
    <div className="section container">
      <Seo
        title="לשפים — קבלת לידים והצטרפות לקבוצה | השף שלי"
        description="שפים פרטיים: קבלו לידים אמיתיים של לקוחות שמחפשים שף לאירוע, והצטרפו לקבוצת הוואטסאפ או הטלגרם לקבלת התראות. תשלום פר-ליד, חשיפת טלפון מיידית."
        canonicalPath="/chefs"
      />
      <p className="eyebrow">לשפים</p>
      <h1>לשפים: איך קונים ליד</h1>
      <p className="lead-text" style={{ marginBlock: "var(--space-4)" }}>
        אנחנו מביאים לכם לקוחות אמיתיים שמחפשים שף פרטי לאירוע — אתם משלמים רק על
        ליד שמעניין אתכם.
      </p>
      <img
        className="page-banner"
        src="/images/olive.png"
        width={1200}
        height={525}
        alt="ענף זית וזעתר טרי על מפת פשתן"
        loading="lazy"
      />

      <div className="grid grid-3" style={{ marginBlockStart: "var(--space-6)" }}>
        <div className="card">
          <h3>לידים בקבוצה</h3>
          <p>סיכום כל ליד חדש נשלח לקבוצת הוואטסאפ והטלגרם — ללא פרטי הלקוח.</p>
        </div>
        <div className="card">
          <h3>תשלום וחשיפה</h3>
          <p>
            פותחים את הקישור, משלמים {formatCurrency(DEFAULT_PRICE)} ב-Bit או
            בכרטיס, ומקבלים מיד את מספר הטלפון של הלקוח.
          </p>
        </div>
        <div className="card">
          <h3>הוגן לשפים</h3>
          <p>כל ליד נמכר לעד {DEFAULT_CAP} שפים בלבד — סיכוי הוגן לסגור את העבודה.</p>
        </div>
      </div>

      <p className="eyebrow" style={{ marginBlockStart: "var(--space-10)" }}>
        הצטרפות
      </p>
      <h2 style={{ marginBlock: "var(--space-3) var(--space-4)" }}>הצטרפו לקבוצת השפים</h2>
      <p className="lead-text" style={{ marginBlockEnd: "var(--space-5)" }}>
        כל ליד חדש נשלח לקבוצות שלנו (ללא פרטי הלקוח). הצטרפו כדי לקבל התראה על
        לידים חדשים ראשונים — ולסגור עבודות.
      </p>
      <img
        className="page-banner"
        src="/images/chef.png"
        width={1200}
        height={525}
        alt="שף פרטי מסדר מנה במטבח ביתי חמים עם סירי נחושת ועשבי תיבול"
        loading="lazy"
      />

      <div className="grid grid-2">
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
              <IconChat width={20} height={20} />
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
              <IconSend width={20} height={20} />
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
