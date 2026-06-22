import Seo from "../components/Seo.tsx";
import { LinkButton } from "../components/Button.tsx";

export default function HowItWorks() {
  return (
    <div className="section container">
      <Seo
        title="איך זה עובד | הזמנת שף פרטי — ChefLeads"
        description="כך מזמינים שף פרטי לאירוע ב-3 שלבים פשוטים: ממלאים טופס, מקבלים הצעות, בוחרים שף."
      />
      <h1>איך זה עובד</h1>
      <div className="grid grid-3" style={{ marginBlockStart: "var(--space-6)" }}>
        <div className="card">
          <h3>1. ממלאים טופס</h3>
          <p>פרטי האירוע: תאריך, מיקום, מספר אורחים, תקציב וסגנון מטבח.</p>
        </div>
        <div className="card">
          <h3>2. שפים פונים אליכם</h3>
          <p>עד 3 שפים מקצועיים מקבלים את פרטי האירוע וחוזרים אליכם עם הצעה.</p>
        </div>
        <div className="card">
          <h3>3. בוחרים ונהנים</h3>
          <p>משווים הצעות, סוגרים עם השף שמתאים לכם, ונהנים מארוחה בלתי נשכחת.</p>
        </div>
      </div>
      <div style={{ marginBlockStart: "var(--space-8)" }}>
        <LinkButton to="/find-a-chef" variant="primary">
          מצאו שף עכשיו
        </LinkButton>
      </div>
    </div>
  );
}
