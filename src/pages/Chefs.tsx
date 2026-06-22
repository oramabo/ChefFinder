import Seo from "../components/Seo.tsx";
import { DEFAULT_PRICE, DEFAULT_CAP } from "@shared/constants.ts";
import { formatCurrency } from "../lib/format.ts";

export default function Chefs() {
  return (
    <div className="section container">
      <Seo
        title="לשפים — קניית לידים | ChefLeads"
        description="שפים פרטיים: קבלו לידים אמיתיים של לקוחות שמחפשים שף לאירוע. תשלום פר ליד, חשיפת טלפון מיידית."
      />
      <h1>לשפים: איך קונים ליד</h1>
      <p className="lead-text" style={{ marginBlock: "var(--space-4)" }}>
        אנחנו מביאים לכם לקוחות אמיתיים שמחפשים שף פרטי לאירוע — אתם משלמים רק על
        ליד שמעניין אתכם.
      </p>
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
    </div>
  );
}
